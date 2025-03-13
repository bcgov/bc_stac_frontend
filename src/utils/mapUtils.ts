import L from 'leaflet';
import "leaflet-draw";
import { initializeSTACLayers, fetchSTACCollection } from "./stacUtils";

// Define constants related to map boundaries and zoom
export const southWest: L.LatLng = L.latLng(40, -150);
export const northEast: L.LatLng = L.latLng(65, -100);
export const bounds: L.LatLngBounds = L.latLngBounds(southWest, northEast);
export const maxZoomNum: number = 15;
export const minZoomNum: number = 5;

// Initialize the map with necessary layers and controls
export const initializeMap = async (mapContainerRef: HTMLDivElement | null, stacCollectionID: any, mapRef: React.RefObject<L.Map | null>) => {
  if (!mapContainerRef || mapRef.current) return;

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

  const stacCollection = await fetchSTACCollection(stacCollectionID);
  let stacBounds: L.LatLngBounds | null = null;

  // Draw the bounding box of the entire STAC collection
  if (stacCollection.extent.spatial.bbox[0]) {
    const bboxCorners: L.LatLngBoundsExpression = [
      [stacCollection.extent.spatial.bbox[0][1], stacCollection.extent.spatial.bbox[0][0]] as L.LatLngTuple, // SW
      [stacCollection.extent.spatial.bbox[0][3], stacCollection.extent.spatial.bbox[0][2]] as L.LatLngTuple, // NE
    ];
    L.rectangle(bboxCorners, { color: "black", weight: 4, fillOpacity: 0 }).addTo(mapInstance);

    // Fit the map view to the STAC bounding box
    mapInstance.fitBounds(bboxCorners);

    // Set the stacBounds
    stacBounds = L.latLngBounds(bboxCorners);
  }

  initializeSTACLayers(mapInstance)

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
  mapInstance.on(L.Draw.Event.CREATED, (e: any) => {
    const layer = e.layer;
    drawnItems.addLayer(layer);
  });

  mapRef.current = mapInstance;
  return stacBounds;
};

// Track the currently selected feature layer
let selectedFeatureLayer: L.Layer | null = null;

// Fit the map to a selected feature's bounding box and add image overlays if necessary
export const updateMapWithSelectedFeature = (selectedFeature: any, mapRef: React.RefObject<L.Map | null>) => {
  if (!mapRef.current || !selectedFeature) return;

  const map = mapRef.current;
  const assets = selectedFeature.assets;
  const featBounds = L.latLngBounds(
    [selectedFeature.bbox[1], selectedFeature.bbox[0]], 
    [selectedFeature.bbox[3], selectedFeature.bbox[2]]
  );

  // Remove previous feature highlight if it exists
  if (selectedFeatureLayer) {
    map.removeLayer(selectedFeatureLayer);
  }

  // Draw and highlight the selected feature
  const featureLayer = L.rectangle(featBounds, { color: "red", weight: 3, fillOpacity: 0.4 }).addTo(map);
  selectedFeatureLayer = featureLayer; // Store reference

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
  ) => {
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