from datetime import datetime, date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.auth import get_current_user, get_staff_user, get_admin_user
from backend.cancellation import calculate_cancellation
from backend.database import get_db
from backend.models import (
    LunchPackage,
    Reservation,
    ReservationStatus,
    ReservationTable,
    Table,
    TimeSlot,
    User,
    UserRole,
)
from backend.schemas import (
    AdminCancelRequest,
    CancelInfo,
    ReservationCreate,
    ReservationOut,
)

router = APIRouter(prefix="/api/reservations", tags=["reservations"])


def _reservation_datetime(res_date: date, slot: TimeSlot) -> datetime:
    return datetime.combine(res_date, slot.start_time)


@router.post("/", response_model=ReservationOut)
async def create_reservation(
    data: ReservationCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    slot_r = await db.execute(select(TimeSlot).where(TimeSlot.id == data.time_slot_id))
    slot = slot_r.scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Horario no encontrado")

    pkg_r = await db.execute(
        select(LunchPackage).where(LunchPackage.id == data.lunch_package_id)
    )
    pkg = pkg_r.scalar_one_or_none()
    if not pkg:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    booked_q = (
        select(ReservationTable.table_id)
        .join(Reservation)
        .where(
            Reservation.date == data.date,
            Reservation.time_slot_id == data.time_slot_id,
            Reservation.status.in_([
                ReservationStatus.CONFIRMED,
                ReservationStatus.PENDING_PAYMENT,
            ]),
        )
    )
    booked = await db.execute(booked_q)
    booked_ids = {row[0] for row in booked.all()}

    for tid in data.table_ids:
        if tid in booked_ids:
            raise HTTPException(
                status_code=409,
                detail=f"La mesa {tid} no está disponible para ese horario",
            )
        tbl_r = await db.execute(select(Table).where(Table.id == tid, Table.is_active == True))
        if not tbl_r.scalar_one_or_none():
            raise HTTPException(status_code=404, detail=f"Mesa {tid} no encontrada")

    total = pkg.price * data.guest_count

    reservation = Reservation(
        user_id=user.id,
        date=data.date,
        time_slot_id=data.time_slot_id,
        lunch_package_id=data.lunch_package_id,
        status=ReservationStatus.PENDING_PAYMENT,
        total_amount=total,
        guest_count=data.guest_count,
        notes=data.notes,
    )
    db.add(reservation)
    await db.flush()

    for tid in data.table_ids:
        db.add(ReservationTable(reservation_id=reservation.id, table_id=tid))

    await db.commit()

    result = await db.execute(
        select(Reservation)
        .options(
            selectinload(Reservation.user),
            selectinload(Reservation.time_slot),
            selectinload(Reservation.lunch_package),
            selectinload(Reservation.reservation_tables).selectinload(
                ReservationTable.table
            ),
        )
        .where(Reservation.id == reservation.id)
    )
    return result.scalar_one()


@router.post("/{reservation_id}/pay", response_model=ReservationOut)
async def pay_reservation(
    reservation_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Reservation)
        .options(
            selectinload(Reservation.user),
            selectinload(Reservation.time_slot),
            selectinload(Reservation.lunch_package),
            selectinload(Reservation.reservation_tables).selectinload(
                ReservationTable.table
            ),
        )
        .where(Reservation.id == reservation_id)
    )
    res = result.scalar_one_or_none()
    if not res:
        raise HTTPException(status_code=404, detail="Reservación no encontrada")
    if res.user_id != user.id and user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="No autorizado")
    if res.status != ReservationStatus.PENDING_PAYMENT:
        raise HTTPException(status_code=400, detail="La reservación ya fue procesada")

    res.status = ReservationStatus.CONFIRMED
    res.paid_amount = res.total_amount
    res.confirmed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(res)
    return res


