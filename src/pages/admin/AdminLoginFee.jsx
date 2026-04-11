import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginFeeAdminApi } from "../../api/adminApi";
import "./Admin.css";

export default function AdminLoginFee() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await loginFeeAdminApi.getAll();
      if (res.data.success) {
        const sortedPayments = (res.data.payments || []).sort((a, b) => {
          const dateA = new Date(a.submitted_at || 0);
          const dateB = new Date(b.submitted_at || 0);
          return dateB - dateA;
        });
        setPayments(sortedPayments);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setErrorMessage("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, userName) => {
    if (!window.confirm(`Approve login fee for ${userName}?`)) return;
    
    try {
      setProcessingId(userId);
      setErrorMessage("");
      const res = await loginFeeAdminApi.approve(userId);
      
      if (res.data.success) {
        setSuccessMessage(`✅ Login fee approved for ${userName}`);
        setPayments(prev => prev.filter(p => p.user_id !== userId));
        
        // If there's an auto-login token, user can be logged in
        if (res.data.auto_login_token) {
          console.log("Auto-login token available for user");
        }
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to approve");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId, userName) => {
    const reason = window.prompt(`Reason for rejecting payment from ${userName}:`);
    if (!reason) return;
    
    try {
      setProcessingId(userId);
      setErrorMessage("");
      await loginFeeAdminApi.reject(userId, reason);
      
      setSuccessMessage(`❌ Payment rejected for ${userName}`);
      setPayments(prev => prev.filter(p => p.user_id !== userId));
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to reject");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm) ||
      p.mpesa_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="admin-login-fee-page">
      <div className="admin-header">
        <button className="back-btn" onClick={() => navigate("/admin")}>
          ← Back
        </button>
        <h1>💰 Login Fee Payments</h1>
        <div className="stats-badge">
          <span className="stat-total">Total: {payments.length}</span>
          <span className="stat-pending">Pending: {payments.filter(p => p.status === 'PENDING').length}</span>
          <span className="stat-approved">Approved: {payments.filter(p => p.status === 'APPROVED').length}</span>
          <span className="stat-rejected">Rejected: {payments.filter(p => p.status === 'REJECTED').length}</span>
        </div>
      </div>

      <button className="refresh-btn" onClick={fetchPayments}>🔄 Refresh</button>

      {successMessage && (
        <div className="alert success">{successMessage}</div>
      )}
      
      {errorMessage && (
        <div className="alert error">{errorMessage}</div>
      )}

      <div className="search-filter-bar">
        <input
          type="text"
          placeholder="🔍 Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : filteredPayments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <h3>No payments found</h3>
        </div>
      ) : (
        <div className="payments-list">
          <table className="payments-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>M-Pesa Message</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, index) => (
                <tr key={payment.user_id}>
                  <td>{index + 1}</td>
                  <td>{payment.full_name || "N/A"}</td>
                  <td>{payment.phone}</td>
                  <td>
                    <span className={`status-badge status-${payment.status?.toLowerCase()}`}>
                      {payment.status === 'APPROVED' ? '✅ Approved' : payment.status === 'REJECTED' ? '❌ Rejected' : '⏳ Pending'}
                    </span>
                  </td>
                  <td className="mpesa-cell">{payment.mpesa_code || "—"}</td>
                  <td>{formatDate(payment.submitted_at)}</td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="approve-btn"
                        onClick={() => handleApprove(payment.user_id, payment.full_name)}
                        disabled={processingId === payment.user_id || payment.status === 'APPROVED'}
                      >
                        ✓
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleReject(payment.user_id, payment.full_name)}
                        disabled={processingId === payment.user_id || payment.status === 'REJECTED'}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .admin-login-fee-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .admin-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        
        .admin-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          flex: 1;
        }
        
        .back-btn {
          padding: 10px 16px;
          background: #f1f5f9;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
        }
        
        .back-btn:hover {
          background: #e2e8f0;
        }
        
        .stats-badge {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .stats-badge span {
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }
        
        .stat-total {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
        }
        
        .stat-pending {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        
        .stat-approved {
          background: linear-gradient(135deg, #22c55e, #16a34a);
        }
        
        .stat-rejected {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }
        
        .search-filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .search-filter-bar input {
          flex: 1;
          padding: 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          box-sizing: border-box;
        }
        
        .search-filter-bar input:focus {
          border-color: #6366f1;
          outline: none;
        }
        
        .status-filter {
          padding: 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          background: white;
          cursor: pointer;
          min-width: 140px;
        }
        
        .status-filter:focus {
          border-color: #6366f1;
          outline: none;
        }
        
        .alert {
          padding: 14px 20px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .alert.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #22c55e;
        }
        
        .alert.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #ef4444;
        }
        
        .loading-state, .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }
        
        .empty-state .empty-icon {
          width: 64px;
          height: 64px;
          background: #22c55e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: white;
          margin: 0 auto 16px;
        }
        
        .empty-state h3 {
          font-size: 18px;
          color: #1e293b;
          margin: 0 0 8px 0;
        }
        
        .empty-state p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }
        
        .payments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        
        .payments-list {
          overflow-x: auto;
        }
        
        .payments-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .payments-table th,
        .payments-table td {
          padding: 14px 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .payments-table th {
          background: #f8fafc;
          font-weight: 700;
          font-size: 13px;
          color: #475569;
        }
        
        .payments-table tr:hover {
          background: #f8fafc;
        }
        
        .payments-table .mpesa-cell {
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .payments-table .action-btns {
          display: flex;
          gap: 8px;
        }
        
        .payments-table .approve-btn,
        .payments-table .reject-btn {
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .payments-table .approve-btn {
          background: #22c55e;
          color: white;
        }
        
        .payments-table .reject-btn {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .payment-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }
        
        .payment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .payment-type {
          padding: 6px 12px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }
        
        .payment-amount {
          font-size: 20px;
          font-weight: 800;
          color: #22c55e;
        }
        
        .payment-details {
          margin-bottom: 16px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .detail-row .label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
        
        .detail-row .value {
          font-size: 13px;
          color: #1e293b;
          font-weight: 600;
        }
        
        .detail-row .value.code {
          font-family: monospace;
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 4px;
        }
        
        .mpesa-message-box {
          background: #f8fafc;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 16px;
          border: 1px solid #e2e8f0;
        }
        
        .mpesa-label {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin: 0 0 8px 0;
        }
        
        .mpesa-text {
          font-size: 12px;
          color: #64748b;
          margin: 0;
          font-family: monospace;
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 80px;
          overflow-y: auto;
        }
        
        .payment-actions {
          display: flex;
          gap: 12px;
        }
        
        .payment-actions button {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .approve-btn {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
        }
        
        .approve-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #16a34a, #15803d);
        }
        
        .reject-btn {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .reject-btn:hover:not(:disabled) {
          background: #fecaca;
        }
        
        .payment-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}