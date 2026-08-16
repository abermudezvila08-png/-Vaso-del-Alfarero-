from datetime import date, time, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


# --- Auth ---
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class StaffLogin(BaseModel):
    email: EmailStr
    password: str
    company_code: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    role: str
    is_verified: bool

    class Config:
        from_attributes = True


# --- Tables ---
class TableOut(BaseModel):
    id: int
    name: str
    capacity: int
    location: str
    is_active: bool

    class Config:
        from_attributes = True


class TableCreate(BaseModel):
    name: str
    capacity: int
    location: str = "Interior"


# --- Time Slots ---
class TimeSlotOut(BaseModel):
    id: int
    start_time: time
    end_time: time
    label: str
    is_active: bool

    class Config:
        from_attributes = True


class TimeSlotCreate(BaseModel):
    start_time: time
    end_time: time
    label: str


# --- Lunch Packages ---
class LunchPackageOut(BaseModel):
    id: int
    name: str
    description: str
    price: float
    is_active: bool

    class Config:
        from_attributes = True


class LunchPackageCreate(BaseModel):
    name: str
    description: str = ""
    price: float


# --- Reservations ---
class ReservationCreate(BaseModel):
    date: date
    time_slot_id: int
    table_ids: list[int]
    lunch_package_id: int
    guest_count: int = 1
    notes: str = ""


class ReservationTableOut(BaseModel):
    id: int
    table_id: int
    table: Optional[TableOut] = None

    class Config:
        from_attributes = True


class ReservationOut(BaseModel):
    id: int
    user_id: int
    date: date
    time_slot_id: int
    lunch_package_id: int
    status: str
    total_amount: float
    paid_amount: float
    refund_amount: float
    penalty_percentage: float
    guest_count: int
    notes: str
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[str] = None
    user: Optional[UserOut] = None
    time_slot: Optional[TimeSlotOut] = None
    lunch_package: Optional[LunchPackageOut] = None
    reservation_tables: list[ReservationTableOut] = []

    class Config:
        from_attributes = True


class CancelInfo(BaseModel):
    hours_remaining: float
    penalty_percentage: float
    refund_percentage: float
    refund_amount: float
    penalty_amount: float
    can_cancel_online: bool
    message: str


class AdminCancelRequest(BaseModel):
    reason: str = ""
