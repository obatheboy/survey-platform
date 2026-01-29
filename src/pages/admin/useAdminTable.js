import { useState, useEffect, useMemo } from 'react';

export function useAdminTable({
  fetchData,
  approveData,
  rejectData,
  searchFields,
  filterConfig,
  initialFilterStatus = 'all',
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [failureMessage, setFailureMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(initialFilterStatus);

  const fetchItems = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await fetchData();
      setItems(res.data);
    } catch (err) {
      console.error('Fetch items error:', err);
      setError('Failed to load items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = async (id, actionFn, confirmMessage, successCb, errorMsg) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setProcessingId(id);
    setSuccessMessage('');
    setFailureMessage('');

    try {
      await actionFn(id);
      successCb(id);
    } catch (err) {
      setFailureMessage(err.response?.data?.message || errorMsg);
    } finally {
      setProcessingId(null);
    }
  };

  const approveItem = (id, successCb, confirmMessage = 'Approve this item?') => {
    handleAction(
      id,
      approveData,
      confirmMessage,
      (itemId) => {
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, status: 'APPROVED' } : item
          )
        );
        if (successCb) successCb(itemId);
      },
      'Approval failed'
    );
  };

  const rejectItem = (id, confirmMessage = 'Reject this item?') => {
    handleAction(
      id,
      rejectData,
      confirmMessage,
      (itemId) => {
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, status: 'REJECTED' } : item
          )
        );
        setSuccessMessage('❌ Item rejected.');
      },
      'Rejection failed'
    );
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        searchFields.some((field) =>
          String(item[field] || '').toLowerCase().includes(searchLower)
        );

      const currentFilter = filterConfig[filterStatus];
      const matchesStatus =
        !currentFilter ||
        currentFilter.value === 'all' ||
        item.status === currentFilter.value;

      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, filterStatus, searchFields, filterConfig]);

  return {
    items,
    loading,
    error,
    processingId,
    successMessage,
    setSuccessMessage,
    failureMessage,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    approveItem,
    rejectItem,
    filteredItems,
  };
}