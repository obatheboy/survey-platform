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
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    // Added activation fee - adjust these values based on your actual activation fees
    activationFee: 100
  },
  VIP: { 
    name: "VIP", 
    icon: "💎", 
    total: 2000, 
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
    activationFee: 150
  },
  VVIP: { 
    name: "VVIP", 
    icon: "👑", 
    total: 3000, 
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    activationFee: 200
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
  const [loading, setLoading] = useState(true);
  const [autoRedirecting, setAutoRedirecting] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedPlanForActivation, setSelectedPlanForActivation] = useState(null);
  const [isUserActivated, setIsUserActivated] = useState(false);
  const [userPlans, setUserPlans] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load user and check activation status
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get(`/auth/me?_t=${Date.now()}`);
        const userData = res.data;
        
        // Check user activation status
        const activated = userData?.is_activated || userData?.account_activated || false;
        setIsUserActivated(activated);
        
        // Store user plans to check individual plan activation
        setUserPlans(userData.plans || {});
        
        // Update cache
        localStorage.setItem("cachedUser", JSON.stringify(userData));
      } catch (err) {
        console.error("Failed to load user:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  // Set amount based on selected plan
  useEffect(() => {
    if (plan && PLANS[plan]) {
      setAmount(PLANS[plan].total.toString());
    }
  }, [plan]);

  // Check if specific plan is activated
  const isPlanActivated = (planKey) => {
    return userPlans[planKey]?.is_activated === true;
  };

  // Handle plan selection with activation check
  const handlePlanSelection = (planKey) => {
    // Check if user is activated globally
    if (!isUserActivated) {
      // Show activation modal
      setSelectedPlanForActivation(planKey);
      setShowActivationModal(true);
      return;
    }
    
    // Check if specific plan is activated
    if (!isPlanActivated(planKey)) {
      // Show activation modal for this specific plan
      setSelectedPlanForActivation(planKey);
      setShowActivationModal(true);
      return;
    }
    
    // If activated, proceed normally
    setPlan(planKey);
  };

  // Handle activation redirect
  const handleActivationRedirect = () => {
    if (selectedPlanForActivation) {
      const planData = PLANS[selectedPlanForActivation];
      // Navigate to activation page with plan info
      navigate("/activate", { 
        state: { 
          plan: selectedPlanForActivation,
          activationFee: planData.activationFee,
          planName: planData.name
        }
      });
    } else {
      // Fallback to generic activation page
      navigate("/activate");
    }
  };

  const closeActivationModal = () => {
    setShowActivationModal(false);
    setSelectedPlanForActivation(null);
  };

  // Main withdrawal submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Double-check activation before submission
    if (!isUserActivated) {
      setError("Please activate your account before making a withdrawal.");
      setShowActivationModal(true);
      return;
    }
    
    // Check specific plan activation
    if (plan && !isPlanActivated(plan)) {
      setError(`Please activate your ${PLANS[plan].name} plan before withdrawing.`);
      setSelectedPlanForActivation(plan);
      setShowActivationModal(true);
      return;
    }

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
        if (err.response?.data?.message?.includes("activated") || !isUserActivated) {
          // Show activation modal if backend also confirms not activated
          setError("Account not activated. Please activate your account to withdraw.");
          setShowActivationModal(true);
        } else {
          setError("Account not activated or insufficient surveys completed.");
        }
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
      {/* Activation Modal */}
      {showActivationModal && (
        <div className="activation-modal-overlay">
          <div className="activation-modal">
            <div className="activation-modal-header">
              <h3>Account Activation Required</h3>
              <button 
                className="modal-close-btn"
                onClick={closeActivationModal}
              >
                ×
              </button>
            </div>
            
            <div className="activation-modal-content">
              <div className="activation-icon">
                <span style={{ fontSize: "48px" }}>🔒</span>
              </div>
              
              <p className="activation-message">
                {selectedPlanForActivation ? (
                  <>
                    Your <strong>{PLANS[selectedPlanForActivation].name} Plan</strong> needs to be activated before you can withdraw.
                  </>
                ) : (
                  "Your account needs to be activated before you can withdraw earnings."
                )}
              </p>
              
              {selectedPlanForActivation && (
                <div className="activation-fee-display">
                  <div className="fee-label">Activation Fee:</div>
                  <div className="fee-amount">
                    KES {PLANS[selectedPlanForActivation].activationFee}
                  </div>
                  <div className="plan-badge">
                    {PLANS[selectedPlanForActivation].icon}{" "}
                    {PLANS[selectedPlanForActivation].name} Plan
                  </div>
                </div>
              )}
              
              <div className="activation-benefits">
                <h4>Activation Benefits:</h4>
                <ul>
                  <li>✅ Unlock withdrawals for this plan</li>
                  <li>✅ Priority withdrawal processing</li>
                  <li>✅ Access to all surveys</li>
                  <li>✅ Dedicated customer support</li>
                </ul>
              </div>
            </div>
            
            <div className="activation-modal-actions">
              <button 
                className="activate-account-btn"
                onClick={handleActivationRedirect}
                style={{
                  background: selectedPlanForActivation 
                    ? PLANS[selectedPlanForActivation].gradient 
                    : "linear-gradient(135deg, #6366f1, #4f46e5)"
                }}
              >
                <span className="btn-icon">🔓</span>
                Activate Now
              </button>
              
              <button 
                className="cancel-activation-btn"
                onClick={closeActivationModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="withdraw-header">
        <button 
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>
        <h1>Withdraw Earnings</h1>
        {!isUserActivated && (
          <div className="activation-badge">
            <span className="badge-icon">⚠️</span>
            Account Not Activated
          </div>
        )}
        <div style={{ width: "60px" }}></div>
      </header>

      <div className="form-container">
        {/* Plan Selection Section */}
        {!plan && (
          <div className="plan-selection-section">
            <h2>Select Plan to Withdraw</h2>
            <p className="section-subtitle">Choose which plan you want to withdraw from</p>
            
            {/* Activation Notice */}
            {!isUserActivated && (
              <div className="activation-notice">
                <div className="notice-icon">🔒</div>
                <div className="notice-content">
                  <strong>Account Not Activated</strong>
                  <p>You need to activate your account before withdrawing. Select a plan to proceed with activation.</p>
                </div>
              </div>
            )}
            
            <div className="plan-selection-cards">
              {Object.entries(PLANS).map(([key, planData]) => {
                const isActivated = isPlanActivated(key);
                
                return (
                  <div 
                    key={key}
                    className="plan-selection-card"
                    onClick={() => handlePlanSelection(key)}
                    style={{
                      borderColor: planData.color,
                      background: `linear-gradient(135deg, ${planData.color}20, transparent)`,
                      opacity: !isUserActivated ? 0.9 : 1,
                      cursor: isActivated ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <div className="plan-selection-header">
                      <span className="plan-icon">{planData.icon}</span>
                      <h3>{planData.name} Plan</h3>
                      {!isActivated && (
                        <span className="activation-required-badge">🔒</span>
                      )}
                    </div>
                    
                    <div className="plan-amount">
                      <span className="currency">KES</span>
                      <span className="amount">{planData.total.toLocaleString()}</span>
                    </div>
                    
                    <p className="plan-description">
                      {isActivated ? "Available for withdrawal" : "Activation required"}
                    </p>
                    
                    {!isActivated && (
                      <div className="activation-hint">
                        <div className="activation-fee-small">
                          Activation: KES {planData.activationFee}
                        </div>
                      </div>
                    )}
                    
                    <button 
                      className="select-plan-btn"
                      style={{
                        background: isActivated 
                          ? planData.gradient 
                          : 'linear-gradient(135deg, #f59e0b, #d97706)',
                        cursor: isActivated ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {isActivated ? (
                        "Select Plan →"
                      ) : (
                        <>
                          <span className="btn-icon-small">🔓</span>
                          Activate to Withdraw
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
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

            {/* Activation Warning for Non-activated Plans */}
            {!isPlanActivated(plan) && (
              <div className="activation-alert-in-form">
                <div className="alert-header">
                  <span className="alert-icon">🔒</span>
                  <span className="alert-title">Plan Not Activated</span>
                </div>
                <p className="alert-message">
                  You need to activate your <strong>{PLANS[plan].name} Plan</strong> before withdrawing. 
                  Activation fee: <strong>KES {PLANS[plan].activationFee}</strong>
                </p>
                <button 
                  type="button"
                  className="activate-now-btn"
                  onClick={() => {
                    setSelectedPlanForActivation(plan);
                    setShowActivationModal(true);
                  }}
                  style={{ background: PLANS[plan].gradient }}
                >
                  🔓 Activate {PLANS[plan].name} Plan
                </button>
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
                  disabled={submitting || autoRedirecting || !isPlanActivated(plan)}
                />
              </div>
              <div className="amount-helper">
                <span>Available: KES {PLANS[plan].total.toLocaleString()}</span>
                <button 
                  type="button" 
                  className="use-max-btn"
                  onClick={() => setAmount(PLANS[plan].total.toString())}
                  disabled={submitting || autoRedirecting || !isPlanActivated(plan)}
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
                disabled={submitting || autoRedirecting || !isPlanActivated(plan)}
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
                disabled={submitting || autoRedirecting || !isPlanActivated(plan)}
                style={{ 
                  background: PLANS[plan].gradient,
                  opacity: !isPlanActivated(plan) ? 0.6 : 1,
                  cursor: !isPlanActivated(plan) ? 'not-allowed' : 'pointer'
                }}
              >
                {!isPlanActivated(plan) ? (
                  <>
                    <span className="btn-icon">🔒</span>
                    Plan Not Activated
                  </>
                ) : submitting ? (
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
                {!isPlanActivated(plan) && (
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                    {" "}Plan activation is required for withdrawal.
                  </span>
                )}
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Support Button */}
      <div className="support-fixed">
        <button 
          className="support-btn"
          onClick={() => window.open('https://wa.me/254102074596?text=Hello%20Support,%20I%20need%20help%20with%20withdrawal', '_blank')}
        >
          💬 Need Help?
        </button>
      </div>

      {/* Add CSS for new components */}
      <style jsx>{`
       
      
        /* Activation Modal Styles - Mobile First */
        .activation-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 16px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        .activation-modal {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 420px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .activation-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .activation-modal-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.3;
        }
        
        .modal-close-btn {
          background: rgba(0, 0, 0, 0.05);
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          flex-shrink: 0;
          touch-action: manipulation;
        }
        
        .modal-close-btn:active {
          background: rgba(0, 0, 0, 0.1);
          transform: scale(0.95);
        }
        
        .activation-modal-content {
          padding: 20px;
        }
        
        .activation-icon {
          text-align: center;
          margin-bottom: 16px;
        }
        
        .activation-icon span {
          font-size: 56px;
          display: inline-block;
          animation: pulse 2s infinite ease-in-out;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .activation-message {
          text-align: center;
          color: #4b5563;
          font-size: 15px;
          line-height: 1.5;
          margin-bottom: 20px;
          padding: 0 4px;
        }
        
        .activation-fee-display {
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border-radius: 16px;
          padding: 18px 16px;
          text-align: center;
          margin-bottom: 20px;
          border: 2px dashed #0ea5e9;
          position: relative;
          overflow: hidden;
        }
        
        .activation-fee-display::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #0ea5e9, #3b82f6);
        }
        
        .fee-label {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 6px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .fee-amount {
          font-size: 32px;
          font-weight: 800;
          color: #0f766e;
          margin-bottom: 10px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .plan-badge {
          display: inline-block;
          background: rgba(5, 150, 105, 0.15);
          color: #047857;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          border: 1px solid rgba(5, 150, 105, 0.3);
          backdrop-filter: blur(4px);
        }
        
        .activation-benefits {
          background: #f8fafc;
          border-radius: 16px;
          padding: 18px;
          margin-bottom: 16px;
          border: 1px solid #e5e7eb;
        }
        
        .activation-benefits h4 {
          margin: 0 0 14px 0;
          color: #1e293b;
          font-size: 16px;
          font-weight: 700;
          text-align: center;
        }
        
        .activation-benefits ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .activation-benefits li {
          padding: 10px 0;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          line-height: 1.4;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .activation-benefits li:last-child {
          border-bottom: none;
        }
        
        .activation-benefits li::before {
          content: "✓";
          color: #10b981;
          font-weight: bold;
          font-size: 16px;
          flex-shrink: 0;
        }
        
        .activation-modal-actions {
          padding: 0 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: sticky;
          bottom: 0;
          background: white;
          border-radius: 0 0 20px 20px;
        }
        
        .activate-account-btn {
          padding: 18px 20px;
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s ease;
          touch-action: manipulation;
          position: relative;
          overflow: hidden;
        }
        
        .activate-account-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }
        
        .activate-account-btn:active::after {
          left: 100%;
        }
        
        .activate-account-btn:active {
          transform: translateY(2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .cancel-activation-btn {
          padding: 16px 20px;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 14px;
          color: #6b7280;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          touch-action: manipulation;
        }
        
        .cancel-activation-btn:active {
          background: #f9fafb;
          border-color: #d1d5db;
          transform: translateY(2px);
        }
        
       
        /* Activation Notice */
        .activation-notice {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 1px solid #fbbf24;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        
        .notice-icon {
          font-size: 22px;
          flex-shrink: 0;
          padding-top: 2px;
        }
        
        .notice-content {
          flex: 1;
        }
        
        .notice-content strong {
          color: #92400e;
          display: block;
          margin-bottom: 4px;
          font-size: 15px;
          line-height: 1.3;
        }
        
        .notice-content p {
          color: #92400e;
          margin: 0;
          font-size: 13px;
          opacity: 0.9;
          line-height: 1.4;
        }
        
        /* Plan Card Activation Status */
        .activation-required-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          padding: 5px 8px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid rgba(239, 68, 68, 0.3);
          backdrop-filter: blur(4px);
          z-index: 2;
        }
        
        .activation-hint {
          margin: 10px 0;
          text-align: center;
        }
        
        .activation-fee-small {
          display: inline-block;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          padding: 5px 10px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 700;
          margin-top: 6px;
          box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
        }
        
        /* In-form Activation Alert */
        .activation-alert-in-form {
          background: linear-gradient(135deg, #fef2f2, #fee2e2);
          border: 1px solid #fecaca;
          border-radius: 14px;
          padding: 18px;
          margin: 16px 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .activation-alert-in-form::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #ef4444, #dc2626);
        }
        
        .alert-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        
        .alert-icon {
          font-size: 20px;
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        
        .alert-title {
          color: #dc2626;
          font-weight: 700;
          font-size: 16px;
        }
        
        .alert-message {
          color: #7f1d1d;
          margin-bottom: 16px;
          line-height: 1.5;
          font-size: 14px;
          padding: 0 4px;
        }
        
        .activate-now-btn {
          padding: 16px 20px;
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 700;
          cursor: pointer;
          width: 100%;
          font-size: 15px;
          transition: all 0.2s ease;
          touch-action: manipulation;
          position: relative;
          overflow: hidden;
        }
        
        .activate-now-btn:active {
          transform: translateY(2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        /* Loading Spinner */
        .redirecting-loader {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
          color: #059669;
          font-weight: 600;
          justify-content: center;
          font-size: 14px;
        }
        
        .mini-spinner {
          width: 16px;
          height: 16px;
          border: 3px solid rgba(5, 150, 105, 0.2);
          border-top-color: #059669;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Mobile-specific improvements */
        @media (max-width: 360px) {
          .activation-modal {
            border-radius: 16px;
          }
          
          .activation-modal-header {
            padding: 14px 16px;
          }
          
          .activation-modal-header h3 {
            font-size: 16px;
          }
          
          .activation-modal-content {
            padding: 16px;
          }
          
          .activation-icon span {
            font-size: 48px;
          }
          
          .activation-message {
            font-size: 14px;
          }
          
          .fee-amount {
            font-size: 28px;
          }
          
          .activation-modal-actions {
            padding: 0 16px 16px;
          }
          
          .activate-account-btn,
          .cancel-activation-btn {
            padding: 14px 16px;
            font-size: 15px;
          }
          
          .activation-badge {
            right: 12px;
            padding: 5px 10px;
            font-size: 11px;
            max-width: 120px;
          }
        }
        
        /* Tablet and larger screens */
        @media (min-width: 768px) {
          .activation-modal {
            max-width: 500px;
          }
          
          .activation-modal-header h3 {
            font-size: 20px;
          }
          
          .activation-message {
            font-size: 16px;
          }
          
          .activate-account-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          }
          
          .activate-account-btn:hover::after {
            left: 100%;
          }
          
          .cancel-activation-btn:hover {
            background: #f9fafb;
            border-color: #d1d5db;
          }
          
          .activate-now-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          }
        }
        
        /* Prevent text selection on buttons for better mobile experience */
        .activate-account-btn,
        .cancel-activation-btn,
        .activate-now-btn,
        .modal-close-btn {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        
        /* Safe area insets for notched phones */
        .activation-modal-overlay {
          padding-left: max(16px, env(safe-area-inset-left));
          padding-right: max(16px, env(safe-area-inset-right));
          padding-top: max(16px, env(safe-area-inset-top));
          padding-bottom: max(16px, env(safe-area-inset-bottom));
        }
        
        /* Improve scrolling on iOS */
        .activation-modal {
          -webkit-overflow-scrolling: touch;
        }



      `}</style>
    </div>
  );
}