import { fetchJson } from "./http.js";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

export async function geocode(city) {
  const params = new URLSearchParams({
    name: city,
    count: "1",
    language: "en",
    format: "json",
  });

  const data = await fetchJson(`${GEOCODING_URL}?${params}`);

  // When nothing matches, the API leaves out "results" entirely
  if (!data.results || data.results.length === 0) {
    return null;
  }

  const place = data.results[0];
  return {
    name: place.name,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}