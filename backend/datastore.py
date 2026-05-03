"""
SQLAlchemy-based data store for Flux.
All operations are scoped to a user_id for multi-tenant isolation.
"""
from sqlalchemy.orm import Session
from models import Category, Expense, Goal, Settings
from datetime import datetime


# ── Category helpers ──────────────────────────────────────────

def get_categories(db: Session, user_id: str) -> list[dict]:
    rows = db.query(Category).filter(Category.user_id == user_id).all()
    return [_category_to_dict(c) for c in rows]


def get_category_by_id(db: Session, user_id: str, cid: int) -> dict | None:
    c = db.query(Category).filter(Category.id == cid, Category.user_id == user_id).first()
    if not c:
        return None
    return _category_to_dict(c)


def add_category(db: Session, user_id: str, cat: dict) -> dict:
    row = Category(
        user_id=user_id,
        name=cat["name"],
        icon=cat.get("icon", "\U0001F4E6"),
        color=cat.get("color", "#00e5ff"),
        budget_limit=cat.get("budget_limit", 0.0),
    )
    db.add(row)
    db.flush()
    return _category_to_dict(row)


def _category_to_dict(c: Category) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "icon": c.icon,
        "color": c.color,
        "budget_limit": c.budget_limit,
    }


# ── Expense helpers ───────────────────────────────────────────

def get_all_expenses(db: Session, user_id: str, regret=False, category_id=None, search=None, limit=200) -> list[dict]:
    q = db.query(Expense).filter(Expense.user_id == user_id)
    if regret:
        q = q.filter(Expense.satisfaction_score <= 2)
    if category_id:
        q = q.filter(Expense.category_id == category_id)
    if search:
        safe_search = search.replace("%", "\\%").replace("_", "\\_")
        q = q.filter(Expense.description.ilike(f"%{safe_search}%"))
    rows = q.order_by(Expense.date.desc()).limit(limit).all()
    return [_expense_to_dict(e) for e in rows]


def add_expense(db: Session, user_id: str, exp: dict) -> dict:
    row = Expense(
        user_id=user_id,
        amount=exp["amount"],
        category_id=exp["category_id"],
        description=exp.get("description", ""),
        date=exp.get("date") or datetime.utcnow(),
        satisfaction_score=exp.get("satisfaction_score", 3),
        is_recurring=exp.get("is_recurring", False),
        recurring_id=exp.get("recurring_id"),
    )
    db.add(row)
    db.flush()
    return _expense_to_dict(row)


def update_expense(db: Session, user_id: str, eid: int, updates: dict) -> dict | None:
    row = db.query(Expense).filter(Expense.id == eid, Expense.user_id == user_id).first()
    if not row:
        return None
    allowed = {"amount", "category_id", "description", "date", "satisfaction_score", "is_recurring", "recurring_id"}
    for k, v in updates.items():
        if k in allowed:
            setattr(row, k, v)
    db.flush()
    return _expense_to_dict(row)


def delete_expense(db: Session, user_id: str, eid: int):
    db.query(Expense).filter(Expense.id == eid, Expense.user_id == user_id).delete()
    db.flush()


def _expense_to_dict(e: Expense) -> dict:
    return {
        "id": e.id,
        "amount": e.amount,
        "category_id": e.category_id,
        "description": e.description,
        "date": e.date.isoformat() if e.date else "",
        "satisfaction_score": e.satisfaction_score,
        "is_recurring": e.is_recurring,
        "recurring_id": e.recurring_id,
    }


def get_expense_with_category(db: Session, user_id: str, exp: dict) -> dict:
    cat = get_category_by_id(db, user_id, exp["category_id"])
    return {
        **exp,
        "category": cat or {"id": 0, "name": "Unknown", "icon": "\U0001F4E6", "color": "#888", "budget_limit": 0},
    }


# ── Goal helpers ──────────────────────────────────────────────

def get_goals(db: Session, user_id: str) -> list[dict]:
    rows = db.query(Goal).filter(Goal.user_id == user_id).all()
    return [_goal_to_dict(g) for g in rows]


def add_goal(db: Session, user_id: str, goal: dict) -> dict:
    row = Goal(
        user_id=user_id,
        name=goal["name"],
        target_amount=goal["target_amount"],
        current_amount=goal.get("current_amount", 0.0),
        deadline=goal.get("deadline"),
        icon=goal.get("icon", "\U0001F3AF"),
    )
    db.add(row)
    db.flush()
    return _goal_to_dict(row)


def update_goal(db: Session, user_id: str, gid: int, updates: dict) -> dict | None:
    row = db.query(Goal).filter(Goal.id == gid, Goal.user_id == user_id).first()
    if not row:
        return None
    allowed = {"name", "target_amount", "current_amount", "deadline", "icon"}
    for k, v in updates.items():
        if k in allowed:
            setattr(row, k, v)
    db.flush()
    return _goal_to_dict(row)


def delete_goal(db: Session, user_id: str, gid: int):
    db.query(Goal).filter(Goal.id == gid, Goal.user_id == user_id).delete()
    db.flush()


def _goal_to_dict(g: Goal) -> dict:
    return {
        "id": g.id,
        "name": g.name,
        "target_amount": g.target_amount,
        "current_amount": g.current_amount,
        "deadline": g.deadline,
        "icon": g.icon,
    }


# ── Settings helpers ──────────────────────────────────────────

def get_settings(db: Session, user_id: str) -> dict:
    row = db.query(Settings).filter(Settings.user_id == user_id).first()
    if not row:
        defaults = {
            "user_id": user_id,
            "balance": 5000.0,
            "committed_bills": 1200.0,
            "goal_savings": 500.0,
            "privacy_mode": False,
            "investment_rate": 7.0,
            "user_age": 28,
            "retirement_age": 60,
        }
        row = Settings(**defaults)
        db.add(row)
        db.commit()
    return _settings_to_dict(row)


def update_settings(db: Session, user_id: str, updates: dict) -> dict:
    row = db.query(Settings).filter(Settings.user_id == user_id).first()
    if not row:
        defaults = {
            "user_id": user_id,
            "balance": 5000.0,
            "committed_bills": 1200.0,
            "goal_savings": 500.0,
            "privacy_mode": False,
            "investment_rate": 7.0,
            "user_age": 28,
            "retirement_age": 60,
        }
        row = Settings(**{**defaults, **updates})
        db.add(row)
    else:
        for k, v in updates.items():
            if k != "id" and k != "user_id" and hasattr(row, k):
                setattr(row, k, v)
    db.flush()
    return _settings_to_dict(row)


def _settings_to_dict(s: Settings) -> dict:
    return {
        "id": s.id,
        "balance": s.balance,
        "committed_bills": s.committed_bills,
        "goal_savings": s.goal_savings,
        "privacy_mode": s.privacy_mode,
        "investment_rate": s.investment_rate,
        "user_age": s.user_age,
        "retirement_age": s.retirement_age,
    }


def is_seeded(db: Session, user_id: str) -> bool:
    return db.query(Category).filter(Category.user_id == user_id).first() is not None
