"""Waste/shrinkage tracking. Staff can log waste, admin sees reports."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_admin_user, get_staff_user
from backend.database import get_db
from backend.models import User
from backend.models_inventory import Ingredient, InventoryTransaction
from backend.waste import WasteRecord, WasteCause, WASTE_CAUSE_LABELS

router = APIRouter(prefix="/api/waste", tags=["waste"])


class WasteCreate(BaseModel):
    ingredient_id: int
    quantity: float
    cause: str
    notes: str = ""


@router.post("/")
async def log_waste(
    data: WasteCreate,
    user: User = Depends(get_staff_user),
    db: AsyncSession = Depends(get_db),
):
    ingredient = await db.get(Ingredient, data.ingredient_id)
    if not ingredient:
        raise HTTPException(404, "Ingrediente no encontrado")

    try:
        cause = WasteCause(data.cause)
    except ValueError:
        raise HTTPException(400, f"Causa inválida. Opciones: {[c.value for c in WasteCause]}")

    cost_lost = data.quantity * ingredient.unit_cost

    record = WasteRecord(
        ingredient_id=data.ingredient_id,
        quantity=data.quantity,
        unit=ingredient.unit,
        cause=cause,
        cost_lost=cost_lost,
        notes=data.notes,
        recorded_by=user.id,
    )
    db.add(record)

    ingredient.current_stock = max(0, ingredient.current_stock - data.quantity)
    txn = InventoryTransaction(
        ingredient_id=ingredient.id,
        transaction_type="waste",
        quantity=data.quantity,
        unit_cost=ingredient.unit_cost,
        notes=f"Merma: {WASTE_CAUSE_LABELS.get(cause, cause.value)} - {data.notes}",
        created_by=user.id,
    )
    db.add(txn)

    await db.commit()
    return {
        "id": record.id,
        "cost_lost": round(cost_lost, 2),
        "message": "Merma registrada",
    }


@router.get("/")
async def list_waste(
    days: int = 30,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(WasteRecord)
        .where(WasteRecord.recorded_at >= since)
        .order_by(WasteRecord.recorded_at.desc())
    )
    records = result.scalars().all()
    out = []
    for r in records:
        ingredient = await db.get(Ingredient, r.ingredient_id)
        out.append({
            "id": r.id,
            "ingredient_name": ingredient.name if ingredient else "?",
            "quantity": r.quantity,
            "unit": r.unit,
            "cause": r.cause.value if r.cause else "other",
            "cause_label": WASTE_CAUSE_LABELS.get(r.cause, "Otro"),
            "cost_lost": round(r.cost_lost, 2),
            "notes": r.notes,
            "recorded_at": r.recorded_at.isoformat() if r.recorded_at else "",
        })
    return out


@router.get("/report")
async def waste_report(
    days: int = 30,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.utcnow() - timedelta(days=days)

    # Total waste by cause
    result = await db.execute(
        select(
            WasteRecord.cause,
            func.count(WasteRecord.id).label("count"),
            func.sum(WasteRecord.cost_lost).label("total_cost"),
            func.sum(WasteRecord.quantity).label("total_qty"),
        )
        .where(WasteRecord.recorded_at >= since)
        .group_by(WasteRecord.cause)
    )
    by_cause = [
        {
            "cause": row.cause.value if row.cause else "other",
            "cause_label": WASTE_CAUSE_LABELS.get(row.cause, "Otro"),
            "count": row.count,
            "total_cost": round(row.total_cost or 0, 2),
            "total_qty": round(row.total_qty or 0, 2),
        }
        for row in result.all()
    ]

    # Total waste by ingredient
    result2 = await db.execute(
        select(
            WasteRecord.ingredient_id,
            func.sum(WasteRecord.cost_lost).label("total_cost"),
            func.sum(WasteRecord.quantity).label("total_qty"),
        )
        .where(WasteRecord.recorded_at >= since)
        .group_by(WasteRecord.ingredient_id)
        .order_by(func.sum(WasteRecord.cost_lost).desc())
        .limit(10)
    )
    by_ingredient = []
    for row in result2.all():
        ing = await db.get(Ingredient, row.ingredient_id)
        by_ingredient.append({
            "ingredient_name": ing.name if ing else "?",
            "total_cost": round(row.total_cost or 0, 2),
            "total_qty": round(row.total_qty or 0, 2),
        })

    total_cost = sum(c["total_cost"] for c in by_cause)
    return {
        "period_days": days,
        "total_waste_cost": round(total_cost, 2),
        "total_incidents": sum(c["count"] for c in by_cause),
        "by_cause": by_cause,
        "top_wasted_ingredients": by_ingredient,
    }
