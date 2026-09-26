import { useEffect, useState } from "react";
import { adminAffiliateApi } from "../../api/api";
import "./Admin.css";

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedAffiliate, setExpandedAffiliate] = useState(null);

  useEffect(() => {
    loadAffiliates();
  }, []);

  const loadAffiliates = async () => {
    try {
      setLoading(true);
      const res = await adminAffiliateApi.getAllAffiliates();
      setAffiliates(res.data.affiliates || []);
    } catch (err) {
      console.error("Failed to load affiliates:", err);
      setError("Failed to load affiliate data");
    } finally {
      setLoading(false);
    }
  };

  const filteredAffiliates = affiliates.filter(aff => {
    const search = searchTerm.toLowerCase();
    return (
      aff.full_name?.toLowerCase().includes(search) ||
      aff.phone?.toLowerCase().includes(search) ||
      aff.email?.toLowerCase().includes(search) ||
      aff.referral_code?.toLowerCase().includes(search)
    );
  });

  const totalCommission = affiliates.reduce((sum, a) => sum + a.commission_earned, 0);
  const totalReferrals = affiliates.reduce((sum, a) => sum + a.referral_count, 0);
  const activeReferrals = affiliates.reduce((sum, a) => sum + a.active_referrals, 0);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading affiliates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>🎯 Affiliate Management</h1>
          <p>Manage users who have referred others and track commissions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{affiliates.length}</h3>
            <p>Total Affiliates</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔗</div>
          <div className="stat-info">
            <h3>{totalReferrals}</h3>
            <p>Total Referrals</p>
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
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>KES {totalCommission.toLocaleString()}</h3>
            <p>Total Commission</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Search by name, phone, email, or referral code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Affiliate Table */}
      <div className="table-container">
        {filteredAffiliates.length === 0 ? (
          <div className="empty-state">
            <p>No affiliates found.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Referral Code</th>
                <th>Referrals</th>
                <th>Active</th>
                <th>Commission</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAffiliates.map((affiliate) => (
                <>
                  <tr key={affiliate.id} className="affiliate-row">
                    <td>
                      <strong>{affiliate.full_name}</strong>
                    </td>
                    <td>{affiliate.phone}</td>
                    <td>{affiliate.email || "—"}</td>
                    <td>
                      <code className="referral-code">{affiliate.referral_code}</code>
                    </td>
                    <td>
                      <span className="badge">{affiliate.referral_count}</span>
                    </td>
                    <td>
                      <span className={`badge ${affiliate.active_referrals > 0 ? 'active' : ''}`}>
                        {affiliate.active_referrals}
                      </span>
                    </td>
                    <td>
                      <strong className="commission-amount">
                        KES {affiliate.commission_earned.toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      {new Date(affiliate.joined_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="action-btn-small"
                        onClick={() => setExpandedAffiliate(
                          expandedAffiliate === affiliate.id ? null : affiliate.id
                        )}
                      >
                        {expandedAffiliate === affiliate.id ? "👁️ Hide" : "👁️ View"}
                      </button>
                    </td>
                  </tr>
                  {expandedAffiliate === affiliate.id && (
                    <tr className="expanded-row">
                      <td colSpan="9">
                        <div className="referrals-detail">
                          <h4>Referral Details for {affiliate.full_name}</h4>
                          {affiliate.referrals_list?.length > 0 ? (
                            <table className="inner-table">
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Phone</th>
                                  <th>Status</th>
                                  <th>Joined</th>
                                </tr>
                              </thead>
                              <tbody>
                                {affiliate.referrals_list.map((ref, idx) => (
                                  <tr key={idx}>
                                    <td>{ref.name}</td>
                                    <td>{ref.phone}</td>
                                    <td>
                                      <span className={`status-badge ${ref.is_activated ? 'active' : 'pending'}`}>
                                        {ref.is_activated ? "✅ Active" : "⏳ Pending"}
                                      </span>
                                    </td>
                                    <td>{new Date(ref.joined_at).toLocaleDateString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="no-referrals">No referrals yet</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
