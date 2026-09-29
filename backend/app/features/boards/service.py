from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.kernel.errors import Conflict, NotFound
from app.kernel.ids import new_id
from app.models import BoardRow, CardRow, ColumnRow, MembershipRow, UserRow

STAGES = [
    ("Backlog", "Ready ideas. Not started. No WIP limit required.", None),
    ("To Do", "Committed. Next to pull. Definition of ready is clear.", 8),
    ("In Progress", "Actively worked. Pull only if this column is under WIP.", 3),
    ("Review", "PR approved + QA passed. Policy visible on the column.", 3),
    ("Done", "Accepted by the manager. No further work.", None),
]

class BoardService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: str, title: str, extra: dict | None = None) -> BoardRow:
        extra = extra or {}
        board = BoardRow(
            id=new_id(), title=title.strip(),
            description=str(extra.get("description") or "")[:240],
            code=str(extra.get("code") or "")[:32],
            start_date=str(extra.get("start_date") or "")[:32],
            end_date=str(extra.get("end_date") or "")[:32],
            budget=str(extra.get("budget") or "")[:32],
        )
        member = MembershipRow(id=new_id(), board_id=board.id, user_id=user_id, role="owner")
        cols = [ColumnRow(id=new_id(), board_id=board.id, title=name, position=i, policy=policy, wip_limit=limit) for i, (name, policy, limit) in enumerate(STAGES)]
        self.db.add_all([board, member, *cols])
        self.db.commit()
        return board

    def get(self, board_id: str) -> BoardRow | None:
        return self.db.get(BoardRow, board_id)

    def archive(self, board_id: str) -> BoardRow:
        board = self.get(board_id)
        if not board:
            raise NotFound("Board not found")
        board.is_archived = 1
        self.db.commit()
        return board

    def list_for(self, board_ids: list[str]) -> list[BoardRow]:
        if not board_ids:
            return []
        return list(self.db.scalars(select(BoardRow).where(BoardRow.id.in_(board_ids), BoardRow.is_archived == 0)))

    def columns(self, board_id: str) -> list[ColumnRow]:
        return list(self.db.scalars(select(ColumnRow).where(ColumnRow.board_id == board_id).order_by(ColumnRow.position)))

    def cards(self, board_id: str) -> list[CardRow]:
        return list(self.db.scalars(select(CardRow).where(CardRow.board_id == board_id).order_by(CardRow.position)))

    def add_card(self, board_id: str, column_id: str, title: str) -> CardRow:
        card = CardRow(id=new_id(), board_id=board_id, column_id=column_id, title=title.strip())
        self.db.add(card)
        self.db.commit()
        return card

    def column_count(self, column_id: str) -> int:
        return int(self.db.scalar(select(func.count()).select_from(CardRow).where(CardRow.column_id == column_id)) or 0)

    def can_pull(self, column: ColumnRow, user: UserRow | None) -> bool:
        if user and user.is_manager():
            return True
        return not column.is_over_wip(self.column_count(column.id))

    def move_card(self, card_id: str, column_id: str, user: UserRow | None = None) -> CardRow:
        card = self.db.get(CardRow, card_id)
        if not card:
            raise NotFound("Card not found")
        column = self.db.get(ColumnRow, column_id)
        if not column:
            raise NotFound("Column not found")
        if card.column_id != column_id and not self.can_pull(column, user):
            raise Conflict("WIP limit reached")
        card.column_id = column_id
        self.db.commit()
        return card

    def rename_card(self, card_id: str, title: str) -> CardRow | None:
        card = self.db.get(CardRow, card_id)
        if not card:
            return None
        card.title = title.strip()
        self.db.commit()
        return card

    def add_column(self, board_id: str, title: str, policy: str = "") -> ColumnRow:
        row = ColumnRow(id=new_id(), board_id=board_id, title=title.strip(), position=len(self.columns(board_id)), policy=policy)
        self.db.add(row)
        self.db.commit()
        return row

    def set_wip(self, column_id: str, limit: int | None) -> ColumnRow:
        column = self.db.get(ColumnRow, column_id)
        if not column:
            raise NotFound("Column not found")
        column.wip_limit = limit
        self.db.commit()
        return column

    def set_policy(self, column_id: str, text: str) -> ColumnRow:
        column = self.db.get(ColumnRow, column_id)
        if not column:
            raise NotFound("Column not found")
        column.policy = text
        self.db.commit()
        return column
