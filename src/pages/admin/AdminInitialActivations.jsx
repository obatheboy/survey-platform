import { useState, useEffect } from "react";
import { 
  getPendingInitialActivations, 
  getAllInitialActivations,
  approveInitialActivation,
  rejectInitialActivation 
} from "../../api/adminApi";
import "./Admin.css";
import StatusBadge from "./StatusBadge";

const filterConfig = {
  all: { label: 'All', value: 'all' },
  pending: { label: 'Pending', value: 'SUBMITTED' },
  approved: { label: 'Approved', value: 'APPROVED' },
  rejected: { label: 'Rejected', value: 'REJECTED' },
};

const statusMap = {
  PENDING: { label: '⏳ PENDING', className: 'pending-badge' },
  SUBMITTED: { label: '⏳ SUBMITTED', className: 'pending-badge' },
  APPROVED: { label: '✅ APPROVED', className: 'approved-badge' },
  REJECTED: { label: '❌ REJECTED', className: 'rejected-badge' },
};

export default function AdminInitialActivations() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getAllInitialActivations();
      if (response.data.success) {
        setPayments(response.data.payments);
      }
    } catch (err) {
      console.error("Error fetching activations:", err);
      setMessage({ type: 'error', text: 'Failed to load activations' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payment) => {
    if (!window.confirm(`Approve this activation for ${payment.full_name}?`)) {
      return;
    }

    try {
      setProcessingId(payment.id);
      setMessage({ type: '', text: '' });
      
      const response = await approveInitialActivation(payment.id);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: `✅ Activation approved for ${payment.full_name}` });
        fetchData();
      }
    } catch (err) {
      console.error("Approve error:", err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to approve' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (payment) => {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) return; // User cancelled

    try {
      setProcessingId(payment.id);
      setMessage({ type: '', text: '' });
      
      const response = await rejectInitialActivation(payment.id, reason || '');
      
      if (response.data.success) {
        setMessage({ type: 'success', text: `❌ Activation rejected for ${payment.full_name}` });
        fetchData();
      }
    } catch (err) {
      console.error("Reject error:", err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reject' });
    } finally {
      setProcessingId(null);
    }
  };

  // Filter payments
  const filteredPayments = payments.filter(p => {
    // Status filter
    if (filterStatus !== 'all' && p.status !== filterStatus) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        (p.full_name && p.full_name.toLowerCase().includes(search)) ||
        (p.phone && p.phone.toLowerCase().includes(search)) ||
        (p.email && p.email.toLowerCase().includes(search)) ||
        (p.mpesa_code && p.mpesa_code.toLowerCase().includes(search))
      );
    }
    
    return true;
  });

  const pendingCount = payments.filter(p => p.status === 'SUBMITTED').length;
  const approvedCount = payments.filter(p => p.status === 'APPROVED').length;
  const rejectedCount = payments.filter(p => p.status === 'REJECTED').length;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>🔐 Initial Account Activations</h1>
        <p className="admin-subtitle">
          KES 100 activation payments - Required before dashboard access
        </p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{payments.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card approved">
          <div className="stat-value">{approvedCount}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-value">{rejectedCount}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="filters-row">
        <input
          type="text"
          placeholder="🔍 Search by name, phone, email, or M-Pesa code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <div className="filter-buttons">
          {Object.entries(filterConfig).map(([key, { label, value }]) => (
            <button
              key={key}
              className={`filter-btn ${filterStatus === value ? 'active' : ''}`}
              onClick={() => setFilterStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading">Loading...</div>
      ) : filteredPayments.length === 0 ? (
        <div className="no-results">
          {searchTerm || filterStatus !== 'all' 
            ? 'No activations match your filters' 
            : 'No initial activations yet'}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>M-Pesa Code</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => (
                <tr key={p.id}>
                  <td>{p.full_name || '—'}</td>
                  <td>{p.phone || '—'}</td>
                  <td>{p.email || '—'}</td>
                  <td style={{ fontFamily: 'monospace' }}>
                    {p.mpesa_code || 'N/A'}
                  </td>
                  <td style={{ fontWeight: 'bold', color: '#0a7c4a' }}>
                    KES {p.amount || 100}
                  </td>
                  <td>
                    <StatusBadge status={p.status} statusMap={statusMap} />
                  </td>
                  <td>
                    {p.submitted_at 
                      ? new Date(p.submitted_at).toLocaleString() 
                      : '—'}
                  </td>
                  <td>
                    {p.status === 'SUBMITTED' && (
                      <div className="action-buttons">
                        <button
                          onClick={() => handleApprove(p)}
                          disabled={processingId === p.id}
                          className="approve-btn"
                        >
                          {processingId === p.id ? 'Processing...' : '✅ Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(p)}
                          disabled={processingId === p.id}
                          className="reject-btn"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    )}
                    {p.status !== 'SUBMITTED' && (
                      <span style={{ color: '#64748b', fontSize: '12px' }}>
                        {p.processed_at 
                          ? `Processed: ${new Date(p.processed_at).toLocaleDateString()}` 
                          : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
