"""Alert system for low stock notifications."""

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_admin_user
from backend.database import get_db
from backend.models import User
from backend.models_inventory import Ingredient

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class AlertConfig(BaseModel):
    email_enabled: bool = False
    sms_enabled: bool = False
    email_address: str = ""
    phone_number: str = ""


# In-memory alert config (in production, this would be in DB)
_alert_config = AlertConfig()
_alert_log: list[dict] = []


@router.get("/config")
async def get_alert_config(user: User = Depends(get_admin_user)):
    return _alert_config.model_dump()


@router.put("/config")
async def update_alert_config(
    data: AlertConfig,
    user: User = Depends(get_admin_user),
):
    global _alert_config
    _alert_config = data
    return {"message": "Configuración de alertas actualizada"}


@router.get("/check")
async def check_and_generate_alerts(
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Check inventory and generate alerts for low stock items."""
    result = await db.execute(
        select(Ingredient).where(Ingredient.is_active == True)
    )
    ingredients = result.scalars().all()

    alerts = []
    for ing in ingredients:
        if ing.current_stock <= 0:
            level = "out_of_stock"
            msg = f"⚠️ {ing.name}: SIN STOCK"
        elif ing.min_stock_alert > 0 and ing.current_stock <= ing.min_stock_alert:
            level = "critical"
            msg = f"🔴 {ing.name}: {ing.current_stock}{ing.unit} (mínimo: {ing.min_stock_alert})"
        elif ing.min_stock_alert > 0 and ing.current_stock <= ing.min_stock_alert * 2:
            level = "warning"
            msg = f"🟡 {ing.name}: {ing.current_stock}{ing.unit}"
        else:
            continue

        alert = {
            "ingredient_id": ing.id,
            "ingredient_name": ing.name,
            "current_stock": ing.current_stock,
            "min_stock": ing.min_stock_alert,
            "level": level,
            "message": msg,
            "timestamp": datetime.utcnow().isoformat(),
        }
        alerts.append(alert)

        # Simulate sending notifications
        if _alert_config.email_enabled and _alert_config.email_address:
            alert["email_sent_to"] = _alert_config.email_address
        if _alert_config.sms_enabled and _alert_config.phone_number:
            alert["sms_sent_to"] = _alert_config.phone_number

    _alert_log.extend(alerts)
    return {
        "alerts_count": len(alerts),
        "alerts": alerts,
        "config": _alert_config.model_dump(),
    }


@router.get("/log")
async def get_alert_log(
    limit: int = 50,
    user: User = Depends(get_admin_user),
):
    return _alert_log[-limit:]
