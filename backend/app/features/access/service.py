from sqlalchemy import select
from sqlalchemy.orm import Session
from app.kernel.errors import Forbidden, NotFound
from app.kernel.ids import new_id
from app.models import MembershipRow, ShareLinkRow, UserRow
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
    def invite(self, board_id: str, email: str, role: str = "member") -> MembershipRow:
        user = self.db.scalar(select(UserRow).where(UserRow.email == email.lower().strip()))
        if not user:
            raise NotFound("No user with that email. They must sign up first.")
        return self.invite_user_id(board_id, user.id, role)
    def invite_user_id(self, board_id: str, user_id: str, role: str) -> MembershipRow:
        existing = self.db.scalar(select(MembershipRow).where(MembershipRow.board_id == board_id, MembershipRow.user_id == user_id))
        if existing:
            return existing
        row = MembershipRow(id=new_id(), board_id=board_id, user_id=user_id, role=role)
        self.db.add(row)
        self.db.commit()
        return row
    def create_share_link(self, board_id: str) -> ShareLinkRow:
        row = ShareLinkRow(id=new_id(), board_id=board_id, token=new_id(), role="member")
        self.db.add(row)
        self.db.commit()
        return row
    def join_with_token(self, user_id: str, token: str) -> MembershipRow:
        link = self.db.scalar(select(ShareLinkRow).where(ShareLinkRow.token == token))
        if not link:
            raise NotFound("Share link not found")
        return self.invite_user_id(link.board_id, user_id, link.role)
