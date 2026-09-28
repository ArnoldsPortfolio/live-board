from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.deps import get_db
from app.features.identity.service import IdentityService
from app.settings import Settings
router = APIRouter(prefix="/auth", tags=["auth"])
class Credentials(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=8)
@router.post("/sign-up")
def sign_up(body: Credentials, db: Session = Depends(get_db)):
    user = IdentityService(db, Settings()).sign_up(body.email, body.password)
    from app.kernel.tokens import encode_access
    settings = Settings()
    return {"access_token": encode_access(settings.app_secret, user.id, settings.access_minutes), "token_type": "bearer"}
@router.post("/sign-in")
def sign_in(body: Credentials, db: Session = Depends(get_db)):
    token = IdentityService(db, Settings()).sign_in(body.email, body.password)
    return {"access_token": token, "token_type": "bearer"}
