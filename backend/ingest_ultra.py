import os
import pandas as pd
import chromadb

DATA_DIR = "../data"
BATCH_SIZE = 5

print("Connecting to ChromaDB Directory...")
client = chromadb.PersistentClient(path="./chroma_db")
try:
    client.delete_collection("airbnb_metadata")
except Exception:
    pass
meta_collection = client.get_or_create_collection(name="airbnb_metadata")

csv_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".csv")]
print("Starting ULTRA-FAST Sandbox Indexing...")

for city_file in csv_files:
    file_path = os.path.join(DATA_DIR, city_file)
    try:
        df = pd.read_csv(file_path).head(BATCH_SIZE)
    except Exception as e:
        print(f"Error reading {city_file}: {e}")
        continue

    city_name = city_file.split(",")[0].strip()
    print(f"Embedding {city_name}...", end=" ", flush=True)

    ids = [str(row["id"]) for _, row in df.iterrows()]
    documents = [
        str(row["description"])[:500]
        if pd.notna(row["description"])
        else str(row["name"])
        for _, row in df.iterrows()
    ]
    metadatas = []

    for _, row in df.iterrows():
        listing_id = str(row["id"])
        name = str(row["name"]) if pd.notna(row["name"]) else "Airbnb Stay"
        desc = str(row["description"])[:500] if pd.notna(row["description"]) else name
        rating = (
            float(row["review_scores_rating"])
            if pd.notna(row.get("review_scores_rating"))
            else None
        )
        reviews = (
            int(row["number_of_reviews"])
            if pd.notna(row.get("number_of_reviews"))
            else 0
        )
        bedrooms = int(row["bedrooms"]) if pd.notna(row.get("bedrooms")) else 0
        beds = int(row["beds"]) if pd.notna(row.get("beds")) else 0
        bathrooms = (
            str(row["bathrooms_text"]) if pd.notna(row.get("bathrooms_text")) else ""
        )
        property_type = (
            str(row["property_type"]) if pd.notna(row.get("property_type")) else ""
        )
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
                "neighborhood": str(row["neighbourhood_cleansed"])
                if pd.notna(row["neighbourhood_cleansed"])
                else city_name,
                "city": city_name,
                "description": desc,
                "latitude": float(row["latitude"])
                if pd.notna(row["latitude"])
                else 0.0,
                "longitude": float(row["longitude"])
                if pd.notna(row["longitude"])
                else 0.0,
                "rating": rating if rating else 0.0,
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
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")

print(f"Complete! Total: {meta_collection.count()}")
