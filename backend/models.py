import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Boolean,
    Date,
    Time,
)
from sqlalchemy.orm import relationship

from backend.database import Base


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    STAFF = "staff"
    ADMIN = "admin"


class ReservationStatus(str, enum.Enum):
    PENDING_PAYMENT = "pending_payment"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    reservations = relationship("Reservation", back_populates="user")


class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    capacity = Column(Integer, nullable=False)
    location = Column(String(100), default="Interior")
    is_active = Column(Boolean, default=True)

    reservation_tables = relationship("ReservationTable", back_populates="table")


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    label = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)


class LunchPackage(Base):
    __tablename__ = "lunch_packages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), default="")
    price = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)
    lunch_package_id = Column(Integer, ForeignKey("lunch_packages.id"), nullable=False)
    status = Column(
        Enum(ReservationStatus),
        default=ReservationStatus.PENDING_PAYMENT,
        nullable=False,
    )
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    refund_amount = Column(Float, default=0.0)
    penalty_percentage = Column(Float, default=0.0)
    guest_count = Column(Integer, default=1)
    notes = Column(String(500), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancelled_by = Column(String(50), nullable=True)

    user = relationship("User", back_populates="reservations")
    time_slot = relationship("TimeSlot")
    lunch_package = relationship("LunchPackage")
    reservation_tables = relationship(
        "ReservationTable", back_populates="reservation", cascade="all, delete-orphan"
    )


class ReservationTable(Base):
    __tablename__ = "reservation_tables"

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=False)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=False)

    reservation = relationship("Reservation", back_populates="reservation_tables")
    table = relationship("Table", back_populates="reservation_tables")
