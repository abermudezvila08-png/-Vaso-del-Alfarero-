"""Simple demand prediction and inventory management engine.

Uses moving averages and trend analysis for forecasting.
No external ML libraries required — pure Python implementation.
"""

from datetime import date, timedelta
from collections import defaultdict

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models_inventory import (
    DailySales,
    Ingredient,
    Recipe,
    RecipeIngredient,
    InventoryTransaction,
    OperatingCost,
    TransactionType,
)
from backend.schemas_inventory import (
    DemandPrediction,
    InventoryAlert,
    PredictionReport,
)


async def calculate_demand_predictions(
    db: AsyncSession,
    lookback_days: int = 30,
) -> list[DemandPrediction]:
    """Predict demand for each recipe based on recent sales history."""
    today = date.today()
    start_date = today - timedelta(days=lookback_days)

    result = await db.execute(
        select(
            DailySales.recipe_id,
            func.avg(DailySales.quantity_sold).label("avg_sales"),
            func.sum(DailySales.quantity_sold).label("total_sales"),
            func.count(DailySales.id).label("days_with_sales"),
        )
        .where(DailySales.date >= start_date)
        .group_by(DailySales.recipe_id)
    )
    sales_data = result.all()

    predictions = []
    for row in sales_data:
        recipe_r = await db.execute(
            select(Recipe).where(Recipe.id == row.recipe_id)
        )
        recipe = recipe_r.scalar_one_or_none()
        if not recipe:
            continue

        avg_daily = float(row.avg_sales) if row.avg_sales else 0
        days_count = int(row.days_with_sales) if row.days_with_sales else 1

        # Simple trend: compare first half vs second half
        mid_date = start_date + timedelta(days=lookback_days // 2)

        first_half = await db.execute(
            select(func.avg(DailySales.quantity_sold))
            .where(
                DailySales.recipe_id == row.recipe_id,
                DailySales.date >= start_date,
                DailySales.date < mid_date,
            )
        )
        second_half = await db.execute(
            select(func.avg(DailySales.quantity_sold))
            .where(
                DailySales.recipe_id == row.recipe_id,
                DailySales.date >= mid_date,
                DailySales.date <= today,
            )
        )

        avg_first = float(first_half.scalar() or 0)
        avg_second = float(second_half.scalar() or 0)

        if avg_first > 0:
            trend_ratio = avg_second / avg_first
        else:
            trend_ratio = 1.0

        if trend_ratio > 1.1:
            trend = "up"
            weekly_multiplier = min(trend_ratio, 1.3)
        elif trend_ratio < 0.9:
            trend = "down"
            weekly_multiplier = max(trend_ratio, 0.7)
        else:
            trend = "stable"
            weekly_multiplier = 1.0

        predicted_weekly = avg_daily * 7 * weekly_multiplier
        confidence = min(days_count / lookback_days, 1.0)

        predictions.append(
            DemandPrediction(
                recipe_name=recipe.name,
                recipe_id=recipe.id,
                avg_daily_sales=round(avg_daily, 1),
                predicted_next_week=round(predicted_weekly, 1),
                trend=trend,
                confidence=round(confidence, 2),
            )
        )

    return predictions


async def calculate_inventory_alerts(
    db: AsyncSession,
    forecast_days: int = 7,
) -> list[InventoryAlert]:
    """Check inventory levels and predict when ingredients will run out."""
    today = date.today()
    start_date = today - timedelta(days=30)

    ingredients_r = await db.execute(
        select(Ingredient).where(Ingredient.is_active == True)
    )
    ingredients = ingredients_r.scalars().all()

    alerts = []
    for ing in ingredients:
        # Calculate average daily consumption from transactions
        consumption_r = await db.execute(
            select(func.sum(InventoryTransaction.quantity))
            .where(
                InventoryTransaction.ingredient_id == ing.id,
                InventoryTransaction.transaction_type == TransactionType.CONSUMPTION,
                InventoryTransaction.created_at >= start_date,
            )
        )
        total_consumed = float(consumption_r.scalar() or 0)
        avg_daily_consumption = total_consumed / 30 if total_consumed > 0 else 0

        if avg_daily_consumption > 0:
            days_until_depletion = ing.current_stock / avg_daily_consumption
        else:
            days_until_depletion = 999

        reorder_qty = avg_daily_consumption * forecast_days * 1.2  # 20% buffer

        if days_until_depletion <= 2 or ing.current_stock <= ing.min_stock_alert:
            urgency = "critical"
        elif days_until_depletion <= 5:
            urgency = "warning"
        else:
            urgency = "ok"

        if urgency != "ok" or ing.current_stock <= ing.min_stock_alert * 1.5:
            alerts.append(
                InventoryAlert(
                    ingredient_id=ing.id,
                    ingredient_name=ing.name,
                    current_stock=round(ing.current_stock, 1),
                    min_stock=round(ing.min_stock_alert, 1),
                    days_until_depletion=round(days_until_depletion, 1),
                    reorder_recommended=round(reorder_qty, 1),
                    urgency=urgency,
                )
            )

    alerts.sort(key=lambda a: {"critical": 0, "warning": 1, "ok": 2}[a.urgency])
    return alerts


async def generate_prediction_report(db: AsyncSession) -> PredictionReport:
    """Generate a comprehensive prediction report."""
    predictions = await calculate_demand_predictions(db)
    alerts = await calculate_inventory_alerts(db)

    # Estimate weekly financials
    weekly_revenue = 0.0
    weekly_cost = 0.0
    for pred in predictions:
        recipe_r = await db.execute(
            select(Recipe).where(Recipe.id == pred.recipe_id)
        )
        recipe = recipe_r.scalar_one_or_none()
        if recipe:
            weekly_revenue += pred.predicted_next_week * recipe.selling_price
            weekly_cost += pred.predicted_next_week * recipe.total_cost

    return PredictionReport(
        demand_predictions=predictions,
        inventory_alerts=alerts,
        estimated_weekly_revenue=round(weekly_revenue, 2),
        estimated_weekly_cost=round(weekly_cost, 2),
        estimated_weekly_profit=round(weekly_revenue - weekly_cost, 2),
    )


async def calculate_recipe_cost(
    db: AsyncSession,
    recipe_id: int,
) -> dict:
    """Calculate the full cost breakdown for a recipe including overhead."""
    recipe_r = await db.execute(
        select(Recipe).where(Recipe.id == recipe_id)
    )
    recipe = recipe_r.scalar_one_or_none()
    if not recipe:
        return {}

    # Get recipe ingredients
    ri_r = await db.execute(
        select(RecipeIngredient)
        .where(RecipeIngredient.recipe_id == recipe_id)
    )
    recipe_ings = ri_r.scalars().all()

    ingredient_costs = []
    total_ingredient_cost = 0.0
    norm_adjustments = []

    for ri in recipe_ings:
        ing_r = await db.execute(
            select(Ingredient).where(Ingredient.id == ri.ingredient_id)
        )
        ing = ing_r.scalar_one_or_none()
        if not ing:
            continue

        cost = ri.actual_quantity * ing.unit_cost
        total_ingredient_cost += cost

        ingredient_costs.append({
            "ingredient": ing.name,
            "norm_qty": ri.norm_quantity,
            "actual_qty": ri.actual_quantity,
            "unit": ri.unit,
            "unit_cost": ing.unit_cost,
            "line_cost": round(cost, 2),
        })

        # Track norm adjustments
        if ri.norm_quantity > 0 and ri.actual_quantity != ri.norm_quantity:
            ratio = ri.actual_quantity / ri.norm_quantity
            norm_adjustments.append({
                "ingredient": ing.name,
                "norm_qty": ri.norm_quantity,
                "actual_qty": ri.actual_quantity,
                "ratio": round(ratio, 2),
                "cost_impact": round(cost * (ratio - 1), 2),
                "norm_source": ing.norm_source,
            })

    # Get operating costs (latest month)
    today = date.today()
    op_r = await db.execute(
        select(OperatingCost)
        .where(OperatingCost.year == today.year)
        .order_by(OperatingCost.month.desc())
        .limit(1)
    )
    op_cost = op_r.scalar_one_or_none()

    # Estimate dishes per month (assuming ~30 dishes/day average)
    dishes_per_month = 30 * 30
    operating_cost_per_dish = 0.0
    if op_cost:
        operating_cost_per_dish = op_cost.total / dishes_per_month

    total_production_cost = total_ingredient_cost + operating_cost_per_dish
    profit_amount = total_production_cost * (recipe.profit_margin / 100)
    selling_price = total_production_cost + profit_amount

    return {
        "recipe_name": recipe.name,
        "ingredient_costs": ingredient_costs,
        "total_ingredient_cost": round(total_ingredient_cost, 2),
        "operating_cost_per_dish": round(operating_cost_per_dish, 2),
        "total_production_cost": round(total_production_cost, 2),
        "profit_margin_pct": recipe.profit_margin,
        "profit_amount": round(profit_amount, 2),
        "selling_price": round(selling_price, 2),
        "norm_adjustments": norm_adjustments,
    }
