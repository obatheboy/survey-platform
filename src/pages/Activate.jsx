// ========================= Activate.jsx =========================
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import api from "../api/api";
import "./Activate.css";

/* =========================
   CONSTANTS
========================= */
const SEND_MONEY_NUMBER = "0740209662";
const RECEIVER_NAME = "Irene Otoki";
const SUPPORT_NUMBER = "254740209662"; // WhatsApp support number

/* =========================
   PLAN CONFIG
========================= */
const PLAN_CONFIG = {
  REGULAR: { 
    label: "Regular Plan", 
    total: 1500, 
    activationFee: 100, 
    color: "#10b981", 
    icon: "⭐"
  },
  VIP: { 
    label: "VIP Plan", 
    total: 2000, 
    activationFee: 150, 
    color: "#6366f1", 
    icon: "💎"
  },
  VVIP: { 
    label: "VVIP Plan", 
    total: 3000, 
    activationFee: 200, 
    color: "#f59e0b", 
    icon: "👑"
  },
};

export default function Activate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [planKey, setPlanKey] = useState(null);
  const [paymentText, setPaymentText] = useState("");
  const [notification, setNotification] = useState(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [userName, setUserName] = useState("");

  /* =========================
     LOAD USER + PLAN
  ========================= */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/auth/me?_t=${Date.now()}`);
        setUserName(res.data.full_name || "User");
        
        const statePlanKey = location.state?.plan;
        const isWelcome = searchParams.get("welcome_bonus");
        const planFromQuery = isWelcome ? "WELCOME" : (statePlanKey || res.data.active_plan);

        if (planFromQuery === "WELCOME" || PLAN_CONFIG[planFromQuery]) {
          setPlanKey(planFromQuery);
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate, searchParams, location.state]);

  /* =========================
     COPY NUMBER
  ========================= */
  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(SEND_MONEY_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setNotification("Failed to copy. Please copy the number manually.");
    }
  };

  /* =========================
     WHATSAPP SUPPORT FUNCTION
  ========================= */
  const openWhatsAppSupport = () => {
    const plan = planKey === "WELCOME" 
      ? "Welcome Bonus" 
      : PLAN_CONFIG[planKey]?.label || "Account";
    
    const message = encodeURIComponent(
      `Hello SurveyEarn Support,\n\n` +
      `I need help with my account activation.\n\n` +
      `📋 Account Details:\n` +
      `• Name: ${userName}\n` +
      `• Plan: ${plan}\n` +
      `• Activation Fee: KES ${planKey === "WELCOME" ? 100 : PLAN_CONFIG[planKey]?.activationFee || 100}\n\n` +
      `❓ Issue: I'm having trouble with the activation process.\n\n` +
      `Please assist me.`
    );
    
    const whatsappUrl = `https://wa.me/${SUPPORT_NUMBER}?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  /* =========================
     WHATSAPP PAYMENT CONFIRMATION
  ========================= */
  const openWhatsAppPaymentConfirm = () => {
    const plan = planKey === "WELCOME" 
      ? "Welcome Bonus" 
      : PLAN_CONFIG[planKey]?.label || "Account";
    
    const message = encodeURIComponent(
      `Hello SurveyEarn Support,\n\n` +
      `✅ I've just made my activation payment!\n\n` +
      `📋 Payment Details:\n` +
      `• Name: ${userName}\n` +
      `• Plan: ${plan}\n` +
      `• Amount Paid: KES ${planKey === "WELCOME" ? 100 : PLAN_CONFIG[planKey]?.activationFee || 100}\n` +
      `• Payment Method: M-Pesa\n` +
      `• Recipient: ${RECEIVER_NAME}\n\n` +
      `I've already submitted the M-Pesa confirmation in the app.\n\n` +
      `Please verify and activate my account.`
    );
    
    const whatsappUrl = `https://wa.me/${SUPPORT_NUMBER}?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  /* =========================
     WHATSAPP QUICK SUPPORT (For simple questions)
  ========================= */
  const openWhatsAppQuickSupport = (questionType) => {
    const questions = {
      payment: "I need help with the payment process for activation.",
      mpesa: "I'm not receiving the M-Pesa confirmation message.",
      activation: "My account is not activating after payment.",
      general: "I have a general question about account activation."
    };

    const message = encodeURIComponent(
      `Hello SurveyEarn Support,\n\n` +
      `I need assistance with: ${questions[questionType] || "account activation"}\n\n` +
      `📋 Account Details:\n` +
      `• Name: ${userName}\n` +
      `• Plan: ${planKey === "WELCOME" ? "Welcome Bonus" : PLAN_CONFIG[planKey]?.label || "Account"}\n\n` +
      `Please help me resolve this issue.`
    );
    
    const whatsappUrl = `https://wa.me/${SUPPORT_NUMBER}?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  /* =========================
     SUBMIT ACTIVATION
  ========================= */
  const submitActivation = async () => {
    if (!paymentText.trim()) {
      setNotification("Please paste your M-Pesa confirmation message.");
      return;
    }

    setSubmitting(true);
    setNotification(null);

    try {
      const planParam = planKey === "WELCOME" ? "REGULAR" : planKey;
      
      await api.post("/activation/submit", {
        mpesa_code: paymentText.trim(),
        plan: planParam,
        is_welcome_bonus: planKey === "WELCOME",
      });
      
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Activation submission failed:", error);
      setNotification("Submission failed. Please try again or contact support.");
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     RENDER LOADING
  ========================= */
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading activation details...</p>
      </div>
    );
  }

  if (!planKey) return null;

  const plan = planKey === "WELCOME" 
    ? { 
        label: "Welcome Bonus", 
        total: 1200, 
        activationFee: 100, 
        color: "#10b981", 
        icon: "🎁" 
      }
    : PLAN_CONFIG[planKey] || PLAN_CONFIG.REGULAR;

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      {/* SUCCESS POPUP */}
      {showSuccessPopup && (
        <div className="success-overlay">
          <div className="success-card">
            <div className="success-icon">✅</div>
            
            <h2>Payment Submitted Successfully!</h2>

            <div className="success-message">
              <p>Your payment has been received and is being verified.</p>
              
              <div className="success-steps">
                <h4>Next Steps:</h4>
                <ol>
                  <li>Return to your dashboard</li>
                  <li>Complete your surveys</li>
                  <li>Withdraw your earnings</li>
                </ol>
              </div>
              
              {/* WhatsApp Notification Button */}
              <div className="whatsapp-notification">
                <p><strong>Want faster activation?</strong></p>
                <p>Notify our support team on WhatsApp:</p>
                <button
                  onClick={openWhatsAppPaymentConfirm}
                  className="whatsapp-notify-button"
                >
                  💬 Notify Support via WhatsApp
                </button>
              </div>
            </div>

            <div className="success-buttons">
              <button
                onClick={() => navigate("/dashboard", { replace: true })}
                className="dashboard-button"
              >
                Go to Dashboard
              </button>
              
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="close-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <div className="activate-page">
        {/* HEADER */}
        <div className="activate-header">
          <h1>Account Activation</h1>
          <p className="subtitle">Unlock your earnings in just a few simple steps</p>
          
          {/* Quick Support Badge */}
          <div className="quick-support-badge" onClick={openWhatsAppSupport}>
            <span className="badge-icon">💬</span>
            <span className="badge-text">Need help? Chat with support</span>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="activate-container">
          {/* BENEFITS SECTION */}
          <div className="benefits-section">
            <div className="benefits-header">
              <span className="benefits-icon">🔓</span>
              <h3>Why Activate Your Account?</h3>
            </div>
            
            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon">💰</div>
                <h4>Unlock Withdrawals</h4>
                <p>Activate once to withdraw your earnings anytime</p>
              </div>
              
              <div className="benefit-card">
                <div className="benefit-icon">⚡</div>
                <h4>Instant Processing</h4>
                <p>Get paid within minutes of requesting withdrawal</p>
              </div>
              
              <div className="benefit-card">
                <div className="benefit-icon">🔒</div>
                <h4>Secure Account</h4>
                <p>Verified account with M-Pesa payment protection</p>
              </div>
              
              <div className="benefit-card">
                <div className="benefit-icon">📈</div>
                <h4>Higher Earnings</h4>
                <p>Access premium surveys and better pay rates</p>
              </div>
            </div>
          </div>

          {/* PAYMENT CALCULATOR */}
          <div className="calculator-section">
            <div className="calculator-header">
              <span className="plan-icon">{plan.icon}</span>
              <h3>{plan.label}</h3>
            </div>
            
            <div className="calculator-cards">
              <div className="calc-card investment">
                <div className="calc-label">Your Investment</div>
                <div className="calc-amount">KES {plan.activationFee}</div>
                <div className="calc-note">One-time activation fee</div>
              </div>
              
              <div className="calc-arrow">→</div>
              
              <div className="calc-card earnings">
                <div className="calc-label">Your Earnings</div>
                <div className="calc-amount">KES {plan.total}</div>
                <div className="calc-note">Available for withdrawal</div>
              </div>
            </div>
            
            <div className="roi-display">
              <div className="roi-label">Your Return</div>
              <div className="roi-value">{Math.round((plan.total / plan.activationFee) * 100)}% ROI</div>
              <div className="roi-note">
                That's {Math.round(plan.total / plan.activationFee)}x your investment
              </div>
            </div>
          </div>

          {/* PAYMENT INSTRUCTIONS */}
          <div className="instructions-section">
            <h3><span className="icon">📱</span> How to Activate</h3>
            
            <div className="instruction-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Open M-Pesa</h4>
                  <p>Go to your M-Pesa menu on your phone</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Send Money</h4>
                  <p>Select "Send Money" option</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Enter Details</h4>
                  <div className="payment-details">
                    <div className="detail">
                      <span className="detail-label">Number:</span>
                      <span className="detail-value">{SEND_MONEY_NUMBER}</span>
                      <button onClick={copyNumber} className="copy-button">
                        {copied ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="detail">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{RECEIVER_NAME}</span>
                    </div>
                    <div className="detail">
                      <span className="detail-label">Amount:</span>
                      <span className="detail-value highlight">KES {plan.activationFee}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Complete Payment</h4>
                  <p>Enter your M-Pesa PIN and confirm the transaction</p>
                </div>
              </div>
            </div>
          </div>

          {/* PAYMENT VERIFICATION */}
          <div className="verification-section">
            <h3><span className="icon">✅</span> Verify Your Payment</h3>
            <p className="verification-note">
              After payment, paste the <strong>complete M-Pesa confirmation message</strong> below
            </p>
            
            <textarea
              placeholder="Paste your M-Pesa confirmation message here..."
              value={paymentText}
              onChange={(e) => setPaymentText(e.target.value)}
              className="payment-textarea"
              rows={4}
            />
            
            {notification && (
              <div className={`notification ${notification.includes("failed") ? "error" : "info"}`}>
                {notification}
              </div>
            )}
            
            <button
              onClick={submitActivation}
              disabled={submitting || !paymentText.trim()}
              className="submit-button"
            >
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                "Submit Payment & Activate Account"
              )}
            </button>
          </div>

          {/* QUICK SUPPORT SECTION */}
          <div className="quick-support-section">
            <h3><span className="icon">💬</span> Quick Support</h3>
            <p className="support-subtitle">Need help? Contact us directly on WhatsApp:</p>
            
            <div className="support-buttons">
              <button
                onClick={() => openWhatsAppQuickSupport("payment")}
                className="support-option-button"
              >
                <span className="support-icon">💳</span>
                <span className="support-text">Payment Issues</span>
              </button>
              
              <button
                onClick={() => openWhatsAppQuickSupport("mpesa")}
                className="support-option-button"
              >
                <span className="support-icon">📱</span>
                <span className="support-text">M-Pesa Problems</span>
              </button>
              
              <button
                onClick={() => openWhatsAppQuickSupport("activation")}
                className="support-option-button"
              >
                <span className="support-icon">🔓</span>
                <span className="support-text">Activation Delay</span>
              </button>
              
              <button
                onClick={() => openWhatsAppQuickSupport("general")}
                className="support-option-button"
              >
                <span className="support-icon">❓</span>
                <span className="support-text">General Questions</span>
              </button>
            </div>
            
            {/* Direct WhatsApp Button */}
            <button
              onClick={openWhatsAppSupport}
              className="whatsapp-direct-button"
            >
              <span className="whatsapp-icon">💬</span>
              <span className="whatsapp-text">Chat with Support on WhatsApp</span>
            </button>
          </div>

          {/* FAQ SECTION */}
          <div className="faq-section">
            <h3><span className="icon">❓</span> Frequently Asked Questions</h3>
            
            <div className="faq-list">
              <div className="faq-item">
                <h4>Why do I need to pay an activation fee?</h4>
                <p>The activation fee verifies your account and enables instant M-Pesa withdrawals. It's a one-time payment that unlocks your earnings.</p>
              </div>
              
              <div className="faq-item">
                <h4>Is this payment safe?</h4>
                <p>Yes! Payments go directly to our official M-Pesa number. We have thousands of verified users who have successfully activated and withdrawn.</p>
              </div>
              
              <div className="faq-item">
                <h4>When will my account be activated?</h4>
                <p>Your account is activated automatically within minutes after payment verification. You'll receive a confirmation message.</p>
              </div>
              
              <div className="faq-item">
                <h4>What if I have issues?</h4>
                <p>Contact our support team on WhatsApp for immediate assistance with any payment or activation issues.</p>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="action-buttons">
            <button
              onClick={() => navigate("/dashboard")}
              className="back-button"
            >
              ← Back to Dashboard
            </button>
            
            <button
              onClick={openWhatsAppSupport}
              className="support-button"
            >
              <span className="support-button-icon">💬</span>
              Contact Support on WhatsApp
            </button>
          </div>
        </div>

        {/* SECURITY BADGE */}
        <div className="security-badge">
          <div className="security-icon">🔒</div>
          <div className="security-text">
            <strong>Secure Payment</strong>
            <span>M-Pesa Verified • SSL Encrypted</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Loading styles */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 16px;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Success popup styles */
        .success-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(10px);
        }
        
        .success-card {
          background: white;
          border-radius: 24px;
          padding: 40px 32px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
        }
        
        .success-icon {
          font-size: 64px;
          margin-bottom: 24px;
          animation: bounce 1s infinite;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .success-card h2 {
          color: #10b981;
          font-size: 26px;
          font-weight: 800;
          margin-bottom: 16px;
        }
        
        .success-message {
          margin: 24px 0;
          color: #475569;
          line-height: 1.6;
          text-align: left;
        }
        
        .success-steps {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .success-steps h4 {
          color: #1e293b;
          margin-bottom: 12px;
        }
        
        .success-steps ol {
          padding-left: 20px;
          margin: 0;
        }
        
        .success-steps li {
          margin-bottom: 8px;
          color: #64748b;
        }
        
        .whatsapp-notification {
          background: linear-gradient(135deg, rgba(37, 211, 102, 0.1), rgba(33, 150, 83, 0.1));
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          border: 1px solid rgba(37, 211, 102, 0.2);
        }
        
        .whatsapp-notify-button {
          width: 100%;
          padding: 14px;
          background: #25D366;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 12px;
          transition: all 0.3s ease;
        }
        
        .whatsapp-notify-button:hover {
          background: #128C7E;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 211, 102, 0.3);
        }
        
        .success-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 24px;
        }
        
        .dashboard-button {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .dashboard-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);
        }
        
        .close-button {
          width: 100%;
          padding: 16px;
          background: transparent;
          color: #64748b;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .close-button:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        
        /* Quick Support Badge */
        .quick-support-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #25D366;
          color: white;
          padding: 10px 20px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          margin-top: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          animation: pulse 2s infinite;
        }
        
        .quick-support-badge:hover {
          background: #128C7E;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 211, 102, 0.3);
        }
        
        .badge-icon {
          font-size: 16px;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </>
  );
}