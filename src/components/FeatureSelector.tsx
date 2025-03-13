import React, { useState } from "react";
import "./FeatureSelector.scss";

interface FeatureSelectorProps {
  features: any[];
  onSelectFeature: (feature: any) => void;
  onResetView: () => void;
}

const FeatureSelector: React.FC<FeatureSelectorProps> = ({ features, onSelectFeature, onResetView }) => {
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filteredStartDate, setFilteredStartDate] = useState<string>("");
  const [filteredEndDate, setFilteredEndDate] = useState<string>("");

  // Filter features based on date range
  const filteredFeatures = features.filter((feature) => {
    const featureDate = feature.properties.datetime; // Assuming datetime is stored in the properties
    return (
      (!filteredStartDate || new Date(featureDate) >= new Date(filteredStartDate)) &&
      (!filteredEndDate || new Date(featureDate) <= new Date(filteredEndDate))
    );
  });

  const handleSelect = (feature: any) => {
    if (selectedFeatureId === feature.id) {
      // If the feature is already selected, reset the map view
      setSelectedFeatureId(null);
      onSelectFeature(null);
      onResetView(); // Reset the map view
    } else {
      // Otherwise, select the feature and update the map
      setSelectedFeatureId(feature.id);
      onSelectFeature(feature);
    }
  };

  const handleReset = () => {
    setSelectedFeatureId(null);
    onSelectFeature(null);
    onResetView();
    setStartDate("");
    setEndDate("");
    setFilteredStartDate("");
    setFilteredEndDate("");
  };

  const handleApplyDateFilter = () => {
    setFilteredStartDate(startDate);
    setFilteredEndDate(endDate);
    
    // Reset the map view if a feature is selected
    if (selectedFeatureId) {
      onResetView();
      setSelectedFeatureId(null); // Deselect the feature
      onSelectFeature(null); // Update the feature selector
    }
  };

  return (
    <div className="feature-selector">
      <div className="feature-list">
        {filteredFeatures.map((feature) => (
          <div
            key={feature.id}
            className={`feature-card ${selectedFeatureId === feature.id ? "selected" : ""}`}
            onClick={() => handleSelect(feature)}
          >
            {feature.id}
          </div>
        ))}
      </div>

      <div className="date-filter">
        <label>Start Date:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label>End Date:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button onClick={handleApplyDateFilter}>Set Date Filter</button>
      </div>

      <button className="reset-button" onClick={handleReset}>Reset Map View</button>
    </div>
  );
};

export default FeatureSelector;
