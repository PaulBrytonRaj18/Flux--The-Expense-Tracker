from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import require_auth
from schemas import ExpenseCreate, ExpenseOut, CategoryOut
from datastore import (
    get_all_expenses, add_expense, update_expense,
    delete_expense, get_expense_with_category, get_categories,
)
from datetime import datetime

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    regret: bool = Query(False, description="Filter low-satisfaction only"),
    category_id: int = Query(None, description="Filter by category"),
    search: str = Query(None, description="Search in description"),
    db: Session = Depends(get_db),
    user_id: str = Depends(require_auth),
):
    expenses = get_all_expenses(db, user_id, regret=regret, category_id=category_id, search=search)
    return [get_expense_with_category(db, user_id, e) for e in expenses]


@router.post("", response_model=ExpenseOut, status_code=201)
def create_expense(body: ExpenseCreate, db: Session = Depends(get_db), user_id: str = Depends(require_auth)):
    exp = add_expense(db, user_id, {
        "amount": body.amount,
        "category_id": body.category_id,
        "description": body.description,
        "date": body.date or datetime.utcnow(),
        "satisfaction_score": body.satisfaction_score,
        "is_recurring": body.is_recurring,
        "recurring_id": body.recurring_id,
    })
    db.commit()
    return get_expense_with_category(db, user_id, exp)


@router.put("/{expense_id}", response_model=ExpenseOut)
def edit_expense(expense_id: int, body: ExpenseCreate, db: Session = Depends(get_db), user_id: str = Depends(require_auth)):
    updates = {
        "amount": body.amount,
        "category_id": body.category_id,
        "description": body.description,
        "satisfaction_score": body.satisfaction_score,
        "is_recurring": body.is_recurring,
        "recurring_id": body.recurring_id,
    }
    if body.date:
        updates["date"] = body.date
    exp = update_expense(db, user_id, expense_id, updates)
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.commit()
    return get_expense_with_category(db, user_id, exp)


@router.delete("/{expense_id}")
def remove_expense(expense_id: int, db: Session = Depends(get_db), user_id: str = Depends(require_auth)):
    delete_expense(db, user_id, expense_id)
    db.commit()
    return {"ok": True}


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db), user_id: str = Depends(require_auth)):
    return get_categories(db, user_id)
