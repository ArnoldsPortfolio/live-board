from sqlalchemy import select
from sqlalchemy.orm import Session

from app.kernel.errors import Forbidden
from app.models import CardRow, UserRow


class CalendarService:
    def __init__(self, db: Session):
        self.db = db

    def month_items(self, user: UserRow, year: int, month: int) -> list[CardRow]:
        if not user.can_use_calendar():
            raise Forbidden("Calendar is restricted")
        prefix = f"{year:04d}-{month:02d}"
        return list(self.db.scalars(select(CardRow).where(CardRow.due_date.startswith(prefix))))
