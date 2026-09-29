from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.deps import get_db, get_user_id
from app.features.access.service import AccessService
from app.features.calendar.service import CalendarService
from app.features.work.service import WorkService
from app.kernel.errors import Forbidden, NotFound
from app.models import CardRow, UserRow

router = APIRouter(prefix="/calendar", tags=["calendar"])

class EventBody(BaseModel):
    title: str | None = None
    description: str | None = None
    due_date: str | None = None

def _user(user_id: str, db: Session) -> UserRow:
    user = db.get(UserRow, user_id)
    if not user:
        raise Forbidden("No user")
    return user

def _out(card: CardRow):
    return {"id": card.id, "board_id": card.board_id, "title": card.title, "description": card.description, "due_date": card.due_date, "priority": card.priority, "kind": "card"}

@router.get("")
def month(year: int, month: int, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    return [_out(c) for c in CalendarService(db).month_items(_user(user_id, db), year, month)]

@router.patch("/{card_id}")
def edit_event(card_id: str, body: EventBody, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    card = db.get(CardRow, card_id)
    if not card:
        raise NotFound("Event not found")
    AccessService(db).require_member(user_id, card.board_id)
    return _out(WorkService(db).patch(card, body.model_dump(exclude_none=True), user_id))

@router.delete("/{card_id}")
def drop_event(card_id: str, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    card = db.get(CardRow, card_id)
    if not card:
        raise NotFound("Event not found")
    AccessService(db).require_member(user_id, card.board_id)
    card.due_date = ""
    db.commit()
    return {"ok": True}
