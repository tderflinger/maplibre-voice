export interface Coordinates {
  longitude: number;
  latitude: number;
}

/**
 * Geocode a place name using the Nominatim API.
 * Returns the coordinates of the first result, or null if not found.
 */
export async function geocode(place: string): Promise<Coordinates | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=geojson&limit=1`;
  try {
    const response = await fetch(url);
    const geojson = await response.json();

    if (geojson.features?.length > 0) {
      const [longitude, latitude] = geojson.features[0].geometry.coordinates;
      return { longitude, latitude };
    }
    return null;
  } catch (error) {
    console.error('Geocoding failed:', error);
    return null;
  }
}
