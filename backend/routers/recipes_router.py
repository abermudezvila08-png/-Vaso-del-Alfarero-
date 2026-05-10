"""Recipe and cost management API."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.auth import get_admin_user, get_staff_user
from backend.database import get_db
from backend.models import User
from backend.models_inventory import (
    Ingredient,
    OperatingCost,
    Recipe,
    RecipeIngredient,
)
from backend.predictions import calculate_recipe_cost
from backend.schemas_inventory import (
    OperatingCostCreate,
    OperatingCostOut,
    RecipeCreate,
    RecipeOut,
    CostBreakdown,
)

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


async def _recalculate_recipe(db: AsyncSession, recipe: Recipe) -> None:
    """Recalculate costs and selling price for a recipe."""
    ri_r = await db.execute(
        select(RecipeIngredient).where(RecipeIngredient.recipe_id == recipe.id)
    )
    ris = ri_r.scalars().all()

    total_ingredient_cost = 0.0
    for ri in ris:
        ing_r = await db.execute(
            select(Ingredient).where(Ingredient.id == ri.ingredient_id)
        )
        ing = ing_r.scalar_one_or_none()
        if ing:
            total_ingredient_cost += ri.actual_quantity * ing.unit_cost

    # Operating cost share
    today = date.today()
    op_r = await db.execute(
        select(OperatingCost)
        .where(OperatingCost.year == today.year)
        .order_by(OperatingCost.month.desc())
        .limit(1)
    )
    op = op_r.scalar_one_or_none()
    dishes_per_month = 30 * 30
    op_share = op.total / dishes_per_month if op else 0.0

    recipe.ingredient_cost = round(total_ingredient_cost, 2)
    recipe.operating_cost_share = round(op_share, 2)
    recipe.total_cost = round(total_ingredient_cost + op_share, 2)
    recipe.selling_price = round(
        recipe.total_cost * (1 + recipe.profit_margin / 100), 2
    )


@router.get("/", response_model=list[RecipeOut])
async def list_recipes(
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(get_staff_user),
):
    result = await db.execute(
        select(Recipe)
        .where(Recipe.is_active == True)
        .options(
            selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient)
        )
        .order_by(Recipe.name)
    )
    recipes = result.scalars().all()

    out = []
    for r in recipes:
        ingredients_out = []
        for ri in r.ingredients:
            cost = ri.actual_quantity * (ri.ingredient.unit_cost if ri.ingredient else 0)
            ingredients_out.append({
                "id": ri.id,
                "ingredient_id": ri.ingredient_id,
                "norm_quantity": ri.norm_quantity,
                "actual_quantity": ri.actual_quantity,
                "unit": ri.unit,
                "ingredient": {
                    "id": ri.ingredient.id,
                    "name": ri.ingredient.name,
                    "category": ri.ingredient.category,
                    "unit": ri.ingredient.unit,
                    "unit_cost": ri.ingredient.unit_cost,
                } if ri.ingredient else None,
                "cost_contribution": round(cost, 2),
            })

        out.append(RecipeOut(
            id=r.id,
            name=r.name,
            category=r.category,
            description=r.description,
            servings=r.servings,
            preparation_time_min=r.preparation_time_min,
            ingredient_cost=r.ingredient_cost,
            operating_cost_share=r.operating_cost_share,
            total_cost=r.total_cost,
            selling_price=r.selling_price,
            profit_margin=r.profit_margin,
            is_active=r.is_active,
            ingredients=ingredients_out,
        ))
    return out


@router.post("/", response_model=RecipeOut)
async def create_recipe(
    data: RecipeCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    recipe = Recipe(
        name=data.name,
        category=data.category,
        description=data.description,
        servings=data.servings,
        preparation_time_min=data.preparation_time_min,
        profit_margin=data.profit_margin,
    )
    db.add(recipe)
    await db.flush()

    for ing_data in data.ingredients:
        ing_r = await db.execute(
            select(Ingredient).where(Ingredient.id == ing_data.ingredient_id)
        )
        if not ing_r.scalar_one_or_none():
            raise HTTPException(
                status_code=404,
                detail=f"Ingrediente {ing_data.ingredient_id} no encontrado",
            )
        ri = RecipeIngredient(
            recipe_id=recipe.id,
            ingredient_id=ing_data.ingredient_id,
            norm_quantity=ing_data.norm_quantity,
            actual_quantity=ing_data.actual_quantity,
            unit=ing_data.unit,
        )
        db.add(ri)

    await db.flush()
    await _recalculate_recipe(db, recipe)
    await db.commit()
    await db.refresh(recipe)

    return RecipeOut(
        id=recipe.id,
        name=recipe.name,
        category=recipe.category,
        description=recipe.description,
        servings=recipe.servings,
        preparation_time_min=recipe.preparation_time_min,
        ingredient_cost=recipe.ingredient_cost,
        operating_cost_share=recipe.operating_cost_share,
        total_cost=recipe.total_cost,
        selling_price=recipe.selling_price,
        profit_margin=recipe.profit_margin,
        is_active=recipe.is_active,
    )


@router.get("/{recipe_id}/cost-breakdown")
async def get_cost_breakdown(
    recipe_id: int,
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(get_staff_user),
):
    breakdown = await calculate_recipe_cost(db, recipe_id)
    if not breakdown:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    return breakdown


@router.post("/recalculate-all")
async def recalculate_all_recipes(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Recalculate costs for all recipes (e.g. after updating ingredient prices)."""
    result = await db.execute(
        select(Recipe).where(Recipe.is_active == True)
    )
    recipes = result.scalars().all()
    count = 0
    for recipe in recipes:
        await _recalculate_recipe(db, recipe)
        count += 1
    await db.commit()
    return {"detail": f"{count} recetas recalculadas"}


# --- Operating Costs ---
@router.get("/operating-costs/", response_model=list[OperatingCostOut])
async def list_operating_costs(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    result = await db.execute(
        select(OperatingCost).order_by(
            OperatingCost.year.desc(), OperatingCost.month.desc()
        )
    )
    costs = result.scalars().all()
    return [
        OperatingCostOut(
            id=c.id,
            month=c.month,
            year=c.year,
            water_cost=c.water_cost,
            electricity_cost=c.electricity_cost,
            gas_cost=c.gas_cost,
            salary_cost=c.salary_cost,
            rent_cost=c.rent_cost,
            maintenance_cost=c.maintenance_cost,
            other_costs=c.other_costs,
            total=c.total,
            notes=c.notes,
        )
        for c in costs
    ]


@router.post("/operating-costs/", response_model=OperatingCostOut)
async def create_operating_cost(
    data: OperatingCostCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    oc = OperatingCost(
        month=data.month,
        year=data.year,
        water_cost=data.water_cost,
        electricity_cost=data.electricity_cost,
        gas_cost=data.gas_cost,
        salary_cost=data.salary_cost,
        rent_cost=data.rent_cost,
        maintenance_cost=data.maintenance_cost,
        other_costs=data.other_costs,
        notes=data.notes,
    )
    db.add(oc)
    await db.commit()
    await db.refresh(oc)
    return OperatingCostOut(
        id=oc.id,
        month=oc.month,
        year=oc.year,
        water_cost=oc.water_cost,
        electricity_cost=oc.electricity_cost,
        gas_cost=oc.gas_cost,
        salary_cost=oc.salary_cost,
        rent_cost=oc.rent_cost,
        maintenance_cost=oc.maintenance_cost,
        other_costs=oc.other_costs,
        total=oc.total,
        notes=oc.notes,
    )
