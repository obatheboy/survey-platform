import React from 'react';

const ActionButtons = ({
  item,
  processingId,
  onApprove,
  onReject,
  approveText = '✓ Approve',
  rejectText = '✕ Reject',
}) => {
  const isProcessing = processingId === item.id;

  if (item.status === 'SUBMITTED' || item.status === 'PROCESSING') {
    return (
      <>
        <button
          onClick={onApprove}
          disabled={isProcessing}
          className="approve-btn"
        >
          {isProcessing ? '...' : approveText}
        </button>
        <button
          onClick={onReject}
          disabled={isProcessing}
          className="reject-btn"
        >
          {rejectText}
        </button>
      </>
    );
  }

  return (
    <span className="done-text">
      {item.status === 'APPROVED' ? '✓ Done' : '✕ Done'}
    </span>
  );
};

export default ActionButtons;