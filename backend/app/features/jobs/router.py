from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.deps import get_db, get_user_id
from app.kernel.errors import NotFound
from app.kernel.ids import new_id
from app.models import JobCandidateRow

router = APIRouter(prefix="/jobs", tags=["jobs"])
STAGES = ("Applied", "Interview", "Offer", "Hired")

class CreateCandidate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    role: str = ""
    stage: str = "Applied"

class MoveCandidate(BaseModel):
    stage: str

def _out(row: JobCandidateRow):
    return {"id": row.id, "name": row.name, "role": row.role, "stage": row.stage}

@router.get("/candidates")
def list_candidates(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    rows = list(db.scalars(select(JobCandidateRow).where(JobCandidateRow.owner_id == user_id)))
    return [_out(r) for r in rows]

@router.post("/candidates")
def add_candidate(body: CreateCandidate, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    stage = body.stage if body.stage in STAGES else "Applied"
    row = JobCandidateRow(id=new_id(), owner_id=user_id, name=body.name.strip(), role=body.role.strip()[:120], stage=stage)
    db.add(row)
    db.commit()
    return _out(row)

@router.patch("/candidates/{candidate_id}")
def move_candidate(candidate_id: str, body: MoveCandidate, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    row = db.get(JobCandidateRow, candidate_id)
    if not row or row.owner_id != user_id:
        raise NotFound("Candidate not found")
    row.stage = body.stage if body.stage in STAGES else row.stage
    db.commit()
    return _out(row)

@router.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: str, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    row = db.get(JobCandidateRow, candidate_id)
    if not row or row.owner_id != user_id:
        raise NotFound("Candidate not found")
    db.delete(row)
    db.commit()
    return {"id": candidate_id}
