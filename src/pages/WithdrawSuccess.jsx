// ========================= WithdrawSuccess.jsx =========================
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./WithdrawSuccess.css";

const PLANS = {
  REGULAR: { name: "Regular", color: "#4ade80", icon: "⭐", gradient: "linear-gradient(135deg, #4ade80, #22c55e)" },
  VIP: { name: "VIP", color: "#3b82f6", icon: "💎", gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
  VVIP: { name: "VVIP", color: "#f59e0b", icon: "👑", gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
};

export default function WithdrawSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { withdrawal, plan } = location.state || {};

  const [shareCount, setShareCount] = useState(withdrawal?.share_count || 0);
  const [copied, setCopied] = useState(false);

  // 🔥 FIX: Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!withdrawal) {
      navigate("/dashboard");
    }
  }, [withdrawal, navigate]);

  const shareToWhatsApp = () => {
    const text = `Hey! I'm earning money on the Survey App. Join me and complete surveys to earn cash! 🎉\n\nDownload now: ${window.location.origin}\n\nUse my referral code: ${withdrawal.referral_code}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    incrementShareCount();
  };

  const shareToSMS = () => {
    const text = `Hi! Join me on Survey App and earn money. Code: ${withdrawal.referral_code} ${window.location.origin}`;
    const smsUrl = `sms:?body=${encodeURIComponent(text)}`;
    
    // Use window.open instead of modifying window.location.href
    window.open(smsUrl, '_blank');
    
    incrementShareCount();
  };

  const copyLink = () => {
    const text = `Survey App Referral - Code: ${withdrawal.referral_code} - ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    incrementShareCount();
  };

  const incrementShareCount = () => {
    setShareCount(prev => {
      const newCount = prev + 1;
      // In a real app, you would update this on the backend
      return newCount;
    });
  };

  if (!withdrawal) {
    return null;
  }

  const planData = PLANS[withdrawal.type] || plan || PLANS.REGULAR;

  return (
    <div className="withdraw-success-page">
      {/* Success Header */}
      <div className="success-header">
        <div className="success-icon-circle">
          <span className="success-icon">🎉</span>
          <div className="checkmark">✓</div>
        </div>
        <h1>Withdrawal Submitted!</h1>
        <p className="success-subtitle">
          Your request is being processed. Share your referral link to speed up payment!
        </p>
      </div>

      {/* Withdrawal Details Card */}
      <div className="details-card">
        <div className="details-header">
          <h2>Withdrawal Details</h2>
          <span 
            className="status-badge" 
            style={{ 
              background: withdrawal.status === "APPROVED" ? "#10b981" : 
                         withdrawal.status === "REJECTED" ? "#ef4444" : "#f59e0b"
            }}
          >
            {withdrawal.status}
          </span>
        </div>

        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Plan</span>
            <span className="detail-value" style={{ color: planData.color }}>
              {planData.icon} {planData.name}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Amount</span>
            <span className="detail-value amount">KES {withdrawal.amount?.toLocaleString()}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Phone</span>
            <span className="detail-value">{withdrawal.phone_number}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Date</span>
            <span className="detail-value">
              {new Date(withdrawal.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Referral Code */}
        <div className="referral-section">
          <div className="referral-header">
            <h3>Your Referral Code</h3>
            <span className="shares-count">
              Shares: <strong>{shareCount}/3</strong>
            </span>
          </div>
          <div className="referral-code-display">
            <div className="referral-code">
              {withdrawal.referral_code}
            </div>
            <button 
              className="copy-code-btn"
              onClick={copyLink}
              style={{ background: planData.gradient }}
            >
              {copied ? "✓ Copied!" : "📋 Copy"}
            </button>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ 
                width: `${Math.min((shareCount / 3) * 100, 100)}%`,
                background: planData.gradient
              }}
            ></div>
          </div>
          <p className="progress-text">
            {shareCount >= 3 ? 
              "✅ Target reached! Your payment is being prioritized." : 
              `Share ${3 - shareCount} more time(s) to speed up processing.`}
          </p>
        </div>
      </div>

      {/* Sharing Options */}
      <div className="sharing-section">
        <h2>Share Your Referral Link</h2>
        <p className="sharing-subtitle">
          Help others earn while speeding up your payment
        </p>

        <div className="share-buttons-grid">
          <button 
            className="share-btn whatsapp-btn"
            onClick={shareToWhatsApp}
          >
            <span className="btn-icon">💬</span>
            <span className="btn-text">WhatsApp</span>
          </button>
          
          <button 
            className="share-btn sms-btn"
            onClick={shareToSMS}
          >
            <span className="btn-icon">📱</span>
            <span className="btn-text">SMS</span>
          </button>
          
          <button 
            className="share-btn copy-btn"
            onClick={copyLink}
            style={{ background: planData.gradient }}
          >
            <span className="btn-icon">{copied ? "✓" : "📋"}</span>
            <span className="btn-text">{copied ? "Copied" : "Copy Link"}</span>
          </button>
        </div>
      </div>

      {/* Next Steps */}
      <div className="next-steps-section">
        <h2>What Happens Next?</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Share Your Link</h3>
            <p>Share your referral code with friends and family</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Priority Processing</h3>
            <p>3+ shares = faster payment processing</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Receive Payment</h3>
            <p>Get paid via M-Pesa within 5-30 minutes</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          className="primary-btn"
          onClick={() => navigate("/dashboard")}
          style={{ background: planData.gradient }}
        >
          <span className="btn-icon">📊</span>
          Go to Dashboard
        </button>
        
        <button 
          className="secondary-btn"
          onClick={() => navigate("/surveys")}
        >
          <span className="btn-icon">📝</span>
          Take More Surveys
        </button>
      </div>

      {/* Help Section */}
      <div className="help-section">
        <h3>Need Help?</h3>
        <p>Contact support if you have any questions about your withdrawal</p>
        <button 
          className="support-btn"
          onClick={() => window.open(`https://wa.me/254794101450?text=Hello%20Support,%20I%20need%20help%20with%20my%20withdrawal%20${withdrawal.id}`, '_blank')}
        >
          💬 Chat with Support
        </button>
      </div>
    </div>
  );
}