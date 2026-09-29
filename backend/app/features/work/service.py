import json
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.kernel.ids import new_id
from app.models import ActivityRow, CardRow, ChecklistRow, CommentRow

class WorkService:
    def __init__(self, db: Session):
        self.db = db

    def log(self, card_id: str, user_id: str, action: str, detail: str = "") -> None:
        self.db.add(ActivityRow(id=new_id(), card_id=card_id, user_id=user_id, action=action, detail=detail))
        self.db.commit()

    def patch(self, card: CardRow, payload: dict, user_id: str) -> CardRow:
        for key in ("title", "description", "assignee_id", "due_date", "priority", "color", "blocked_reason"):
            if key in payload and payload[key] is not None:
                setattr(card, key, payload[key])
        if "labels" in payload:
            card.labels = json.dumps(payload["labels"])
        if "blocked" in payload:
            card.blocked = 1 if payload["blocked"] else 0
        self.db.commit()
        self.log(card.id, user_id, "edited")
        return card

    def set_blocked(self, card: CardRow, reason: str, user_id: str) -> CardRow:
        card.blocked = 1
        card.blocked_reason = reason
        self.db.commit()
        self.log(card.id, user_id, "blocked", reason)
        return card

    def clear_blocked(self, card: CardRow, user_id: str) -> CardRow:
        card.blocked = 0
        card.blocked_reason = ""
        self.db.commit()
        self.log(card.id, user_id, "unblocked")
        return card

    def add_check(self, card_id: str, title: str, user_id: str) -> ChecklistRow:
        item = ChecklistRow(id=new_id(), card_id=card_id, title=title)
        self.db.add(item)
        self.db.commit()
        self.log(card_id, user_id, "checklist")
        return item

    def toggle_check(self, item_id: str, user_id: str) -> ChecklistRow | None:
        item = self.db.get(ChecklistRow, item_id)
        if not item:
            return None
        item.toggle()
        self.db.commit()
        self.log(item.card_id, user_id, "checklist")
        return item

    def add_comment(self, card_id: str, user_id: str, body: str) -> CommentRow:
        row = CommentRow(id=new_id(), card_id=card_id, user_id=user_id, body=body)
        self.db.add(row)
        self.db.commit()
        self.log(card_id, user_id, "comment")
        return row

    def checks(self, card_id: str) -> list[ChecklistRow]:
        return list(self.db.scalars(select(ChecklistRow).where(ChecklistRow.card_id == card_id)))

    def comments(self, card_id: str) -> list[CommentRow]:
        return list(self.db.scalars(select(CommentRow).where(CommentRow.card_id == card_id)))

    def activity(self, card_id: str) -> list[ActivityRow]:
        return list(self.db.scalars(select(ActivityRow).where(ActivityRow.card_id == card_id)))
