# AirbnbLens — Beast Engine

**AI-Powered Style Discovery for Airbnb**

Find your perfect vibe. Search by photo, describe your aesthetic, or teleport styles across 8 cities — powered by ResNet152, ChromaDB, and FastAPI.

![AirbnbLens](https://img.shields.io/badge/status-production-green)
![Listings](https://img.shields.io/badge/listings-62%2C329-blue)
![Cities](https://img.shields.io/badge/cities-8-orange)

---

## What It Does

| Feature | Description |
|---------|-------------|
| **Text Vibe Search** | Describe a style ("rustic cabin fireplace") and get ranked matches |
| **Visual Lens Search** | Upload a photo, find listings with similar aesthetics via ResNet152 |
| **Style Teleportation** | Take a listing's vibe and find matches in a different city |
| **Geospatial Mapping** | Results plotted on an interactive Leaflet map with hover highlighting |
| **Category Bar** | Quick-search icons for Rustic, Minimalist, Industrial, Beach, etc. |
| **Hugging Face Augmentation** | Short queries expanded into rich keywords via Mistral-7B |
| **Real Airbnb Links** | Every card opens the actual listing on airbnb.com |

## Tech Stack

### Backend
- **FastAPI** — REST API server
- **ChromaDB** — Vector database (SQLite-backed)
- **ResNet152** — Image feature extraction (2048-dim vectors)
- **Keras 3** — Neural network framework
- **slowapi** — Rate limiting
- **Pydantic** — Response validation
- **httpx** — Async HTTP client (Hugging Face API)

### Frontend
- **Next.js 15** — React framework with App Router
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Styling
- **Leaflet + react-leaflet** — Interactive maps
- **next/image** — Optimized image loading
- **Vitest** — Component testing

---

## Quick Start

### 1. Backend

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# Index data (200 listings per city, ~10 seconds)
.venv/bin/python ingest_sandbox.py

# (Optional) Index images for visual search (~10 min)
.venv/bin/python ingest_visuals_sandbox.py

# Start server
.venv/bin/python main.py
```

Server runs on `http://localhost:8000`

### 2. Frontend

```bash
cd frontend

npm install
npm run dev
```

Open `http://localhost:3000`

### 3. Optional: Hugging Face Query Augmentation

```bash
# Get free token at https://huggingface.co/settings/tokens
echo 'HF_API_TOKEN=hf_your_token_here' > backend/.env
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | System status + collection counts |
| `POST` | `/search/image` | Visual search (upload image) |
| `GET/POST` | `/search/text` | Text vibe search |
| `GET` | `/search/similar` | Style teleportation |

### Query Parameters

**`/search/text`**
- `query` (required) — Search terms
- `city` (optional) — Filter by city
- `price_min` / `price_max` (optional) — Price range filter

**`/search/image`**
- `file` (required) — Image file (JPG/PNG/WebP, max 10MB)
- `city` (optional) — Filter by city

**`/search/similar`**
- `listing_id` (required) — Listing ID to find matches for
- `target_city` (optional) — City to search in

---

## Data

- **62,329 listings** across 8 cities (indexed from InsideAirbnb)
- **405 visual images** vectorized via ResNet152
- **75 data columns** per listing including rating, reviews, beds, baths, lat/lng

| City | Listings |
|------|----------|
| New York | 39,453 |
| Boston | 3,973 |
| Rhode Island | 5,132 |
| Washington | 6,541 |
| Ashville | 3,239 |
| Jersey City | 1,380 |
| Newark | 1,551 |
| Cambridge | 1,061 |

### Indexing Commands

```bash
cd backend

.venv/bin/python ingest_ultra.py          # 5 per city (instant, testing)
.venv/bin/python ingest_sandbox.py        # 200 per city (~10 sec)
.venv/bin/python ingest_visuals_sandbox.py # 500 images (~10 min)
```

---

## Project Structure

```
ab/
├── backend/
│   ├── main.py                  # FastAPI server
│   ├── ingest_sandbox.py        # Text indexer (200/city)
│   ├── ingest_visuals_sandbox.py # Visual indexer
│   ├── requirements.txt         # Python deps
│   ├── .env.example             # HF token template
│   ├── test_api.py              # 9 backend tests
│   └── chroma_db/               # Vector database (gitignored)
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx             # Main page (split-screen layout)
│   │   ├── layout.tsx           # Root layout + OG tags
│   │   └── components/
│   │       ├── Header.tsx       # Sticky header with mini search
│   │       ├── LensSearch.tsx   # Search bar + image upload
│   │       ├── ListingCard.tsx  # Listing card with heart/teleport
│   │       ├── CategoryBar.tsx  # Vibe category icons
│   │       ├── VibeMap.tsx      # Leaflet map component
│   │       ├── Toast.tsx        # Error notifications
│   │       └── ErrorBoundary.tsx # Crash recovery
│   ├── src/lib/
│   │   ├── api.ts               # API client with abort controller
│   │   └── types.ts             # TypeScript interfaces
│   └── src/__tests__/           # Vitest component tests
├── data/                        # CSV files (8 cities)
├── docs/                        # Presentation + images
├── DESIGN.md                    # UI design spec
└── README.md                    # This file
```

---

## Testing

```bash
# Backend (9 tests)
cd backend && .venv/bin/python -m pytest test_api.py -v

# Frontend (12 tests)
cd frontend && npx vitest run
```

---

## Architecture

```
User Photo/Query
       │
       ▼
┌──────────────┐     ┌─────────────────┐
│   Frontend   │────▶│   FastAPI Server │
│   (Next.js)  │◀────│   (main.py)     │
└──────────────┘     └────────┬────────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              ┌─────────┐ ┌──────┐ ┌─────────┐
              │ ResNet  │ │Chroma│ │ Hugging │
              │ 152     │ │  DB  │ │  Face   │
              │(visual) │ │(text)│ │ (augment)│
              └─────────┘ └──────┘ └─────────┘
```

**Retrieval flow:**
1. Query hits Hugging Face → expanded keywords
2. ChromaDB semantic search → top N matches
3. Results ranked by rating, filtered by city/price
4. Frontend renders split-screen (list + map)
5. Click card → opens real Airbnb listing

---

## Acknowledgements

- [InsideAirbnb](http://insideairbnb.com/get-the-data/) for the dataset
- UMBC DATA 606 Capstone project foundation
