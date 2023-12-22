"""
Author: Harsh Shroff
Date: 12/22/2023

This Streamlit script serves as a House Listing Recommender using a pre-trained ResNet152 model for image embeddings.
It provides recommendations based on the uploaded image, displaying similar images and their respective listing URLs.

Dependencies:
- streamlit
- numpy
- pickle
- tensorflow
- keras
- sklearn
- numpy
- cv2
- os
- pandas
"""

import streamlit as st
import numpy as np
import pickle
import tensorflow as tf
from keras.preprocessing import image
from keras.layers import GlobalMaxPooling2D
from keras.applications import ResNet152, resnet50
from keras.applications.resnet50 import preprocess_input
from sklearn.neighbors import NearestNeighbors
from numpy.linalg import norm
import cv2
import os
import pandas as pd

data_directory = '/data/'

# Initialize an empty DataFrame to store the combined data
combined_data = pd.DataFrame()

# Loop through each CSV file in the specified directory
for filename in os.listdir(data_directory):
    if filename.endswith('.csv'):
        file_path = os.path.join(data_directory, filename)

        # Read the CSV file
        df = pd.read_csv(file_path)

        # Combine the data from all CSV files
        combined_data = pd.concat([combined_data, df])

feature_list = np.array(pickle.load(open('embeddings_152_all_2.pkl', 'rb')))
filenames = pickle.load(open('filenames_152_all_2.pkl', 'rb'))

print("Number of features:", len(feature_list))
print("Number of filenames:", len(filenames))

# Load image model
model_image = ResNet152(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
model_image.trainable = False
model_image = tf.keras.Sequential([model_image, GlobalMaxPooling2D()])

st.title('House Listing Recommender')

# Image Recommendation Section
uploaded_file_image = st.file_uploader("Choose an image")
if uploaded_file_image is not None:
    # Process the uploaded image
    img = image.load_img(uploaded_file_image, target_size=(224, 224))
    st.image(uploaded_file_image, caption="Uploaded Image", use_column_width=True)
    img_array = image.img_to_array(img)
    expanded_img_array = np.expand_dims(img_array, axis=0)
    preprocessed_img = preprocess_input(expanded_img_array)
    result = model_image.predict(preprocessed_img).flatten()
    normalized_result = result / norm(result)

    # Find the nearest neighbors of the image using euclidean distance
    neighbors = NearestNeighbors(n_neighbors=3, algorithm='auto', metric='euclidean')
    normalized_result = normalized_result.reshape(1, -1)
    neighbors.fit(feature_list)
    indices = neighbors.kneighbors(normalized_result)[1].flatten()

    # Display recommended images along with their respective listing URLs
    st.write("Recommended Images and Listing URLs:")
    for idx in indices:
        x = filenames[idx].replace('/content/drive/MyDrive/', 'D:/UMBC/Sem3/DATA606/')  # Subject to change based on location
        x = x.replace(".jpg", "_0.jpg")
        parts = x.rsplit('/', 2)
        x = parts[0] + '/' + parts[2]
        print(x)
        temp_img = cv2.imread(x)
        temp_img_rgb = cv2.cvtColor(temp_img, cv2.COLOR_BGR2RGB)
        st.image(temp_img_rgb, use_column_width=True)

        try:
            # Extract the unique identifier from the image filename
            identifier = os.path.basename(filenames[idx])[0]

            # Retrieve the corresponding listing URL based on the identifier
            matching_listing = combined_data[combined_data['listing_url'].str.contains(identifier, case=False)]

            if not matching_listing.empty:
                listing_url = matching_listing['listing_url'].iloc[0]
                st.write(f"- {combined_data['name'].iloc[idx]}: {listing_url}")
            else:
                st.write("No matching listing URL found for this image.")
        except IndexError as e:
            print(f"IndexError: {e}")
