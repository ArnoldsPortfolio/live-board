"""Contract tests for every dashboard api() path."""
from fastapi.testclient import TestClient

def auth(client: TestClient, email: str = "owner@board.dev"):
    res = client.post("/auth/sign-up", json={"email": email, "password": "password1"})
    if res.status_code != 200:
        res = client.post("/auth/sign-in", json={"email": email, "password": "password1"})
    body = res.json()
    assert res.status_code == 200, body
    return {"Authorization": f"Bearer {body['access_token']}"}, body

def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_project_dashboard_create_list_move_delete(client):
    headers, _ = auth(client, "dash@x.com")
    created = client.post("/boards", json={"title": "Saas project"}, headers=headers)
    assert created.status_code == 200, created.text
    board = created.json()
    assert board["id"]
    assert board["title"] == "Saas project"
    listed = client.get("/projects", headers=headers)
    assert listed.status_code == 200, listed.text
    ids = [row["id"] for row in listed.json()]
    assert board["id"] in ids
    row = next(r for r in listed.json() if r["id"] == board["id"])
    assert (row.get("status") or "backlog") == "backlog"
    moved = client.patch(f"/projects/{board['id']}", json={"status": "in_progress"}, headers=headers)
    assert moved.status_code == 200, moved.text
    assert moved.json()["status"] == "in_progress"
    deleted = client.delete(f"/projects/{board['id']}", headers=headers)
    assert deleted.status_code == 200, deleted.text
    leftover = [r["id"] for r in client.get("/projects", headers=headers).json()]
    assert board["id"] not in leftover

def test_create_requires_token(client):
    res = client.post("/boards", json={"title": "Nope"})
    assert res.status_code in {401, 403}

def test_jobs_candidates(client):
    headers, _ = auth(client, "jobs@x.com")
    added = client.post("/jobs/candidates", json={"name": "Ava Chen", "role": "Frontend", "stage": "Applied"}, headers=headers)
    assert added.status_code == 200, added.text
    cid = added.json()["id"]
    listed = client.get("/jobs/candidates", headers=headers)
    assert listed.status_code == 200
    assert any(r["id"] == cid for r in listed.json())
    moved = client.patch(f"/jobs/candidates/{cid}", json={"stage": "Interview"}, headers=headers)
    assert moved.status_code == 200
    assert moved.json()["stage"] == "Interview"
    assert client.delete(f"/jobs/candidates/{cid}", headers=headers).status_code == 200

def test_payroll_advance(client):
    headers, _ = auth(client, "pay@x.com")
    listed = client.get("/payroll/periods", headers=headers)
    assert listed.status_code == 200, listed.text
    draft = next(r for r in listed.json() if r["status"] == "Draft")
    advanced = client.post(f"/payroll/periods/{draft['id']}/advance", headers=headers)
    assert advanced.status_code == 200
    assert advanced.json()["status"] == "Review"

def test_integrations_toggle(client):
    headers, _ = auth(client, "int@x.com")
    listed = client.get("/integrations", headers=headers)
    assert listed.status_code == 200, listed.text
    tool = listed.json()[0]
    toggled = client.post(f"/integrations/{tool['id']}/toggle", headers=headers)
    assert toggled.status_code == 200
    assert toggled.json()["on"] != tool["on"]

def test_calendar_manager_can_list(client):
    headers, _ = auth(client, "cal@x.com")
    res = client.get("/calendar?year=2026&month=9", headers=headers)
    assert res.status_code == 200, res.text
    assert isinstance(res.json(), list)

def test_team_and_me(client):
    headers, _ = auth(client, "lead@x.com")
    me = client.get("/me", headers=headers)
    assert me.status_code == 200
    patched = client.patch("/me", json={"name": "Lead"}, headers=headers)
    assert patched.status_code == 200
    assert patched.json()["name"] == "Lead"
    team = client.get("/team", headers=headers)
    assert team.status_code == 200
    assert any(row["email"] == "lead@x.com" for row in team.json())
