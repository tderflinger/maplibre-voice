import { Mistral } from "@mistralai/mistralai";

export interface POI {
  name: string;
  latitude: number;
  longitude: number;
}

/** @deprecated Use POI instead */
export type Park = POI;
export type Museum = POI;

const CHAT_MODEL = "devstral-2512"; //"mistral-small-latest";

/**
 * Strip Overpass QL comments (// line comments and /* block comments).
 */
function stripComments(query: string): string {
  return query
    .replace(/\/\*[\s\S]*?\*\//g, "")   // block comments
    .replace(/\/\/.*$/gm, "")            // line comments
    .trim();
}

/**
 * Execute a raw Overpass QL query and return named POIs.
 */
async function executeOverpassQuery(query: string): Promise<POI[]> {
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
    .filter((el: any) => (el.center || (el.lat && el.lon)) && el.tags?.name?.trim())
    .map((el: any) => ({
      name: el.tags.name,
      latitude: el.center?.lat ?? el.lat,
      longitude: el.center?.lon ?? el.lon,
    }));
}

/**
 * Build a bbox‑scoped Overpass query from a filter expression and execute it.
 */
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
  return executeOverpassQuery(query);
}

/**
 * Query the Overpass API for parks within a bounding box.
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
 */
export async function queryMuseums(
  south: number, west: number, north: number, east: number,
): Promise<Museum[]> {
  return queryOverpass(south, west, north, east,
    `node["tourism"="museum"];\n  way["tourism"="museum"];\n  relation["tourism"="museum"];`
  );
}

/**
 * Use Mistral to generate an Overpass query from a natural‑language prompt,
 * then execute it and return the matching POIs.
 *
 * @param client  – Mistral client instance
 * @param userPrompt – free‑text description, e.g. "Show me all zoos"
 * @param south/west/north/east – bounding box of the current map view
 */
export async function queryWithMistral(
  client: Mistral,
  userPrompt: string,
  south: number,
  west: number,
  north: number,
  east: number,
): Promise<POI[]> {
  const chatResponse = await client.chat.complete({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an OpenStreetMap Overpass Turbo programmer. " +
          "Generate a query for the following user prompt. " +
          "Only output the raw Overpass QL query — no explanation, no markdown fences. " +
          `Use the bounding box: [bbox:${south},${west},${north},${east}]. ` +
          'Always use [out:json] and end with "out center;".',
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const raw = chatResponse.choices?.[0]?.message?.content ?? "";

  // Remove markdown code fences the LLM may wrap the query in
  const fenced = typeof raw === "string"
    ? raw.replace(/```[a-z]*\n?/g, "").replace(/```/g, "")
    : String(raw);

  const query = stripComments(fenced);
  console.log("Mistral-generated Overpass query:\n", query);

  return executeOverpassQuery(query);
}

