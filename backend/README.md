# AirbnbLens Beast Engine — Backend

FastAPI server powering the AirbnbLens style-discovery platform.

## Setup

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Run

```bash
.venv/bin/python main.py
```

Server: `http://localhost:8000`
Docs: `http://localhost:8000/docs`

## Index Data

```bash
.venv/bin/python ingest_ultra.py           # 5 per city (instant)
.venv/bin/python ingest_sandbox.py         # 200 per city (~10 sec)
.venv/bin/python ingest_visuals_sandbox.py # ~500 images (~10 min)
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Status + collection counts |
| `/search/text` | GET/POST | Text vibe search |
| `/search/image` | POST | Visual image search |
| `/search/similar` | GET | Style teleportation |

### Parameters

**`/search/text?query=cozy&city=Boston&price_min=50&price_max=200`**
- `query` — search terms
- `city` — filter by city
- `price_min`, `price_max` — price range

**`/search/image`**
- Upload JPG/PNG/WebP (max 10MB)
- Optional `?city=` filter

**`/search/similar?listing_id=123&target_city=New+York`**
- Find aesthetic twins in another city

## Tests

```bash
.venv/bin/python -m pytest test_api.py -v
```

## Environment

Create `.env` for Hugging Face augmentation:
```
HF_API_TOKEN=hf_your_token_here
```

Without a token, text search works normally (just without query expansion).
