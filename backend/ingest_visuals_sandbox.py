import numpy as np
import httpx
import chromadb
from keras.utils import load_img, img_to_array
from keras.applications.resnet import preprocess_input
from keras.applications import ResNet152
from keras.layers import GlobalMaxPooling2D
from keras import Sequential
import io
import os

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

TOTAL_IMAGES = 500  # total across all cities
PER_CITY = TOTAL_IMAGES // 8  # ~62 per city for balanced coverage

print("Connecting to local ChromaDB...")
client = chromadb.PersistentClient(path="./chroma_db")
meta_collection = client.get_collection("airbnb_metadata")

# Drop and recreate visuals collection
try:
    client.delete_collection("airbnb_visuals")
except Exception:
    pass
image_collection = client.get_or_create_collection(name="airbnb_visuals")

# Distribute across cities
CITIES = [
    "Washington",
    "Jersey City",
    "Ashville",
    "Newark",
    "New York",
    "Cambridge",
    "Boston",
    "Rhode Island",
]
urls = []
ids = []
metadatas = []

print(f"Fetching ~{PER_CITY} URLs per city (total {TOTAL_IMAGES})...")
batch_size = 200
offset = 0
collected = {c: 0 for c in CITIES}
target_reached = False

while not target_reached:
    try:
        meta_results = meta_collection.get(limit=batch_size, offset=offset)
        if not meta_results or not meta_results.get("ids"):
            break
        for i in range(len(meta_results["ids"])):
            try:
                city = meta_results["metadatas"][i].get("city", "")
                if city in collected and collected[city] < PER_CITY:
                    url = meta_results["metadatas"][i].get("picture_url", "")
                    if "http" in url:
                        urls.append(url)
                        ids.append(meta_results["ids"][i])
                        metadatas.append(meta_results["metadatas"][i])
                        collected[city] += 1
                if sum(collected.values()) >= TOTAL_IMAGES:
                    target_reached = True
                    break
            except Exception:
                pass
        offset += batch_size
    except Exception as e:
        print(f"  Batch error at offset {offset}: {e}")
        break

print(f"Loaded {len(urls)} images across cities:")
for city, count in sorted(collected.items(), key=lambda x: -x[1]):
    if count > 0:
        print(f"  {city}: {count}")

print("\nLoading Stylizer Engine (ResNet152)...")
base_model = ResNet152(weights="imagenet", include_top=False, input_shape=(224, 224, 3))
model = Sequential([base_model, GlobalMaxPooling2D()])

valid_ids = []
valid_embeddings = []
valid_metadatas = []
skipped = 0

print("Processing images into 2048-D Vectors...")
valid_count = 0
for idx, url in enumerate(urls):
    try:
        response = httpx.get(url, timeout=15.0)
        img = load_img(io.BytesIO(response.content), target_size=(224, 224))
        img_array = img_to_array(img)
        expanded = np.expand_dims(img_array, axis=0)
        preprocessed = preprocess_input(expanded)

        query_vector = model.predict(preprocessed, verbose=0).flatten().tolist()

        valid_ids.append(ids[idx])
        valid_embeddings.append(query_vector)
        valid_metadatas.append(metadatas[idx])
        valid_count += 1

        if (idx + 1) % 25 == 0:
            print(f"  [{idx + 1}/{len(urls)}] {valid_count} done, {skipped} skipped")
    except Exception as e:
        skipped += 1

if valid_ids:
    print(f"\nAdding {len(valid_ids)} vectors to ChromaDB visuals...")
    image_collection.add(
        ids=valid_ids, embeddings=valid_embeddings, metadatas=valid_metadatas
    )
    print(f"DONE! {image_collection.count()} images indexed for visual search.")
    print(f"  Success: {len(valid_ids)}  |  Skipped: {skipped}")
else:
    print("FAILED. No valid images found.")
