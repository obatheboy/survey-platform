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
    activationFee: 0
  },
  VIP: { 
    name: "VIP", 
    icon: "💎", 
    total: 2000, 
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
    activationFee: 500
  },
  VVIP: { 
    name: "VVIP", 
    icon: "👑", 
    total: 3000, 
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    activationFee: 1000
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
  const [userPlanActivationStatus, setUserPlanActivationStatus] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadUserAndActivation = async () => {
      try {
        // 1. First, load user data to ensure they're authenticated
        const userRes = await api.get(`/auth/me?_t=${Date.now()}`);
        const userData = userRes.data;
        localStorage.setItem("cachedUser", JSON.stringify(userData));
        
        // 2. Try to get user's current plan/activation status
        // Try multiple possible endpoints since we don't know your exact backend structure
        let activationStatus = {
          REGULAR: true, // Assume regular is always activated
          VIP: false,
          VVIP: false
        };

        try {
          // Option 1: Check if user has a plan in their profile
          if (userData.plan) {
            activationStatus[userData.plan] = true;
          }
          
          // Option 2: Try to get activation status from user endpoint
          const planStatusRes = await api.get(`/user/plan-status`);
          if (planStatusRes.data) {
            Object.keys(PLANS).forEach(planKey => {
              if (planStatusRes.data[planKey]) {
                activationStatus[planKey] = planStatusRes.data[planKey];
              }
            });
          }
        } catch (planErr) {
          console.warn("Could not fetch plan activation status:", planErr.message);
          
          // Option 3: Check localStorage for previously activated plans
          const savedActivation = localStorage.getItem('activatedPlans');
          if (savedActivation) {
            try {
              const parsed = JSON.parse(savedActivation);
              Object.keys(PLANS).forEach(planKey => {
                if (parsed[planKey]) {
                  activationStatus[planKey] = parsed[planKey];
                }
              });
            } catch (e) {
              console.warn("Error parsing saved activation:", e);
            }
          }
        }
        
        setUserPlanActivationStatus(activationStatus);
        
      } catch (err) {
        console.error("Failed to load user:", err);
        
        // Only redirect to login if it's an auth error
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("cachedUser");
          navigate("/auth?mode=login");
        } else {
          // For other errors (like 404), just continue with defaults
          setUserPlanActivationStatus({
            REGULAR: true,
            VIP: false,
            VVIP: false
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserAndActivation();
  }, [navigate]);

  useEffect(() => {
    if (plan && PLANS[plan]) {
      setAmount(PLANS[plan].total.toString());
    }
  }, [plan]);

  const checkAccountActivation = async (planKey) => {
    // For Regular plan with no activation fee, always return true
    if (planKey === "REGULAR" && PLANS[planKey].activationFee === 0) {
      return true;
    }
    
    try {
      // Try multiple endpoints to check activation
      let isActivated = false;
      
      // Method 1: Try dedicated activation check endpoint
      try {
        const res = await api.get(`/withdraw/check-eligibility`);
        if (res.data?.eligibleForWithdrawal) {
          isActivated = true;
        }
      } catch (e1) {
        console.warn("Method 1 failed:", e1.message);
      }
      
      // Method 2: Check user's current plan
      if (!isActivated) {
        try {
          const userRes = await api.get(`/auth/me?_t=${Date.now()}`);
          if (userRes.data?.plan === planKey) {
            isActivated = true;
          }
        } catch (e2) {
          console.warn("Method 2 failed:", e2.message);
        }
      }
      
      // Method 3: Use locally stored activation status
      if (!isActivated) {
        isActivated = userPlanActivationStatus[planKey] || false;
      }
      
      return isActivated;
      
    } catch (err) {
      console.error("Activation check error:", err);
      return userPlanActivationStatus[planKey] || false;
    }
  };

  const handlePlanSelection = async (planKey) => {
    try {
      // For Regular plan with no activation fee, skip activation check
      if (planKey === "REGULAR" && PLANS[planKey].activationFee === 0) {
        setPlan(planKey);
        return;
      }
      
      // Check account activation status
      const isActivated = await checkAccountActivation(planKey);
      
      if (!isActivated) {
        // Show activation modal instead of setting plan directly
        setSelectedPlanForActivation(planKey);
        setShowActivationModal(true);
      } else {
        // Account is activated, proceed to withdraw form
        setPlan(planKey);
      }
    } catch (err) {
      setError("Unable to verify account status. Please try again.");
      console.error("Plan selection error:", err);
    }
  };

  const handleActivateAccount = () => {
    if (!selectedPlanForActivation) return;
    
    // Navigate to activation page with plan info
    navigate("/activate-account", {
      state: {
        plan: selectedPlanForActivation,
        planData: PLANS[selectedPlanForActivation],
        redirectTo: "/withdraw-form",
        redirectState: { plan: selectedPlanForActivation }
      }
    });
  };

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
      // Final activation check before withdrawal (skip for Regular with no fee)
      if (plan !== "REGULAR" || PLANS[plan].activationFee > 0) {
        const isActivated = await checkAccountActivation(plan);
        if (!isActivated) {
          setError(`Your ${PLANS[plan].name} account is not activated. Please activate first.`);
          setSubmitting(false);
          return;
        }
      }

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
        <div style={{ width: "60px" }}></div>
      </header>

      <div className="form-container">
        {/* Plan Selection */}
        {!plan && (
          <div className="plan-selection-section">
            <h2>Select Plan to Withdraw</h2>
            <p className="section-subtitle">Choose which plan you want to withdraw from</p>
            
            <div className="plan-selection-cards">
              {Object.entries(PLANS).map(([key, planData]) => {
                const isActivated = userPlanActivationStatus[key] || false;
                return (
                  <div 
                    key={key}
                    className="plan-selection-card"
                    onClick={() => handlePlanSelection(key)}
                    style={{
                      borderColor: planData.color,
                      background: `linear-gradient(135deg, ${planData.color}20, transparent)`,
                      opacity: (key !== "REGULAR" && planData.activationFee > 0 && !isActivated) ? 0.9 : 1
                    }}
                  >
                    <div className="plan-selection-header">
                      <span className="plan-icon">{planData.icon}</span>
                      <h3>{planData.name} Plan</h3>
                      {isActivated && (
                        <span className="activated-badge">✅ Activated</span>
                      )}
                    </div>
                    <div className="plan-amount">
                      <span className="currency">KES</span>
                      <span className="amount">{planData.total.toLocaleString()}</span>
                    </div>
                    <p className="plan-description">Available for withdrawal</p>
                    {planData.activationFee > 0 && !isActivated && (
                      <div className="activation-badge">
                        <span className="badge-icon">🔒</span>
                        <span>Activation required</span>
                      </div>
                    )}
                    {planData.activationFee > 0 && isActivated && (
                      <div className="activated-fee-badge">
                        <span className="badge-icon">✅</span>
                        <span>Already activated</span>
                      </div>
                    )}
                    <button className="select-plan-btn">
                      {isActivated ? 'Withdraw Now →' : 'Select Plan →'}
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

            {/* Check if plan needs activation */}
            {(PLANS[plan].activationFee > 0 && !userPlanActivationStatus[plan]) && (
              <div className="warning-banner">
                <span className="warning-icon">⚠️</span>
                <div className="warning-content">
                  <strong>Plan Not Activated</strong>
                  <p>You need to activate your {PLANS[plan].name} plan before withdrawing.</p>
                  <button 
                    type="button"
                    className="activate-btn-small"
                    onClick={() => navigate("/activate-account", { 
                      state: { 
                        plan: plan,
                        planData: PLANS[plan],
                        redirectTo: "/withdraw-form",
                        redirectState: { plan: plan }
                      } 
                    })}
                  >
                    Activate Now
                  </button>
                </div>
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
                  disabled={submitting || autoRedirecting || (PLANS[plan].activationFee > 0 && !userPlanActivationStatus[plan])}
                />
              </div>
              <div className="amount-helper">
                <span>Available: KES {PLANS[plan].total.toLocaleString()}</span>
                <button 
                  type="button" 
                  className="use-max-btn"
                  onClick={() => setAmount(PLANS[plan].total.toString())}
                  disabled={submitting || autoRedirecting || (PLANS[plan].activationFee > 0 && !userPlanActivationStatus[plan])}
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
                disabled={submitting || autoRedirecting || (PLANS[plan].activationFee > 0 && !userPlanActivationStatus[plan])}
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
              {(PLANS[plan].activationFee > 0 && !userPlanActivationStatus[plan]) ? (
                <button 
                  type="button" 
                  className="activate-btn-large"
                  onClick={() => navigate("/activate-account", { 
                    state: { 
                      plan: plan,
                      planData: PLANS[plan],
                      redirectTo: "/withdraw-form",
                      redirectState: { plan: plan }
                    } 
                  })}
                  style={{ background: PLANS[plan].gradient }}
                >
                  <span className="btn-icon">🔓</span>
                  Activate {PLANS[plan].name} Plan to Withdraw
                </button>
              ) : (
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
              )}
              
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

      {/* Activation Modal */}
      {showActivationModal && selectedPlanForActivation && (
        <div className="modal-overlay">
          <div className="activation-modal">
            <div className="modal-header">
              <h2>Account Activation Required</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowActivationModal(false);
                  setSelectedPlanForActivation(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="activation-plan-info">
                <div className="activation-plan-icon">
                  {PLANS[selectedPlanForActivation].icon}
                </div>
                <h3>{PLANS[selectedPlanForActivation].name} Plan</h3>
                <p className="activation-fee">
                  Activation Fee: <strong>KES {PLANS[selectedPlanForActivation].activationFee.toLocaleString()}</strong>
                </p>
              </div>
              
              <div className="activation-features">
                <h4>Benefits of Activation:</h4>
                <ul>
                  <li>✅ Withdraw up to KES {PLANS[selectedPlanForActivation].total.toLocaleString()}</li>
                  <li>✅ Priority processing for withdrawals</li>
                  <li>✅ Access to premium surveys</li>
                  <li>✅ Higher earning rates</li>
                  <li>✅ Exclusive customer support</li>
                </ul>
              </div>
              
              <div className="activation-note">
                <p>
                  <strong>Note:</strong> You need to activate your account before 
                  you can withdraw from the {PLANS[selectedPlanForActivation].name} plan.
                  The activation fee is a one-time payment.
                </p>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-activate-btn"
                onClick={handleActivateAccount}
                style={{ background: PLANS[selectedPlanForActivation].gradient }}
              >
                <span className="btn-icon">🔓</span>
                Activate Account Now
              </button>
              
              <button 
                className="modal-cancel-btn"
                onClick={() => {
                  setShowActivationModal(false);
                  setSelectedPlanForActivation(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Button */}
      <div className="support-fixed">
        <button 
          className="support-btn"
          onClick={() => window.open('https://wa.me/254740209662?text=Hello%20Support,%20I%20need%20help%20with%20withdrawal', '_blank')}
        >
          💬 Need Help?
        </button>
      </div>

      {/* Add CSS for new badges */}
      <style jsx>{`
        .activated-badge {
          background: #10b981;
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 10px;
          display: inline-block;
        }
        
        .activated-fee-badge {
          background: #d1fae5;
          color: #065f46;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          margin: 10px 0;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>
    </div>
  );
}