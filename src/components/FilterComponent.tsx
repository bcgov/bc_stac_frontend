import React, { useState } from "react";
import "./FilterComponent.scss";

interface FilterProps {
  onFilterChange: (startDate: string, endDate: string) => void;
  onResetFilter: () => void; // New prop for reset functionality
}

const FilterComponent: React.FC<FilterProps> = ({ onFilterChange, onResetFilter }) => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  const handleApplyFilter = () => {
    onFilterChange(startDate, endDate);
  };

  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    onResetFilter();
  };

  return (
    <div className="date-filter-container">
      <h3>Date Filter</h3>
      <label htmlFor="start-date">Start Date:</label>
      <input type="date" id="start-date" value={startDate} onChange={handleStartDateChange} />

      <label htmlFor="end-date">End Date:</label>
      <input type="date" id="end-date" value={endDate} onChange={handleEndDateChange} />

      <button onClick={handleApplyFilter}>Apply Date Filter</button>
      <button onClick={handleResetFilter} className="reset-button">Reset Filter</button>
    </div>
  );
};

export default FilterComponent;