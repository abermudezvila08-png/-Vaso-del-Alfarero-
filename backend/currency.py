"""Currency management with daily exchange rates.

Base currency: CUP (Peso Cubano).
Supports: USD, EUR, MLC (Moneda Libremente Convertible), CAD, MXN.
Rates are configurable by admin and default to approximate market rates.
"""

from datetime import date, datetime
from sqlalchemy import Column, Date, DateTime, Float, Integer, String, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import Base

# Default exchange rates (CUP per 1 unit of foreign currency)
DEFAULT_RATES = {
    "USD": 300.0,
    "EUR": 330.0,
    "MLC": 250.0,
    "CAD": 220.0,
    "MXN": 15.0,
    "GBP": 380.0,
}

CURRENCY_NAMES = {
    "CUP": "Peso Cubano",
    "USD": "Dólar Estadounidense",
    "EUR": "Euro",
    "MLC": "Moneda Libremente Convertible",
    "CAD": "Dólar Canadiense",
    "MXN": "Peso Mexicano",
    "GBP": "Libra Esterlina",
}

CURRENCY_SYMBOLS = {
    "CUP": "$",
    "USD": "US$",
    "EUR": "€",
    "MLC": "MLC$",
    "CAD": "CA$",
    "MXN": "MX$",
    "GBP": "£",
}


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    currency_code = Column(String(5), nullable=False)
    rate_to_cup = Column(Float, nullable=False)
    rate_date = Column(Date, nullable=False, default=date.today)
    updated_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(String(100), default="")


async def get_rates_for_date(
    db: AsyncSession, target_date: date | None = None
) -> dict[str, float]:
    """Get exchange rates for a given date. Falls back to latest available."""
    if target_date is None:
        target_date = date.today()

    result = await db.execute(
        select(ExchangeRate)
        .where(ExchangeRate.rate_date == target_date)
    )
    rates_rows = result.scalars().all()

    if rates_rows:
        return {r.currency_code: r.rate_to_cup for r in rates_rows}

    # Fallback to latest rates
    result = await db.execute(
        select(ExchangeRate)
        .order_by(ExchangeRate.rate_date.desc())
        .limit(len(DEFAULT_RATES))
    )
    rates_rows = result.scalars().all()

    if rates_rows:
        return {r.currency_code: r.rate_to_cup for r in rates_rows}

    return DEFAULT_RATES.copy()


def convert_currency(
    amount: float,
    from_currency: str,
    to_currency: str,
    rates: dict[str, float],
) -> dict:
    """Convert amount between currencies using CUP as base."""
    if from_currency == to_currency:
        return {
            "original_amount": amount,
            "converted_amount": amount,
            "from_currency": from_currency,
            "to_currency": to_currency,
            "rate": 1.0,
        }

    # Convert to CUP first
    if from_currency == "CUP":
        amount_cup = amount
    else:
        rate = rates.get(from_currency, 1.0)
        amount_cup = amount * rate

    # Convert from CUP to target
    if to_currency == "CUP":
        converted = amount_cup
        rate_used = rates.get(from_currency, 1.0) if from_currency != "CUP" else 1.0
    else:
        target_rate = rates.get(to_currency, 1.0)
        converted = amount_cup / target_rate
        if from_currency == "CUP":
            rate_used = 1 / target_rate
        else:
            rate_used = rates.get(from_currency, 1.0) / target_rate

    return {
        "original_amount": round(amount, 2),
        "converted_amount": round(converted, 2),
        "from_currency": from_currency,
        "to_currency": to_currency,
        "rate": round(rate_used, 6),
    }
