"""Payment processing module.

Supports:
- Transfermóvil (Cuba)
- Cash (CUP or foreign currency)
- Card (simulated)
- QR walk-in (last-minute table charge)

All amounts stored in CUP. Multi-currency conversions on input.
"""

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text,
)
from sqlalchemy.orm import relationship

from backend.database import Base


class PaymentMethod(str, enum.Enum):
    TRANSFERMOVIL = "transfermovil"
    CASH = "cash"
    CARD = "card"
    QR_WALKIN = "qr_walkin"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    method = Column(Enum(PaymentMethod), nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)

    amount_original = Column(Float, nullable=False)
    currency_original = Column(String(5), default="CUP")
    amount_cup = Column(Float, nullable=False)
    exchange_rate_used = Column(Float, default=1.0)

    # Transfermóvil fields
    transfermovil_ref = Column(String(50), nullable=True)
    transfermovil_phone = Column(String(20), nullable=True)

    # QR walk-in fields
    qr_code = Column(String(100), nullable=True)
    table_number = Column(Integer, nullable=True)

    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="payments")


class OrderType(str, enum.Enum):
    DINE_IN = "dine_in"
    DELIVERY = "delivery"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_type = Column(Enum(OrderType), default=OrderType.DINE_IN)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)

    table_number = Column(Integer, nullable=True)
    guest_count = Column(Integer, default=1)

    # Delivery info
    delivery_address = Column(Text, nullable=True)
    delivery_phone = Column(String(20), nullable=True)

    subtotal_cup = Column(Float, default=0.0)
    total_cup = Column(Float, default=0.0)

    payment_method = Column(Enum(PaymentMethod), nullable=True)
    payment_currency = Column(String(5), default="CUP")
    is_paid = Column(Boolean, default=False)

    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price_cup = Column(Float, default=0.0)
    line_total_cup = Column(Float, default=0.0)

    order = relationship("Order", back_populates="items")
    recipe = relationship("Recipe")
