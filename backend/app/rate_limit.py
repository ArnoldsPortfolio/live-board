import time
from collections import defaultdict
from app.kernel.errors import DomainError
_hits: dict[str, list[float]] = defaultdict(list)

def limit_auth(key: str, max_hits: int = 20, window: int = 60) -> None:
    now = time.time()
    recent = [t for t in _hits[key] if now - t < window]
    if len(recent) >= max_hits:
        raise DomainError("rate_limited", "Too many auth attempts", 429)
    recent.append(now)
    _hits[key] = recent
