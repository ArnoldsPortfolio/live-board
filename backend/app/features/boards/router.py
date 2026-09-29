from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.deps import get_db, get_user_id
from app.features.access.service import AccessService
from app.features.boards.service import BoardService
from app.features.history.service import HistoryService
from app.features.realtime.hub import hub
from app.features.sync.service import SyncService
from app.kernel.errors import NotFound
from app.models import CardRow
router = APIRouter(prefix="/boards", tags=["boards"])
class CreateBoard(BaseModel):
    title: str = Field(min_length=1, max_length=200)
class CreateCard(BaseModel):
    column_id: str
    title: str = Field(min_length=1, max_length=200)
class MoveCard(BaseModel):
    column_id: str
class RenameCard(BaseModel):
    title: str = Field(min_length=1, max_length=200)
class CreateColumn(BaseModel):
    title: str = Field(min_length=1, max_length=80)
class InviteBody(BaseModel):
    email: str
class JoinBody(BaseModel):
    token: str
async def _emit(db, board_id, user_id, kind, payload):
    op = SyncService(db).append(board_id, user_id, kind, payload)
    await hub.publish(board_id, {"kind": op.kind, "sequence": op.sequence, "payload": payload})
    return op
@router.post("")
def create_board(body: CreateBoard, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    board = BoardService(db).create(user_id, body.title)
    return {"id": board.id, "title": board.title, "sequence": board.sequence}
@router.get("")
def list_boards(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    ids = AccessService(db).list_board_ids(user_id)
    return [{"id": b.id, "title": b.title, "sequence": b.sequence} for b in BoardService(db).list_for(ids)]
@router.post("/join")
def join_board(body: JoinBody, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    member = AccessService(db).join_with_token(user_id, body.token)
    return {"board_id": member.board_id, "role": member.role}
@router.get("/{board_id}")
def get_board(board_id: str, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, board_id)
    board = BoardService(db).get(board_id)
    if not board:
        raise NotFound("Board not found")
    columns = BoardService(db).columns(board_id)
    cards = BoardService(db).cards(board_id)
    return {"id": board.id, "title": board.title, "sequence": board.sequence, "columns": [{"id": c.id, "title": c.title, "position": c.position} for c in columns], "cards": [{"id": c.id, "title": c.title, "column_id": c.column_id, "position": c.position} for c in cards]}
@router.post("/{board_id}/columns")
async def add_column(board_id: str, body: CreateColumn, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, board_id)
    col = BoardService(db).add_column(board_id, body.title)
    payload = {"id": col.id, "title": col.title, "position": col.position}
    op = await _emit(db, board_id, user_id, "column.added", payload)
    return {**payload, "sequence": op.sequence}
@router.post("/{board_id}/cards")
async def add_card(board_id: str, body: CreateCard, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, board_id)
    card = BoardService(db).add_card(board_id, body.column_id, body.title)
    HistoryService(db).record(board_id, card, user_id, "added", {"title": "", "column_id": ""})
    payload = {"id": card.id, "title": card.title, "column_id": card.column_id}
    op = await _emit(db, board_id, user_id, "card.added", payload)
    return {**payload, "sequence": op.sequence}
@router.post("/{board_id}/cards/{card_id}/move")
async def move_card(board_id: str, card_id: str, body: MoveCard, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, board_id)
    card = db.get(CardRow, card_id)
    if not card:
        raise NotFound("Card not found")
    before = {"title": card.title, "column_id": card.column_id}
    card = BoardService(db).move_card(card_id, body.column_id)
    HistoryService(db).record(board_id, card, user_id, "moved", before)
    payload = {"id": card.id, "column_id": card.column_id}
    op = await _emit(db, board_id, user_id, "card.moved", payload)
    return {**payload, "sequence": op.sequence}
@router.post("/{board_id}/cards/{card_id}/rename")
async def rename_card(board_id: str, card_id: str, body: RenameCard, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, board_id)
    card = db.get(CardRow, card_id)
    if not card:
        raise NotFound("Card not found")
    before = {"title": card.title, "column_id": card.column_id}
    card = BoardService(db).rename_card(card_id, body.title)
    HistoryService(db).record(board_id, card, user_id, "renamed", before)
    payload = {"id": card.id, "title": card.title}
    op = await _emit(db, board_id, user_id, "card.renamed", payload)
    return {**payload, "sequence": op.sequence}
@router.get("/{board_id}/cards/{card_id}/history")
def card_history(board_id: str, card_id: str, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, board_id)
    return [{"id": r.id, "action": r.action, "before_title": r.before_title, "after_title": r.after_title} for r in HistoryService(db).list_for(card_id)]
@router.post("/{board_id}/cards/{card_id}/undo")
async def undo_card(board_id: str, card_id: str, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, board_id)
    card = db.get(CardRow, card_id)
    if not card:
        raise NotFound("Card not found")
    restored = HistoryService(db).undo(card)
    if not restored:
        raise NotFound("Nothing to undo")
    payload = {"id": restored.id, "title": restored.title, "column_id": restored.column_id}
    op = await _emit(db, board_id, user_id, "card.undone", payload)
    return {**payload, "sequence": op.sequence}
@router.post("/{board_id}/invites")
def invite(board_id: str, body: InviteBody, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, board_id)
    member = AccessService(db).invite(board_id, body.email)
    return {"user_id": member.user_id, "role": member.role}
@router.post("/{board_id}/share-link")
def share_link(board_id: str, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, board_id)
    return {"token": AccessService(db).create_share_link(board_id).token}
@router.get("/{board_id}/ops")
def replay(board_id: str, after: int = 0, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, board_id)
    return [{"sequence": o.sequence, "kind": o.kind, "payload": o.payload} for o in SyncService(db).replay(board_id, after)]
