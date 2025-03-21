import L from 'leaflet';
import "leaflet-draw";
import { initializeSTACLayers, fetchSTACCollection } from "./stacUtils";

// Define constants related to map boundaries and zoom
export const southWest: L.LatLng = L.latLng(40, -150);
export const northEast: L.LatLng = L.latLng(65, -100);
export const bounds: L.LatLngBounds = L.latLngBounds(southWest, northEast);
export const maxZoomNum: number = 15;
export const minZoomNum: number = 5;

// Define the structure of the selectedFeature for type safety
interface SelectedFeature {
  assets: {
    rendered_preview?: {
      href: string;
    };
  };
  bbox: number[];
}

export const initializeMap = async (
  mapContainerRef: HTMLDivElement | null,
  stacCollectionID: string,
  mapRef: React.RefObject<L.Map | null>
): Promise<L.LatLngBounds | null> => {
  if (!mapContainerRef || mapRef.current) return null;

  const mapInstance = L.map(mapContainerRef, {
    maxBounds: bounds,
    maxZoom: maxZoomNum,
    minZoom: minZoomNum,
  });
  mapInstance.setView([54, -125], 5);

  // Add OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(mapInstance);

  let stacBounds: L.LatLngBounds | null = null;

  try {
    const { collectionData, collectionUrl } = await fetchSTACCollection(stacCollectionID);

    // Draw the bounding box of the entire STAC collection
    if (collectionData.extent.spatial.bbox[0]) {
      const bboxCorners: L.LatLngBoundsExpression = [
        [collectionData.extent.spatial.bbox[0][1], collectionData.extent.spatial.bbox[0][0]], // SW
        [collectionData.extent.spatial.bbox[0][3], collectionData.extent.spatial.bbox[0][2]], // NE
      ];
      L.rectangle(bboxCorners, { color: "black", weight: 4, fillOpacity: 0 }).addTo(mapInstance);

      // Fit the map view to the STAC bounding box
      mapInstance.fitBounds(bboxCorners);

      // Set the stacBounds
      stacBounds = L.latLngBounds(bboxCorners);
    }

    initializeSTACLayers(mapInstance);

  } catch (error) {
    console.error('Error fetching STAC collection:', error);
  }

  // Initialize Leaflet Draw control
  const drawnItems = new L.FeatureGroup();
  mapInstance.addLayer(drawnItems);

  const drawControl = new L.Control.Draw({
    edit: {
      featureGroup: drawnItems,
      edit: false,
    },
    draw: {
      polygon: {
        allowIntersection: false,
        showArea: true,
      },
      polyline: false,
      rectangle: {},
      circle: false,
      marker: false,
      circlemarker: false,
    },
  });

  drawControl.setPosition("topright");
  mapInstance.addControl(drawControl);

  // Listen for the draw:created event to add shapes to the map
  mapInstance.on(L.Draw.Event.CREATED, (e: L.DrawEvents.Created) => {
    const layer = e.layer;
    drawnItems.addLayer(layer);
  });

  mapRef.current = mapInstance;
  return stacBounds;
};

// Track the currently selected feature layer
let selectedFeatureLayer: L.Layer | null = null;

// Fit the map to a selected feature's bounding box and add image overlays if necessary
export const updateMapWithSelectedFeature = (
  selectedFeature: SelectedFeature | null,
  mapRef: React.RefObject<L.Map | null>
): void => {
  if (!mapRef.current || !selectedFeature) return;

  const map = mapRef.current;
  const { assets, bbox } = selectedFeature;
  const featBounds = L.latLngBounds(
    [bbox[1], bbox[0]], // SW
    [bbox[3], bbox[2]]  // NE
  );

  // Remove previous feature highlight if it exists
  if (selectedFeatureLayer) {
    map.removeLayer(selectedFeatureLayer);
  }

  // Draw and highlight the selected feature
  const featureLayer = L.rectangle(featBounds, { color: "red", weight: 3, fillOpacity: 0.4 }).addTo(map);
  selectedFeatureLayer = featureLayer; // Store reference

  // Add image overlay if it exists
  if (assets?.rendered_preview) {
    L.imageOverlay(assets.rendered_preview.href, featBounds).addTo(map);
  }

  map.fitBounds(featBounds);
};

// Function to reset the map view
export const resetMapView = (
  mapRef: React.RefObject<L.Map | null>,
  setSelectedFeature: React.Dispatch<React.SetStateAction<any | null>>,
  stacBounds: L.LatLngBounds | null
): void => {
  if (mapRef.current && stacBounds) {
    const map = mapRef.current;
    map.fitBounds(stacBounds); // Reset to STAC collection bounds
    setSelectedFeature(null);  // Clear selected feature

    // Remove the highlighted feature layer
    if (selectedFeatureLayer) {
      map.removeLayer(selectedFeatureLayer);
      selectedFeatureLayer = null;
    }
  }
};
