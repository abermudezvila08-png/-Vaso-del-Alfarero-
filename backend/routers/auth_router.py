from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from backend.config import COMPANY_CODE
from backend.database import get_db
from backend.models import User, UserRole
from backend.schemas import (
    StaffLogin,
    Token,
    UserLogin,
    UserOut,
    UserRegister,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=Token)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    user = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        password_hash=hash_password(data.password),
        role=UserRole.CUSTOMER,
        is_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return Token(access_token=token)


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return Token(access_token=token)


@router.post("/staff-login", response_model=Token)
async def staff_login(data: StaffLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    if user.role not in (UserRole.STAFF, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="No tiene permisos de personal")

    if data.company_code != COMPANY_CODE:
        raise HTTPException(status_code=403, detail="Código de empresa inválido")

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return Token(access_token=token)


@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    return user
