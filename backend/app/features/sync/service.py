import json
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.kernel.ids import new_id
from app.models import BoardRow, OperationRow
class SyncService:
    def __init__(self, db: Session):
        self.db = db
    def append(self, board_id: str, actor_id: str, kind: str, payload: dict) -> OperationRow:
        board = self.db.get(BoardRow, board_id)
        board.sequence += 1
        op = OperationRow(id=new_id(), board_id=board_id, sequence=board.sequence, actor_id=actor_id, kind=kind, payload=json.dumps(payload))
        self.db.add(op)
        self.db.commit()
        return op
    def replay(self, board_id: str, after: int) -> list[OperationRow]:
        return list(self.db.scalars(select(OperationRow).where(OperationRow.board_id == board_id, OperationRow.sequence > after).order_by(OperationRow.sequence)))
