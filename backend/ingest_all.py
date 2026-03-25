import os
import pandas as pd
import chromadb
from tqdm import tqdm

# Configuration
DATA_DIR = "../data"

# Initialize Shared Chroma Server connection
print("Connecting to ChromaDB Directory...")
try:
    client = chromadb.PersistentClient(
        path="./chroma_db", settings=chromadb.Settings(anonymized_telemetry=False)
    )
except Exception as e:
    print(f"FAILED to connect: {e}")
    exit(1)

meta_collection = client.get_or_create_collection(name="airbnb_metadata")

# Files to process
csv_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".csv")]

print(f"Starting Universal Metadata Indexing for {len(csv_files)} cities...")

total_docs = 0
for city_file in csv_files:
    print(f"Processing {city_file}...")
    file_path = os.path.join(DATA_DIR, city_file)

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        print(f"Could not read {city_file}: {e}")
        continue

    # Batch processing is much faster
    batch_size = 500
    for i in range(0, len(df), batch_size):
        batch = df.iloc[i : i + batch_size]

        ids = [str(row["id"]) for _, row in batch.iterrows()]
        documents = [
            str(row["description"])
            if pd.notna(row["description"])
            else str(row["name"])
            for _, row in batch.iterrows()
        ]
        metadatas = []

        # Build metadata list robustly
        for _, row in batch.iterrows():
            city_name = city_file.split(",")[0].strip()
            # Clean missing data to avoid vector DB crashes
            price = str(row["price"]) if pd.notna(row["price"]) else "$0"
            neighborhood = (
                str(row["neighbourhood_cleansed"])
                if pd.notna(row["neighbourhood_cleansed"])
                else city_name
            )
            name = str(row["name"]) if pd.notna(row["name"]) else "Airbnb Stay"
            picture_url = (
                str(row["picture_url"]) if pd.notna(row["picture_url"]) else ""
            )
            desc = (
                str(row["description"])[:200] if pd.notna(row["description"]) else name
            )

            metadatas.append(
                {
                    "id": str(row["id"]),
                    "name": name,
                    "picture_url": picture_url,
                    "price": price,
                    "neighborhood": neighborhood,
                    "city": city_name,
                    "description": desc,
                }
            )

        try:
            meta_collection.add(ids=ids, documents=documents, metadatas=metadatas)
            total_docs += len(ids)
        except Exception as e:
            # Skip duplicates or badly formatted rows
            print(f"Batch insert error: {e}")

print(f"Universal Metadata Indexing Complete. Total indexed: {total_docs}")
