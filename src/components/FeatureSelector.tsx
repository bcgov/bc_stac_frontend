import React, { useState } from "react";
import "./FeatureSelector.scss";
import { feature } from "turf";

interface FeatureSelectorProps {
  features: any[];
  onSelectFeature: (feature: any) => void;
  onResetView: () => void;
}

const FeatureSelector: React.FC<FeatureSelectorProps> = ({ features, onSelectFeature, onResetView }) => {
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

  // date fields (temporary values before applying the date filter)
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // apply date filters when user clicks "Set Date Filter"
  const [filteredStartDate, setFilteredStartDate] = useState<string>("");
  const [filteredEndDate, setFilteredEndDate] = useState<string>("");

  // Filter features based on date range
  const filteredFeatures = features.filter((feature) => {
    const featureDate = new Date(feature.properties.datetime);
    const start = filteredStartDate ? new Date(filteredStartDate) : null;
    const end = filteredEndDate ? new Date(filteredEndDate) : null;

    return (!start || featureDate >= start) && (!end || featureDate <= end);
  });

  const handleSelect = (feature: any) => {
    if (selectedFeatureId === feature.id) {
      // If already selected, reset the selection
      setSelectedFeatureId(null);
      onSelectFeature(null);
      onResetView();
    } else {
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
