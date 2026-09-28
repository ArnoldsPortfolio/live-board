from sqlalchemy import select
from sqlalchemy.orm import Session
from app.kernel.errors import Unauthorized
from app.kernel.ids import new_id
from app.kernel.password import hash_password, password_matches
from app.kernel.tokens import encode_access
from app.models import UserRow
from app.settings import Settings

class IdentityService:
    def __init__(self, db: Session, settings: Settings):
        self.db = db
        self.settings = settings
    def sign_up(self, email: str, password: str) -> UserRow:
        email = email.lower().strip()
        if self.db.scalar(select(UserRow).where(UserRow.email == email)):
            raise Unauthorized("Email already registered")
        user = UserRow(id=new_id(), email=email, password_hash=hash_password(password))
        self.db.add(user)
        self.db.commit()
        return user
    def sign_in(self, email: str, password: str) -> str:
        user = self.db.scalar(select(UserRow).where(UserRow.email == email.lower().strip()))
        if not user or not password_matches(password, user.password_hash):
            raise Unauthorized("Bad credentials")
        return encode_access(self.settings.app_secret, user.id, self.settings.access_minutes)
