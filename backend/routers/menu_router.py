"""Customer-facing menu and ordering endpoints.

Customers can:
- Browse menu (recipes with selling prices)
- Create orders (dine-in or delivery)
- Pay via Transfermóvil, cash, card
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import User
from backend.models_inventory import Recipe, RecipeIngredient, Ingredient, InventoryTransaction
from backend.payments import (
    Order, OrderItem, OrderStatus, OrderType, Payment,
    PaymentMethod, PaymentStatus,
)
from backend.currency import get_rates_for_date, convert_currency

router = APIRouter(prefix="/api/menu", tags=["menu"])


class MenuItem(BaseModel):
    id: int
    name: str
    description: str
    category: str
    selling_price_cup: float
    is_available: bool


class OrderItemCreate(BaseModel):
    recipe_id: int
    quantity: int = 1


class CreateOrder(BaseModel):
    order_type: str = "dine_in"  # dine_in or delivery
    items: list[OrderItemCreate]
    guest_count: int = 1
    table_number: int | None = None
    delivery_address: str | None = None
    delivery_phone: str | None = None
    notes: str = ""


class PayOrder(BaseModel):
    method: str  # transfermovil, cash, card, qr_walkin
    currency: str = "CUP"
    transfermovil_ref: str | None = None
    transfermovil_phone: str | None = None


class OrderOut(BaseModel):
    id: int
    order_type: str
    status: str
    guest_count: int
    subtotal_cup: float
    total_cup: float
    is_paid: bool
    items: list[dict]
    created_at: str


@router.get("/", response_model=list[MenuItem])
async def get_menu(db: AsyncSession = Depends(get_db)):
    """Public menu — no auth required."""
    result = await db.execute(
        select(Recipe).where(Recipe.is_active == True)
    )
    recipes = result.scalars().all()
    items = []
    for r in recipes:
        items.append(MenuItem(
            id=r.id,
            name=r.name,
            description=r.description or "",
            category=r.category,
            selling_price_cup=round(r.selling_price, 2),
            is_available=r.is_active,
        ))
    return items


@router.post("/orders", response_model=OrderOut)
async def create_order(
    data: CreateOrder,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        otype = OrderType(data.order_type)
    except ValueError:
        raise HTTPException(400, "Tipo de orden inválido (dine_in o delivery)")

    if otype == OrderType.DELIVERY and not data.delivery_address:
        raise HTTPException(400, "Dirección de entrega requerida")

    order = Order(
        user_id=user.id,
        order_type=otype,
        guest_count=data.guest_count,
        table_number=data.table_number,
        delivery_address=data.delivery_address,
        delivery_phone=data.delivery_phone,
        notes=data.notes,
    )
    db.add(order)
    await db.flush()

    subtotal = 0.0
    for item in data.items:
        recipe = await db.get(Recipe, item.recipe_id)
        if not recipe or not recipe.is_active:
            raise HTTPException(400, f"Plato ID {item.recipe_id} no disponible")

        line_total = recipe.selling_price * item.quantity
        oi = OrderItem(
            order_id=order.id,
            recipe_id=item.recipe_id,
            quantity=item.quantity,
            unit_price_cup=recipe.selling_price,
            line_total_cup=line_total,
        )
        db.add(oi)
        subtotal += line_total

    order.subtotal_cup = round(subtotal, 2)
    order.total_cup = round(subtotal, 2)
    await db.commit()
    await db.refresh(order)

    return _order_to_out(order, data.items)


@router.post("/orders/{order_id}/pay")
async def pay_order(
    order_id: int,
    data: PayOrder,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    order = await db.get(Order, order_id)
    if not order or order.user_id != user.id:
        raise HTTPException(404, "Orden no encontrada")
    if order.is_paid:
        raise HTTPException(400, "Orden ya pagada")

    try:
        method = PaymentMethod(data.method)
    except ValueError:
        raise HTTPException(400, "Método de pago inválido")

    rates = await get_rates_for_date(db)
    conversion = convert_currency(order.total_cup, "CUP", data.currency, rates)
    amount_in_currency = conversion["converted_amount"]

    payment = Payment(
        order_id=order.id,
        user_id=user.id,
        method=method,
        amount_original=amount_in_currency,
        currency_original=data.currency,
        amount_cup=order.total_cup,
        exchange_rate_used=rates.get(data.currency, 1.0) if data.currency != "CUP" else 1.0,
        transfermovil_ref=data.transfermovil_ref,
        transfermovil_phone=data.transfermovil_phone,
        status=PaymentStatus.CONFIRMED,
        confirmed_at=datetime.utcnow(),
    )
    db.add(payment)

    order.is_paid = True
    order.payment_method = method
    order.payment_currency = data.currency
    order.status = OrderStatus.CONFIRMED

    # Auto-deduct inventory
    result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    order_items = result.scalars().all()
    for oi in order_items:
        result2 = await db.execute(
            select(RecipeIngredient).where(RecipeIngredient.recipe_id == oi.recipe_id)
        )
        recipe_ings = result2.scalars().all()
        for ri in recipe_ings:
            ingredient = await db.get(Ingredient, ri.ingredient_id)
            if ingredient:
                deduction = ri.actual_quantity * oi.quantity
                ingredient.current_stock = max(0, ingredient.current_stock - deduction)
                txn = InventoryTransaction(
                    ingredient_id=ingredient.id,
                    transaction_type="consumption",
                    quantity=deduction,
                    unit_cost=ingredient.unit_cost,
                    notes=f"Orden #{order.id} - {oi.quantity}x receta #{oi.recipe_id}",
                    created_by=user.id,
                )
                db.add(txn)

    await db.commit()

    return {
        "message": "Pago confirmado",
        "payment_id": payment.id,
        "amount_paid": amount_in_currency,
        "currency": data.currency,
        "amount_cup": order.total_cup,
        "method": data.method,
    }


@router.get("/orders/my", response_model=list[OrderOut])
async def my_orders(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .limit(20)
    )
    orders = result.scalars().all()
    out = []
    for o in orders:
        result2 = await db.execute(
            select(OrderItem).where(OrderItem.order_id == o.id)
        )
        items_rows = result2.scalars().all()
        items_data = []
        for it in items_rows:
            recipe = await db.get(Recipe, it.recipe_id)
            items_data.append({
                "recipe_id": it.recipe_id,
                "recipe_name": recipe.name if recipe else "?",
                "quantity": it.quantity,
                "unit_price": it.unit_price_cup,
                "line_total": it.line_total_cup,
            })
        out.append(OrderOut(
            id=o.id,
            order_type=o.order_type.value if o.order_type else "dine_in",
            status=o.status.value if o.status else "pending",
            guest_count=o.guest_count or 1,
            subtotal_cup=o.subtotal_cup,
            total_cup=o.total_cup,
            is_paid=o.is_paid,
            items=items_data,
            created_at=o.created_at.isoformat() if o.created_at else "",
        ))
    return out


def _order_to_out(order: Order, items_input: list[OrderItemCreate]) -> OrderOut:
    return OrderOut(
        id=order.id,
        order_type=order.order_type.value if order.order_type else "dine_in",
        status=order.status.value if order.status else "pending",
        guest_count=order.guest_count or 1,
        subtotal_cup=order.subtotal_cup,
        total_cup=order.total_cup,
        is_paid=order.is_paid,
        items=[{"recipe_id": i.recipe_id, "quantity": i.quantity} for i in items_input],
        created_at=order.created_at.isoformat() if order.created_at else "",
    )
