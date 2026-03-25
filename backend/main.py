import os
import logging
import json
import sys
from functools import lru_cache
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
import httpx
from keras.utils import load_img, img_to_array
from keras.applications import ResNet152
from keras.applications.resnet import preprocess_input
from keras.layers import GlobalMaxPooling2D
from keras import Sequential
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


# --- Rate Limiting ---
limiter = Limiter(key_func=get_remote_address)

# --- App Setup ---
app = FastAPI(title="AirbnbLens Beast Engine", version="3.0")
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return HTTPException(
        status_code=429,
        detail=f"Rate limit exceeded: {exc.detail}",
    ).__call__(request)


ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

# --- Hugging Face Query Augmentation ---
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")
HF_API_URL = (
    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3"
)
HF_ENABLED = bool(HF_API_TOKEN) and HF_API_TOKEN != "hf_your_token_here"

if HF_ENABLED:
    logger.info("Hugging Face query augmentation enabled")
else:
    logger.info("Hugging Face token not found - augmentation disabled")


@lru_cache(maxsize=128)
def _cached_augmentation(query: str) -> str:
    """Cache HF augmentation results so identical queries don't hit the API twice."""
    return ""  # placeholder, actual call is async


async def augment_query_with_hf(user_query: str) -> str:
    """Use Mistral-7B to expand a short query into rich aesthetic keywords."""
    if not HF_ENABLED:
        return user_query

    cached = _cached_augmentation(user_query)
    if cached:
        return cached

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
            logger.warning(f"HF API returned {response.status_code}")
            return user_query

        data = response.json()
        if isinstance(data, list) and len(data) > 0:
            generated = data[0].get("generated_text", "")
            # Strip the prompt from the response to get just the keywords
            expanded = generated.replace(prompt, "").strip()
            if expanded:
                logger.info(f"Augmented '{user_query}' -> '{expanded}'")
                return expanded

    except Exception as e:
        logger.warning(f"HF augmentation failed: {e}")

    return user_query


# --- ChromaDB Connection ---
try:
    client = chromadb.PersistentClient(
        path="./chroma_db", settings=chromadb.Settings(anonymized_telemetry=False)
    )
    logger.info("ChromaDB connected")
except Exception as e:
    logger.error(f"Could not connect to ChromaDB: {e}")
    client = None

image_collection = None
meta_collection = None

if client:
    try:
        image_collection = client.get_or_create_collection(name="airbnb_visuals")
        meta_collection = client.get_or_create_collection(name="airbnb_metadata")
        logger.info(
            f"Collections loaded: visuals={image_collection.count()}, metadata={meta_collection.count()}"
        )
    except Exception as e:
        logger.error(f"Error accessing collections: {e}")

# --- Model Loading ---
logger.info("Loading ResNet152...")
try:
    base_model = ResNet152(
        weights="imagenet", include_top=False, input_shape=(224, 224, 3)
    )
    base_model.trainable = False
    model_image = Sequential([base_model, GlobalMaxPooling2D()])
    logger.info("ResNet152 loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    model_image = None


# --- Response Cache (LRU) ---
@lru_cache(maxsize=256)
def _cached_text_query(query: str, city: str | None, limit: int) -> tuple:
    """Cache text search results. Returns tuple for hashability."""
    where_filter = {"city": city} if city else None
    results = meta_collection.query(
        query_texts=[query], n_results=limit, where=where_filter
    )
    if not results or not results.get("metadatas"):
        return ()
    return tuple(tuple(sorted(m.items())) for m in results["metadatas"][0])


def _tuple_to_dicts(cached: tuple) -> list[dict]:
    return [dict(t) for t in cached]


# --- Endpoints ---
@app.get("/health", response_model=HealthResponse)
def health():
    img_count = image_collection.count() if image_collection else 0
    meta_count = meta_collection.count() if meta_collection else 0
    return HealthResponse(
        status="healthy",
        model_loaded=model_image is not None,
        db_connected=client is not None,
        hf_available=HF_ENABLED,
        collections={
            "airbnb_visuals": img_count,
            "airbnb_metadata": meta_count,
        },
    )


@app.post("/search/image", response_model=SearchResponse)
@limiter.limit("30/minute")
async def search_image(
    request: Request, file: UploadFile = File(...), city: str | None = None
):
    if image_collection is None:
        raise HTTPException(status_code=503, detail="Vector index not connected.")
    if model_image is None:
        raise HTTPException(status_code=503, detail="ML model not loaded.")

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}",
        )

    try:
        content = await file.read()
        if len(content) > MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Max 10MB.")
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")

        img = load_img(io.BytesIO(content), target_size=(224, 224))
        img_array = img_to_array(img)
        expanded = np.expand_dims(img_array, axis=0)
        preprocessed = preprocess_input(expanded)
        query_vector = model_image.predict(preprocessed).flatten().tolist()

        where_filter = {"city": city} if city else None
        results = image_collection.query(
            query_embeddings=[query_vector], n_results=50, where=where_filter
        )

        if not results or not results.get("metadatas") or not results["metadatas"][0]:
            return SearchResponse(results=[])

        logger.info(f"Image search returned {len(results['metadatas'][0])} results")
        return SearchResponse(results=results["metadatas"][0])
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Image search failed")
        raise HTTPException(status_code=500, detail="Image processing failed.")


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
        raise HTTPException(status_code=503, detail="Metadata server not connected.")
    if limit < 1 or limit > 500:
        limit = 50

    try:
        # Augment query with HF LLM
        expanded = await augment_query_with_hf(query)
        search_term = expanded if expanded != query else query

        # Try cache first
        city_key = city or ""
        cached = _cached_text_query(search_term, city_key, limit)
        if cached:
            logger.info(f"Cache hit for query='{search_term}' city='{city_key}'")
            return SearchResponse(
                query=query,
                expanded_query=expanded if expanded != query else None,
                results=_tuple_to_dicts(cached),
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

        # Price filtering
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
                    filtered.append(item)
                except (ValueError, TypeError):
                    filtered.append(item)  # keep if price unparseable
            items = filtered

        # Rank by rating (higher rated first), then by review count
        def sort_key(item):
            rating = item.get("rating") or 0
            reviews = item.get("reviews") or 0
            return (-rating, -reviews)

        items.sort(key=sort_key)

        logger.info(f"Text search '{search_term}' returned {len(items)} results")
        return SearchResponse(
            query=query,
            expanded_query=expanded if expanded != query else None,
            results=items,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Text search failed")
        raise HTTPException(status_code=500, detail="Search failed.")


@app.get("/search/similar", response_model=SearchResponse)
@limiter.limit("30/minute")
async def search_similar(
    request: Request, listing_id: str, target_city: str | None = None
):
    """Find aesthetic twins in other cities (The Style Migration Feature)"""
    if image_collection is None:
        raise HTTPException(status_code=503, detail="Vector index not connected.")

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
        except Exception as query_exc:
            logger.warning(
                f"Image collection lookup failed for {listing_id}: {query_exc}"
            )

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
    except Exception as e:
        logger.exception("Similarity search failed")
        raise HTTPException(status_code=500, detail="Similarity search failed.")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
