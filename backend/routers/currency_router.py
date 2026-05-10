"""Currency exchange rate management and converter API."""

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_admin_user, get_current_user
from backend.database import get_db
from backend.models import User
from backend.currency import (
    ExchangeRate, get_rates_for_date, convert_currency,
    DEFAULT_RATES, CURRENCY_NAMES, CURRENCY_SYMBOLS,
)

router = APIRouter(prefix="/api/currency", tags=["currency"])


class RateUpdate(BaseModel):
    currency_code: str
    rate_to_cup: float


class ConvertRequest(BaseModel):
    amount: float
    from_currency: str = "CUP"
    to_currency: str = "USD"


@router.get("/rates")
async def get_current_rates(db: AsyncSession = Depends(get_db)):
    """Get today's exchange rates. Public endpoint."""
    rates = await get_rates_for_date(db)
    return {
        "date": date.today().isoformat(),
        "base": "CUP",
        "rates": rates,
        "names": CURRENCY_NAMES,
        "symbols": CURRENCY_SYMBOLS,
    }


@router.post("/convert")
async def convert(
    data: ConvertRequest,
    db: AsyncSession = Depends(get_db),
):
    """Convert between currencies. Public endpoint."""
    rates = await get_rates_for_date(db)
    result = convert_currency(data.amount, data.from_currency, data.to_currency, rates)
    return result


@router.put("/rates")
async def update_rates(
    rates: list[RateUpdate],
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin: set today's exchange rates."""
    today = date.today()

    for r in rates:
        if r.currency_code not in CURRENCY_NAMES or r.currency_code == "CUP":
            continue
        # Delete existing rate for today
        await db.execute(
            delete(ExchangeRate).where(
                ExchangeRate.currency_code == r.currency_code,
                ExchangeRate.rate_date == today,
            )
        )
        new_rate = ExchangeRate(
            currency_code=r.currency_code,
            rate_to_cup=r.rate_to_cup,
            rate_date=today,
            updated_at=datetime.utcnow(),
            updated_by=user.name if hasattr(user, 'name') else str(user.id),
        )
        db.add(new_rate)

    await db.commit()
    return {"message": "Tasas actualizadas", "date": today.isoformat()}


@router.get("/rates/history")
async def rate_history(
    currency: str = "USD",
    days: int = 30,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin: get rate history for a currency."""
    result = await db.execute(
        select(ExchangeRate)
        .where(ExchangeRate.currency_code == currency)
        .order_by(ExchangeRate.rate_date.desc())
        .limit(days)
    )
    rows = result.scalars().all()
    return [
        {
            "date": r.rate_date.isoformat(),
            "rate": r.rate_to_cup,
            "updated_by": r.updated_by,
        }
        for r in rows
    ]
