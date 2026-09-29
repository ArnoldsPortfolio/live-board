from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db import Base
from app.kernel.clock import Clock
from app.kernel.ids import new_id

def _now() -> datetime:
    return Clock().now()

class UserRow(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    name: Mapped[str] = mapped_column(String(80), default="")
    role: Mapped[str] = mapped_column(String(24), default="member")
    avatar_path: Mapped[str] = mapped_column(String(240), default="")
    is_active: Mapped[int] = mapped_column(Integer, default=1)
    def is_manager(self) -> bool:
        return self.role == "manager"
    def can_use_calendar(self) -> bool:
        return self.role in {"manager", "authorized"}

class BoardRow(Base):
    __tablename__ = "boards"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    title: Mapped[str] = mapped_column(String(200))
    sequence: Mapped[int] = mapped_column(Integer, default=0)
    swimlane_mode: Mapped[str] = mapped_column(String(24), default="off")
    is_archived: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

class MembershipRow(Base):
    __tablename__ = "board_members"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    board_id: Mapped[str] = mapped_column(ForeignKey("boards.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(24), default="owner")

class ColumnRow(Base):
    __tablename__ = "board_columns"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    board_id: Mapped[str] = mapped_column(ForeignKey("boards.id"), index=True)
    title: Mapped[str] = mapped_column(String(80))
    position: Mapped[int] = mapped_column(Integer, default=0)
    policy: Mapped[str] = mapped_column(String(240), default="")
    wip_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    def is_over_wip(self, count: int) -> bool:
        return self.wip_limit is not None and count >= self.wip_limit

class CardRow(Base):
    __tablename__ = "cards"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    board_id: Mapped[str] = mapped_column(ForeignKey("boards.id"), index=True)
    column_id: Mapped[str] = mapped_column(ForeignKey("board_columns.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    assignee_id: Mapped[str] = mapped_column(String(36), default="")
    due_date: Mapped[str] = mapped_column(String(32), default="")
    priority: Mapped[str] = mapped_column(String(16), default="med")
    labels: Mapped[str] = mapped_column(Text, default="[]")
    color: Mapped[str] = mapped_column(String(16), default="#d4af6e")
    blocked: Mapped[int] = mapped_column(Integer, default=0)
    blocked_reason: Mapped[str] = mapped_column(String(240), default="")
    position: Mapped[int] = mapped_column(Integer, default=0)

class OperationRow(Base):
    __tablename__ = "operations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    board_id: Mapped[str] = mapped_column(String(36), index=True)
    sequence: Mapped[int] = mapped_column(Integer)
    actor_id: Mapped[str] = mapped_column(String(36))
    kind: Mapped[str] = mapped_column(String(40))
    payload: Mapped[str] = mapped_column(Text, default="{}")

class ShareLinkRow(Base):
    __tablename__ = "share_links"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    board_id: Mapped[str] = mapped_column(ForeignKey("boards.id"), index=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(24), default="member")

class HistoryRow(Base):
    __tablename__ = "card_history"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    board_id: Mapped[str] = mapped_column(String(36), index=True)
    card_id: Mapped[str] = mapped_column(String(36), index=True)
    actor_id: Mapped[str] = mapped_column(String(36))
    action: Mapped[str] = mapped_column(String(40))
    before_title: Mapped[str] = mapped_column(String(200), default="")
    after_title: Mapped[str] = mapped_column(String(200), default="")
    before_column_id: Mapped[str] = mapped_column(String(36), default="")
    after_column_id: Mapped[str] = mapped_column(String(36), default="")

class RefreshTokenRow(Base):
    __tablename__ = "refresh_tokens"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    revoked: Mapped[int] = mapped_column(Integer, default=0)

class ChecklistRow(Base):
    __tablename__ = "checklist_items"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    card_id: Mapped[str] = mapped_column(String(36), index=True)
    title: Mapped[str] = mapped_column(String(200))
    is_done: Mapped[int] = mapped_column(Integer, default=0)
    position: Mapped[int] = mapped_column(Integer, default=0)
    def toggle(self) -> "ChecklistRow":
        self.is_done = 0 if self.is_done else 1
        return self

class CommentRow(Base):
    __tablename__ = "comments"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    card_id: Mapped[str] = mapped_column(String(36), index=True)
    user_id: Mapped[str] = mapped_column(String(36))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

class ActivityRow(Base):
    __tablename__ = "activities"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    card_id: Mapped[str] = mapped_column(String(36), index=True)
    user_id: Mapped[str] = mapped_column(String(36))
    action: Mapped[str] = mapped_column(String(40))
    detail: Mapped[str] = mapped_column(String(240), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
