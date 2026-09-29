from sqlalchemy import text
from sqlalchemy.engine import Engine

ADDS = {
    "users": [("name", "TEXT DEFAULT ''"), ("role", "TEXT DEFAULT 'member'"), ("avatar_path", "TEXT DEFAULT ''"), ("is_active", "INTEGER DEFAULT 1")],
    "boards": [("swimlane_mode", "TEXT DEFAULT 'off'"), ("is_archived", "INTEGER DEFAULT 0"), ("description", "TEXT DEFAULT ''"), ("code", "TEXT DEFAULT ''"), ("start_date", "TEXT DEFAULT ''"), ("end_date", "TEXT DEFAULT ''"), ("budget", "TEXT DEFAULT ''")],
    "board_columns": [("policy", "TEXT DEFAULT ''"), ("wip_limit", "INTEGER")],
    "cards": [("description", "TEXT DEFAULT ''"), ("assignee_id", "TEXT DEFAULT ''"), ("due_date", "TEXT DEFAULT ''"), ("priority", "TEXT DEFAULT 'med'"), ("labels", "TEXT DEFAULT '[]'"), ("color", "TEXT DEFAULT '#d4af6e'"), ("blocked", "INTEGER DEFAULT 0"), ("blocked_reason", "TEXT DEFAULT ''")],
}

def apply_sqlite_patches(engine: Engine) -> None:
    if engine.url.drivername != "sqlite":
        return
    with engine.begin() as conn:
        tables = {r[0] for r in conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()}
        for table, specs in ADDS.items():
            if table not in tables:
                continue
            existing = {r[1] for r in conn.execute(text(f"PRAGMA table_info({table})")).fetchall()}
            for name, spec in specs:
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {spec}"))
