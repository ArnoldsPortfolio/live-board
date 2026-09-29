# Live Board

Real-time kanban. Invite others, replay missed ops, undo card changes.

```bash
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010
```

```bash
cd frontend && npm install && npm run dev
```

http://localhost:3010  
Seed: owner@board.dev / ChangeMe123!

Invite from a board page (email must already have an account), or create a share token and Join it from /dashboard.

```bash
docker compose up --build
```
