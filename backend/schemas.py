from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# --- Category ---
class CategoryBase(BaseModel):
    name: str
    icon: str = "📦"
    color: str = "#00e5ff"
    budget_limit: float = 0.0


class CategoryCreate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    id: int
    model_config = {"from_attributes": True}


# --- Expense ---
class ExpenseBase(BaseModel):
    amount: float
    category_id: int
    description: str = ""
    date: Optional[datetime] = None
    satisfaction_score: int = 3
    is_recurring: bool = False
    recurring_id: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseOut(ExpenseBase):
    id: int
    category: CategoryOut
    model_config = {"from_attributes": True}


# --- Goal ---
class GoalBase(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0
    deadline: Optional[str] = None
    icon: str = "🎯"


class GoalCreate(GoalBase):
    pass


class GoalOut(GoalBase):
    id: int
    model_config = {"from_attributes": True}


# --- Settings ---
class SettingsBase(BaseModel):
    balance: float = 5000.0
    committed_bills: float = 1200.0
    goal_savings: float = 500.0
    privacy_mode: bool = False
    investment_rate: float = 7.0
    user_age: int = 28
    retirement_age: int = 60


class SettingsUpdate(SettingsBase):
    model_config = {"extra": "forbid"}


class SettingsOut(SettingsBase):
    id: int
    model_config = {"from_attributes": True}


# --- Dashboard ---
class SafeToSpendOut(BaseModel):
    total: float
    daily: float
    weekly: float
    percentage: float
    status: str  # "healthy", "caution", "danger"
    color: str


class SpendingSummary(BaseModel):
    today: float
    this_week: float
    this_month: float


class CategoryBreakdown(BaseModel):
    name: str
    icon: str
    color: str
    amount: float
    percentage: float


class GhostAlert(BaseModel):
    recurring_id: str
    description: str
    category: str
    monthly_cost: float
    annual_cost: float
    satisfaction_trend: list[int]
    recommendation: str


class DashboardOut(BaseModel):
    safe_to_spend: SafeToSpendOut
    spending_summary: SpendingSummary
    category_breakdown: list[CategoryBreakdown]
    spending_trend: list[dict]
    ghost_alerts: list[GhostAlert]


# --- Insights ---
class EmotionalROIItem(BaseModel):
    category: str
    icon: str
    color: str
    joy_per_dollar: float
    total_spent: float
    avg_satisfaction: float


class OpportunityCostItem(BaseModel):
    category: str
    total_spent: float
    projected_value: float
    years_to_grow: int


class InsightsOut(BaseModel):
    emotional_roi: list[EmotionalROIItem]
    opportunity_costs: list[OpportunityCostItem]
    ghost_subscriptions: list[GhostAlert]


# --- Opportunity Cost Prompt ---
class OpportunityCostPrompt(BaseModel):
    amount: float
    projected_value: float
    years: int
    message: str
