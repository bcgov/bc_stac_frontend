// URL constants
export const stac_url = "https://pgstac-backend.apps.silver.devops.gov.bc.ca/";
const request_origin = location.origin;

// Reusable fetch headers
const fetchHeaders = {
  "Content-Type": "application/json",
  "Origin": request_origin,
  "Access-Control-Request-Method": "GET",
};

export async function fetchSTACCatalog() {
  try {
    const url = stac_url;
    const response = await fetch(url, { method: "GET", headers: fetchHeaders });

    if (!response.ok) {
      throw new Error(`Failed to fetch STAC catalog: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { data, url };
  } catch (error) {
    console.error("Error fetching STAC catalog:", error);
    throw error;
  }
}

export async function fetchSTACCollections(collectionId?: string) {
  const url = collectionId
    ? `${stac_url}collections/${collectionId}`
    : `${stac_url}collections`;

  try {
    const response = await fetch(url, { method: "GET", headers: fetchHeaders });

    if (!response.ok) {
      throw new Error(`Failed to fetch STAC collections: ${response.statusText}`);
    }

    const data = await response.json();
    return collectionId ? { collectionData: data, collectionUrl: url } : data;
  } catch (error) {
    console.error("Error fetching STAC collections:", error);
    throw error;
  }
}

export async function fetchSTACItems(
  collectionId: string,
  filterCallback?: (item: any) => boolean
) {
  let allItems: any[] = [];
  let nextPage: string | null = null;
  const params = new URLSearchParams();

  try {
    // Loop to handle pagination
    do {
      const itemsUrl = nextPage ?? `${stac_url}collections/${collectionId}/items?${params.toString()}`;
      const response = await fetch(itemsUrl, { method: "GET", headers: fetchHeaders });

      if (!response.ok) {
        throw new Error(`Failed to fetch STAC items: ${response.statusText}`);
      }

      const data = await response.json();
      let items = data.features;

      if (filterCallback) {
        items = items.filter(filterCallback);
      }

      allItems = [...allItems, ...items];
      nextPage = data.links?.find((link: any) => link.rel === "next")?.href || null;
    } while (nextPage);

    return { data: allItems };
  } catch (error) {
    console.error("Error fetching STAC items:", error);
    throw error;
  }
}