from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.deps import get_db, get_user_id
from app.features.access.service import AccessService
from app.features.boards.service import BoardService
from app.features.realtime.hub import hub
from app.features.sync.service import SyncService
from app.kernel.errors import NotFound
router = APIRouter(prefix="/boards", tags=["boards"])
class CreateBoard(BaseModel):
    title: str = Field(min_length=1, max_length=200)
class CreateCard(BaseModel):
    column_id: str
    title: str = Field(min_length=1, max_length=200)
class MoveCard(BaseModel):
    column_id: str
@router.post("")
def create_board(body: CreateBoard, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    board = BoardService(db).create(user_id, body.title)
    return {"id": board.id, "title": board.title, "sequence": board.sequence}
@router.get("")
def list_boards(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    ids = AccessService(db).list_board_ids(user_id)
    boards = BoardService(db).list_for(ids)
    return [{"id": b.id, "title": b.title, "sequence": b.sequence} for b in boards]
@router.get("/{board_id}")
def get_board(board_id: str, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, board_id)
    board = BoardService(db).get(board_id)
    if not board:
        raise NotFound("Board not found")
    columns = BoardService(db).columns(board_id)
    cards = BoardService(db).cards(board_id)
    return {
        "id": board.id,
        "title": board.title,
        "sequence": board.sequence,
        "columns": [{"id": c.id, "title": c.title, "position": c.position} for c in columns],
        "cards": [{"id": c.id, "title": c.title, "column_id": c.column_id, "position": c.position} for c in cards],
    }
@router.post("/{board_id}/cards")
async def add_card(board_id: str, body: CreateCard, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, board_id)
    card = BoardService(db).add_card(board_id, body.column_id, body.title)
    op = SyncService(db).append(board_id, user_id, "card.added", {"id": card.id, "title": card.title, "column_id": card.column_id})
    await hub.publish(board_id, {"kind": op.kind, "sequence": op.sequence, "payload": {"id": card.id, "title": card.title, "column_id": card.column_id}})
    return {"id": card.id, "title": card.title, "column_id": card.column_id, "sequence": op.sequence}
@router.post("/{board_id}/cards/{card_id}/move")
async def move_card(board_id: str, card_id: str, body: MoveCard, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, board_id)
    card = BoardService(db).move_card(card_id, body.column_id)
    if not card:
        raise NotFound("Card not found")
    op = SyncService(db).append(board_id, user_id, "card.moved", {"id": card.id, "column_id": card.column_id})
    await hub.publish(board_id, {"kind": op.kind, "sequence": op.sequence, "payload": {"id": card.id, "column_id": card.column_id}})
    return {"id": card.id, "column_id": card.column_id, "sequence": op.sequence}
