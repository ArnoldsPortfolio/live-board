from sqlalchemy import select
from sqlalchemy.orm import Session
from app.kernel.errors import Forbidden
from app.models import MembershipRow
class AccessService:
    def __init__(self, db: Session):
        self.db = db
    def require_member(self, user_id: str, board_id: str) -> MembershipRow:
        row = self.db.scalar(select(MembershipRow).where(MembershipRow.user_id == user_id, MembershipRow.board_id == board_id))
        if not row:
            raise Forbidden("Not a member of this board")
        return row
    def list_board_ids(self, user_id: str) -> list[str]:
        rows = self.db.scalars(select(MembershipRow).where(MembershipRow.user_id == user_id))
        return [row.board_id for row in rows]
