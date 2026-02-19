import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { affiliateApi } from "../api/api";
import "./AffiliateDashboard.css";

export default function AffiliateDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadAffiliateStats();
  }, []);

  const loadAffiliateStats = async () => {
    try {
      const res = await affiliateApi.getStats();
      setStats(res.data);
    } catch (error) {
      console.error("Failed to load affiliate stats:", error);
      setToast("Failed to load affiliate data");
      setTimeout(() => setToast(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (stats?.referral_link) {
      navigator.clipboard.writeText(stats.referral_link);
      setCopied(true);
      setToast("✅ Referral link copied!");
      setTimeout(() => {
        setCopied(false);
        setToast("");
      }, 3000);
    }
  };

  const shareToWhatsApp = () => {
    const message = encodeURIComponent(
      `Hey! I'm earning real money by completing simple surveys on SurveyEarn. 💰\n\nJoin using my link and get a KES 1,200 welcome bonus! 🎁\n\n${stats?.referral_link}`
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="affiliate-loading">
        <div className="loading-spinner"></div>
        <p>Loading your affiliate dashboard...</p>
      </div>
    );
  }

  return (
    <div className="affiliate-dashboard">
      {toast && <div className="affiliate-toast">{toast}</div>}

      {/* Header */}
      <div className="affiliate-header">
        <div className="header-top">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            ← Dashboard
          </button>
          {(stats?.amount_earned > 0) && (
            <button className="withdraw-btn" onClick={() => navigate("/withdraw")}>
              💰 Withdraw
            </button>
          )}
        </div>
        <h1>🎯 Affiliate Program</h1>
        <p>Earn KES 50 for every friend you refer!</p>
      </div>

      {/* Stats Cards */}
      <div className="affiliate-stats-grid">
        <div className="affiliate-stat-card earnings">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>KES {stats?.amount_earned || 0}</h3>
            <p>Total Earned</p>
          </div>
        </div>

        <div className="affiliate-stat-card referrals">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats?.total_referrals || 0}</h3>
            <p>Total Referrals</p>
          </div>
        </div>

        <div className="affiliate-stat-card active">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats?.active_referrals || 0}</h3>
            <p>Active Referrals</p>
          </div>
        </div>

        <div className="affiliate-stat-card inactive">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats?.inactive_referrals || 0}</h3>
            <p>Inactive Referrals</p>
          </div>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="affiliate-referral-section">
        <h2>🔗 Your Referral Link</h2>
        <div className="referral-link-box">
          <input
            type="text"
            value={stats?.referral_link || ""}
            readOnly
            className="referral-input"
          />
          <button
            className={`copy-btn ${copied ? "copied" : ""}`}
            onClick={copyReferralLink}
          >
            {copied ? "✓ Copied" : "📋 Copy"}
          </button>
        </div>
        <p className="referral-code-display">
          Your Code: <strong>{stats?.referral_code}</strong>
        </p>
        <div className="share-buttons">
          <button className="share-btn whatsapp" onClick={shareToWhatsApp}>
            💬 Share on WhatsApp
          </button>
        </div>
      </div>

      {/* How it Works */}
      <div className="affiliate-how-it-works">
        <h2>📖 How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Share Your Link</h4>
              <p>Share your unique referral link with friends</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>They Sign Up</h4>
              <p>Friend creates an account using your link</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>They Activate</h4>
              <p>Friend pays activation fee and gets approved</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>You Earn!</h4>
              <p>Get KES 50 credited instantly to your account</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals List */}
      {stats?.referrals?.length > 0 && (
        <div className="affiliate-referrals-list">
          <h2>👥 Your Referrals</h2>
          <div className="referrals-table">
            <div className="table-header">
              <span>Name</span>
              <span>Phone</span>
              <span>Status</span>
              <span>Joined</span>
            </div>
            {stats.referrals.map((ref) => (
              <div key={ref.id} className="table-row">
                <span>{ref.name}</span>
                <span>{ref.phone}</span>
                <span className={`status ${ref.is_activated ? "active" : "inactive"}`}>
                  {ref.is_activated ? "✅ Active" : "⏳ Pending"}
                </span>
                <span>{formatDate(ref.joined_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.referrals?.length === 0 && (
        <div className="no-referrals">
          <div className="empty-icon">🎁</div>
          <h3>No Referrals Yet</h3>
          <p>Share your referral link to start earning!</p>
        </div>
      )}
    </div>
  );
}
