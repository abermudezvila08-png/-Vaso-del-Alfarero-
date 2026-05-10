"""Supplier management and purchase orders. Admin only."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_admin_user
from backend.database import get_db
from backend.models import User
from backend.models_inventory import Ingredient
from backend.suppliers import Supplier, PurchaseOrder, PurchaseOrderItem, PriceHistory

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])


class SupplierCreate(BaseModel):
    name: str
    contact_person: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    notes: str = ""


class POItemCreate(BaseModel):
    ingredient_id: int
    quantity: float
    unit_price: float = 0.0


class POCreate(BaseModel):
    supplier_id: int
    items: list[POItemCreate]
    notes: str = ""


@router.get("/")
async def list_suppliers(
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Supplier).order_by(Supplier.name))
    suppliers = result.scalars().all()
    return [
        {
            "id": s.id, "name": s.name, "contact_person": s.contact_person,
            "phone": s.phone, "email": s.email, "address": s.address,
            "notes": s.notes, "is_active": s.is_active,
        }
        for s in suppliers
    ]


@router.post("/")
async def create_supplier(
    data: SupplierCreate,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    s = Supplier(**data.model_dump())
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return {"id": s.id, "name": s.name}


@router.get("/purchase-orders")
async def list_purchase_orders(
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PurchaseOrder).order_by(PurchaseOrder.ordered_at.desc()).limit(50)
    )
    orders = result.scalars().all()
    out = []
    for po in orders:
        supplier = await db.get(Supplier, po.supplier_id)
        result2 = await db.execute(
            select(PurchaseOrderItem).where(PurchaseOrderItem.purchase_order_id == po.id)
        )
        items = result2.scalars().all()
        items_out = []
        for it in items:
            ing = await db.get(Ingredient, it.ingredient_id)
            items_out.append({
                "ingredient_id": it.ingredient_id,
                "ingredient_name": ing.name if ing else "?",
                "quantity": it.quantity,
                "unit_price": it.unit_price,
                "line_total": it.line_total,
                "received_quantity": it.received_quantity,
            })
        out.append({
            "id": po.id,
            "supplier_name": supplier.name if supplier else "?",
            "supplier_id": po.supplier_id,
            "status": po.status,
            "total_amount": po.total_amount,
            "notes": po.notes,
            "ordered_at": po.ordered_at.isoformat() if po.ordered_at else "",
            "received_at": po.received_at.isoformat() if po.received_at else None,
            "items": items_out,
        })
    return out


@router.post("/purchase-orders")
async def create_purchase_order(
    data: POCreate,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    supplier = await db.get(Supplier, data.supplier_id)
    if not supplier:
        raise HTTPException(404, "Proveedor no encontrado")

    po = PurchaseOrder(
        supplier_id=data.supplier_id,
        notes=data.notes,
        created_by=user.id,
    )
    db.add(po)
    await db.flush()

    total = 0.0
    for item in data.items:
        line_total = item.quantity * item.unit_price
        poi = PurchaseOrderItem(
            purchase_order_id=po.id,
            ingredient_id=item.ingredient_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            line_total=line_total,
        )
        db.add(poi)
        total += line_total

    po.total_amount = total
    await db.commit()
    return {"id": po.id, "total": total}


@router.post("/purchase-orders/{po_id}/receive")
async def receive_purchase_order(
    po_id: int,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    po = await db.get(PurchaseOrder, po_id)
    if not po:
        raise HTTPException(404, "Orden no encontrada")

    po.status = "received"
    po.received_at = datetime.utcnow()

    result = await db.execute(
        select(PurchaseOrderItem).where(PurchaseOrderItem.purchase_order_id == po.id)
    )
    items = result.scalars().all()

    from backend.models_inventory import InventoryTransaction

    for item in items:
        received = item.received_quantity or item.quantity
        ingredient = await db.get(Ingredient, item.ingredient_id)
        if ingredient:
            ingredient.current_stock += received
            ingredient.unit_cost = item.unit_price
            txn = InventoryTransaction(
                ingredient_id=ingredient.id,
                transaction_type="purchase",
                quantity=received,
                unit_cost=item.unit_price,
                notes=f"Orden de compra #{po.id}",
                created_by=user.id,
            )
            db.add(txn)

            ph = PriceHistory(
                ingredient_id=ingredient.id,
                supplier_id=po.supplier_id,
                price=item.unit_price,
                quantity=received,
            )
            db.add(ph)

    await db.commit()
    return {"message": "Orden recibida, inventario actualizado"}


@router.get("/price-history/{ingredient_id}")
async def get_price_history(
    ingredient_id: int,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PriceHistory)
        .where(PriceHistory.ingredient_id == ingredient_id)
        .order_by(PriceHistory.recorded_at.desc())
        .limit(50)
    )
    rows = result.scalars().all()
    out = []
    for r in rows:
        supplier = await db.get(Supplier, r.supplier_id) if r.supplier_id else None
        out.append({
            "price": r.price,
            "quantity": r.quantity,
            "supplier_name": supplier.name if supplier else "Desconocido",
            "date": r.recorded_at.isoformat() if r.recorded_at else "",
        })
    return out
