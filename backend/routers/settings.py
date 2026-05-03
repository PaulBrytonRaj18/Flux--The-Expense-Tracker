from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import require_auth
from schemas import SettingsOut, SettingsUpdate
from datastore import get_settings, update_settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsOut)
async def read_settings(db: Session = Depends(get_db), user_id: str = Depends(require_auth)):
    return get_settings(db, user_id)


@router.put("", response_model=SettingsOut)
async def write_settings(body: SettingsUpdate, db: Session = Depends(get_db), user_id: str = Depends(require_auth)):
    updated = update_settings(db, user_id, body.model_dump())
    db.commit()
    return updated
