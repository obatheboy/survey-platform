import { useState, useEffect, useMemo } from 'react';

export function useAdminTable({
  fetchData,
  approveData,
  rejectData,
  deleteBulkData,
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
  const [selectedIds, setSelectedIds] = useState(new Set());

  const fetchItems = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await fetchData();
      setItems(res.data);
      setSelectedIds(new Set());
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

  const handleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(filteredItems.map((item) => item.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const deleteSelectedItems = async () => {
    if (selectedIds.size === 0) {
      setFailureMessage('No items selected.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} selected item(s)?`)) {
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setFailureMessage('');

    try {
      const idsToDelete = Array.from(selectedIds);
      await deleteBulkData(idsToDelete);
      setItems((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));
      setSelectedIds(new Set());
      setSuccessMessage(`${idsToDelete.length} item(s) deleted successfully.`);
    } catch (err) {
      setFailureMessage(err.response?.data?.message || 'Bulk delete failed.');
    } finally {
      setLoading(false);
    }
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
    selectedIds,
    handleSelectOne,
    handleSelectAll,
    deleteSelectedItems,
  };
}