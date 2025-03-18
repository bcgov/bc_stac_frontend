import React from "react";
import CopyUrlComponent from "../components/CopyUrlComponent";

interface InfoPanelProps {
  selectedFeature: any | null;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ selectedFeature }) => {
  if (!selectedFeature) {
    return (
      <>
        <p>Select a feature from the dropdown on the left to see details.</p>
        <p>
          Click the <strong><i>Reset Map View</i></strong> button to clear the
          map and return to the default map view.
        </p>
      </>
    );
  }

  // Ensure selectedFeature.properties and selectedFeature.assets exist
  const { properties, assets, id, collection } = selectedFeature;
  const selectedFeatureUrl = selectedFeature.links.find((link: { rel: string; type: string; href: string }) => link.rel === "self").href
  
  // Handle datetime parsing safely
  const timestamp = properties?.datetime ? Date.parse(properties.datetime) : NaN;
  const dateObject = !isNaN(timestamp) ? new Date(timestamp) : null;
  const dateString = dateObject
    ? `${dateObject.getUTCFullYear()}-${dateObject.getUTCMonth() + 1}-${dateObject.getUTCDate()}`
    : "N/A";

  // Iterate through assets and generate links safely
  const assetLinks =
    assets && Object.keys(assets).length > 0 ? (
      <ul>
        {Object.entries(assets).map(([key, asset]: [string, any]) => (
          <li key={key}>
            <a href={asset.href} target="_blank" rel="noopener noreferrer">
              {key}
            </a>
          </li>
        ))}
      </ul>
    ) : (
      <p>No assets available</p>
    );

  return (
    <div id="feature-info">
      <h3>Feature Details</h3>
      <CopyUrlComponent url={selectedFeatureUrl} />
      <div>
        <p>
          <b>ID:</b> {id || "N/A"}
        </p>
        <p>
          <b>Title:</b> {properties?.title || "N/A"}
        </p>
        <p>
          <b>Datetime:</b> {dateString}
        </p>
        <p>
          <b>Collection:</b> {collection || "N/A"}
        </p>
      </div>
      <div>
        <b>Assets:</b>
        {assetLinks}
      </div>
    </div>
  );
};

export default InfoPanel;
