import os
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

# Load model
model_image = ResNet152(
    weights="imagenet", include_top=False, input_shape=(224, 224, 3)
)
model_image = Sequential([model_image, GlobalMaxPooling2D()])

client = chromadb.PersistentClient(
    path="./chroma_db", settings=chromadb.Settings(anonymized_telemetry=False)
)
image_collection = client.get_or_create_collection(name="airbnb_visuals")
meta_collection = client.get_or_create_collection(name="airbnb_metadata")


def extract_features(img_data):
    with open("temp.jpg", "wb") as f:
        f.write(img_data)
    img = load_img("temp.jpg", target_size=(224, 224))
    img_array = img_to_array(img)
    expanded_img_array = np.expand_dims(img_array, axis=0)
    preprocessed_img = preprocess_input(expanded_img_array)
    return model_image.predict(preprocessed_img).flatten().tolist()


def safe_str(val, fallback=""):
    return str(val) if pd.notna(val) else fallback


def safe_float(val):
    return float(val) if pd.notna(val) else None


if __name__ == "__main__":
    DATA_DIR = "../data"
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

    for city_file in city_files:
        city_name = city_file.replace(".csv", "")
        df = pd.read_csv(os.path.join(DATA_DIR, city_file))
        print(f"Processing {city_name} ({len(df)} listings)...")

        for _, row in tqdm(df.iterrows(), total=len(df)):
            try:
                img_url = str(row["picture_url"])
                response = requests.get(img_url, timeout=5)
                if response.status_code != 200:
                    continue

                img_embedding = extract_features(response.content)

                lat = safe_float(row["latitude"])
                lng = safe_float(row["longitude"])

                metadata = {
                    "id": str(row["id"]),
                    "name": safe_str(row["name"]),
                    "picture_url": safe_str(row["picture_url"]),
                    "price": safe_str(row["price"]),
                    "city": city_name,
                    "neighborhood": safe_str(row["neighbourhood_cleansed"], "Unknown"),
                    "description": safe_str(row["description"])[:500],
                    "latitude": lat if lat is not None else 0.0,
                    "longitude": lng if lng is not None else 0.0,
                }

                image_collection.add(
                    embeddings=[img_embedding],
                    metadatas=[metadata],
                    ids=[str(row["id"])],
                )

                meta_collection.add(
                    documents=[safe_str(row["description"], safe_str(row["name"]))],
                    metadatas=[metadata],
                    ids=[str(row["id"])],
                )
            except Exception as e:
                continue

    print("Indexing complete.")
