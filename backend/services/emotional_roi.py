"""Emotional ROI: Joy per Dollar by category + Regret Filter."""
from sqlalchemy.orm import Session
from models import Expense, Category
from collections import defaultdict


def get_emotional_roi(db: Session, user_id: str) -> list[dict]:
    categories = db.query(Category).filter(Category.user_id == user_id).all()
    cat_map = {c.id: c for c in categories}

    expenses = db.query(Expense).filter(Expense.user_id == user_id).all()

    cat_stats: dict[int, dict] = defaultdict(lambda: {"total": 0.0, "sat_sum": 0, "count": 0})

    for e in expenses:
        cid = e.category_id
        cat_stats[cid]["total"] += e.amount
        cat_stats[cid]["sat_sum"] += e.satisfaction_score
        cat_stats[cid]["count"] += 1

    roi_list = []
    for cid, stats in cat_stats.items():
        cat = cat_map.get(cid)
        if not cat or stats["count"] == 0:
            continue
        avg_sat = stats["sat_sum"] / stats["count"]
        total = stats["total"]
        joy = (avg_sat / (total / 100)) if total > 0 else 0

        roi_list.append({
            "category": cat.name,
            "icon": cat.icon,
            "color": cat.color,
            "joy_per_dollar": round(joy, 2),
            "total_spent": round(total, 2),
            "avg_satisfaction": round(avg_sat, 1),
        })

    roi_list.sort(key=lambda x: x["joy_per_dollar"], reverse=True)
    return roi_list
