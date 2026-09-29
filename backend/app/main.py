from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.db import Base
from app.deps import SessionLocal, engine, settings
from app.features.boards.projects import router as board_projects_router
from app.features.boards.router import router as boards_router
from app.features.projects.router import router as projects_router
from app.features.calendar.router import router as calendar_router
from app.features.identity.router import router as identity_router
from app.features.realtime.router import router as realtime_router
from app.features.team.router import router as team_router
from app.migrate import apply_sqlite_patches
from app.kernel.errors import DomainError
from app.seed import seed_if_empty

app = FastAPI(title="Live Board API", version="0.1.0", redirect_slashes=False)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=".*",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(DomainError)
async def domain_error(_, exc: DomainError):
    return JSONResponse({"code": exc.code, "message": exc.message}, status_code=exc.status)

@app.on_event("startup")
def startup():
    try:
        Base.metadata.create_all(bind=engine)
        apply_sqlite_patches(engine)
        db = SessionLocal()
        try:
            seed_if_empty(db)
        finally:
            db.close()
    except Exception:
        return

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(identity_router)
app.include_router(boards_router)
app.include_router(board_projects_router)
app.include_router(projects_router)
app.include_router(realtime_router)
app.include_router(calendar_router)
app.include_router(team_router)
