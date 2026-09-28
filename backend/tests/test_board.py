def auth(client, email="a@b.com"):
    res = client.post("/auth/sign-up", json={"email": email, "password": "password1"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}
def test_create_and_add_card(client):
    headers = auth(client)
    board = client.post("/boards", json={"title": "Sprint"}, headers=headers).json()
    detail = client.get(f"/boards/{board['id']}", headers=headers).json()
    column_id = detail["columns"][0]["id"]
    card = client.post(f"/boards/{board['id']}/cards", json={"column_id": column_id, "title": "Write brief"}, headers=headers)
    assert card.status_code == 200
    again = client.get(f"/boards/{board['id']}", headers=headers).json()
    assert again["cards"][0]["title"] == "Write brief"
def test_isolation(client):
    a = auth(client, "a@x.com")
    b = auth(client, "b@x.com")
    board = client.post("/boards", json={"title": "Secret"}, headers=a).json()
    denied = client.get(f"/boards/{board['id']}", headers=b)
    assert denied.status_code == 403
