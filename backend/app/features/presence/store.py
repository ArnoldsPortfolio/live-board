from collections import defaultdict
class PresenceStore:
    def __init__(self):
        self._viewers: dict[str, dict[str, str]] = defaultdict(dict)
    def join(self, board_id: str, user_id: str, email: str) -> list[dict]:
        self._viewers[board_id][user_id] = email
        return self.snapshot(board_id)
    def leave(self, board_id: str, user_id: str) -> list[dict]:
        self._viewers[board_id].pop(user_id, None)
        return self.snapshot(board_id)
    def snapshot(self, board_id: str) -> list[dict]:
        return [{"user_id": uid, "email": email} for uid, email in self._viewers[board_id].items()]
presence = PresenceStore()
