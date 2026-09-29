from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.deps import get_db, get_user_id
from app.features.access.service import AccessService
from app.features.boards.service import BoardService

router = APIRouter(prefix="/boards", tags=["projects"])

class CreateProject(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    code: str = ""
    start_date: str = ""
    end_date: str = ""
    budget: str = ""

def _out(board):
    return {
        "id": board.id, "title": board.title, "sequence": board.sequence,
        "description": getattr(board, "description", ""),
        "code": getattr(board, "code", ""),
        "start_date": getattr(board, "start_date", ""),
        "end_date": getattr(board, "end_date", ""),
        "budget": getattr(board, "budget", ""),
    }

@router.get("/projects")
def list_projects(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    ids = AccessService(db).list_board_ids(user_id)
    return [_out(b) for b in BoardService(db).list_for(ids)]

@router.post("/projects")
def create_project(body: CreateProject, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    return _out(BoardService(db).create(user_id, body.title, body.model_dump()))

@router.delete("/{board_id}")
def delete_project(board_id: str, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, board_id)
    return _out(BoardService(db).archive(board_id))
