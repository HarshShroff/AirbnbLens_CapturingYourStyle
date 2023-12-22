"""
Author: Harsh Shroff
Date: 12/22/2023

This Streamlit script implements a House Listing Recommender System based on text descriptions using TF-IDF, TruncatedSVD, and k-NN models.

Dependencies:
- pandas
- sklearn
- streamlit
- os
"""

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import Normalizer
from sklearn.neighbors import NearestNeighbors
import streamlit as st
import os

# Set the data directory path
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

# Text Preprocessing
tfidf_vectorizer = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf_vectorizer.fit_transform(combined_data['description'].fillna(''))

# Dimensionality reduction for efficiency
svd = TruncatedSVD(n_components=100)
normalizer = Normalizer()
lsa = make_pipeline(svd, normalizer)
tfidf_matrix = lsa.fit_transform(tfidf_matrix)

# Train a k-NN model
knn_model_text = NearestNeighbors(n_neighbors=3, algorithm='brute', metric='cosine')
knn_model_text.fit(tfidf_matrix)

# Streamlit Web App
st.title("House Listing Recommender")

# Text Recommendation Section
user_input = st.text_area("Enter your preferences and requirements:")

if user_input:
    # Preprocess user input
    user_tfidf = tfidf_vectorizer.transform([user_input])
    user_tfidf = lsa.transform(user_tfidf)

    # Find nearest neighbors
    _, indices = knn_model_text.kneighbors(user_tfidf, n_neighbors=3)

    # Display recommended listings
    st.subheader("Recommended House Listings:")
    for idx in indices.flatten():
        if idx < len(combined_data):
            st.write(f"- {combined_data['name'].iloc[idx]}: {combined_data['listing_url'].iloc[idx]}")
