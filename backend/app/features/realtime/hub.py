from collections import defaultdict
from fastapi import WebSocket
class BoardHub:
    def __init__(self):
        self._rooms: dict[str, list[WebSocket]] = defaultdict(list)
    async def join(self, board_id: str, socket: WebSocket) -> None:
        await socket.accept()
        self._rooms[board_id].append(socket)
    def leave(self, board_id: str, socket: WebSocket) -> None:
        room = self._rooms[board_id]
        if socket in room:
            room.remove(socket)
    async def publish(self, board_id: str, message: dict) -> None:
        living = []
        for socket in self._rooms[board_id]:
            try:
                await socket.send_json(message)
                living.append(socket)
            except Exception:
                continue
        self._rooms[board_id] = living
hub = BoardHub()
