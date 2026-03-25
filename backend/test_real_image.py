import numpy as np
import warnings
import chromadb
from keras.utils import load_img, img_to_array
from keras.applications.resnet import preprocess_input
from keras.applications import ResNet152
from keras.layers import GlobalMaxPooling2D
from keras import Sequential
import tensorflow as tf
import os
import json

# Suppress TF logs
tf.get_logger().setLevel('ERROR')
warnings.filterwarnings('ignore')

target_image_path = "/Users/harshshroff/Downloads/m.png"

if not os.path.exists(target_image_path):
    print(f"❌ Could not find image at {target_image_path}")
    exit(1)

print("Connecting to local ChromaDB...")
client = chromadb.PersistentClient(path="./chroma_db", settings=chromadb.Settings(anonymized_telemetry=False))
image_collection = client.get_collection("airbnb_visuals")

print("Loading Stylizer Engine (ResNet152)...")
base_model = ResNet152(weights="imagenet", include_top=False, input_shape=(224, 224, 3))
model = Sequential([base_model, GlobalMaxPooling2D()])

print(f"Parsing '{target_image_path}' to extract mathematical aesthetic...")
img = load_img(target_image_path, target_size=(224, 224))
img_array = img_to_array(img)
expanded = np.expand_dims(img_array, axis=0)
preprocessed = preprocess_input(expanded)

print("Calculating 2048-dimensional Vector...")
query_vector = model.predict(preprocessed, verbose=0).flatten().tolist()

print("Querying ChromaDB for Top 3 absolute closest visual matches globally...")
results = image_collection.query(
    query_embeddings=[query_vector], 
    n_results=3
)

print("\n🔥 BEAST ENGINE RESULTS FOR UPLOADED IMAGE 🔥")
print("-" * 60)
if results and results.get("metadatas") and results["metadatas"][0]:
    for idx, meta in enumerate(results["metadatas"][0]):
        print(f"Match #{idx + 1}")
        print(f"🏠 Title: {meta.get('name', 'Unknown')}")
        print(f"📍 Location: {meta.get('neighborhood', 'Unknown')}, {meta.get('city', 'Unknown')}")
        print(f"💰 Price: {meta.get('price', 'Unknown')} per night")
        print(f"🖼 Image URL: {meta.get('picture_url', 'Unknown')}")
        print(f"📄 Description Preview: {meta.get('description', '')[:100]}...\n")
else:
    print("Database returned no matches.")
