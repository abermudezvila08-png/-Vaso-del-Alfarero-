from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_current_user, get_admin_user
from backend.database import get_db
from backend.models import (
    Table,
    Reservation,
    ReservationStatus,
    ReservationTable,
    User,
)
from backend.schemas import TableCreate, TableOut

router = APIRouter(prefix="/api/tables", tags=["tables"])


@router.get("/", response_model=list[TableOut])
async def list_tables(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(Table).where(Table.is_active == True))
    return result.scalars().all()


@router.get("/available", response_model=list[TableOut])
async def available_tables(
    reservation_date: date,
    time_slot_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    booked_q = (
        select(ReservationTable.table_id)
        .join(Reservation)
        .where(
            Reservation.date == reservation_date,
            Reservation.time_slot_id == time_slot_id,
            Reservation.status.in_([
                ReservationStatus.CONFIRMED,
                ReservationStatus.PENDING_PAYMENT,
            ]),
        )
    )
    booked = await db.execute(booked_q)
    booked_ids = {row[0] for row in booked.all()}

    result = await db.execute(select(Table).where(Table.is_active == True))
    tables = result.scalars().all()
    return [t for t in tables if t.id not in booked_ids]


@router.post("/", response_model=TableOut)
async def create_table(
    data: TableCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    table = Table(name=data.name, capacity=data.capacity, location=data.location)
    db.add(table)
    await db.commit()
    await db.refresh(table)
    return table


@router.delete("/{table_id}")
async def delete_table(
    table_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(Table).where(Table.id == table_id))
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    table.is_active = False
    await db.commit()
    return {"detail": "Mesa desactivada"}
