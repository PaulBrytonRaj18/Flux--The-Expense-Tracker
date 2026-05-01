"""Seed demo data for a specific user."""
from datetime import datetime, timedelta
from database import SessionLocal
from datastore import is_seeded, add_category, add_expense, get_categories
from models import Goal, Settings
import random

CATEGORIES = [
    {"name": "Food & Dining", "icon": "🍕", "color": "#ff6d00", "budget_limit": 600},
    {"name": "Transport", "icon": "🚗", "color": "#00e5ff", "budget_limit": 300},
    {"name": "Entertainment", "icon": "🎮", "color": "#d500f9", "budget_limit": 200},
    {"name": "Shopping", "icon": "🛍️", "color": "#ff1744", "budget_limit": 400},
    {"name": "Subscriptions", "icon": "📱", "color": "#651fff", "budget_limit": 100},
    {"name": "Health", "icon": "💊", "color": "#00e676", "budget_limit": 150},
    {"name": "Education", "icon": "📚", "color": "#2979ff", "budget_limit": 200},
    {"name": "Groceries", "icon": "🛒", "color": "#76ff03", "budget_limit": 500},
]

EXPENSE_TEMPLATES = [
    ("Morning coffee", 0, (4, 7), (3, 5)),
    ("Lunch at work", 0, (10, 18), (2, 4)),
    ("Weekend dinner out", 0, (35, 75), (3, 5)),
    ("Fast food", 0, (8, 15), (1, 3)),
    ("Uber ride", 1, (12, 30), (3, 4)),
    ("Gas station", 1, (40, 65), (2, 3)),
    ("Parking", 1, (5, 15), (1, 2)),
    ("Movie tickets", 2, (15, 30), (3, 5)),
    ("Concert tickets", 2, (60, 150), (4, 5)),
    ("Video game", 2, (30, 70), (2, 5)),
    ("Streaming binge snacks", 2, (10, 25), (2, 4)),
    ("New shoes", 3, (80, 200), (1, 4)),
    ("Online impulse buy", 3, (20, 90), (1, 3)),
    ("Clothes shopping", 3, (50, 150), (2, 5)),
    ("Gadget accessory", 3, (15, 60), (2, 4)),
    ("Gym membership", 5, (30, 50), (3, 5)),
    ("Vitamins", 5, (20, 40), (3, 4)),
    ("Online course", 6, (15, 50), (4, 5)),
    ("Books", 6, (10, 30), (4, 5)),
    ("Weekly groceries", 7, (60, 120), (3, 4)),
    ("Snack run", 7, (10, 25), (2, 3)),
]

SUBSCRIPTIONS = [
    ("Netflix", 4, 15.99, [5, 5, 4, 4, 3, 2]),
    ("Spotify", 4, 9.99, [5, 5, 5, 5, 5, 5]),
    ("Cloud Storage", 4, 2.99, [4, 4, 3, 3, 2, 1]),
    ("Gym App Pro", 5, 12.99, [4, 4, 3, 2, 2, 1]),
    ("News App", 6, 9.99, [4, 4, 4, 4, 4, 4]),
]


def seed_user_data(user_id: str):
    db = SessionLocal()
    try:
        if is_seeded(db, user_id):
            return False

        random.seed(42)
        now = datetime.utcnow()

        for c in CATEGORIES:
            add_category(db, user_id, dict(c))

        db.flush()
        categories = get_categories(db, user_id)
        cat_ids = [c["id"] for c in categories]

        for day_offset in range(90, 0, -1):
            day = now - timedelta(days=day_offset)
            num = random.randint(1, 3)
            for _ in range(num):
                tmpl = random.choice(EXPENSE_TEMPLATES)
                desc, cat_idx, (amt_lo, amt_hi), (sat_lo, sat_hi) = tmpl
                add_expense(db, user_id, {
                    "amount": round(random.uniform(amt_lo, amt_hi), 2),
                    "category_id": cat_ids[cat_idx],
                    "description": desc,
                    "date": day.replace(hour=random.randint(8, 22), minute=random.randint(0, 59)),
                    "satisfaction_score": random.randint(sat_lo, sat_hi),
                    "is_recurring": False,
                    "recurring_id": None,
                })

        for sub_desc, cat_idx, amount, scores in SUBSCRIPTIONS:
            rid = f"sub_{sub_desc.lower().replace(' ', '_')}"
            for month_offset in range(6, 0, -1):
                day = now - timedelta(days=month_offset * 30)
                score_idx = 6 - month_offset
                add_expense(db, user_id, {
                    "amount": amount,
                    "category_id": cat_ids[cat_idx],
                    "description": sub_desc,
                    "date": day,
                    "satisfaction_score": scores[score_idx] if score_idx < len(scores) else scores[-1],
                    "is_recurring": True,
                    "recurring_id": rid,
                })

        for g_data in [
            {"name": "Emergency Fund", "target_amount": 10000, "current_amount": 3500, "deadline": "2026-12-31", "icon": "🛡️"},
            {"name": "Japan Trip", "target_amount": 5000, "current_amount": 1200, "deadline": "2027-06-01", "icon": "✈️"},
            {"name": "New Laptop", "target_amount": 2000, "current_amount": 800, "deadline": "2026-09-01", "icon": "💻"},
        ]:
            db.add(Goal(user_id=user_id, **g_data))

        db.add(Settings(
            user_id=user_id,
            balance=5200.0,
            committed_bills=1350.0,
            goal_savings=500.0,
            privacy_mode=False,
            investment_rate=7.0,
            user_age=28,
            retirement_age=60,
        ))

        db.commit()
        return True
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
