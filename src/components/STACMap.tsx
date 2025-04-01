import React, { useEffect } from "react";
import L from 'leaflet';
import { initializeMap } from "../utils/mapUtils";
import { Feature } from "geojson";

interface STACMapProps {
  stacCollectionID: string;
  setStacBounds: React.Dispatch<React.SetStateAction<L.LatLngBounds | null>>;
  mapRef: React.RefObject<L.Map | null>;
  setStacLayer: React.Dispatch<React.SetStateAction<L.Layer | null>>;
  setSelectedFeatures: React.Dispatch<React.SetStateAction<Set<Feature>>>;
}

const STACMap: React.FC<STACMapProps> = ({
  stacCollectionID,
  setStacBounds,
  mapRef,
  setStacLayer,
  setSelectedFeatures
}) => {
  useEffect(() => {
    let mapInstance: L.Map | null = null;

    const initialize = async () => {
      const { map, bounds, stacLayer, selectedFeatures } = await initializeMap(
        document.getElementById("map-container") as HTMLDivElement,
        stacCollectionID,
        setSelectedFeatures
      );

      if (map) {
        mapInstance = map;
        setStacBounds(bounds);
        setStacLayer(stacLayer);
        setSelectedFeatures(selectedFeatures);
        mapRef.current = mapInstance;
      }
    };

    initialize();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
        mapRef.current = null;
      }
    };
  }, [stacCollectionID, setStacBounds, mapRef, setStacLayer, setSelectedFeatures]);

  return null;
};

export default STACMap;
