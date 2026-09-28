from sqlalchemy import select
from sqlalchemy.orm import Session
from app.features.boards.service import BoardService
from app.features.identity.service import IdentityService
from app.models import UserRow
from app.settings import Settings

def seed_if_empty(db: Session) -> None:
    if db.scalar(select(UserRow).limit(1)):
        return
    user = IdentityService(db, Settings()).sign_up("owner@board.dev", "ChangeMe123!")
    BoardService(db).create(user.id, "Demo Board")
