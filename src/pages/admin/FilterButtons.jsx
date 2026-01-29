import React from 'react';

const FilterButtons = ({ filterConfig, filterStatus, setFilterStatus }) => (
  <div className="filter-container">
    {Object.entries(filterConfig).map(([key, { label }]) => (
      <button
        key={key}
        className={`filter-btn ${filterStatus === key ? 'filter-btn-active' : ''}`}
        onClick={() => setFilterStatus(key)}
      >
        {label}
      </button>
    ))}
  </div>
);

export default FilterButtons;