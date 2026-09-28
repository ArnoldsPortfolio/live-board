from sqlalchemy import select
from sqlalchemy.orm import Session
from app.kernel.ids import new_id
from app.models import BoardRow, CardRow, ColumnRow, MembershipRow
class BoardService:
    def __init__(self, db: Session):
        self.db = db
    def create(self, user_id: str, title: str) -> BoardRow:
        board = BoardRow(id=new_id(), title=title.strip())
        member = MembershipRow(id=new_id(), board_id=board.id, user_id=user_id, role="owner")
        cols = [ColumnRow(id=new_id(), board_id=board.id, title=name, position=i) for i, name in enumerate(["To do", "Doing", "Done"])]
        self.db.add_all([board, member, *cols])
        self.db.commit()
        return board
    def get(self, board_id: str) -> BoardRow | None:
        return self.db.get(BoardRow, board_id)
    def list_for(self, board_ids: list[str]) -> list[BoardRow]:
        if not board_ids:
            return []
        return list(self.db.scalars(select(BoardRow).where(BoardRow.id.in_(board_ids))))
    def columns(self, board_id: str) -> list[ColumnRow]:
        return list(self.db.scalars(select(ColumnRow).where(ColumnRow.board_id == board_id).order_by(ColumnRow.position)))
    def cards(self, board_id: str) -> list[CardRow]:
        return list(self.db.scalars(select(CardRow).where(CardRow.board_id == board_id).order_by(CardRow.position)))
    def add_card(self, board_id: str, column_id: str, title: str) -> CardRow:
        card = CardRow(id=new_id(), board_id=board_id, column_id=column_id, title=title.strip())
        self.db.add(card)
        self.db.commit()
        return card
    def move_card(self, card_id: str, column_id: str) -> CardRow | None:
        card = self.db.get(CardRow, card_id)
        if not card:
            return None
        card.column_id = column_id
        self.db.commit()
        return card
