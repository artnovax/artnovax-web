from fastapi.testclient import TestClient

from server import app


def test_api_health():
    client = TestClient(app)
    response = client.get("/api/")
    assert response.status_code == 200
    assert response.json() == {"message": "ArtNovaX API is up."}
