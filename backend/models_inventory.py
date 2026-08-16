"""Inventory, recipe, and cost management models."""

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
    Text,
)
from sqlalchemy.orm import relationship

from backend.database import Base


class IngredientCategory(str, enum.Enum):
    PROTEINAS = "Proteínas"
    CARBOHIDRATOS = "Carbohidratos"
    VEGETALES = "Vegetales"
    SOPAS = "Sopas"
    POSTRES = "Postres"
    BEBIDAS = "Bebidas"
    SALSAS = "Salsas"
    INGREDIENTES = "Ingredientes"
    OTROS = "Otros"


class TransactionType(str, enum.Enum):
    PURCHASE = "purchase"
    CONSUMPTION = "consumption"
    WASTE = "waste"
    ADJUSTMENT = "adjustment"


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    category = Column(String(50), default="Otros")
    unit = Column(String(10), default="g")  # g, ml, piece
    # Norm portions (Cuban > European > Asian)
    norm_cuban_g = Column(Float, nullable=True)
    norm_european_g = Column(Float, nullable=True)
    norm_asian_g = Column(Float, nullable=True)
    norm_source = Column(String(50), default="Estándar")
    # Actual portion used in this restaurant
    actual_portion_g = Column(Float, nullable=True)
    # Inventory
    current_stock = Column(Float, default=0.0)
    min_stock_alert = Column(Float, default=0.0)
    unit_cost = Column(Float, default=0.0)  # cost per unit (g or ml or piece)
    supplier = Column(String(200), default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    recipe_ingredients = relationship("RecipeIngredient", back_populates="ingredient")
    transactions = relationship("InventoryTransaction", back_populates="ingredient")


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(50), default="Plato principal")
    description = Column(Text, default="")
    servings = Column(Integer, default=1)
    preparation_time_min = Column(Integer, default=30)
    # Costs (calculated)
    ingredient_cost = Column(Float, default=0.0)
    operating_cost_share = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    selling_price = Column(Float, default=0.0)
    profit_margin = Column(Float, default=30.0)  # percentage
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ingredients = relationship(
        "RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan"
    )


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    norm_quantity = Column(Float, nullable=False)  # quantity per norm
    actual_quantity = Column(Float, nullable=False)  # quantity actually used
    unit = Column(String(10), default="g")

    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="recipe_ingredients")


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    reference = Column(String(200), default="")  # order #, reservation #, etc.
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100), default="")

    ingredient = relationship("Ingredient", back_populates="transactions")


class OperatingCost(Base):
    __tablename__ = "operating_costs"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    water_cost = Column(Float, default=0.0)
    electricity_cost = Column(Float, default=0.0)
    gas_cost = Column(Float, default=0.0)
    salary_cost = Column(Float, default=0.0)
    rent_cost = Column(Float, default=0.0)
    maintenance_cost = Column(Float, default=0.0)
    other_costs = Column(Float, default=0.0)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def total(self) -> float:
        return (
            self.water_cost
            + self.electricity_cost
            + self.gas_cost
            + self.salary_cost
            + self.rent_cost
            + self.maintenance_cost
            + self.other_costs
        )


class DailySales(Base):
    """Track daily sales for demand prediction."""
    __tablename__ = "daily_sales"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    quantity_sold = Column(Integer, default=0)
    revenue = Column(Float, default=0.0)
    food_cost = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
