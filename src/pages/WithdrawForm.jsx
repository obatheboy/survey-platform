// ========================= WithdrawForm.jsx =========================
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { queueWithdrawRequest, canMakeRequest } from "../api/api";
import "./WithdrawForm.css";

const PLANS = {
  REGULAR: { 
    name: "Regular", 
    icon: "⭐", 
    total: 1500, 
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #059669)"
  },
  VIP: { 
    name: "VIP", 
    icon: "💎", 
    total: 2000, 
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1, #4f46e5)"
  },
  VVIP: { 
    name: "VVIP", 
    icon: "👑", 
    total: 3000, 
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)"
  },
};

export default function WithdrawForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const planFromState = location.state?.plan;
  
  const [plan, setPlan] = useState(planFromState || "");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRedirecting, setAutoRedirecting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Moved loadUser inside useEffect
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get(`/auth/me?_t=${Date.now()}`);
        setUser(res.data);
        
        // Update cache
        localStorage.setItem("cachedUser", JSON.stringify(res.data));
      } catch (err) {
        console.error("Failed to load user:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]); // Only navigate is needed in dependencies

  useEffect(() => {
    if (plan && PLANS[plan]) {
      setAmount(PLANS[plan].total.toString());
    }
  }, [plan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submitting) {
      setError("Please wait, processing your request...");
      return;
    }

    if (!canMakeRequest('withdraw', 10000)) {
      setError("Please wait 10 seconds before making another request.");
      return;
    }

    if (!amount || !phone) {
      setError("Please enter amount and phone number");
      return;
    }

    const amountNum = Number(amount);
    if (amountNum < 100) {
      setError("Minimum withdrawal amount is KES 100");
      return;
    }

    if (amountNum > PLANS[plan].total) {
      setError(`Maximum amount for ${PLANS[plan].name} plan is KES ${PLANS[plan].total}`);
      return;
    }

    // Validate phone number format (Kenyan - accepts 07 or 01)
    const phoneRegex = /^0[17][0-9]{8}$/;
    const cleanedPhone = phone.replace(/\s+/g, '');
    if (!phoneRegex.test(cleanedPhone)) {
      setError("Please enter a valid Kenyan phone number (07XXXXXXXX or 01XXXXXXXX)");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const res = await queueWithdrawRequest(() => 
        api.post("/withdraw/request", {
          phone_number: cleanedPhone,
          amount: amountNum,
          type: plan,
        })
      );

      const withdrawalId = res.data?.id || `temp_${Date.now()}`;
      const code = res.data?.referral_code || Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Set auto redirecting state
      setAutoRedirecting(true);
      setMessage("Withdrawal submitted successfully! Redirecting to success page...");
      
      // Auto redirect after 2 seconds
      setTimeout(() => {
        navigate("/withdraw-success", {
          state: {
            withdrawal: {
              id: withdrawalId,
              type: plan,
              amount: amountNum,
              phone_number: cleanedPhone,
              referral_code: code,
              share_count: 0,
              status: res.data?.status || "PROCESSING",
              created_at: new Date().toISOString(),
              fee: res.data?.fee || 0,
              net_amount: res.data?.net_amount || amountNum
            },
            plan: PLANS[plan]
          }
        });
      }, 2000);

    } catch (err) {
      if (err.response?.status === 429) {
        setError("Too many requests. Please wait 2 minutes before trying again.");
      } else if (err.response?.status === 409) {
        setError("You already have a withdrawal pending for this plan. Please manage it from the success page.");
      } else if (err.response?.status === 403) {
        setError("Account not activated or insufficient surveys completed.");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Invalid request. Please check your inputs.");
      } else {
        setError("Withdrawal failed. Please try again.");
      }
      console.error("Withdrawal error:", err.response?.data || err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="withdraw-form-page">
      {/* Header */}
      <header className="withdraw-header">
        <button 
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>
        <h1>Withdraw Earnings</h1>
        <div style={{ width: "60px" }}></div> {/* Spacer for alignment */}
      </header>

      <div className="form-container">
        {/* Plan Selection */}
        {!plan && (
          <div className="plan-selection-section">
            <h2>Select Plan to Withdraw</h2>
            <p className="section-subtitle">Choose which plan you want to withdraw from</p>
            
            <div className="plan-selection-cards">
              {Object.entries(PLANS).map(([key, planData]) => (
                <div 
                  key={key}
                  className="plan-selection-card"
                  onClick={() => setPlan(key)}
                  style={{
                    borderColor: planData.color,
                    background: `linear-gradient(135deg, ${planData.color}20, transparent)`
                  }}
                >
                  <div className="plan-selection-header">
                    <span className="plan-icon">{planData.icon}</span>
                    <h3>{planData.name} Plan</h3>
                  </div>
                  <div className="plan-amount">
                    <span className="currency">KES</span>
                    <span className="amount">{planData.total.toLocaleString()}</span>
                  </div>
                  <p className="plan-description">Available for withdrawal</p>
                  <button className="select-plan-btn">
                    Select Plan →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Withdrawal Form */}
        {plan && (
          <form className="withdrawal-form" onSubmit={handleSubmit}>
            <div className="form-header">
              <h2>
                <span className="plan-icon-small">{PLANS[plan].icon}</span>
                Withdraw {PLANS[plan].name} Plan
              </h2>
              <p>Enter your withdrawal details</p>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {message && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                <p>{message}</p>
                {autoRedirecting && (
                  <div className="redirecting-loader">
                    <div className="mini-spinner"></div>
                    <span>Redirecting...</span>
                  </div>
                )}
              </div>
            )}

            {/* Amount Input */}
            <div className="form-group">
              <label>Amount to Withdraw (KES)</label>
              <div className="amount-input-group">
                <span className="amount-prefix">KES</span>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="100"
                  max={PLANS[plan].total}
                  required
                  disabled={submitting || autoRedirecting}
                />
              </div>
              <div className="amount-helper">
                <span>Available: KES {PLANS[plan].total.toLocaleString()}</span>
                <button 
                  type="button" 
                  className="use-max-btn"
                  onClick={() => setAmount(PLANS[plan].total.toString())}
                  disabled={submitting || autoRedirecting}
                >
                  Use Max
                </button>
              </div>
            </div>

            {/* Phone Input */}
            <div className="form-group">
              <label>Phone Number (M-Pesa)</label>
              <input
                type="tel"
                placeholder="07XX XXX XXX or 01XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={submitting || autoRedirecting}
              />
              <p className="input-helper">Enter your M-Pesa number (e.g., 0712345678 or 0112345678)</p>
            </div>

            {/* Processing Info */}
            <div className="processing-info">
              <div className="info-item">
                <span className="info-icon">⏱️</span>
                <span>Processing Time: 5-30 minutes</span>
              </div>
              <div className="info-item">
                <span className="info-icon">💳</span>
                <span>Minimum: KES 100</span>
              </div>
              <div className="info-item">
                <span className="info-icon">🔒</span>
                <span>Secure M-Pesa transfer</span>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={submitting || autoRedirecting}
                style={{ background: PLANS[plan].gradient }}
              >
                {submitting ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : autoRedirecting ? (
                  <>
                    <span className="btn-icon">✅</span>
                    Submitted
                  </>
                ) : (
                  <>
                    <span className="btn-icon">💸</span>
                    Confirm Withdrawal
                  </>
                )}
              </button>
              
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => plan ? setPlan("") : navigate("/dashboard")}
                disabled={submitting || autoRedirecting}
              >
                {plan ? 'Change Plan' : 'Cancel'}
              </button>
            </div>

            {/* Terms */}
            <div className="terms-notice">
              <p>
                <strong>Important:</strong> By withdrawing, you agree to our terms. 
                Processing may take 5-30 minutes. You'll receive an SMS confirmation from M-Pesa.
                Ensure your phone number is correct.
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Support Button */}
      <div className="support-fixed">
        <button 
          className="support-btn"
          onClick={() => window.open('https://wa.me/254740209662?text=Hello%20Support,%20I%20need%20help%20with%20withdrawal', '_blank')}
        >
          💬 Need Help?
        </button>
      </div>

      {/* Add CSS for redirecting loader */}
      <style jsx>{`
        .redirecting-loader {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          color: #059669;
          font-weight: 600;
        }
        
        .mini-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(5, 150, 105, 0.3);
          border-top-color: #059669;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}