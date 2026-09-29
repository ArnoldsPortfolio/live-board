import hashlib
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.kernel.errors import Unauthorized
from app.kernel.ids import new_id
from app.kernel.password import hash_password, password_matches
from app.kernel.tokens import encode_access
from app.models import RefreshTokenRow, UserRow
from app.settings import Settings

def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()

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
    def sign_in(self, email: str, password: str) -> UserRow:
        user = self.db.scalar(select(UserRow).where(UserRow.email == email.lower().strip()))
        if not user or not password_matches(password, user.password_hash):
            raise Unauthorized("Bad credentials")
        return user
    def issue_tokens(self, user: UserRow) -> dict:
        access = encode_access(self.settings.app_secret, user.id, self.settings.access_minutes)
        raw = new_id() + new_id()
        self.db.add(RefreshTokenRow(id=new_id(), user_id=user.id, token_hash=_hash(raw)))
        self.db.commit()
        return {"access_token": access, "refresh_token": raw, "token_type": "bearer"}
    def rotate(self, refresh_token: str) -> dict:
        row = self.db.scalar(select(RefreshTokenRow).where(RefreshTokenRow.token_hash == _hash(refresh_token)))
        if not row or row.revoked:
            raise Unauthorized("Invalid refresh token")
        row.revoked = 1
        user = self.db.get(UserRow, row.user_id)
        if not user:
            raise Unauthorized("Invalid refresh token")
        self.db.commit()
        return self.issue_tokens(user)
    def revoke(self, refresh_token: str) -> None:
        row = self.db.scalar(select(RefreshTokenRow).where(RefreshTokenRow.token_hash == _hash(refresh_token)))
        if row:
            row.revoked = 1
            self.db.commit()
