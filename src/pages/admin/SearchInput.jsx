import React from 'react';

const SearchInput = ({ searchTerm, setSearchTerm, placeholder }) => (
  <div className="search-container">
    <input
      type="text"
      placeholder={placeholder}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="search-input"
    />
  </div>
);

export default SearchInput;