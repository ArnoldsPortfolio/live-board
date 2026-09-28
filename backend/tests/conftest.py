import pytest
from fastapi.testclient import TestClient
from app.db import Base, make_engine, make_session_factory
from app.deps import get_db
from app.main import app
@pytest.fixture
def client():
    engine = make_engine("sqlite:////tmp/live_board_test.db")
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    Factory = make_session_factory(engine)
    def override():
        db = Factory()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = override
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
