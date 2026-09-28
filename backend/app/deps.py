from fastapi import Header
from app.db import make_engine, make_session_factory
from app.kernel.errors import Unauthorized
from app.kernel.tokens import decode_access
from app.settings import Settings
settings = Settings()
engine = make_engine(settings.database_url)
SessionLocal = make_session_factory(engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_user_id(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise Unauthorized("Missing bearer token")
    try:
        return decode_access(settings.app_secret, authorization.split(" ", 1)[1])
    except Exception as exc:
        raise Unauthorized("Invalid access token") from exc
