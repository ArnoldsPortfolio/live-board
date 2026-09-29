from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_db, get_user_id
from app.features.calendar.service import CalendarService
from app.kernel.errors import Forbidden
from app.models import UserRow

router = APIRouter(prefix="/calendar", tags=["calendar"])


def _user(user_id: str, db: Session) -> UserRow:
    user = db.get(UserRow, user_id)
    if not user:
        raise Forbidden("No user")
    return user


@router.get("")
def month(year: int, month: int, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    user = _user(user_id, db)
    items = CalendarService(db).month_items(user, year, month)
    return [{"id": c.id, "title": c.title, "due_date": c.due_date, "color": c.color, "priority": c.priority} for c in items]
