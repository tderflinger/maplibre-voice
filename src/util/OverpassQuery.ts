export interface Park {
  name: string;
  latitude: number;
  longitude: number;
}

/**
 * Query the Overpass API for parks within a bounding box.
 * Returns only parks that have a non-empty name.
 *
 * @param south - Southern latitude of the bounding box
 * @param west  - Western longitude of the bounding box
 * @param north - Northern latitude of the bounding box
 * @param east  - Eastern longitude of the bounding box
 */
export async function queryParks(
  south: number,
  west: number,
  north: number,
  east: number,
): Promise<Park[]> {
  const query = `
[out:json][bbox:${south},${west},${north},${east}];
(
  way["leisure"="park"];
  relation["leisure"="park"];
);
out center;
`;

  const response = await fetch(
    "https://overpass-api.de/api/interpreter",
    {
      method: "POST",
      body: "data=" + encodeURIComponent(query),
    }
  );

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return data.elements
    .filter((el: any) => el.center && el.tags?.name?.trim())
    .map((el: any) => ({
      name: el.tags.name,
      latitude: el.center.lat,
      longitude: el.center.lon,
    }));
}
