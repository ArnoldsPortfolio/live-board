from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.deps import get_db, get_user_id
from app.kernel.errors import NotFound
from app.kernel.ids import new_id
from app.models import IntegrationRow

router = APIRouter(prefix="/integrations", tags=["integrations"])
DEFAULTS = [("Slack", "Post board moves to a channel.", 0), ("Email ingest", "Turn a forwarded thread into a card.", 0), ("Google Calendar", "Show due dates on the shared calendar.", 1), ("GitHub", "Attach a pull request to a card.", 0), ("SSO", "Sign in with the company identity provider.", 0)]

def _out(row: IntegrationRow):
    return {"id": row.id, "name": row.name, "detail": row.detail, "on": bool(row.is_on)}

def _seed(user_id: str, db: Session):
    if db.scalar(select(IntegrationRow.id).where(IntegrationRow.owner_id == user_id)):
        return
    db.add_all([IntegrationRow(id=new_id(), owner_id=user_id, name=n, detail=d, is_on=on) for n, d, on in DEFAULTS])
    db.commit()

@router.get("")
@router.get("/")
def list_tools(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    _seed(user_id, db)
    rows = list(db.scalars(select(IntegrationRow).where(IntegrationRow.owner_id == user_id)))
    return [_out(r) for r in rows]

@router.post("/{tool_id}/toggle")
def toggle_tool(tool_id: str, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    row = db.get(IntegrationRow, tool_id)
    if not row or row.owner_id != user_id:
        raise NotFound("Integration not found")
    row.is_on = 0 if row.is_on else 1
    db.commit()
    return _out(row)
