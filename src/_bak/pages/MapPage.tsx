import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import STACMap from "../components/STACMap";
import InfoPanel from "../components/InfoPanel";
import FeatureSelector from "../components/FeatureSelector";
import CopyUrlComponent from "../components/CopyUrlComponent";
import { fetchSTACCollection, fetchSTACItems } from "../utils/stacUtils";
import { resetMapView } from "../utils/mapUtils";
import "./MapPage.scss";

interface CollectionData {
  title: string;
  description?: string;
  id: string;
  // Add other properties based on the response structure from `fetchSTACCollection`
}

const App: React.FC = () => {
  const [features, setFeatures] = useState<any[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);
  const [stacBounds, setStacBounds] = useState<L.LatLngBounds | null>(null);
  const [collectionData, setCollectionData] = useState<CollectionData | null>(null); // Updated to object type
  const [collectionUrl, setCollectionUrl] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Retrieve the collectionID from the URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const collection = urlParams.get("collectionID") || "STAC Browser"; // Default if no collectionID is provided

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        // Fetch collection data and destructure it
        const { collectionData, collectionUrl } = await fetchSTACCollection(collection);
        setCollectionData(collectionData); // Set collection data
        const { data, collectionUrl: itemCollectionUrl } = await fetchSTACItems(collection);
        setFeatures(data.features || []); // Set items data
        setCollectionUrl(itemCollectionUrl || collectionUrl); // Set the collection URL
      } catch (error) {
        console.error(error);
      }
    };

    loadFeatures();
  }, [collection]); // This effect runs once when the collection changes

  return (
    <div id="map-page-container">
      <div id="app-header">
        <a id="home-button" href="/">Home</a>
        <h1>Collection: {collectionData?.title}</h1> {/* Updated to handle undefined state */}
        <CopyUrlComponent url={collectionUrl || ""} />
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
            stacCollectionID={collection || ""}
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
