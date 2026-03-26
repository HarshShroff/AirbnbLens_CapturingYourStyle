"""
AirbnbLens Data Ingestion Script

Ingests Airbnb listing data from CSV files, extracts image embeddings using ResNet152,
and stores both visual embeddings and metadata in ChromaDB collections.

Usage:
    python ingest.py [--data-dir ../data] [--db-path ./chroma_db]
"""

import os
import io
import argparse
import logging
import pandas as pd
import requests
import numpy as np
import chromadb
from tqdm import tqdm
from keras.utils import load_img, img_to_array
from keras.applications import ResNet152
from keras.applications.resnet import preprocess_input
from keras.layers import GlobalMaxPooling2D
from keras import Sequential

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Load model
logger.info("Loading ResNet152 model...")
base_model = ResNet152(
    weights="imagenet", include_top=False, input_shape=(224, 224, 3)
)
base_model.trainable = False
model_image = Sequential([base_model, GlobalMaxPooling2D()])
logger.info("Model loaded successfully")


def extract_features(img_data: bytes) -> list[float]:
    """
    Extract image features using ResNet152.
    Uses BytesIO to avoid writing temporary files to disk.
    """
    img = load_img(io.BytesIO(img_data), target_size=(224, 224))
    img_array = img_to_array(img)
    expanded_img_array = np.expand_dims(img_array, axis=0)
    preprocessed_img = preprocess_input(expanded_img_array)
    return model_image.predict(preprocessed_img, verbose=0).flatten().tolist()


def safe_str(val, fallback: str = "") -> str:
    """Safely convert value to string, returning fallback if NaN/None."""
    return str(val) if pd.notna(val) else fallback


def safe_float(val) -> float | None:
    """Safely convert value to float, returning None if NaN."""
    try:
        return float(val) if pd.notna(val) else None
    except (ValueError, TypeError):
        return None


def safe_int(val) -> int | None:
    """Safely convert value to int, returning None if NaN."""
    try:
        return int(float(val)) if pd.notna(val) else None
    except (ValueError, TypeError):
        return None


def parse_city_name(filename: str) -> str:
    """Extract clean city name from filename."""
    # Remove .csv extension and state abbreviation
    name = filename.replace(".csv", "")
    # Split by comma and take first part (city name)
    parts = name.split(",")
    return parts[0].strip() if parts else name


def ingest_city(
    df: pd.DataFrame,
    city_name: str,
    image_collection,
    meta_collection,
    skip_existing: bool = True
) -> dict:
    """
    Ingest a single city's listings into ChromaDB.

    Returns:
        dict with stats: {"processed": int, "skipped": int, "failed": int}
    """
    stats = {"processed": 0, "skipped": 0, "failed": 0}

    for _, row in tqdm(df.iterrows(), total=len(df), desc=city_name):
        listing_id = str(row["id"])

        try:
            # Skip if already exists
            if skip_existing:
                existing = meta_collection.get(ids=[listing_id])
                if existing and existing.get("ids"):
                    stats["skipped"] += 1
                    continue

            # Fetch image
            img_url = str(row.get("picture_url", ""))
            if not img_url or img_url == "nan":
                stats["failed"] += 1
                continue

            response = requests.get(img_url, timeout=10)
            if response.status_code != 200:
                stats["failed"] += 1
                continue

            # Extract embeddings using BytesIO (no temp file)
            img_embedding = extract_features(response.content)

            # Parse metadata
            lat = safe_float(row.get("latitude"))
            lng = safe_float(row.get("longitude"))
            rating = safe_float(row.get("review_scores_rating"))
            reviews = safe_int(row.get("number_of_reviews"))
            bedrooms = safe_int(row.get("bedrooms"))
            beds = safe_int(row.get("beds"))
            accommodates = safe_int(row.get("accommodates"))

            metadata = {
                "id": listing_id,
                "name": safe_str(row.get("name")),
                "picture_url": img_url,
                "listing_url": safe_str(row.get("listing_url")),
                "price": safe_str(row.get("price")),
                "city": city_name,
                "neighborhood": safe_str(row.get("neighbourhood_cleansed"), "Unknown"),
                "description": safe_str(row.get("description"))[:500],
                "latitude": lat if lat is not None else 0.0,
                "longitude": lng if lng is not None else 0.0,
                "rating": rating,
                "reviews": reviews,
                "bedrooms": bedrooms,
                "beds": beds,
                "bathrooms": safe_str(row.get("bathrooms_text")),
                "property_type": safe_str(row.get("property_type")),
                "accommodates": accommodates,
            }

            # Add to image collection (visual embeddings)
            image_collection.add(
                embeddings=[img_embedding],
                metadatas=[metadata],
                ids=[listing_id],
            )

            # Add to metadata collection (text search)
            document = safe_str(row.get("description"), safe_str(row.get("name")))
            meta_collection.add(
                documents=[document],
                metadatas=[metadata],
                ids=[listing_id],
            )

            stats["processed"] += 1

        except Exception as e:
            logger.debug(f"Failed to process listing {listing_id}: {e}")
            stats["failed"] += 1
            continue

    return stats


def main():
    parser = argparse.ArgumentParser(description="Ingest Airbnb data into ChromaDB")
    parser.add_argument(
        "--data-dir",
        default="../data",
        help="Directory containing CSV files"
    )
    parser.add_argument(
        "--db-path",
        default="./chroma_db",
        help="Path to ChromaDB database"
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        default=True,
        help="Skip listings that already exist in the database"
    )
    args = parser.parse_args()

    # Initialize ChromaDB
    logger.info(f"Connecting to ChromaDB at {args.db_path}")
    client = chromadb.PersistentClient(
        path=args.db_path,
        settings=chromadb.Settings(anonymized_telemetry=False)
    )
    image_collection = client.get_or_create_collection(name="airbnb_visuals")
    meta_collection = client.get_or_create_collection(name="airbnb_metadata")

    logger.info(f"Existing records: visuals={image_collection.count()}, metadata={meta_collection.count()}")

    # Find and process city files
    city_files = [
        "Ashville, NC.csv",
        "Boston, MA.csv",
        "Cambridge, MA.csv",
        "Jersey City, NJ.csv",
        "New York, NY.csv",
        "Newark, NJ.csv",
        "Rhode Island, RI.csv",
        "Washington, DC.csv",
    ]

    total_stats = {"processed": 0, "skipped": 0, "failed": 0}

    for city_file in city_files:
        filepath = os.path.join(args.data_dir, city_file)
        if not os.path.exists(filepath):
            logger.warning(f"File not found: {filepath}")
            continue

        city_name = parse_city_name(city_file)
        df = pd.read_csv(filepath)
        logger.info(f"Processing {city_name} ({len(df)} listings)...")

        stats = ingest_city(
            df,
            city_name,
            image_collection,
            meta_collection,
            skip_existing=args.skip_existing
        )

        for key in total_stats:
            total_stats[key] += stats[key]

        logger.info(f"  {city_name}: processed={stats['processed']}, skipped={stats['skipped']}, failed={stats['failed']}")

    logger.info("=" * 50)
    logger.info(f"Indexing complete!")
    logger.info(f"Total: processed={total_stats['processed']}, skipped={total_stats['skipped']}, failed={total_stats['failed']}")
    logger.info(f"Final counts: visuals={image_collection.count()}, metadata={meta_collection.count()}")


if __name__ == "__main__":
    main()
