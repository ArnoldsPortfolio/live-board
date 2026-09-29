from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.deps import get_db, get_user_id
from app.features.access.service import AccessService
from app.features.boards.service import BoardService
from app.features.realtime.hub import hub
from app.features.sync.service import SyncService

router = APIRouter(prefix="/boards", tags=["boards"])

@router.delete("/{board_id}/cards/{card_id}")
async def delete_card(board_id: str, card_id: str, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    AccessService(db).require_member(user_id, board_id)
    BoardService(db).delete_card(board_id, card_id)
    op = SyncService(db).append(board_id, user_id, "card.removed", {"id": card_id})
    await hub.publish(board_id, {"kind": op.kind, "sequence": op.sequence, "payload": {"id": card_id}})
    return {"id": card_id, "sequence": op.sequence}
