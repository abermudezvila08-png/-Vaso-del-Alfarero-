"""Food norms and price adjustment API."""

from fastapi import APIRouter, Depends, Query

from backend.auth import get_staff_user
from backend.models import User
from backend.norms import (
    PORTION_NORMS,
    calculate_adjusted_price,
    get_all_categories,
    get_norm,
    get_norms_by_category,
)
from backend.schemas_inventory import NormOut, PriceAdjustment

router = APIRouter(prefix="/api/norms", tags=["norms"])


@router.get("/", response_model=list[NormOut])
async def list_norms(
    category: str | None = None,
    _staff: User = Depends(get_staff_user),
):
    norms = get_norms_by_category(category) if category else PORTION_NORMS
    return [
        NormOut(
            ingredient=n.ingredient,
            category=n.category,
            cuban_portion_g=n.cuban_portion_g,
            european_portion_g=n.european_portion_g,
            asian_portion_g=n.asian_portion_g,
            effective_portion_g=n.effective_portion_g,
            norm_source=n.norm_source,
            unit=n.unit,
            notes=n.notes,
        )
        for n in norms
    ]


@router.get("/categories")
async def list_categories(
    _staff: User = Depends(get_staff_user),
):
    return get_all_categories()


@router.get("/search", response_model=list[NormOut])
async def search_norms(
    q: str = Query(..., min_length=2),
    _staff: User = Depends(get_staff_user),
):
    lower = q.lower()
    matching = [
        n for n in PORTION_NORMS
        if lower in n.ingredient.lower() or lower in n.category.lower()
    ]
    return [
        NormOut(
            ingredient=n.ingredient,
            category=n.category,
            cuban_portion_g=n.cuban_portion_g,
            european_portion_g=n.european_portion_g,
            asian_portion_g=n.asian_portion_g,
            effective_portion_g=n.effective_portion_g,
            norm_source=n.norm_source,
            unit=n.unit,
            notes=n.notes,
        )
        for n in matching
    ]


@router.get("/price-adjustment", response_model=PriceAdjustment)
async def get_price_adjustment(
    ingredient_name: str,
    actual_portion_g: float,
    base_cost: float,
    _staff: User = Depends(get_staff_user),
):
    """Calculate price when actual ingredient differs from norm.

    Example: Egg norm = 50g, actual = 75g, base cost = $0.50
    → adjusted cost = $0.75 (50% more product = 50% more cost)
    """
    norm = get_norm(ingredient_name)
    if not norm:
        norm_g = 100.0
    else:
        norm_g = norm.effective_portion_g

    result = calculate_adjusted_price(norm_g, actual_portion_g, base_cost)

    return PriceAdjustment(
        ingredient_name=ingredient_name,
        norm_portion_g=result["norm_portion_g"],
        actual_portion_g=result["actual_portion_g"],
        ratio=result["ratio"],
        base_cost=result["base_cost"],
        adjusted_cost=result["adjusted_cost"],
        difference_pct=result["difference_pct"],
    )
