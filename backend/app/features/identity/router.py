from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.deps import get_db
from app.features.identity.service import IdentityService
from app.rate_limit import limit_auth
from app.settings import Settings
router = APIRouter(prefix="/auth", tags=["auth"])
class Credentials(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=8)
class RefreshBody(BaseModel):
    refresh_token: str
@router.post("/sign-up")
def sign_up(body: Credentials, request: Request, db: Session = Depends(get_db)):
    limit_auth(request.client.host if request.client else "anon")
    svc = IdentityService(db, Settings())
    return svc.issue_tokens(svc.sign_up(body.email, body.password))
@router.post("/sign-in")
def sign_in(body: Credentials, request: Request, db: Session = Depends(get_db)):
    limit_auth(request.client.host if request.client else "anon")
    svc = IdentityService(db, Settings())
    return svc.issue_tokens(svc.sign_in(body.email, body.password))
@router.post("/refresh")
def refresh(body: RefreshBody, db: Session = Depends(get_db)):
    return IdentityService(db, Settings()).rotate(body.refresh_token)
@router.post("/logout")
def logout(body: RefreshBody, db: Session = Depends(get_db)):
    IdentityService(db, Settings()).revoke(body.refresh_token)
    return {"ok": True}