@router.get("/my", response_model=list[ReservationOut])
async def my_reservations(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Reservation)
        .options(
            selectinload(Reservation.user),
            selectinload(Reservation.time_slot),
            selectinload(Reservation.lunch_package),
            selectinload(Reservation.reservation_tables).selectinload(
                ReservationTable.table
            ),
        )
        .where(Reservation.user_id == user.id)
        .order_by(Reservation.date.desc(), Reservation.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{reservation_id}/cancel-info", response_model=CancelInfo)
async def cancel_info(
    reservation_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Reservation)
        .options(selectinload(Reservation.time_slot))
        .where(Reservation.id == reservation_id)
    )
    res = result.scalar_one_or_none()
    if not res:
        raise HTTPException(status_code=404, detail="Reservación no encontrada")
    if res.user_id != user.id and user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="No autorizado")

    res_dt = _reservation_datetime(res.date, res.time_slot)
    return calculate_cancellation(res_dt, datetime.utcnow(), res.paid_amount)


@router.post("/{reservation_id}/cancel", response_model=ReservationOut)
async def cancel_reservation(
    reservation_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Reservation)
        .options(
            selectinload(Reservation.user),
            selectinload(Reservation.time_slot),
            selectinload(Reservation.lunch_package),
            selectinload(Reservation.reservation_tables).selectinload(
                ReservationTable.table
            ),
        )
        .where(Reservation.id == reservation_id)
    )
    res = result.scalar_one_or_none()
    if not res:
        raise HTTPException(status_code=404, detail="Reservación no encontrada")
    if res.user_id != user.id and user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="No autorizado")
    if res.status == ReservationStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Ya fue cancelada")
    if res.status == ReservationStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="La reservación ya fue completada")

    res_dt = _reservation_datetime(res.date, res.time_slot)
    info = calculate_cancellation(res_dt, datetime.utcnow(), res.paid_amount)

    if not info.can_cancel_online:
        raise HTTPException(
            status_code=400,
            detail="Solo el administrador puede cancelar dentro de las últimas 24 horas. "
            "Contacte al restaurante presencialmente o por teléfono.",
        )

    res.status = ReservationStatus.CANCELLED
    res.cancelled_at = datetime.utcnow()
    res.cancelled_by = "customer"
    res.penalty_percentage = info.penalty_percentage
    res.refund_amount = info.refund_amount
    await db.commit()
    await db.refresh(res)
    return res


@router.post("/{reservation_id}/admin-cancel", response_model=ReservationOut)
async def admin_cancel_reservation(
    reservation_id: int,
    body: AdminCancelRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    result = await db.execute(
        select(Reservation)
        .options(
            selectinload(Reservation.user),
            selectinload(Reservation.time_slot),
            selectinload(Reservation.lunch_package),
            selectinload(Reservation.reservation_tables).selectinload(
                ReservationTable.table
            ),
        )
        .where(Reservation.id == reservation_id)
    )
    res = result.scalar_one_or_none()
    if not res:
        raise HTTPException(status_code=404, detail="Reservación no encontrada")
    if res.status == ReservationStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Ya fue cancelada")

    res_dt = _reservation_datetime(res.date, res.time_slot)
    info = calculate_cancellation(res_dt, datetime.utcnow(), res.paid_amount)

    res.status = ReservationStatus.CANCELLED
    res.cancelled_at = datetime.utcnow()
    res.cancelled_by = f"admin:{admin.name}"
    res.penalty_percentage = info.penalty_percentage
    res.refund_amount = info.refund_amount
    res.notes = (res.notes or "") + f"\nCancelado por admin: {body.reason}"
    await db.commit()
    await db.refresh(res)
    return res


@router.get("/all", response_model=list[ReservationOut])
async def all_reservations(
    reservation_date: date | None = None,
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(get_staff_user),
):
    q = select(Reservation).options(
        selectinload(Reservation.user),
        selectinload(Reservation.time_slot),
        selectinload(Reservation.lunch_package),
        selectinload(Reservation.reservation_tables).selectinload(
            ReservationTable.table
        ),
    )
    if reservation_date:
        q = q.where(Reservation.date == reservation_date)
    q = q.order_by(Reservation.date.desc(), Reservation.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()
