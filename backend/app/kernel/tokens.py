from datetime import datetime, timedelta, timezone
import jwt
def encode_access(secret: str, user_id: str, minutes: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    return jwt.encode({"sub": user_id, "exp": exp}, secret, algorithm="HS256")
def decode_access(secret: str, token: str) -> str:
    return str(jwt.decode(token, secret, algorithms=["HS256"])["sub"])
