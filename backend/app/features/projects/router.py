from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.deps import get_db, get_user_id
from app.features.access.service import AccessService
from app.features.boards.service import BoardService

router = APIRouter(prefix="/projects", tags=["projects"])
STAGES = ("backlog", "in_progress", "review", "done")

class CreateProject(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    code: str = ""
    start_date: str = ""
    end_date: str = ""
    budget: str = ""
    status: str = "backlog"

class MoveProject(BaseModel):
    status: str

def _out(board):
    return {
        "id": board.id, "title": board.title,
        "description": getattr(board, "description", ""),
        "code": getattr(board, "code", ""),
        "start_date": getattr(board, "start_date", ""),
        "end_date": getattr(board, "end_date", ""),
        "budget": getattr(board, "budget", ""),
        "status": getattr(board, "status", None) or "backlog",
    }

@router.get("")
def list_projects(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    ids = AccessService(db).list_board_ids(user_id)
    return [_out(b) for b in BoardService(db).list_for(ids)]

@router.post("")
def create_project(body: CreateProject, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    data = body.model_dump()
    data["status"] = body.status if body.status in STAGES else "backlog"
    return _out(BoardService(db).create(user_id, body.title, data))

@router.patch("/{project_id}")
def move_project(project_id: str, body: MoveProject, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, project_id)
    status = body.status if body.status in STAGES else "backlog"
    return _out(BoardService(db).set_status(project_id, status))

@router.delete("/{project_id}")
def delete_project(project_id: str, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, project_id)
    return _out(BoardService(db).archive(project_id))
