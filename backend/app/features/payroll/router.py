from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.deps import get_db, get_user_id
from app.kernel.errors import NotFound
from app.kernel.ids import new_id
from app.models import PayrollPeriodRow

router = APIRouter(prefix="/payroll", tags=["payroll"])
FLOW = {"Draft": "Review", "Review": "Paid"}

class CreatePeriod(BaseModel):
    period: str = Field(min_length=1, max_length=80)
    amount: str = "$0"
    people: int = 0

def _out(row: PayrollPeriodRow):
    return {"id": row.id, "period": row.period, "status": row.status, "amount": row.amount, "people": row.people}

def _seed(user_id: str, db: Session):
    if db.scalar(select(PayrollPeriodRow.id).where(PayrollPeriodRow.owner_id == user_id)):
        return
    defaults = [("1-15 Sep 2026", "Paid", "$12,400", 4), ("16-30 Sep 2026", "Review", "$12,400", 4), ("1-15 Oct 2026", "Draft", "$12,400", 4)]
    db.add_all([PayrollPeriodRow(id=new_id(), owner_id=user_id, period=p, status=s, amount=a, people=n) for p, s, a, n in defaults])
    db.commit()

@router.get("/periods")
def list_periods(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    _seed(user_id, db)
    rows = list(db.scalars(select(PayrollPeriodRow).where(PayrollPeriodRow.owner_id == user_id)))
    return [_out(r) for r in rows]

@router.post("/periods")
def add_period(body: CreatePeriod, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    row = PayrollPeriodRow(id=new_id(), owner_id=user_id, period=body.period.strip(), amount=body.amount, people=body.people, status="Draft")
    db.add(row)
    db.commit()
    return _out(row)

@router.post("/periods/{period_id}/advance")
def advance_period(period_id: str, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    row = db.get(PayrollPeriodRow, period_id)
    if not row or row.owner_id != user_id:
        raise NotFound("Period not found")
    row.status = FLOW.get(row.status, row.status)
    db.commit()
    return _out(row)
