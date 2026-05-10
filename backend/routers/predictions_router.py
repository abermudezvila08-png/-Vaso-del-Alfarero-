"""Prediction and analytics API."""

from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_admin_user
from backend.database import get_db
from backend.models import User
from backend.predictions import (
    calculate_demand_predictions,
    calculate_inventory_alerts,
    generate_prediction_report,
)
from backend.schemas_inventory import PredictionReport

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


@router.get("/report", response_model=PredictionReport)
async def get_prediction_report(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    return await generate_prediction_report(db)


@router.get("/demand")
async def get_demand_predictions(
    lookback_days: int = 30,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    return await calculate_demand_predictions(db, lookback_days)


@router.get("/inventory-alerts")
async def get_inventory_alerts(
    forecast_days: int = 7,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    return await calculate_inventory_alerts(db, forecast_days)
