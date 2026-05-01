"""Safe-to-Spend: Balance - CommittedBills - GoalSavings - MonthSpent"""
from sqlalchemy.orm import Session
from models import Expense, Settings
from datetime import datetime


def calculate_safe_to_spend(db: Session, user_id: str) -> dict:
    settings_row = db.query(Settings).filter(Settings.user_id == user_id).first()
    if not settings_row:
        settings = {
            "balance": 5000.0,
            "committed_bills": 1200.0,
            "goal_savings": 500.0,
        }
    else:
        settings = {
            "balance": settings_row.balance,
            "committed_bills": settings_row.committed_bills,
            "goal_savings": settings_row.goal_savings,
        }

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    result = db.query(Expense).filter(Expense.user_id == user_id, Expense.date >= month_start).all()
    month_spent = sum(e.amount for e in result)

    safe_total = settings["balance"] - settings["committed_bills"] - settings["goal_savings"]
    remaining = safe_total - month_spent

    if now.month == 12:
        next_month = now.replace(year=now.year + 1, month=1, day=1)
    else:
        next_month = now.replace(month=now.month + 1, day=1)
    days_left = max((next_month - now).days, 1)

    daily = remaining / days_left
    weekly = daily * 7
    percentage = (remaining / safe_total * 100) if safe_total > 0 else 0
    percentage = max(0, min(100, percentage))

    if percentage > 50:
        status, color = "healthy", "#00e676"
    elif percentage > 20:
        status, color = "caution", "#ffab00"
    else:
        status, color = "danger", "#ff1744"

    return {
        "total": round(remaining, 2),
        "daily": round(daily, 2),
        "weekly": round(weekly, 2),
        "percentage": round(percentage, 1),
        "status": status,
        "color": color,
    }
