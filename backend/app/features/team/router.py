from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db, get_user_id
from app.kernel.errors import Forbidden, NotFound
from app.models import UserRow

router = APIRouter(tags=["team"])

class RoleBody(BaseModel):
    role: str

class ProfileBody(BaseModel):
    name: str

def _actor(user_id: str, db: Session) -> UserRow:
    user = db.get(UserRow, user_id)
    if not user:
        raise Forbidden("No user")
    return user

@router.get("/me")
def me(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    user = _actor(user_id, db)
    return {"id": user.id, "email": user.email, "name": user.name, "role": user.role, "avatar_url": user.avatar_path or None}

@router.patch("/me")
def update_me(body: ProfileBody, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    user = _actor(user_id, db)
    user.name = body.name.strip()[:80]
    db.commit()
    return {"id": user.id, "name": user.name, "role": user.role}

@router.get("/team")
def team(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    actor = _actor(user_id, db)
    if not actor.is_manager():
        raise Forbidden("Managers only")
    rows = list(db.scalars(select(UserRow).where(UserRow.is_active == 1)))
    return [{"id": u.id, "email": u.email, "name": u.name, "role": u.role} for u in rows]

@router.patch("/users/{target_id}/role")
def set_role(target_id: str, body: RoleBody, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    actor = _actor(user_id, db)
    if not actor.is_manager():
        raise Forbidden("Managers only")
    if body.role not in {"manager", "authorized", "member"}:
        raise Forbidden("Bad role")
    user = db.get(UserRow, target_id)
    if not user:
        raise NotFound("User not found")
    user.role = body.role
    db.commit()
    return {"id": user.id, "role": user.role}
