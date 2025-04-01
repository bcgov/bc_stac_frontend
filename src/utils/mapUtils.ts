import L from 'leaflet';
import 'leaflet-draw';
import { fetchSTACCollections, fetchSTACItems } from './stacUtils';
import { Feature } from 'geojson';

export const southWest: L.LatLng = L.latLng(40, -150);
export const northEast: L.LatLng = L.latLng(65, -100);
export const bounds: L.LatLngBounds = L.latLngBounds(southWest, northEast);
export const maxZoomNum: number = 15;
export const minZoomNum: number = 5;

export const originalFeatureStyles = new Map<L.Layer, any>();
const selectedFeatures: Set<Feature> = new Set();

export const polygonStyle = {
  color: "#003366",
  weight: 2,
  opacity: 1,
  fillColor: "#002D5B",
  fillOpacity: 0.5,
};

export const selectionStyle = {
  color: "#FF0000",
  weight: 3,
  opacity: 1,
  fillColor: "#A52A2A",
  fillOpacity: 0.6,
};

export const initializeMap = async (
  mapContainerRef: HTMLDivElement | null,
  stacCollectionID: string,
  setSelectedFeatures: React.Dispatch<React.SetStateAction<Set<Feature>>>
): Promise<{ map: L.Map | null, bounds: L.LatLngBounds | null, stacLayer: L.Layer | null, selectedFeatures: Set<Feature> }> => {
  if (!mapContainerRef) return { map: null, bounds: null, stacLayer: null, selectedFeatures: new Set() };

  const mapInstance = L.map(mapContainerRef, {
    maxBounds: bounds,
    maxZoom: maxZoomNum,
    minZoom: minZoomNum,
  }).setView([54, -125], 5);

  const cartoBasemap = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
    }
  );
  cartoBasemap.addTo(mapInstance);

  const drawnItems = new L.FeatureGroup();
  mapInstance.addLayer(drawnItems);

  let stacBounds: L.LatLngBounds | null = null;

  try {
    const { collectionData } = await fetchSTACCollections(stacCollectionID);
    const bbox = collectionData.extent.spatial.bbox[0];

    if (bbox) {
      const bboxCorners: L.LatLngBoundsExpression = [
        [bbox[1], bbox[0]],
        [bbox[3], bbox[2]],
      ];
      L.rectangle(bboxCorners, { color: 'black', weight: 4, fillOpacity: 0 }).addTo(mapInstance);
      mapInstance.fitBounds(bboxCorners);
      stacBounds = L.latLngBounds(bboxCorners);
    }

    // Fetch STAC items and create GeoJSON layer
    const { layer: stacLayer, selectedFeatures } = await initializeGeoJSONLayer(mapInstance, stacCollectionID, setSelectedFeatures);
    const currentStyle = (stacLayer as L.GeoJSON).options.style;

    const drawControl = new L.Control.Draw({
      draw: { rectangle: {}, polyline: false, polygon: false, circle: false, marker: false, circlemarker: false }
    });
    mapInstance.addControl(drawControl);

    mapInstance.on('draw:created', (e: L.DrawEvents.Created) => {
      const layer = e.layer;
      
      if (layer instanceof L.Rectangle) {
        const bounds = layer.getBounds();
        (stacLayer as L.GeoJSON).eachLayer((featureLayer: L.Layer) => {
          if ('feature' in featureLayer) {
            const feature = featureLayer.feature;
    
            if (featureLayer instanceof L.Polygon) {
              if (featureLayer.options.interactive && bounds.intersects(featureLayer.getBounds())) {
                selectedFeatures.add(feature as Feature);
                featureLayer.setStyle(selectionStyle);
              }
            }
          }
        });

        // Update the selected features state
        setSelectedFeatures(new Set(selectedFeatures));
        console.log('Selected features by rectangle:', selectedFeatures);
      }
    });

    const resetViewButton = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        const button = L.DomUtil.create('button', 'reset-view-button');
        button.innerHTML = 'Reset View';
        button.style.color = '#000';
        button.style.backgroundColor = '#fff';
        button.style.border = '1px solid #ccc';
        button.style.padding = '5px';
        button.style.cursor = 'pointer';
    
        L.DomEvent.on(button, 'click', () => {
          if (stacBounds) {
            mapInstance.fitBounds(stacBounds);
          }
        });
    
        return button;
      },
    });
    
    const resetView = new resetViewButton();
    resetView.addTo(mapInstance);

    const ResetButton = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        const button = L.DomUtil.create('button', 'reset-button');
        button.innerHTML = 'Reset Selections';
        button.style.color = '#000';
        button.style.backgroundColor = '#fff';
        button.style.border = '1px solid #ccc';
        button.style.padding = '5px';
        button.style.cursor = 'pointer';
    
        L.DomEvent.on(button, 'click', () => {
          resetSelections(stacLayer as L.GeoJSON, selectedFeatures, originalFeatureStyles, currentStyle);
          // After reset, clear the selected features state
          setSelectedFeatures(new Set());
        });
    
        return button;
      },
    });

    const resetButton = new ResetButton();
    resetButton.addTo(mapInstance);

    return { map: mapInstance, bounds: stacBounds, stacLayer: stacLayer, selectedFeatures };
  } catch (error) {
    console.error('Error initializing map:', error);
    return { map: null, bounds: null, stacLayer: null, selectedFeatures: new Set() };
  }
};


