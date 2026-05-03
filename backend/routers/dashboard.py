from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import require_auth
from schemas import DashboardOut
from services.safe_to_spend import calculate_safe_to_spend
from services.ghost_hunter import detect_ghost_subscriptions
from models import Expense, Category
from datetime import datetime, timedelta
from collections import defaultdict

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
async def get_dashboard(db: Session = Depends(get_db), user_id: str = Depends(require_auth)):
    now = datetime.utcnow()

    safe = calculate_safe_to_spend(db, user_id)

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    today_expenses = db.query(Expense).filter(Expense.user_id == user_id, Expense.date >= today_start).all()
    week_expenses = db.query(Expense).filter(Expense.user_id == user_id, Expense.date >= week_start).all()
    month_expenses = db.query(Expense).filter(Expense.user_id == user_id, Expense.date >= month_start).all()

    today_spent = sum(e.amount for e in today_expenses)
    week_spent = sum(e.amount for e in week_expenses)
    month_spent = sum(e.amount for e in month_expenses)

    categories = db.query(Category).filter(Category.user_id == user_id).all()
    cat_map = {c.id: c for c in categories}

    cat_totals: dict[int, float] = defaultdict(float)
    for e in month_expenses:
        cat_totals[e.category_id] += e.amount

    cat_breakdown = []
    for cid, total in cat_totals.items():
        cat = cat_map.get(cid)
        if not cat:
            continue
        pct = (total / month_spent * 100) if month_spent > 0 else 0
        cat_breakdown.append({
            "name": cat.name,
            "icon": cat.icon,
            "color": cat.color,
            "amount": round(total, 2),
            "percentage": round(pct, 1),
        })
    cat_breakdown.sort(key=lambda x: x["amount"], reverse=True)

    trend_data: dict[str, float] = {}
    for i in range(30):
        day = now - timedelta(days=i)
        trend_data[day.strftime("%Y-%m-%d")] = 0.0

    for e in month_expenses:
        day_key = e.date.strftime("%Y-%m-%d")
        if day_key in trend_data:
            trend_data[day_key] += e.amount

    spending_trend = [
        {"date": k, "amount": round(v, 2)}
        for k, v in sorted(trend_data.items())
    ]

    ghosts = detect_ghost_subscriptions(db, user_id)

    return {
        "safe_to_spend": safe,
        "spending_summary": {
            "today": round(today_spent, 2),
            "this_week": round(week_spent, 2),
            "this_month": round(month_spent, 2),
        },
        "category_breakdown": cat_breakdown,
        "spending_trend": spending_trend,
        "ghost_alerts": ghosts,
    }
