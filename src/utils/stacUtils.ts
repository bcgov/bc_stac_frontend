import L from "leaflet";

// URL for your STAC API
export const stac_url = "https://pgstac-backend.apps.silver.devops.gov.bc.ca/";
const request_origin = location.origin;

// Function to fetch the STAC collections
export async function fetchAllSTACCollections() {
  const collectionsUrl = `${stac_url}collections`;
  const response = await fetch(collectionsUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Origin": request_origin,
      "Access-Control-Request-Method": "GET",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch STAC data: ${response.statusText}`);
  }
  return await response.json();
}

// Function to fetch a specific STAC Collection based on Collection ID
export async function fetchSTACCollection(collectionId: string) {
  const collectionUrl = `${stac_url}collections/${collectionId}`;
  const response = await fetch(collectionUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Origin": request_origin,
      "Access-Control-Request-Method": "GET",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch STAC Collection data: ${response.statusText}`);
  }
  const data = await response.json();
  return { collectionData: data, collectionUrl };
}

// Function to fetch items for a given STAC Collection
export async function fetchSTACItems(
  collectionId: string,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
  bbox?: number[]
) {
  const params = new URLSearchParams({ limit: limit.toString() });

  if (startDate || endDate) {
    const datetime = `${startDate || ".."}/${endDate || ".."}`;
    params.append("datetime", datetime);
  }

  if (bbox) {
    params.append("bbox", bbox.join(","));
  } else {
    params.append("bbox", "-139.1,48.3,-114.0,60.0"); // Default BC bounding box
  }

  const collectionUrl = `${stac_url}collections/${collectionId}`;
  const itemsUrl = `${stac_url}collections/${collectionId}/items?${params.toString()}`;
  const response = await fetch(itemsUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Origin": request_origin,
      "Access-Control-Request-Method": "GET",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch STAC data: ${response.statusText}`);
  }

  const data = await response.json();
  return { data, collectionUrl };
}

// Function to create a Leaflet GeoJSON layer for each feature
export function createSTACLayerForFeature(feature: any): L.GeoJSON {
  if (!feature || !feature.geometry || !feature.properties) {
    throw new Error("Invalid feature data");
  }

  const props = feature.properties;
  const id = feature.id?.toString() || "Unknown";
  const collection = feature.collection?.toString() || "Unknown";
  const tileurl = feature.assets?.landcover?.href || "#";

  return L.geoJSON(feature, {
    onEachFeature: (feature: any, layer: L.Layer) => {
      layer.bindPopup(`
        <b>ID:</b> ${id}<br>
        <b>Collection:</b> ${collection}<br>
        <b>Datetime:</b> ${props?.["datetime"] || "N/A"}<br>
        <a href="${tileurl}" target="_blank">Tile URL</a>
      `);
    },
  });
}

// Function to initialize STAC layers based on the collection ID in the URL parameters
export async function initializeSTACLayers(map: L.Map) {
  try {
    // Get the collection ID from the URL parameters (e.g., ?collection=yourCollectionId)
    const urlParams = new URLSearchParams(window.location.search);
    const collectionId = urlParams.get("collectionID");

    if (!collectionId) {
      console.error("No collection ID found in URL parameters");
      return;
    }

    // Fetch items from the specified collection (gets both data & URL)
    const { data } = await fetchSTACItems(collectionId);
    const items = data.features || [];

    // Add layers for the fetched items
    for (const feature of items) {
      const layer = createSTACLayerForFeature(feature);
      layer.addTo(map);
    }
  } catch (error) {
    console.error("Error initializing STAC layers:", error);
  }
}
