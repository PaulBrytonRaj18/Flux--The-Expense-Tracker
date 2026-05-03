from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from auth import require_auth
from schemas import InsightsOut, OpportunityCostPrompt
from services.emotional_roi import get_emotional_roi
from services.ghost_hunter import detect_ghost_subscriptions
from services.opportunity_cost import calculate_opportunity_cost
from models import Expense, Category, Settings
from collections import defaultdict

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("", response_model=InsightsOut)
async def get_insights(db: Session = Depends(get_db), user_id: str = Depends(require_auth)):
    settings_row = db.query(Settings).filter(Settings.user_id == user_id).first()
    if settings_row:
        years = settings_row.retirement_age - settings_row.user_age
        rate = settings_row.investment_rate
    else:
        years = 60 - 28
        rate = 7.0

    roi = get_emotional_roi(db, user_id)

    categories = db.query(Category).filter(Category.user_id == user_id).all()
    cat_map = {c.id: c for c in categories}

    expenses = db.query(Expense).filter(Expense.user_id == user_id).all()
    cat_totals: dict[int, float] = defaultdict(float)
    for e in expenses:
        cat_totals[e.category_id] += e.amount

    opp_costs = []
    for cid, total in cat_totals.items():
        cat = cat_map.get(cid)
        if not cat:
            continue
        projected = calculate_opportunity_cost(total, rate, years)
        opp_costs.append({
            "category": cat.name,
            "total_spent": round(total, 2),
            "projected_value": projected["projected_value"],
            "years_to_grow": years,
        })
    opp_costs.sort(key=lambda x: x["projected_value"], reverse=True)

    ghosts = detect_ghost_subscriptions(db, user_id)

    return {
        "emotional_roi": roi,
        "opportunity_costs": opp_costs,
        "ghost_subscriptions": ghosts,
    }


@router.get("/opportunity-cost", response_model=OpportunityCostPrompt)
async def get_opportunity_cost(
    amount: float = Query(..., description="Purchase amount"),
    db: Session = Depends(get_db),
    user_id: str = Depends(require_auth),
):
    settings_row = db.query(Settings).filter(Settings.user_id == user_id).first()
    if settings_row:
        years = settings_row.retirement_age - settings_row.user_age
        rate = settings_row.investment_rate
    else:
        years = 60 - 28
        rate = 7.0
    return calculate_opportunity_cost(amount, rate, years)
