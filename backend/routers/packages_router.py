from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_current_user, get_admin_user
from backend.database import get_db
from backend.models import LunchPackage, User
from backend.schemas import LunchPackageCreate, LunchPackageOut

router = APIRouter(prefix="/api/packages", tags=["packages"])


@router.get("/", response_model=list[LunchPackageOut])
async def list_packages(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(LunchPackage).where(LunchPackage.is_active == True)
    )
    return result.scalars().all()


@router.post("/", response_model=LunchPackageOut)
async def create_package(
    data: LunchPackageCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    pkg = LunchPackage(name=data.name, description=data.description, price=data.price)
    db.add(pkg)
    await db.commit()
    await db.refresh(pkg)
    return pkg


@router.delete("/{package_id}")
async def delete_package(
    package_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    result = await db.execute(
        select(LunchPackage).where(LunchPackage.id == package_id)
    )
    pkg = result.scalar_one_or_none()
    if not pkg:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    pkg.is_active = False
    await db.commit()
    return {"detail": "Paquete desactivado"}
