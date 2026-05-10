"""QR code generation for walk-in customers at empty tables."""

import hashlib
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_staff_user, get_current_user
from backend.database import get_db
from backend.models import User
from backend.payments import Order, OrderType, OrderStatus

router = APIRouter(prefix="/api/qr", tags=["qr"])


def _generate_qr_code(table_number: int) -> str:
    ts = datetime.utcnow().strftime("%Y%m%d%H%M")
    raw = f"mesa-{table_number}-{ts}"
    short_hash = hashlib.sha256(raw.encode()).hexdigest()[:12]
    return f"QR-{table_number}-{short_hash}"


class QRGenerate(BaseModel):
    table_number: int


@router.post("/generate")
async def generate_qr(
    data: QRGenerate,
    user: User = Depends(get_staff_user),
    db: AsyncSession = Depends(get_db),
):
    """Staff generates QR for an empty table so a walk-in customer can order."""
    qr_code = _generate_qr_code(data.table_number)

    order = Order(
        user_id=user.id,
        order_type=OrderType.DINE_IN,
        status=OrderStatus.PENDING,
        table_number=data.table_number,
        notes=f"Mesa walk-in QR: {qr_code}",
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    return {
        "qr_code": qr_code,
        "table_number": data.table_number,
        "order_id": order.id,
        "message": f"QR generado para mesa {data.table_number}",
    }


@router.get("/validate/{qr_code}")
async def validate_qr(
    qr_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Customer scans QR to see their table order."""
    result = await db.execute(
        select(Order).where(
            Order.notes.contains(qr_code),
            Order.status == OrderStatus.PENDING,
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "QR inválido o expirado")

    return {
        "order_id": order.id,
        "table_number": order.table_number,
        "status": order.status.value,
        "total_cup": order.total_cup,
    }
