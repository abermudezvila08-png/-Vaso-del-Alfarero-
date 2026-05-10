"""Seed the database with initial data: tables, time slots, packages, and admin user."""

from datetime import time

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import hash_password
from backend.models import LunchPackage, Table, TimeSlot, User, UserRole


async def seed_data(db: AsyncSession) -> None:
    existing = await db.execute(select(User).limit(1))
    if existing.scalar_one_or_none():
        return

    # Admin user
    admin = User(
        name="Administrador",
        email="admin@restaurante.com",
        phone="+1234567890",
        password_hash=hash_password("admin123"),
        role=UserRole.ADMIN,
        is_verified=True,
    )
    db.add(admin)

    # Staff user
    staff = User(
        name="Personal",
        email="staff@restaurante.com",
        phone="+1234567891",
        password_hash=hash_password("staff123"),
        role=UserRole.STAFF,
        is_verified=True,
    )
    db.add(staff)

    # Tables
    tables = [
        Table(name="Mesa 1", capacity=2, location="Terraza"),
        Table(name="Mesa 2", capacity=2, location="Terraza"),
        Table(name="Mesa 3", capacity=4, location="Interior"),
        Table(name="Mesa 4", capacity=4, location="Interior"),
        Table(name="Mesa 5", capacity=6, location="Interior"),
        Table(name="Mesa 6", capacity=6, location="Salón Privado"),
        Table(name="Mesa 7", capacity=8, location="Salón Privado"),
        Table(name="Mesa 8", capacity=10, location="Salón VIP"),
    ]
    for t in tables:
        db.add(t)

    # Time slots
    slots = [
        TimeSlot(start_time=time(10, 0), end_time=time(11, 30), label="10:00 - 11:30 AM"),
        TimeSlot(start_time=time(11, 30), end_time=time(13, 0), label="11:30 AM - 1:00 PM"),
        TimeSlot(start_time=time(13, 0), end_time=time(14, 30), label="1:00 - 2:30 PM"),
        TimeSlot(start_time=time(14, 30), end_time=time(16, 0), label="2:30 - 4:00 PM"),
        TimeSlot(start_time=time(18, 0), end_time=time(19, 30), label="6:00 - 7:30 PM"),
        TimeSlot(start_time=time(19, 30), end_time=time(21, 0), label="7:30 - 9:00 PM"),
        TimeSlot(start_time=time(21, 0), end_time=time(22, 30), label="9:00 - 10:30 PM"),
    ]
    for s in slots:
        db.add(s)

    # Lunch packages
    packages = [
        LunchPackage(
            name="Paquete Básico",
            description="Entrada + Plato principal + Bebida",
            price=25.00,
        ),
        LunchPackage(
            name="Paquete Premium",
            description="Entrada + Plato principal + Postre + 2 Bebidas",
            price=45.00,
        ),
        LunchPackage(
            name="Paquete VIP",
            description="2 Entradas + Plato principal + Postre + Vino + Café",
            price=75.00,
        ),
        LunchPackage(
            name="Paquete Ejecutivo",
            description="Entrada + Plato principal + Postre + Bebida + Café",
            price=35.00,
        ),
    ]
    for p in packages:
        db.add(p)

    await db.commit()
