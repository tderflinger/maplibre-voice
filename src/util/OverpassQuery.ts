export interface POI {
  name: string;
  latitude: number;
  longitude: number;
}

/** @deprecated Use POI instead */
export type Park = POI;
export type Museum = POI;

async function queryOverpass(
  south: number, west: number, north: number, east: number,
  filter: string,
): Promise<POI[]> {
  const query = `
[out:json][bbox:${south},${west},${north},${east}];
(
  ${filter}
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

/**
 * Query the Overpass API for parks within a bounding box.
 * Returns only parks that have a non-empty name.
 */
export async function queryParks(
  south: number, west: number, north: number, east: number,
): Promise<Park[]> {
  return queryOverpass(south, west, north, east,
    `way["leisure"="park"];\n  relation["leisure"="park"];`
  );
}

/**
 * Query the Overpass API for museums within a bounding box.
 * Returns only museums that have a non-empty name.
 */
export async function queryMuseums(
  south: number, west: number, north: number, east: number,
): Promise<Museum[]> {
  return queryOverpass(south, west, north, east,
    `node["tourism"="museum"];\n  way["tourism"="museum"];\n  relation["tourism"="museum"];`
  );
}
