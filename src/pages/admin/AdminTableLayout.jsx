import React from 'react';
import SearchInput from './SearchInput';
import FilterButtons from './FilterButtons';

const AdminTableLayout = ({
  header,
  filterConfig,
  filterStatus,
  setFilterStatus,
  searchTerm,
  setSearchTerm,
  searchInputPlaceholder,
  successMessage,
  failureMessage,
  loading,
  error,
  items,
  children,
}) => {
  if (loading) return <p className="loading-text">{header.loadingText}</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>{header.title}</h2>
        <p>{header.stats(items)}</p>
      </div>

      {successMessage && (
        <div className="response-message success-message">{successMessage}</div>
      )}
      {failureMessage && (
        <div className="response-message error-message">{failureMessage}</div>
      )}

      <div className="search-section">
        <SearchInput
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder={searchInputPlaceholder}
        />
        <FilterButtons
          filterConfig={filterConfig}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />
      </div>

      {children}
    </div>
  );
};

export default AdminTableLayout;