from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import require_auth
from schemas import GoalCreate, GoalOut
from datastore import get_goals, add_goal, update_goal, delete_goal

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.get("", response_model=list[GoalOut])
def list_goals(db: Session = Depends(get_db), user_id: str = Depends(require_auth)):
    return get_goals(db, user_id)


@router.post("", response_model=GoalOut, status_code=201)
def create_goal(body: GoalCreate, db: Session = Depends(get_db), user_id: str = Depends(require_auth)):
    goal = add_goal(db, user_id, {
        "name": body.name,
        "target_amount": body.target_amount,
        "current_amount": body.current_amount,
        "deadline": body.deadline,
        "icon": body.icon,
    })
    db.commit()
    return goal


@router.put("/{goal_id}", response_model=GoalOut)
def edit_goal(goal_id: int, body: GoalCreate, db: Session = Depends(get_db), user_id: str = Depends(require_auth)):
    updated = update_goal(db, user_id, goal_id, {
        "name": body.name,
        "target_amount": body.target_amount,
        "current_amount": body.current_amount,
        "deadline": body.deadline,
        "icon": body.icon,
    })
    if not updated:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.commit()
    return updated


@router.delete("/{goal_id}")
def remove_goal(goal_id: int, db: Session = Depends(get_db), user_id: str = Depends(require_auth)):
    delete_goal(db, user_id, goal_id)
    db.commit()
    return {"ok": True}
