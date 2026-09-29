from sqlalchemy import select
from sqlalchemy.orm import Session
from app.kernel.ids import new_id
from app.models import CardRow, HistoryRow
class HistoryService:
    def __init__(self, db: Session):
        self.db = db
    def record(self, board_id: str, card: CardRow, actor_id: str, action: str, before: dict) -> HistoryRow:
        row = HistoryRow(id=new_id(), board_id=board_id, card_id=card.id, actor_id=actor_id, action=action, before_title=before.get("title", ""), after_title=card.title, before_column_id=before.get("column_id", ""), after_column_id=card.column_id)
        self.db.add(row)
        self.db.commit()
        return row
    def list_for(self, card_id: str) -> list[HistoryRow]:
        return list(self.db.scalars(select(HistoryRow).where(HistoryRow.card_id == card_id).order_by(HistoryRow.id.desc())))
    def undo(self, card: CardRow) -> CardRow | None:
        latest = self.list_for(card.id)
        if not latest:
            return None
        entry = latest[0]
        if entry.before_title:
            card.title = entry.before_title
        if entry.before_column_id:
            card.column_id = entry.before_column_id
        self.db.delete(entry)
        self.db.commit()
        return card
