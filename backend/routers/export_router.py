"""Data import/export: CSV/JSON for ingredients, recipes, sales, waste."""

import csv
import io
import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_admin_user
from backend.database import get_db
from backend.models import User
from backend.models_inventory import Ingredient, Recipe, DailySales, InventoryTransaction

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/ingredients/csv")
async def export_ingredients_csv(
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Ingredient).order_by(Ingredient.name))
    ingredients = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Nombre", "Categoría", "Unidad", "Norma Cuba (g)", "Norma Europa (g)",
        "Norma Asia (g)", "Porción Real (g)", "Stock Actual", "Stock Mínimo",
        "Costo Unitario", "Proveedor", "Activo",
    ])
    for i in ingredients:
        writer.writerow([
            i.id, i.name, i.category, i.unit, i.norm_cuban_g, i.norm_european_g,
            i.norm_asian_g, i.actual_portion_g, i.current_stock, i.min_stock_alert,
            i.unit_cost, i.supplier, i.is_active,
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=ingredientes_{datetime.now().strftime('%Y%m%d')}.csv"},
    )


@router.get("/recipes/csv")
async def export_recipes_csv(
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Recipe).order_by(Recipe.name))
    recipes = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Nombre", "Categoría", "Costo Ingredientes", "Costo Operativo",
        "Costo Total", "Precio de Venta", "Margen (%)", "Activo",
    ])
    for r in recipes:
        writer.writerow([
            r.id, r.name, r.category, r.ingredient_cost, r.operating_cost_share,
            r.total_cost, r.selling_price, r.profit_margin, r.is_active,
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=recetas_{datetime.now().strftime('%Y%m%d')}.csv"},
    )


@router.get("/sales/csv")
async def export_sales_csv(
    days: int = 30,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import date
    since = date.today() - timedelta(days=days)

    result = await db.execute(
        select(DailySales)
        .where(DailySales.date >= since)
        .order_by(DailySales.date)
    )
    sales = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Fecha", "Receta ID", "Cantidad", "Ingreso", "Costo"])
    for s in sales:
        recipe = await db.get(Recipe, s.recipe_id)
        writer.writerow([
            s.date.isoformat(), recipe.name if recipe else s.recipe_id,
            s.quantity_sold, s.revenue, s.cost,
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=ventas_{datetime.now().strftime('%Y%m%d')}.csv"},
    )


@router.get("/inventory-transactions/csv")
async def export_transactions_csv(
    days: int = 30,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(InventoryTransaction)
        .where(InventoryTransaction.created_at >= since)
        .order_by(InventoryTransaction.created_at.desc())
    )
    txns = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Fecha", "Ingrediente", "Tipo", "Cantidad", "Costo Unitario", "Notas"])
    for t in txns:
        ingredient = await db.get(Ingredient, t.ingredient_id)
        writer.writerow([
            t.created_at.isoformat() if t.created_at else "",
            ingredient.name if ingredient else t.ingredient_id,
            t.transaction_type, t.quantity, t.unit_cost, t.notes,
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=transacciones_{datetime.now().strftime('%Y%m%d')}.csv"},
    )


@router.post("/ingredients/import")
async def import_ingredients_csv(
    file: UploadFile = File(...),
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Import ingredients from CSV. Headers must match export format."""
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(400, "Archivo debe ser CSV")

    content = await file.read()
    text = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(text))

    imported = 0
    for row in reader:
        name = row.get("Nombre", "").strip()
        if not name:
            continue

        existing = await db.execute(select(Ingredient).where(Ingredient.name == name))
        if existing.scalar_one_or_none():
            continue

        ing = Ingredient(
            name=name,
            category=row.get("Categoría", "Otros"),
            unit=row.get("Unidad", "g"),
            norm_cuban_g=_float(row.get("Norma Cuba (g)")),
            norm_european_g=_float(row.get("Norma Europa (g)")),
            norm_asian_g=_float(row.get("Norma Asia (g)")),
            actual_portion_g=_float(row.get("Porción Real (g)")),
            current_stock=_float(row.get("Stock Actual")) or 0,
            min_stock_alert=_float(row.get("Stock Mínimo")) or 0,
            unit_cost=_float(row.get("Costo Unitario")) or 0,
            supplier=row.get("Proveedor", ""),
        )
        db.add(ing)
        imported += 1

    await db.commit()
    return {"imported": imported, "message": f"{imported} ingredientes importados"}


def _float(val: str | None) -> float | None:
    if val is None or val.strip() == "" or val.strip().lower() == "none":
        return None
    try:
        return float(val)
    except ValueError:
        return None
