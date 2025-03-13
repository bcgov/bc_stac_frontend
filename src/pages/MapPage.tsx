import React, { useState, useEffect, useRef } from "react";
import L from 'leaflet';
import STACMap from "../components/STACMap";
import InfoPanel from "../components/InfoPanel";
import FeatureSelector from "../components/FeatureSelector";
import { fetchSTACItems } from "../utils/stacUtils";
import { resetMapView } from "../utils/mapUtils";  // Importing the utility function
import "./MapPage.scss";

const App: React.FC = () => {
  const [features, setFeatures] = useState<any[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);
  const [stacBounds, setStacBounds] = useState<L.LatLngBounds | null>(null); // Store the STAC collection bounds
  const mapRef = useRef<L.Map | null>(null);

  // Retrieve the itemID from the URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const collection = urlParams.get("collectionID") || "STAC Browser"; // Default if no itemID is provided

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const data = await fetchSTACItems(collection);
        setFeatures(data.features || []);
      } catch (error) {
        console.error(error);
      }
    };

    loadFeatures();
  }, [collection]);

  return (
    <div id="map-page-container">
      <div id="app-header">
        <a id="home-button" href="/">Home</a>
        <h1>Collection: {collection}</h1>
      </div>
      <div id="app-container">
        {/* Left Panel: Feature Selector */}
        <div id="selector-panel">
          <h2>Feature Selector</h2>
          <FeatureSelector 
            features={features} 
            onSelectFeature={setSelectedFeature} 
            onResetView={() => resetMapView(mapRef, setSelectedFeature, stacBounds)} 
          />
        </div>

        {/* Center: Always Visible Map */}
        <div id="map-container">
          <STACMap 
            selectedFeature={selectedFeature} 
            stacCollectionID={collection || { features: [], bbox: [] }} 
            mapRef={mapRef} 
            setStacBounds={setStacBounds}  // Pass function to update stacBounds
          />
        </div>

        {/* Right Panel: Selected Feature Info */}
        <div id="info-panel">
          <h2>Feature Information</h2>
          <InfoPanel selectedFeature={selectedFeature} />
        </div>
      </div>
    </div>
  );
};

export default App;