// Function to initialize the GeoJSON layer and handle feature selection
export const initializeGeoJSONLayer = async (
  map: L.Map,
  stacCollectionID: string,
  setSelectedFeatures: React.Dispatch<React.SetStateAction<Set<Feature>>>
): Promise<{ layer: L.GeoJSON, selectedFeatures: Set<Feature> }> => {
  try {
    const { data } = await fetchSTACItems(stacCollectionID);
    const originalFeatures = data || [];

    if (originalFeatures.length === 0) {
      console.warn("No items found for collection:", stacCollectionID);
      return { layer: L.geoJSON([]), selectedFeatures: new Set() };
    }

    return createGeoJSONLayer(map, originalFeatures, setSelectedFeatures);
  } catch (error) {
    console.error('Error initializing STAC layers:', error);
    return { layer: L.geoJSON([]), selectedFeatures: new Set() };
  }
};

// Create the GeoJSON layer and manage feature selection
function createGeoJSONLayer(
  map: L.Map,
  features: Feature[],
  setSelectedFeatures: React.Dispatch<React.SetStateAction<Set<Feature>>>
): { layer: L.GeoJSON; selectedFeatures: Set<Feature> } {

  let selectedFeatures: Set<Feature> = new Set();

  const geoJSONLayer = L.geoJSON(features, {
    style: polygonStyle,
    onEachFeature: (feature, layer) => {
      if (layer instanceof L.Polygon) {
        layer.on("click", () => {
          if (selectedFeatures.has(feature)) {
            selectedFeatures.delete(feature);
            layer.setStyle(polygonStyle);
          } else {
            selectedFeatures.add(feature);
            layer.setStyle(selectionStyle);
          }

          // Trigger the state update to make the changes reactive
          setSelectedFeatures(new Set(selectedFeatures)); // Force a state update
        });
      }
    },
  }).addTo(map);

  if (features.length > 0) {
    map.fitBounds(geoJSONLayer.getBounds());
  }

  return { layer: geoJSONLayer, selectedFeatures };
}


// Reset selections function
export const resetSelections = (stacLayer: L.Layer, selectedFeatures: Set<Feature>, originalFeatureStyles: Map<L.Layer, any>, currentStyle: any) => {
  // Clear selected features
  selectedFeatures.clear();
  console.log('Cleared selected features', selectedFeatures);

  // Reset styles for all layers in the stacLayer
  (stacLayer as L.LayerGroup).eachLayer((featureLayer: L.Layer) => {
    if (featureLayer instanceof L.Polygon) {
      featureLayer.setStyle(originalFeatureStyles.get(featureLayer) || currentStyle);
    }
  });

  console.log('Reset selected features');
};