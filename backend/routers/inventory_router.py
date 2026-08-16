"""Inventory and ingredient management API."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.auth import get_admin_user, get_staff_user
from backend.database import get_db
from backend.models import User
from backend.models_inventory import (
    Ingredient,
    InventoryTransaction,
    TransactionType,
)
from backend.schemas_inventory import (
    IngredientCreate,
    IngredientOut,
    IngredientUpdate,
    TransactionCreate,
    TransactionOut,
)

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


def _ingredient_to_out(ing: Ingredient) -> IngredientOut:
    effective = ing.norm_cuban_g or ing.norm_european_g or ing.norm_asian_g
    if ing.norm_cuban_g is not None:
        source = "NC (Norma Cubana)"
    elif ing.norm_european_g is not None:
        source = "EU (Norma Europea)"
    elif ing.norm_asian_g is not None:
        source = "ASIA (Norma Asiática)"
    else:
        source = "Estándar"

    stock_status = "ok"
    if ing.min_stock_alert > 0:
        if ing.current_stock <= 0:
            stock_status = "out_of_stock"
        elif ing.current_stock <= ing.min_stock_alert:
            stock_status = "critical"
        elif ing.current_stock <= ing.min_stock_alert * 1.5:
            stock_status = "warning"

    return IngredientOut(
        id=ing.id,
        name=ing.name,
        category=ing.category,
        unit=ing.unit,
        norm_cuban_g=ing.norm_cuban_g,
        norm_european_g=ing.norm_european_g,
        norm_asian_g=ing.norm_asian_g,
        norm_source=source,
        actual_portion_g=ing.actual_portion_g,
        current_stock=ing.current_stock,
        min_stock_alert=ing.min_stock_alert,
        unit_cost=ing.unit_cost,
        supplier=ing.supplier,
        is_active=ing.is_active,
        effective_norm_g=effective,
        stock_status=stock_status,
    )


@router.get("/ingredients", response_model=list[IngredientOut])
async def list_ingredients(
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(get_staff_user),
):
    result = await db.execute(
        select(Ingredient).where(Ingredient.is_active == True).order_by(Ingredient.name)
    )
    return [_ingredient_to_out(i) for i in result.scalars().all()]


@router.post("/ingredients", response_model=IngredientOut)
async def create_ingredient(
    data: IngredientCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    existing = await db.execute(
        select(Ingredient).where(Ingredient.name == data.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El ingrediente ya existe")

    norm_source = "Estándar"
    if data.norm_cuban_g is not None:
        norm_source = "NC (Norma Cubana)"
    elif data.norm_european_g is not None:
        norm_source = "EU (Norma Europea)"
    elif data.norm_asian_g is not None:
        norm_source = "ASIA (Norma Asiática)"

    ing = Ingredient(
        name=data.name,
        category=data.category,
        unit=data.unit,
        norm_cuban_g=data.norm_cuban_g,
        norm_european_g=data.norm_european_g,
        norm_asian_g=data.norm_asian_g,
        norm_source=norm_source,
        actual_portion_g=data.actual_portion_g,
        current_stock=data.current_stock,
        min_stock_alert=data.min_stock_alert,
        unit_cost=data.unit_cost,
        supplier=data.supplier,
    )
    db.add(ing)
    await db.commit()
    await db.refresh(ing)
    return _ingredient_to_out(ing)


@router.put("/ingredients/{ingredient_id}", response_model=IngredientOut)
async def update_ingredient(
    ingredient_id: int,
    data: IngredientUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    result = await db.execute(
        select(Ingredient).where(Ingredient.id == ingredient_id)
    )
    ing = result.scalar_one_or_none()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(ing, field, value)

    if data.norm_cuban_g is not None:
        ing.norm_source = "NC (Norma Cubana)"
    elif data.norm_european_g is not None:
        ing.norm_source = "EU (Norma Europea)"
    elif data.norm_asian_g is not None:
        ing.norm_source = "ASIA (Norma Asiática)"

    await db.commit()
    await db.refresh(ing)
    return _ingredient_to_out(ing)


@router.post("/transactions", response_model=TransactionOut)
async def create_transaction(
    data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_staff_user),
):
    ing_r = await db.execute(
        select(Ingredient).where(Ingredient.id == data.ingredient_id)
    )
    ing = ing_r.scalar_one_or_none()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")

    tx_type = TransactionType(data.transaction_type)
    total_cost = data.quantity * data.unit_cost

    tx = InventoryTransaction(
        ingredient_id=data.ingredient_id,
        transaction_type=tx_type,
        quantity=data.quantity,
        unit_cost=data.unit_cost,
        total_cost=total_cost,
        reference=data.reference,
        notes=data.notes,
        created_by=staff.name,
    )
    db.add(tx)

    # Update stock
    if tx_type == TransactionType.PURCHASE:
        ing.current_stock += data.quantity
        if data.unit_cost > 0:
            ing.unit_cost = data.unit_cost
    elif tx_type in (TransactionType.CONSUMPTION, TransactionType.WASTE):
        ing.current_stock = max(0, ing.current_stock - data.quantity)
    elif tx_type == TransactionType.ADJUSTMENT:
        ing.current_stock = data.quantity  # absolute set

    await db.commit()
    await db.refresh(tx)

    return TransactionOut(
        id=tx.id,
        ingredient_id=tx.ingredient_id,
        transaction_type=tx.transaction_type.value,
        quantity=tx.quantity,
        unit_cost=tx.unit_cost,
        total_cost=tx.total_cost,
        reference=tx.reference,
        notes=tx.notes,
        created_at=tx.created_at,
        created_by=tx.created_by,
    )


@router.get("/transactions", response_model=list[TransactionOut])
async def list_transactions(
    ingredient_id: int | None = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(get_staff_user),
):
    q = select(InventoryTransaction).order_by(
        InventoryTransaction.created_at.desc()
    )
    if ingredient_id:
        q = q.where(InventoryTransaction.ingredient_id == ingredient_id)
    q = q.limit(limit)

    result = await db.execute(q)
    txs = result.scalars().all()

    out = []
    for tx in txs:
        out.append(
            TransactionOut(
                id=tx.id,
                ingredient_id=tx.ingredient_id,
                transaction_type=tx.transaction_type.value,
                quantity=tx.quantity,
                unit_cost=tx.unit_cost,
                total_cost=tx.total_cost,
                reference=tx.reference,
                notes=tx.notes,
                created_at=tx.created_at,
                created_by=tx.created_by,
            )
        )
    return out


@router.get("/alerts")
async def stock_alerts(
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(get_staff_user),
):
    result = await db.execute(
        select(Ingredient).where(Ingredient.is_active == True)
    )
    ingredients = result.scalars().all()

    alerts = []
    for ing in ingredients:
        if ing.min_stock_alert > 0 and ing.current_stock <= ing.min_stock_alert:
            alerts.append({
                "ingredient_id": ing.id,
                "ingredient_name": ing.name,
                "current_stock": ing.current_stock,
                "min_stock": ing.min_stock_alert,
                "unit": ing.unit,
                "urgency": "critical" if ing.current_stock <= 0 else "warning",
            })

    alerts.sort(key=lambda a: 0 if a["urgency"] == "critical" else 1)
    return alerts
