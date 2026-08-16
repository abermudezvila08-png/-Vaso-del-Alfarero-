"""Dashboard and reports: sales trends, margins, financial overview. Admin only."""

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_admin_user
from backend.database import get_db
from backend.models import User
from backend.models_inventory import DailySales, Recipe, Ingredient, OperatingCost
from backend.payments import Order, OrderItem, OrderStatus, Payment, PaymentStatus
from backend.waste import WasteRecord

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary(
    days: int = 30,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Main dashboard summary with all key metrics."""
    since = datetime.utcnow() - timedelta(days=days)
    today = date.today()

    # Total revenue from paid orders
    rev_result = await db.execute(
        select(func.sum(Order.total_cup))
        .where(Order.is_paid == True, Order.created_at >= since)
    )
    total_revenue = rev_result.scalar() or 0

    # Total orders
    orders_result = await db.execute(
        select(func.count(Order.id))
        .where(Order.created_at >= since)
    )
    total_orders = orders_result.scalar() or 0

    paid_orders_result = await db.execute(
        select(func.count(Order.id))
        .where(Order.is_paid == True, Order.created_at >= since)
    )
    paid_orders = paid_orders_result.scalar() or 0

    # Total waste cost
    waste_result = await db.execute(
        select(func.sum(WasteRecord.cost_lost))
        .where(WasteRecord.recorded_at >= since)
    )
    total_waste = waste_result.scalar() or 0

    # Inventory value
    inv_result = await db.execute(
        select(func.sum(Ingredient.current_stock * Ingredient.unit_cost))
        .where(Ingredient.is_active == True)
    )
    inventory_value = inv_result.scalar() or 0

    # Low stock count
    low_stock = await db.execute(
        select(func.count(Ingredient.id))
        .where(
            Ingredient.is_active == True,
            Ingredient.current_stock <= Ingredient.min_stock_alert,
            Ingredient.min_stock_alert > 0,
        )
    )
    low_stock_count = low_stock.scalar() or 0

    # Recipe count
    recipe_count_result = await db.execute(
        select(func.count(Recipe.id)).where(Recipe.is_active == True)
    )
    recipe_count = recipe_count_result.scalar() or 0

    # Operating costs for current month
    op_result = await db.execute(
        select(OperatingCost).where(
            OperatingCost.month == today.month,
            OperatingCost.year == today.year,
        )
    )
    op_cost = op_result.scalar_one_or_none()
    monthly_operating_cost = 0
    if op_cost:
        monthly_operating_cost = (
            op_cost.water_cost + op_cost.electricity_cost + op_cost.gas_cost +
            op_cost.salary_cost + op_cost.rent_cost + op_cost.maintenance_cost +
            op_cost.other_costs
        )

    return {
        "period_days": days,
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "paid_orders": paid_orders,
        "avg_order_value": round(total_revenue / paid_orders, 2) if paid_orders > 0 else 0,
        "total_waste_cost": round(total_waste, 2),
        "inventory_value": round(inventory_value, 2),
        "low_stock_items": low_stock_count,
        "active_recipes": recipe_count,
        "monthly_operating_cost": round(monthly_operating_cost, 2),
        "estimated_profit": round(total_revenue - total_waste - (monthly_operating_cost * days / 30), 2),
    }


@router.get("/sales-by-day")
async def sales_by_day(
    days: int = 30,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Daily sales data for charting."""
    since = date.today() - timedelta(days=days)

    result = await db.execute(
        select(
            DailySales.date,
            func.sum(DailySales.revenue).label("revenue"),
            func.sum(DailySales.food_cost).label("cost"),
            func.sum(DailySales.quantity_sold).label("quantity"),
        )
        .where(DailySales.date >= since)
        .group_by(DailySales.date)
        .order_by(DailySales.date)
    )
    rows = result.all()
    return [
        {
            "date": row.date.isoformat(),
            "revenue": round(row.revenue or 0, 2),
            "cost": round(row.cost or 0, 2),
            "profit": round((row.revenue or 0) - (row.cost or 0), 2),
            "quantity": row.quantity or 0,
        }
        for row in rows
    ]


@router.get("/sales-by-recipe")
async def sales_by_recipe(
    days: int = 30,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Sales breakdown by recipe for charting."""
    since = date.today() - timedelta(days=days)

    result = await db.execute(
        select(
            DailySales.recipe_id,
            func.sum(DailySales.revenue).label("revenue"),
            func.sum(DailySales.food_cost).label("cost"),
            func.sum(DailySales.quantity_sold).label("quantity"),
        )
        .where(DailySales.date >= since)
        .group_by(DailySales.recipe_id)
        .order_by(func.sum(DailySales.revenue).desc())
    )
    rows = result.all()
    out = []
    for row in rows:
        recipe = await db.get(Recipe, row.recipe_id)
        margin = 0
        if row.revenue and row.revenue > 0:
            margin = ((row.revenue - row.cost) / row.revenue) * 100
        out.append({
            "recipe_name": recipe.name if recipe else f"ID {row.recipe_id}",
            "revenue": round(row.revenue or 0, 2),
            "cost": round(row.cost or 0, 2),
            "profit": round((row.revenue or 0) - (row.cost or 0), 2),
            "quantity": row.quantity or 0,
            "margin_pct": round(margin, 1),
        })
    return out


@router.get("/payment-methods")
async def payment_method_breakdown(
    days: int = 30,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Payment method usage breakdown."""
    since = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(
            Payment.method,
            func.count(Payment.id).label("count"),
            func.sum(Payment.amount_cup).label("total_cup"),
        )
        .where(
            Payment.status == PaymentStatus.CONFIRMED,
            Payment.created_at >= since,
        )
        .group_by(Payment.method)
    )
    rows = result.all()
    method_labels = {
        "transfermovil": "Transfermóvil",
        "cash": "Efectivo",
        "card": "Tarjeta",
        "qr_walkin": "QR Walk-in",
    }
    return [
        {
            "method": row.method.value if row.method else "unknown",
            "label": method_labels.get(row.method.value if row.method else "", "Otro"),
            "count": row.count,
            "total_cup": round(row.total_cup or 0, 2),
        }
        for row in rows
    ]
