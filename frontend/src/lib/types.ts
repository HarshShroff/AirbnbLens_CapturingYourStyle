export interface Listing {
  id: string;
  name: string;
  picture_url: string;
  listing_url?: string;
  price: string;
  neighborhood: string;
  city?: string;
  description?: string;
  matchScore?: number;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviews?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: string;
  property_type?: string;
  accommodates?: number;
}

export interface SearchResponse {
  query?: string;
  expanded_query?: string;
  results: Listing[];
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  db_connected: boolean;
  hf_available: boolean;
  collections: {
    airbnb_visuals: number;
    airbnb_metadata: number;
  };
}
