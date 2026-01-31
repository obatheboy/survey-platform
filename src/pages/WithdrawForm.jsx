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
                <span className="activation-icon-symbol">🔒</span>
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

      {/* Header - FIXED STRUCTURE */}
      <header className="withdraw-header">
        <button 
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>
        <h1>💰💰💰</h1>
        {!isUserActivated && (
          <div className="activation-badge">
            <span className="badge-icon">⚠️</span>
            Activate Account
          </div>
        )}
        {/* Empty div for alignment */}
        <div className="header-spacer"></div>
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
    </div>
  );
}