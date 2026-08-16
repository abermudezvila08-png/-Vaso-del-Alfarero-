from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_current_user, get_admin_user
from backend.database import get_db
from backend.models import TimeSlot, User
from backend.schemas import TimeSlotCreate, TimeSlotOut

router = APIRouter(prefix="/api/timeslots", tags=["timeslots"])


@router.get("/", response_model=list[TimeSlotOut])
async def list_timeslots(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(TimeSlot).where(TimeSlot.is_active == True))
    return result.scalars().all()


@router.post("/", response_model=TimeSlotOut)
async def create_timeslot(
    data: TimeSlotCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    ts = TimeSlot(
        start_time=data.start_time,
        end_time=data.end_time,
        label=data.label,
    )
    db.add(ts)
    await db.commit()
    await db.refresh(ts)
    return ts


@router.delete("/{slot_id}")
async def delete_timeslot(
    slot_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(TimeSlot).where(TimeSlot.id == slot_id))
    ts = result.scalar_one_or_none()
    if not ts:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    ts.is_active = False
    await db.commit()
    return {"detail": "Horario desactivado"}
