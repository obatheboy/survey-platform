import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import "./Admin.css";
import StatusBadge from "./StatusBadge";
import ActionButtons from "./ActionButtons";

const statusMap = {
  SUBMITTED: { label: '⏳ SUBMITTED', className: 'processing-badge' },
  PROCESSING: { label: '⏳ PROCESSING', className: 'processing-badge' },
  PENDING: { label: '⏳ PENDING', className: 'processing-badge' },
  APPROVED: { label: '✅ APPROVED', className: 'approved-badge' },
  REJECTED: { label: '❌ REJECTED', className: 'rejected-badge' },
};

export default function AdminAffiliateWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [referredUsers, setReferredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("withdrawals"); // "withdrawals" or "referrals"
  const [processingId, setProcessingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all withdrawals and filter for affiliate
      const withdrawalsRes = await adminApi.get('/withdraw/admin/all');
      const allWithdrawals = withdrawalsRes.data || [];
      
      // Filter only affiliate withdrawals
      const affiliateWithdrawals = allWithdrawals.filter(w => w.type === 'affiliate');
      setWithdrawals(affiliateWithdrawals);

      // Load referred users (users who joined via referral)
      const affiliatesRes = await adminApi.get('/affiliate/admin/all');
      const allAffiliates = affiliatesRes.data.affiliates || [];
      
      // Get users who were referred (have referred_by)
      const referredUsersList = [];
      allAffiliates.forEach(aff => {
        if (aff.referrals_list && aff.referrals_list.length > 0) {
          aff.referrals_list.forEach(ref => {
            referredUsersList.push({
              affiliate_id: aff.id,
              affiliate_name: aff.full_name,
              affiliate_code: aff.referral_code,
              referred_name: ref.name,
              referred_phone: ref.phone,
              is_activated: ref.is_activated,
              joined_at: ref.joined_at
            });
          });
        }
      });
      
      setReferredUsers(referredUsersList);
    } catch (err) {
      console.error("Failed to load affiliate data:", err);
      setError("Failed to load affiliate data");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this affiliate withdrawal? Payment will be processed.')) return;
    
    try {
      setProcessingId(id);
      await adminApi.patch(`/withdraw/admin/${id}/approve`);
      setSuccessMessage('✅ Withdrawal approved successfully!');
      loadData(); // Refresh data
    } catch (err) {
      console.error("Failed to approve:", err);
      setError("Failed to approve withdrawal");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this withdrawal? The funds will be refunded to user.')) return;
    
    try {
      setProcessingId(id);
      await adminApi.patch(`/withdraw/admin/${id}/reject`);
      setSuccessMessage('✅ Withdrawal rejected successfully!');
      loadData(); // Refresh data
    } catch (err) {
      console.error("Failed to reject:", err);
      setError("Failed to reject withdrawal");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    const search = searchTerm.toLowerCase();
    return (
      w.user_name?.toLowerCase().includes(search) ||
      w.user_phone?.toLowerCase().includes(search) ||
      w.user_email?.toLowerCase().includes(search)
    );
  });

  const filteredReferrals = referredUsers.filter(r => {
    const search = searchTerm.toLowerCase();
    return (
      r.affiliate_name?.toLowerCase().includes(search) ||
      r.affiliate_code?.toLowerCase().includes(search) ||
      r.referred_name?.toLowerCase().includes(search) ||
      r.referred_phone?.toLowerCase().includes(search)
    );
  });

  // Stats
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'APPROVED')
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);
  
  const pendingWithdrawal = withdrawals
    .filter(w => ['SUBMITTED', 'PROCESSING', 'PENDING'].includes(w.status))
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const activeReferrals = referredUsers.filter(r => r.is_activated).length;

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading affiliate data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>🎯 Affiliate Withdrawals</h1>
          <p>Manage referral earnings and track users who joined via referral links</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔗</div>
          <div className="stat-info">
            <h3>{referredUsers.length}</h3>
            <p>Total Referred Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{activeReferrals}</h3>
            <p>Active Referrals</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-info">
            <h3>KES {pendingWithdrawal.toLocaleString()}</h3>
            <p>Pending Withdrawals</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>KES {totalWithdrawn.toLocaleString()}</h3>
            <p>Total Withdrawn</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'withdrawals' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          💰 Affiliate Withdrawals ({withdrawals.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'referrals' ? 'active' : ''}`}
          onClick={() => setActiveTab('referrals')}
        >
          🔗 Referred Users ({referredUsers.length})
        </button>
      </div>

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder={`🔍 Search ${activeTab === 'withdrawals' ? 'withdrawals...' : 'referrals...'}`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* Withdrawals Tab */}
      {activeTab === 'withdrawals' && (
        <div className="table-container">
          {filteredWithdrawals.length === 0 ? (
            <div className="empty-state">
              <p>No affiliate withdrawals found.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Amount (KES)</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithdrawals.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <strong>{w.user_name || "—"}</strong>
                    </td>
                    <td>{w.user_phone || "—"}</td>
                    <td>{w.user_email || "—"}</td>
                    <td>
                      <strong style={{ color: "#0a7c4a", fontSize: "16px" }}>
                        KES {Number(w.amount || 0).toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <StatusBadge status={w.status} statusMap={statusMap} />
                    </td>
                    <td>
                      {w.created_at ? (
                        <>
                          {new Date(w.created_at).toLocaleDateString()} <br />
                          <small>{new Date(w.created_at).toLocaleTimeString()}</small>
                        </>
                      ) : "—"}
                    </td>
                    <td>
                      <ActionButtons
                        item={w}
                        processingId={processingId}
                        onApprove={() => handleApprove(w.id)}
                        onReject={() => handleReject(w.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <div className="table-container">
          {filteredReferrals.length === 0 ? (
            <div className="empty-state">
              <p>No referred users found.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Affiliate</th>
                  <th>Referral Code</th>
                  <th>Referred User</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.map((r, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{r.affiliate_name}</strong>
                    </td>
                    <td>
                      <code className="referral-code">{r.affiliate_code}</code>
                    </td>
                    <td>{r.referred_name}</td>
                    <td>{r.referred_phone}</td>
                    <td>
                      <span className={`status-badge ${r.is_activated ? 'active' : 'pending'}`}>
                        {r.is_activated ? "✅ Active" : "⏳ Pending"}
                      </span>
                    </td>
                    <td>
                      {r.joined_at ? new Date(r.joined_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
