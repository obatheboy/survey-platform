// ========================= WithdrawSuccess.jsx =========================
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./WithdrawSuccess.css";

const PLANS = {
  REGULAR: { name: "REGULAR SURVEYS", color: "#10b981", icon: "⭐", gradient: "linear-gradient(135deg, #10b981, #059669)" },
  VIP: { name: "VIP SURVEY", color: "#6366f1", icon: "💎", gradient: "linear-gradient(135deg, #6366f1, #4f46e5)" },
  VVIP: { name: "VVIP SURVEYS", color: "#f59e0b", icon: "👑", gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
};

export default function WithdrawSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { withdrawal, plan } = location.state || {};

  const [shareCount, setShareCount] = useState(withdrawal?.share_count || 0);
  const [copied, setCopied] = useState(false);

  // 🔥 ENHANCED FIX: Multiple strategies to ensure scroll to top
  useEffect(() => {
    // Immediate scroll when component mounts
    window.scrollTo(0, 0);
    
    // Force scroll after a tiny delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // Use 'instant' for immediate scroll
      });
      
      // Additional scroll methods for compatibility
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!withdrawal) {
      navigate("/dashboard");
    }
  }, [withdrawal, navigate]);

  const referralLink = `${window.location.origin}/auth?ref=${withdrawal.referral_code}`;
  
  const shareToWhatsApp = () => {
    const text = `Hey! I'm earning money doing simple surveys on Survey App Kenya! 🎉\n\nJoin me using this link and get KES 1,200 welcome bonus:\n\n${referralLink}\n\nUse code: ${withdrawal.referral_code}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    incrementShareCount();
  };

  const shareToSMS = () => {
    const text = `Hi! Join me on Survey App Kenya and earn money. Get KES 1,200 welcome bonus: ${referralLink} - Code: ${withdrawal.referral_code}`;
    const smsUrl = `sms:?body=${encodeURIComponent(text)}`;
    
    // Use window.open instead of modifying window.location.href
    window.open(smsUrl, '_blank');
    
    incrementShareCount();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
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
          🎉 Your withdrawal is being processed! <br/>
          👉 <strong>Invite 10+ friends</strong> to get paid faster!
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
            <h3>🎁 Invite Friends to Speed Up Payment</h3>
            <span className="shares-count">
              Invited: <strong>{shareCount}/10</strong>
            </span>
          </div>
          
          <p style={{ color: "#fff", fontSize: "14px", marginBottom: "12px", textAlign: "center" }}>
            📢 <strong>Invite 10 or more friends</strong> to get your payment faster!
          </p>
          
          <div className="referral-code-display">
            <div className="referral-code">
              {withdrawal.referral_code}
            </div>
            <button 
              className="copy-code-btn"
              onClick={copyLink}
              style={{ background: planData.gradient }}
            >
              {copied ? "✓ Copied!" : "📋 Copy Code"}
            </button>
          </div>
          
          <div className="referral-code-display" style={{ marginTop: "8px" }}>
            <div className="referral-code" style={{ fontSize: "12px" }}>
              {window.location.origin}/auth?ref={withdrawal.referral_code}
            </div>
            <button 
              className="copy-code-btn"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${withdrawal.referral_code}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
              }}
              style={{ background: planData.gradient }}
            >
              {copied ? "✓ Copied!" : "📋 Copy Link"}
            </button>
          </div>
          
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ 
                width: `${Math.min((shareCount / 10) * 100, 100)}%`,
                background: planData.gradient
              }}
            ></div>
          </div>
          <p className="progress-text">
            {shareCount >= 10 ? 
              "✅ Amazing! 10+ invited - your payment is being prioritized!" : 
              `Invite ${10 - shareCount} more friend(s) to speed up your payment!`}
          </p>
        </div>
      </div>

      {/* Sharing Options */}
      <div className="sharing-section">
        <h2>📨 Invite Friends Now</h2>
        <p className="sharing-subtitle">
          Share your referral link - the more people who join, the faster you get paid!
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
          onClick={() => window.open(`https://wa.me/254752881670?text=Hello%20Support,%20I%20need%20help%20with%20my%20withdrawal%20${withdrawal.id}`, '_blank')}
        >
          💬 Chat with Support
        </button>
      </div>
    </div>
  );
}