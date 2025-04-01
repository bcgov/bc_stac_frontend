import React, { useState, useEffect } from "react";
import { Feature } from "geojson";
import CopyUrlComponent from "../components/CopyUrlComponent";
import "./InfoPanel.scss";
import L from "leaflet";

interface Asset {
  href: string;
  type: string;
  roles?: string[];
}

interface Provider {
  name: string;
  url?: string;
  description?: string;
}

interface FeatureWithAssets extends Feature {
  assets?: Record<string, Asset>;
  providers?: Provider[];
  collection?: string;
  links?: { rel: string; href: string }[];
}

interface InfoPanelProps {
  selectedFeatures: Set<FeatureWithAssets>;
  map: any;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-CA");
}

const InfoPanel: React.FC<InfoPanelProps> = ({ selectedFeatures, map }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [features, setFeatures] = useState<FeatureWithAssets[]>([]);

  useEffect(() => {
    setFeatures(Array.from(selectedFeatures));
    setCurrentPage(1);
  }, [selectedFeatures]);

  const handleNextPage = () => {
    if (currentPage < features.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleJumpToPage = (id: string) => {
    const featureIndex = features.findIndex(feature => feature.id === id);
    if (featureIndex !== -1) {
      setCurrentPage(featureIndex + 1);
    }
  };

  const getThumbnailUrl = (feature: FeatureWithAssets) => {
    return Object.values(feature.assets || {}).find(
      asset => asset.roles?.includes("thumbnail") && asset.type === "image/png"
    )?.href;
  };

  const selfHref = features[currentPage - 1]?.links?.find(link => link.rel === "self")?.href;

  const handlePanAndZoom = () => {
    const feature = features[currentPage - 1];
    console.log("Zoom", feature);
    if (feature && map) {
      if (feature.bbox) {
        const coords = feature.bbox;
        const bounds = L.latLngBounds(
          L.latLng(coords[1], coords[0]),  // Bottom-left corner (lat, lng)
          L.latLng(coords[3], coords[2])   // Top-right corner (lat, lng)
        );
        
        // Use fitBounds to automatically adjust zoom level
        map.fitBounds(bounds, {
          padding: [50, 50], // Optional padding for extra space around the bounds
        });
      }
    }
  };

  console.log("Selected features:", features);

  return (
    <div id="info-panel">
      <div className="info-header">
        <h3>Item Information</h3>
        {features.length > 0 && (
          <h4>Item {currentPage} of {features.length} selected</h4>
        )}
      </div>
    {features.length > 0 ? (
    <div className="info-content">
        <div className="feature-info">
          <h4>ID: {features[currentPage - 1]?.id}</h4>
          {getThumbnailUrl(features[currentPage - 1]) && (
            <div className="image-container">
              <img
                src={getThumbnailUrl(features[currentPage - 1])}
                alt="Feature thumbnail"
                className="feature-thumbnail"
              />
            </div>
          )}
          <div className ="feature-info-tombstone">
            <p><strong>Title: </strong>{features[currentPage - 1]?.properties?.title || "No title available"}</p>
            <p><strong>Content Date: </strong>{formatDate(features[currentPage - 1]?.properties?.datetime) || "No datetime available"}</p>
            <p><strong>Creation Date: </strong>{formatDate(features[currentPage - 1]?.properties?.created) || "No creation date available"}</p>
            <CopyUrlComponent url={selfHref || ""} title="Item URL: " />
          </div>
          <div className="assets-panel">
            <h4>Assets</h4>
            <ul>
              {Object.entries(features[currentPage - 1]?.assets || {}).map(([key, asset]) => (
                <li key={key}>
                  <a href={asset.href} target="_blank" rel="noopener noreferrer">
                    {asset.type}
                  </a>
                  <CopyUrlComponent url={asset.href || ""} title="" />
                </li>
              ))}
            </ul>
          </div>
          <div className="providers-panel">
            <h4>Providers</h4>
            <ul>
              {features[currentPage - 1]?.properties?.providers?.map((provider: Provider, index: number) => (
                <li key={index}>
                  {provider.url ? (
                    <a href={provider.url} target="_blank" rel="noopener noreferrer">
                      {provider.name}
                    </a>
                  ) : (
                    provider.name
                  )}
                  <p>{provider.description}</p>
                </li>
              )) || <p>No providers available.</p>}
            </ul>
          </div>
        </div>
        <div className="info-controls">
          <div className="jump-to-feature">
            <label htmlFor="feature-select">Jump to item:</label>
            <select
              id="feature-select"
              onChange={(e) => handleJumpToPage(e.target.value)}
              value={features[currentPage - 1]?.id || ""}
            >
              {features.map((feature) => (
                <option key={feature.id} value={feature.id}>
                  {feature.id}
                </option>
              ))}
            </select>
          </div>
          <div className="pagination-controls">
            <button onClick={handlePreviousPage} disabled={currentPage === 1}>
              Previous
            </button>
            <button onClick={handleNextPage} disabled={currentPage === features.length}>
              Next
            </button>
          </div>
          <div>
            <button onClick={handlePanAndZoom} className="zoom-button">
              Zoom to Feature
            </button>
          </div>
        </div>
        </div>
      ) : (
        <p>Select a feature to view its details here.</p>
      )}
    </div>
  );
};

export default InfoPanel;
