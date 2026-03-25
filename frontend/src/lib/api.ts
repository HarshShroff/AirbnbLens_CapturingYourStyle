import { SearchResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const REQUEST_TIMEOUT = 15_000;

let activeController: AbortController | null = null;

function getController(): AbortController {
  if (activeController) {
    activeController.abort();
  }
  activeController = new AbortController();
  return activeController;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = getController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function cancelActiveRequests(): void {
  if (activeController) {
    activeController.abort();
    activeController = null;
  }
}

export async function searchText(
  query: string,
  city?: string
): Promise<SearchResponse> {
  const params = new URLSearchParams({ query });
  if (city) params.set("city", city);

  const res = await fetchWithTimeout(`${API_URL}/search/text?${params}`, {
    method: "POST",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Search failed (${res.status})`);
  }

  return res.json();
}

export async function searchImage(
  file: File,
  city?: string
): Promise<SearchResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const params = city ? `?city=${encodeURIComponent(city)}` : "";
  const res = await fetchWithTimeout(`${API_URL}/search/image${params}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Image search failed (${res.status})`);
  }

  return res.json();
}

export async function searchSimilar(
  listingId: string,
  targetCity?: string
): Promise<SearchResponse> {
  const params = new URLSearchParams({ listing_id: listingId });
  if (targetCity) params.set("target_city", targetCity);

  const res = await fetchWithTimeout(`${API_URL}/search/similar?${params}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Similarity search failed (${res.status})`);
  }

  return res.json();
}
