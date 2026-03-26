import os
import logging
import json
import sys
from typing import Dict

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import chromadb
import httpx
import torch
import timm
from PIL import Image
import numpy as np
import io
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from slowapi import Limiter

load_dotenv()


# --- Structured JSON Logging ---
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log = {
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
        }
        if record.exc_info:
            log["exception"] = self.formatException(record.exc_info)
        return json.dumps(log)


handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JSONFormatter())
logging.basicConfig(level=logging.INFO, handlers=[handler])
logger = logging.getLogger("airbnblens")


# --- Pydantic Response Models ---
class Listing(BaseModel):
    id: str | None = None
    name: str | None = None
    picture_url: str | None = None
    listing_url: str | None = None
    price: str | None = None
    neighborhood: str | None = None
    city: str | None = None
    description: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    rating: float | None = None
    reviews: int | None = None
    bedrooms: int | None = None
    beds: int | None = None
    bathrooms: str | None = None
    property_type: str | None = None
    accommodates: int | None = None


class SearchResponse(BaseModel):
    query: str | None = None
    expanded_query: str | None = None
    results: list[Listing]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    db_connected: bool
    hf_available: bool
    collections: dict


# --- Rate Limiting & App Setup ---
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="AirbnbLens Beast Engine", version="3.0")
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429, content={"detail": f"Rate limit exceeded: {exc.detail}"}
    )


# --- CORS ---
def get_allowed_origins() -> list[str]:
    env_origins = os.getenv("ALLOWED_ORIGINS", "")
    if env_origins:
        return [origin.strip() for origin in env_origins.split(",") if origin.strip()]
    return ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"]


ALLOWED_ORIGINS = get_allowed_origins()
logger.info(f"CORS: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

MAX_UPLOAD_SIZE = 10 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


# --- Hugging Face Query Augmentation ---
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")
HF_API_URL = (
    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3"
)
HF_ENABLED = bool(HF_API_TOKEN) and HF_API_TOKEN != "hf_your_token_here"
logger.info(f"HF augmentation: {'enabled' if HF_ENABLED else 'disabled'}")

_augmentation_cache: Dict[str, str] = {}


async def augment_query_with_hf(user_query: str) -> str:
    if not HF_ENABLED:
        return user_query
    if user_query in _augmentation_cache:
        return _augmentation_cache[user_query]
    prompt = (
        "[INST] You are an interior design AI. Extract the aesthetic intent from "
        "this phrase and return exactly 5 highly descriptive visual keywords "
        "separated by commas. Do not add any conversational text.\n"
        f"Phrase: '{user_query}' [/INST]"
    )
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.post(
                HF_API_URL,
                headers={"Authorization": f"Bearer {HF_API_TOKEN}"},
                json={"inputs": prompt, "parameters": {"max_new_tokens": 50}},
            )
        if response.status_code != 200:
            return user_query
        data = response.json()
        if isinstance(data, list) and len(data) > 0:
            expanded = data[0].get("generated_text", "").replace(prompt, "").strip()
            if expanded:
                _augmentation_cache[user_query] = expanded
                return expanded
    except Exception:
        pass
    return user_query


# --- ChromaDB ---
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")
try:
    client = chromadb.PersistentClient(
        path=CHROMA_DB_PATH, settings=chromadb.Settings(anonymized_telemetry=False)
    )
    logger.info(f"ChromaDB connected at {CHROMA_DB_PATH}")
except Exception as e:
    logger.error(f"ChromaDB error: {e}")
    client = None

image_collection = None
meta_collection = None
if client:
    try:
        image_collection = client.get_or_create_collection(name="airbnb_visuals")
        meta_collection = client.get_or_create_collection(name="airbnb_metadata")
        logger.info(
            f"Collections: visuals={image_collection.count()}, metadata={meta_collection.count()}"
        )
    except Exception as e:
        logger.error(f"Collections error: {e}")


# --- PyTorch ResNet152 via timm ---
logger.info("Loading ResNet152 via timm...")
try:
    model_image = timm.create_model("resnet152", pretrained=True, num_classes=0)
    model_image.eval()
    data_config = timm.data.resolve_model_data_config(model_image)
    preprocess = timm.data.create_transform(**data_config, is_training=False)
    logger.info("ResNet152 loaded successfully")
except Exception as e:
    logger.error(f"Model load failed: {e}")
    model_image = None
    preprocess = None


def extract_features(img_bytes: bytes) -> list[float]:
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img_tensor = preprocess(img).unsqueeze(0)
    with torch.no_grad():
        features = model_image(img_tensor)
    return features.flatten().tolist()


# --- Cache ---
_text_cache: Dict[str, list] = {}


# --- Endpoints ---
@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="healthy",
        model_loaded=model_image is not None,
        db_connected=client is not None,
        hf_available=HF_ENABLED,
        collections={
            "airbnb_visuals": image_collection.count() if image_collection else 0,
            "airbnb_metadata": meta_collection.count() if meta_collection else 0,
        },
    )


