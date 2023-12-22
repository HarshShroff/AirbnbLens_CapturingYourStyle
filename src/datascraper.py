"""
Author: Harsh Shroff
Date: 12/22/2023

This script downloads and organizes Airbnb listing images based on the provided CSV files. 
It uses concurrent.futures to download images in parallel and handles errors, such as invalid URLs or network issues.

Dependencies:
- pandas
- geopy
- logging
- validators
- retrying
- concurrent.futures
- os
- requests
- glob
"""

import concurrent.futures
import pandas as pd
import os
import requests
import glob
from geopy.geocoders import Nominatim
import logging
import validators
from retrying import retry  # Import the retry function

# Configure logging to save messages to a file
logging.basicConfig(filename='download_errors.log', level=logging.ERROR, format='%(asctime)s - %(levelname)s - %(message)s')

# Get CSV files list from a folder
path = r'/data'
csv_files = glob.glob(os.path.join(path, "*.csv"))

# Create an empty DataFrame to store the merged data
merged_df = pd.DataFrame()

# Loop through the CSV files and merge them into the merged_df
for csv_file in csv_files:
    df = pd.read_csv(csv_file)
    merged_df = pd.concat([merged_df, df], ignore_index=True)

geolocator = Nominatim(user_agent="my_geocoder")

# Select a subset of the DataFrame for processing (adjust as needed)
merged_df = merged_df['id'][906661052699006247:]
print(merged_df)

# Function to get state from lat-long with retry and rate limiting
@retry(wait_fixed=2000, stop_max_attempt_number=3)  # Retry with a fixed delay of 2 seconds, up to 3 times
def get_state_from_lat_long(lat, lon):
    location = geolocator.reverse(f"{lat}, {lon}", exactly_one=True, timeout=10)  # Increase timeout
    if location:
        address = location.raw['address']
        state = address.get('state', 'N/A')
        return state
    else:
        return 'N/A'

# Create a directory to store images
image_directory = 'airbnb_images'
if not os.path.exists(image_directory):
    os.makedirs(image_directory)

# Function to download and save images
def download_and_save_images(row):
    latitude = row['latitude']
    longitude = row['longitude']
    print(latitude, longitude)

    try:
        # Get the state from latitude and longitude (with retry)
        state = get_state_from_lat_long(latitude, longitude)

        # Create a directory for the state if it doesn't exist
        state_directory = os.path.join(image_directory, state)
        if not os.path.exists(state_directory):
            os.makedirs(state_directory)

        picture_urls = str(row['picture_url'])
        for i, photo_url in enumerate(picture_urls.split(',')):
            if validators.url(photo_url.strip()):
                response = requests.get(photo_url.strip())
                if response.status_code == 200:
                    id = row['id']
                    with open(os.path.join(state_directory, f'{id}_{i}.jpg'), 'wb') as img_file:
                        img_file.write(response.content)
                        print(f'Saved {id}_{i}.jpg')
                else:
                    error_message = f"Failed to download image {i} for listing {row['id']}"
                    print(error_message)
                    logging.error(error_message)
            else:
                invalid_url_message = f"Invalid URL: {photo_url.strip()} for listing {row['id']}"
                print(invalid_url_message)
                logging.error(invalid_url_message)

    except Exception as e:
        error_message = f"Error processing listing {row['id']}: {str(e)}"
        print(error_message)
        logging.error(error_message)

# Use concurrent.futures to download images in parallel
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(download_and_save_images, row) for _, row in merged_df.iterrows()]

# Wait for all futures to complete
concurrent.futures.wait(futures)

print("Images have been scraped and organized by state.")
