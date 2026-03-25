import sys
from unittest.mock import MagicMock, patch

# Mock heavy dependencies before importing main
_heavy_mocks = {
    "chromadb": MagicMock(),
    "keras": MagicMock(),
    "keras.utils": MagicMock(),
    "keras.applications": MagicMock(),
    "keras.applications.resnet": MagicMock(),
    "keras.layers": MagicMock(),
    "numpy": MagicMock(),
    "dotenv": MagicMock(),
}
for mod_name, mock in _heavy_mocks.items():
    sys.modules[mod_name] = mock

import pytest
import pytest_asyncio
import httpx
import main

# Configure mocks
_mock_collection = MagicMock()
_mock_collection.count.return_value = 100
_mock_collection.query.return_value = {
    "metadatas": [
        [
            {
                "id": "1",
                "name": "Cozy Loft",
                "price": "$120",
                "city": "Boston",
                "neighborhood": "Back Bay",
                "picture_url": "https://example.com/1.jpg",
            }
        ]
    ]
}
_mock_collection.get.return_value = {
    "metadatas": [{"id": "1", "name": "Cozy Loft", "description": "A cozy place"}],
    "embeddings": [[0.1] * 2048],
}

_mock_client = MagicMock()
_mock_client.get_or_create_collection.return_value = _mock_collection

_mock_model = MagicMock()
_mock_model.predict.return_value = MagicMock(
    flatten=MagicMock(return_value=MagicMock(tolist=lambda: [0.1] * 2048))
)

main.client = _mock_client
main.image_collection = _mock_collection
main.meta_collection = _mock_collection
main.model_image = _mock_model
main.HF_ENABLED = False


@pytest_asyncio.fixture
async def client():
    transport = httpx.ASGITransport(app=main.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "collections" in data
    assert "hf_available" in data


@pytest.mark.asyncio
async def test_text_search_empty_query(client):
    resp = await client.get("/search/text", params={"query": ""})
    assert resp.status_code == 200
    assert resp.json()["results"] == []


@pytest.mark.asyncio
async def test_text_search(client):
    resp = await client.get("/search/text", params={"query": "cozy loft"})
    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data
    assert len(data["results"]) > 0


@pytest.mark.asyncio
async def test_text_search_with_city(client):
    resp = await client.get(
        "/search/text", params={"query": "modern", "city": "Boston"}
    )
    assert resp.status_code == 200
    assert "results" in resp.json()


@pytest.mark.asyncio
async def test_text_search_limit_clamped(client):
    resp = await client.get("/search/text", params={"query": "test", "limit": 999})
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_similar_search(client):
    resp = await client.get("/search/similar", params={"listing_id": "123"})
    assert resp.status_code == 200
    assert "results" in resp.json()


@pytest.mark.asyncio
async def test_similar_with_target_city(client):
    resp = await client.get(
        "/search/similar", params={"listing_id": "123", "target_city": "New York"}
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_image_search_invalid_type(client):
    resp = await client.post(
        "/search/image",
        files={"file": ("test.txt", b"hello", "text/plain")},
    )
    assert resp.status_code == 400
    assert "Invalid file type" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_image_search_empty_file(client):
    resp = await client.post(
        "/search/image",
        files={"file": ("test.jpg", b"", "image/jpeg")},
    )
    assert resp.status_code == 400
    assert "Empty file" in resp.json()["detail"]
