"""Pydantic schemas for inventory, recipes, and cost management."""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


# --- Ingredients ---
class IngredientCreate(BaseModel):
    name: str
    category: str = "Otros"
    unit: str = "g"
    norm_cuban_g: Optional[float] = None
    norm_european_g: Optional[float] = None
    norm_asian_g: Optional[float] = None
    actual_portion_g: Optional[float] = None
    current_stock: float = 0.0
    min_stock_alert: float = 0.0
    unit_cost: float = 0.0
    supplier: str = ""


class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    norm_cuban_g: Optional[float] = None
    norm_european_g: Optional[float] = None
    norm_asian_g: Optional[float] = None
    actual_portion_g: Optional[float] = None
    current_stock: Optional[float] = None
    min_stock_alert: Optional[float] = None
    unit_cost: Optional[float] = None
    supplier: Optional[str] = None


class IngredientOut(BaseModel):
    id: int
    name: str
    category: str
    unit: str
    norm_cuban_g: Optional[float]
    norm_european_g: Optional[float]
    norm_asian_g: Optional[float]
    norm_source: str
    actual_portion_g: Optional[float]
    current_stock: float
    min_stock_alert: float
    unit_cost: float
    supplier: str
    is_active: bool
    effective_norm_g: Optional[float] = None
    stock_status: str = "ok"

    class Config:
        from_attributes = True


# --- Recipes ---
class IngredientBrief(BaseModel):
    id: int
    name: str
    category: str
    unit: str
    unit_cost: float


class RecipeIngredientCreate(BaseModel):
    ingredient_id: int
    norm_quantity: float
    actual_quantity: float
    unit: str = "g"


class RecipeIngredientOut(BaseModel):
    id: int
    ingredient_id: int
    norm_quantity: float
    actual_quantity: float
    unit: str
    ingredient: Optional[IngredientBrief] = None
    cost_contribution: float = 0.0

    class Config:
        from_attributes = True


class RecipeCreate(BaseModel):
    name: str
    category: str = "Plato principal"
    description: str = ""
    servings: int = 1
    preparation_time_min: int = 30
    profit_margin: float = 30.0
    ingredients: list[RecipeIngredientCreate] = []


class RecipeOut(BaseModel):
    id: int
    name: str
    category: str
    description: str
    servings: int
    preparation_time_min: int
    ingredient_cost: float
    operating_cost_share: float
    total_cost: float
    selling_price: float
    profit_margin: float
    is_active: bool
    ingredients: list[RecipeIngredientOut] = []

    class Config:
        from_attributes = True


# --- Inventory Transactions ---
class TransactionCreate(BaseModel):
    ingredient_id: int
    transaction_type: str  # purchase, consumption, waste, adjustment
    quantity: float
    unit_cost: float = 0.0
    reference: str = ""
    notes: str = ""


class TransactionOut(BaseModel):
    id: int
    ingredient_id: int
    transaction_type: str
    quantity: float
    unit_cost: float
    total_cost: float
    reference: str
    notes: str
    created_at: datetime
    created_by: str
    ingredient: Optional[IngredientOut] = None

    class Config:
        from_attributes = True


# --- Operating Costs ---
class OperatingCostCreate(BaseModel):
    month: int
    year: int
    water_cost: float = 0.0
    electricity_cost: float = 0.0
    gas_cost: float = 0.0
    salary_cost: float = 0.0
    rent_cost: float = 0.0
    maintenance_cost: float = 0.0
    other_costs: float = 0.0
    notes: str = ""


class OperatingCostOut(BaseModel):
    id: int
    month: int
    year: int
    water_cost: float
    electricity_cost: float
    gas_cost: float
    salary_cost: float
    rent_cost: float
    maintenance_cost: float
    other_costs: float
    total: float
    notes: str

    class Config:
        from_attributes = True


# --- Cost Calculation ---
class CostBreakdown(BaseModel):
    recipe_name: str
    ingredient_costs: list[dict]
    total_ingredient_cost: float
    operating_cost_per_dish: float
    total_production_cost: float
    profit_margin_pct: float
    profit_amount: float
    selling_price: float
    norm_adjustments: list[dict]


# --- Predictions ---
class DemandPrediction(BaseModel):
    recipe_name: str
    recipe_id: int
    avg_daily_sales: float
    predicted_next_week: float
    trend: str  # "up", "down", "stable"
    confidence: float


class InventoryAlert(BaseModel):
    ingredient_id: int
    ingredient_name: str
    current_stock: float
    min_stock: float
    days_until_depletion: float
    reorder_recommended: float
    urgency: str  # "critical", "warning", "ok"


class PredictionReport(BaseModel):
    demand_predictions: list[DemandPrediction]
    inventory_alerts: list[InventoryAlert]
    estimated_weekly_revenue: float
    estimated_weekly_cost: float
    estimated_weekly_profit: float


# --- Norms ---
class NormOut(BaseModel):
    ingredient: str
    category: str
    cuban_portion_g: Optional[float]
    european_portion_g: Optional[float]
    asian_portion_g: Optional[float]
    effective_portion_g: float
    norm_source: str
    unit: str
    notes: str


class PriceAdjustment(BaseModel):
    ingredient_name: str
    norm_portion_g: float
    actual_portion_g: float
    ratio: float
    base_cost: float
    adjusted_cost: float
    difference_pct: float
