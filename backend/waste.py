"""Waste and shrinkage tracking with cause categorization."""

import enum
from datetime import datetime

from sqlalchemy import (
    Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text,
)
from sqlalchemy.orm import relationship

from backend.database import Base


class WasteCause(str, enum.Enum):
    EXPIRED = "expired"
    DAMAGED = "damaged"
    OVERPRODUCTION = "overproduction"
    PREPARATION = "preparation"
    CUSTOMER_RETURN = "customer_return"
    STORAGE = "storage"
    OTHER = "other"


WASTE_CAUSE_LABELS = {
    WasteCause.EXPIRED: "Caducado",
    WasteCause.DAMAGED: "Dañado",
    WasteCause.OVERPRODUCTION: "Sobreproducción",
    WasteCause.PREPARATION: "Preparación",
    WasteCause.CUSTOMER_RETURN: "Devolución del cliente",
    WasteCause.STORAGE: "Error de almacenamiento",
    WasteCause.OTHER: "Otro",
}


class WasteRecord(Base):
    __tablename__ = "waste_records"

    id = Column(Integer, primary_key=True, index=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(10), default="g")
    cause = Column(Enum(WasteCause), nullable=False)
    cost_lost = Column(Float, default=0.0)
    notes = Column(Text, default="")
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    ingredient = relationship("Ingredient")
    user = relationship("User")