@app.post("/search/image", response_model=SearchResponse)
@limiter.limit("30/minute")
async def search_image(
    request: Request, file: UploadFile = File(...), city: str | None = None
):
    if image_collection is None:
        raise HTTPException(503, "Vector index not connected.")
    if model_image is None:
        raise HTTPException(503, "ML model not loaded.")
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            400, f"Invalid file type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )

    try:
        content = await file.read()
        if len(content) > MAX_UPLOAD_SIZE:
            raise HTTPException(413, "File too large. Max 10MB.")
        if len(content) == 0:
            raise HTTPException(400, "Empty file.")

        query_vector = extract_features(content)
        where_filter = {"city": city} if city else None
        results = image_collection.query(
            query_embeddings=[query_vector], n_results=50, where=where_filter
        )

        if not results or not results.get("metadatas") or not results["metadatas"][0]:
            return SearchResponse(results=[])

        logger.info(f"Image search: {len(results['metadatas'][0])} results")
        return SearchResponse(results=results["metadatas"][0])
    except HTTPException:
        raise
    except Exception:
        logger.exception("Image search failed")
        raise HTTPException(500, "Image processing failed.")


@app.get("/search/text", response_model=SearchResponse)
@app.post("/search/text", response_model=SearchResponse)
@limiter.limit("60/minute")
async def search_text(
    request: Request,
    query: str = "",
    city: str | None = None,
    limit: int = 50,
    price_min: int | None = None,
    price_max: int | None = None,
):
    if not query:
        return SearchResponse(results=[])
    if meta_collection is None:
        raise HTTPException(503, "Metadata not connected.")
    if limit < 1 or limit > 500:
        limit = 50

    try:
        expanded = await augment_query_with_hf(query)
        search_term = expanded if expanded != query else query

        cache_key = f"{search_term}:{city or ''}:{limit}"
        if cache_key in _text_cache:
            return SearchResponse(
                query=query,
                expanded_query=expanded if expanded != query else None,
                results=_text_cache[cache_key],
            )

        where_filter = {"city": city} if city else None
        results = meta_collection.query(
            query_texts=[search_term], n_results=limit, where=where_filter
        )

        if not results or not results.get("metadatas") or not results["metadatas"][0]:
            return SearchResponse(
                query=query,
                expanded_query=expanded if expanded != query else None,
                results=[],
            )

        items = results["metadatas"][0]

        # Price filter
        if price_min is not None or price_max is not None:
            filtered = []
            for item in items:
                try:
                    price = int(
                        str(item.get("price", "$0"))
                        .replace("$", "")
                        .replace(",", "")
                        .split(".")[0]
                    )
                    if price_min and price < price_min:
                        continue
                    if price_max and price > price_max:
                        continue
                except (ValueError, TypeError):
                    pass
                filtered.append(item)
            items = filtered

        # Sort by rating
        items.sort(key=lambda x: (-(x.get("rating") or 0), -(x.get("reviews") or 0)))

        _text_cache[cache_key] = items
        logger.info(f"Text search '{search_term}': {len(items)} results")
        return SearchResponse(
            query=query,
            expanded_query=expanded if expanded != query else None,
            results=items,
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Text search failed")
        raise HTTPException(500, "Search failed.")


@app.get("/search/similar", response_model=SearchResponse)
@limiter.limit("30/minute")
async def search_similar(
    request: Request, listing_id: str, target_city: str | None = None
):
    if image_collection is None:
        raise HTTPException(503, "Vector index not connected.")
    try:
        try:
            listing = image_collection.get(
                ids=[listing_id], include=["embeddings", "metadatas"]
            )
            if listing and listing.get("embeddings") and len(listing["embeddings"]) > 0:
                vector = listing["embeddings"][0]
                where_filter = {"city": target_city} if target_city else None
                results = image_collection.query(
                    query_embeddings=[vector], n_results=25, where=where_filter
                )
                if results and results.get("metadatas") and results["metadatas"][0]:
                    return SearchResponse(results=results["metadatas"][0])
        except Exception:
            pass

        if meta_collection:
            meta_listing = meta_collection.get(ids=[listing_id], include=["metadatas"])
            if (
                meta_listing
                and meta_listing.get("metadatas")
                and len(meta_listing["metadatas"]) > 0
            ):
                desc = meta_listing["metadatas"][0].get("description", "cozy stay")
                return await search_text(request=request, query=desc, city=target_city)

        return SearchResponse(results=[])
    except HTTPException:
        raise
    except Exception:
        logger.exception("Similar search failed")
        raise HTTPException(500, "Similarity search failed.")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
