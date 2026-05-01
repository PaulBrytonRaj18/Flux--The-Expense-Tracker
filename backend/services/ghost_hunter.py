"""Ghost Hunter: detects recurring expenses with declining satisfaction."""
from sqlalchemy.orm import Session
from models import Expense, Category
from collections import defaultdict


def detect_ghost_subscriptions(db: Session, user_id: str) -> list[dict]:
    recurring = (
        db.query(Expense)
        .filter(Expense.user_id == user_id, Expense.is_recurring == True, Expense.recurring_id.isnot(None))
        .order_by(Expense.date)
        .all()
    )

    categories = db.query(Category).filter(Category.user_id == user_id).all()
    cat_map = {c.id: c for c in categories}

    groups: dict[str, list] = defaultdict(list)
    for exp in recurring:
        groups[exp.recurring_id].append(exp)

    ghosts = []
    for rid, entries in groups.items():
        if len(entries) < 2:
            continue

        recent = entries[-3:] if len(entries) >= 3 else entries
        scores = [e.satisfaction_score for e in recent]

        is_declining = all(
            scores[i] >= scores[i + 1] for i in range(len(scores) - 1)
        ) and scores[0] > scores[-1]

        if is_declining:
            latest = entries[-1]
            cat = cat_map.get(latest.category_id)
            monthly = latest.amount
            annual = monthly * 12

            ghosts.append({
                "recurring_id": rid,
                "description": latest.description,
                "category": cat.name if cat else "Unknown",
                "monthly_cost": round(monthly, 2),
                "annual_cost": round(annual, 2),
                "satisfaction_trend": scores,
                "recommendation": (
                    f"Your satisfaction with '{latest.description}' has dropped "
                    f"from {scores[0]}★ to {scores[-1]}★. "
                    f"Cancel to save ${annual:,.0f}/year."
                ),
            })

    return ghosts
