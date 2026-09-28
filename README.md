# Live Board

Real-time kanban. Many people edit the same board at once.

```
live-board/
  backend/     FastAPI + WebSocket gateway
  frontend/    TypeScript Next.js
```

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010
```

http://127.0.0.1:8010/docs

## Frontend

```bash
cd frontend
npm install
npm run dev
```

http://localhost:3010

Seed: `owner@board.dev` / `ChangeMe123!`

Uses ports 8010 and 3010 so Tenant Workspace can keep 8000 and 3000.
