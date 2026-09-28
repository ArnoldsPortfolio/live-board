from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.deps import SessionLocal, settings
from app.features.access.service import AccessService
from app.features.presence.store import presence
from app.features.realtime.hub import hub
from app.kernel.tokens import decode_access
from app.models import UserRow
router = APIRouter()
@router.websocket("/ws/boards/{board_id}")
async def board_socket(websocket: WebSocket, board_id: str):
    token = websocket.query_params.get("token", "")
    try:
        user_id = decode_access(settings.app_secret, token)
    except Exception:
        await websocket.close(code=4401)
        return
    db = SessionLocal()
    try:
        AccessService(db).require_member(user_id, board_id)
        user = db.get(UserRow, user_id)
        email = user.email if user else user_id
    except Exception:
        db.close()
        await websocket.close(code=4403)
        return
    finally:
        db.close()
    await hub.join(board_id, websocket)
    snapshot = presence.join(board_id, user_id, email)
    await hub.publish(board_id, {"kind": "presence", "viewers": snapshot})
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        hub.leave(board_id, websocket)
        left = presence.leave(board_id, user_id)
        await hub.publish(board_id, {"kind": "presence", "viewers": left})
