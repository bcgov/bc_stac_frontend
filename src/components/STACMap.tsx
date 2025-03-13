import React, { useEffect } from "react";
import L from 'leaflet';
import { initializeMap, updateMapWithSelectedFeature } from "../utils/mapUtils";

interface STACMapProps {
  selectedFeature: any;
  stacCollectionID: any;
  mapRef: React.RefObject<L.Map | null>;
  setStacBounds: (bounds: L.LatLngBounds | null) => void;  // New prop
}

const STACMap: React.FC<STACMapProps> = ({ selectedFeature, stacCollectionID, mapRef, setStacBounds }) => {
  useEffect(() => {
    initializeMap(document.getElementById("map-container") as HTMLDivElement, stacCollectionID, mapRef)
      .then(bounds => {
        if (bounds) setStacBounds(bounds); // Store STAC collection bounds
      });
  }, [stacCollectionID]);

  useEffect(() => {
    updateMapWithSelectedFeature(selectedFeature, mapRef);
  }, [selectedFeature]);

  return <div id="map-container"></div>;
};

export default STACMap;
