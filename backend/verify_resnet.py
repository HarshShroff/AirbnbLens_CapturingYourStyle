import numpy as np
import httpx
import warnings
from keras.utils import load_img, img_to_array
from keras.applications.resnet import preprocess_input
from keras.applications import ResNet152
from keras.layers import GlobalMaxPooling2D
from keras import Sequential
import io
import tensorflow as tf

# Suppress TF logs
tf.get_logger().setLevel('ERROR')
warnings.filterwarnings('ignore')

print("Loading ResNet152 for Accuracy Verification...")
base_model = ResNet152(weights="imagenet", include_top=False, input_shape=(224, 224, 3))
model = Sequential([base_model, GlobalMaxPooling2D()])

def get_image_vector(url):
    print(f"Downloading test image...")
    response = httpx.get(url)
    img = load_img(io.BytesIO(response.content), target_size=(224, 224))
    img_array = img_to_array(img)
    expanded = np.expand_dims(img_array, axis=0)
    preprocessed = preprocess_input(expanded)
    return model.predict(preprocessed, verbose=0).flatten()

def cosine_similarity(v1, v2):
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

print("\n--- Running Aesthetic Similarity Test ---")
# Image 1: Minimalist Modern Living Room
url_modern_1 = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400"
# Image 2: Another Minimalist Modern Living Room
url_modern_2 = "https://images.unsplash.com/photo-1600210491369-0df33b27b822?w=400"
# Image 3: Rustic Log Cabin Bedroom
url_rustic = "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=400"

v_mod1 = get_image_vector(url_modern_1)
v_mod2 = get_image_vector(url_modern_2)
v_rust = get_image_vector(url_rustic)

sim_modern_to_modern = cosine_similarity(v_mod1, v_mod2)
sim_modern_to_rustic = cosine_similarity(v_mod1, v_rust)

print("\n--- Verification Results ---")
print(f"Similarity (Modern Room A <-> Modern Room B) : {sim_modern_to_modern:.4f} (Should be HIGH +0.70)")
print(f"Similarity (Modern Room A <-> Rustic Cabin)  : {sim_modern_to_rustic:.4f} (Should be LOW ~0.30)")

if sim_modern_to_modern > sim_modern_to_rustic + 0.15:
    print("\n✅ VERIFIED: ResNet152 is accurately grouping interior aesthetics mathematically!")
else:
    print("\n❌ INCONCLUSIVE: ResNet152 struggled to differentiate aesthetics.")
