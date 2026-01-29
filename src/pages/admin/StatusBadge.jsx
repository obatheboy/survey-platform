import React from 'react';

const StatusBadge = ({ status, statusMap }) => {
  const { label, className } = statusMap[status] || { label: status, className: '' };
  return <span className={`status-badge ${className}`}>{label}</span>;
};

export default StatusBadge;