import os
import pandas as pd
import chromadb

DATA_DIR = "../data"
BATCH_SIZE = 500  # process per batch for memory

print("Connecting to ChromaDB Directory...")
client = chromadb.PersistentClient(path="./chroma_db")
meta_collection = client.get_or_create_collection(name="airbnb_metadata")

# Get already-indexed IDs to skip
print("Checking existing index...")
try:
    existing = meta_collection.get(include=[])
    existing_ids = set(existing["ids"])
    print(f"  Already indexed: {len(existing_ids)}")
except Exception:
    existing_ids = set()

csv_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".csv")]
total_new = 0

for city_file in csv_files:
    file_path = os.path.join(DATA_DIR, city_file)
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        print(f"Error reading {city_file}: {e}")
        continue

    city_name = city_file.split(",")[0].strip()

    # Filter out already-indexed
    df["id_str"] = df["id"].astype(str)
    df = df[~df["id_str"].isin(existing_ids)]

    if len(df) == 0:
        print(f"  {city_name}: all already indexed, skipping")
        continue

    print(f"  {city_name}: {len(df)} new listings to index...", flush=True)

    # Process in batches
    for batch_start in range(0, len(df), BATCH_SIZE):
        batch = df.iloc[batch_start : batch_start + BATCH_SIZE]

        ids, documents, metadatas = [], [], []

        for _, row in batch.iterrows():
            listing_id = str(row["id"])
            ids.append(listing_id)

            desc = str(row["description"])[:500] if pd.notna(row["description"]) else ""
            name = str(row["name"]) if pd.notna(row["name"]) else "Airbnb Stay"
            property_type = (
                str(row["property_type"]) if pd.notna(row.get("property_type")) else ""
            )
            neighborhood = (
                str(row["neighbourhood_cleansed"])
                if pd.notna(row["neighbourhood_cleansed"])
                else city_name
            )
            bathrooms = (
                str(row["bathrooms_text"])
                if pd.notna(row.get("bathrooms_text"))
                else ""
            )

            # Enriched document for better semantic search
            doc_parts = [name, property_type, neighborhood, city_name, bathrooms, desc]
            enriched_doc = " ".join(p for p in doc_parts if p)
            documents.append(enriched_doc[:800])

            rating = (
                float(row["review_scores_rating"])
                if pd.notna(row.get("review_scores_rating"))
                else 0.0
            )
            reviews = (
                int(row["number_of_reviews"])
                if pd.notna(row.get("number_of_reviews"))
                else 0
            )
            bedrooms = int(row["bedrooms"]) if pd.notna(row.get("bedrooms")) else 0
            beds = int(row["beds"]) if pd.notna(row.get("beds")) else 0
            accommodates = (
                int(row["accommodates"]) if pd.notna(row.get("accommodates")) else 1
            )

            metadatas.append(
                {
                    "id": listing_id,
                    "name": name,
                    "picture_url": str(row["picture_url"])
                    if pd.notna(row["picture_url"])
                    else "",
                    "listing_url": str(row["listing_url"])
                    if pd.notna(row.get("listing_url"))
                    else f"https://www.airbnb.com/rooms/{listing_id}",
                    "price": str(row["price"]) if pd.notna(row["price"]) else "$0",
                    "neighborhood": neighborhood,
                    "city": city_name,
                    "description": desc,
                    "latitude": float(row["latitude"])
                    if pd.notna(row["latitude"])
                    else 0.0,
                    "longitude": float(row["longitude"])
                    if pd.notna(row["longitude"])
                    else 0.0,
                    "rating": rating,
                    "reviews": reviews,
                    "bedrooms": bedrooms,
                    "beds": beds,
                    "bathrooms": bathrooms,
                    "property_type": property_type,
                    "accommodates": accommodates,
                }
            )

        try:
            meta_collection.add(ids=ids, documents=documents, metadatas=metadatas)
            total_new += len(ids)
            existing_ids.update(ids)
        except Exception as e:
            print(f"    Batch error: {e}")

    print(f"    {city_name} done!")

print(f"\nIndexing complete!")
print(f"  New: {total_new}")
print(f"  Total: {meta_collection.count()}")
