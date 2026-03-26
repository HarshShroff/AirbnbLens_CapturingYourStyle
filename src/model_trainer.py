"""
Author: Harsh Shroff
Date: 12/22/2023

This script utilizes a pre-trained ResNet152 model to extract image embeddings from a set of images and saves the embeddings and filenames for later use.

Dependencies:
- tensorflow
- keras
- numpy
- os
- tqdm
- pickle
"""

import tensorflow
from keras.preprocessing import image
from keras.layers import GlobalMaxPooling2D
from keras.applications import ResNet152
from keras.applications.resnet50 import preprocess_input
import numpy as np
from numpy.linalg import norm
import os
from tqdm import tqdm
import pickle

# Load pre-trained ResNet152 model
model = ResNet152(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
model.trainable = False

# Create a sequential model for feature extraction
model = tensorflow.keras.Sequential([
    model,
    GlobalMaxPooling2D()
])

print(model.summary())

# Function to extract features from an image
def extract_features(img_path, model):
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    expanded_img_array = np.expand_dims(img_array, axis=0)
    preprocessed_img = preprocess_input(expanded_img_array)
    result = model.predict(preprocessed_img).flatten()
    normalized_result = result / norm(result)

    return normalized_result

# List to store filenames and features
filenames = []
path = '/airbnb_images/'

# Traverse through all files in the specified path
for root, directories, files in os.walk(path):
    for file in files:
        filenames.append(os.path.join(root, file))

feature_list = []

# Extract features for each image and store in the feature_list
for file in tqdm(filenames):
    feature_list.append(extract_features(file, model))

# Save the embeddings and filenames to pickle files
pickle.dump(feature_list, open('embeddings_152_all.pkl', 'wb'))
pickle.dump(filenames, open('filenames_152_all.pkl', 'wb'))
