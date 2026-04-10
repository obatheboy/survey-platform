import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { loginFeeApi } from "../api/api";

const LOGIN_FEE = 100;

export default function LoginFeePayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentLink, setPaymentLink] = useState(null);
  const [checkoutId, setCheckoutId] = useState(null);
  const [message, setMessage] = useState("");
  const [polling, setPolling] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [step, setStep] = useState(1);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [mpesaCode, setMpesaCode] = useState("");
  const [submittingCode, setSubmittingCode] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [codeSuccess, setCodeSuccess] = useState(false);

  const pendingUser = JSON.parse(localStorage.getItem("pendingLoginUser") || "{}");
  const userId = location.state?.userId || pendingUser.id;
  const phone = location.state?.phone || pendingUser.phone;
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const checkPayment = useCallback(async () => {
    if (!checkoutId) return;
    try {
      const res = await loginFeeApi.verify({ reference: checkoutId });
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("lastLoginTime", Date.now().toString());
        localStorage.removeItem("pendingLoginUser");
        setMessage("✓ Payment verified! Logging you in...");
        setStep(3);
        setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
        return;
      }
    } catch (err) {
      if (err.response?.data?.message === "Login fee already paid" || err.response?.data?.success === true) {
        try {
          const loginRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone })
          }).then(r => r.json());
          if (loginRes.token) {
            localStorage.setItem("token", loginRes.token);
            localStorage.setItem("lastLoginTime", Date.now().toString());
            localStorage.removeItem("pendingLoginUser");
            setMessage("✓ Payment verified! Logging you in...");
            setStep(3);
            setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
          }
        } catch (e) {}
      }
    }
  }, [checkoutId, navigate, phone]);

  useEffect(() => {
    if (!userId || !phone) {
      navigate("/auth?mode=login", { replace: true });
    }
  }, [userId, phone, navigate]);

  useEffect(() => {
    const init = async () => {
      if (reference && !checkoutId) {
        setCheckoutId(reference);
        setMessage("Verifying payment...");
        setLoading(false);
        setStep(2);
        try { await checkPayment(); } catch { setPolling(true); }
        return;
      }
      if (!userId || !phone) {
        navigate("/auth?mode=login", { replace: true });
        return;
      }
      try {
        const res = await loginFeeApi.initiate();
        if (res.data.authorization_url) {
          setPaymentLink(res.data.authorization_url);
          setCheckoutId(res.data.reference);
          setStep(2);
        } else if (res.data.reference) {
          setCheckoutId(res.data.reference);
          setMessage("STK Push sent to your phone");
          setPolling(true);
          setStep(2);
        } else {
          setMessage("Could not initiate payment. Please try again.");
        }
      } catch (err) {
        setMessage(err.response?.data?.message || "Failed to create payment. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [reference, checkoutId, userId, phone, navigate]);

  useEffect(() => {
    if (polling && checkoutId) {
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { checkPayment(); return 5; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [polling, checkoutId, checkPayment]);

  const handlePayWithMpesa = () => {
    if (paymentLink) window.location.href = paymentLink;
  };

  const handleManualVerify = async () => {
    setPolling(true);
    setMessage("Checking payment status...");
    await checkPayment();
    setPolling(false);
  };

  const handleWhatsAppSupport = () => {
    const msg = encodeURIComponent(`Hello SurveyEarn Support, I need help with login fee payment. Phone: ${phone}`);
    window.open(`https://wa.me/2547140834185?text=${msg}`, '_blank');
  };

  const handleManualMpesaSubmit = async () => {
    if (!mpesaCode.trim()) {
      setCodeError("Please paste your M-Pesa message or confirmation code");
      return;
    }
    
    setCodeError("");
    setSubmittingCode(true);
    
    try {
      const res = await loginFeeApi.submitMpesaCode({ mpesa_code: mpesaCode.trim() });
      
      if (res.data.success) {
        setCodeSuccess(true);
        setMessage("✓ Payment submitted! Waiting for admin approval...");
        setStep(3);
        
        localStorage.setItem("pendingLoginFeeApproval", "true");
        
        setTimeout(() => {
          navigate("/auth?mode=login", { replace: true });
        }, 3000);
      }
    } catch (err) {
      setCodeError(err.response?.data?.message || "Failed to submit payment. Please try again.");
    } finally {
      setSubmittingCode(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingBox}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Preparing payment...</p>
          </div>
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.progressBar}>
          <div style={{...styles.progressStep, ...styles.progressActive, ...styles.progressActiveSpan}}>
            <span style={styles.progressStepSpan}>1</span><p style={styles.progressLabel}>Amount</p>
          </div>
          <div style={styles.progressLine}></div>
          <div style={{...styles.progressStep, ...(step >= 2 ? styles.progressActive : {}), ...(step >= 2 ? styles.progressActiveSpan : {})}}>
            <span style={{...styles.progressStepSpan, ...(step >= 2 ? styles.progressActiveSpanColor : {})}}>2</span><p style={styles.progressLabel}>Pay</p>
          </div>
          <div style={styles.progressLine}></div>
          <div style={{...styles.progressStep, ...(step >= 3 ? styles.progressActive : {}), ...(step >= 3 ? styles.progressActiveSpan : {})}}>
            <span style={{...styles.progressStepSpan, ...(step >= 3 ? styles.progressActiveSpanColor : {})}}>3</span><p style={styles.progressLabel}>Done</p>
          </div>
        </div>

        <div style={styles.header}>
          <div style={styles.iconBox}>💰</div>
          <h1 style={styles.title}>Activation Fee</h1>
          <p style={styles.subtitle}>Complete payment to activate your account</p>
        </div>

        <div style={styles.amountCard}>
          <div style={styles.amountLabel}>Total Amount</div>
          <div style={styles.amount}>KES {LOGIN_FEE}</div>
          <div style={styles.amountHint}>One-time payment</div>
        </div>

        {!showManualEntry ? (
          <div style={styles.paymentOptionsSection}>
            <div style={styles.optionCard} onClick={() => {
              if (paymentLink) {
                window.location.href = paymentLink;
              } else if (checkoutId) {
                setMessage("STK Push sent to your phone. Please check and enter PIN.");
              } else {
                setShowManualEntry(true);
              }
            }}>
              <div style={styles.optionIcon}>📱</div>
              <div style={styles.optionContent}>
                <h3 style={styles.optionTitle}>Pay via M-Pesa</h3>
                <p style={styles.optionDesc}>We'll send an STK push to your phone</p>
              </div>
              <div style={styles.optionArrow}>→</div>
            </div>

            <div style={styles.dividerContainer}>
              <div style={styles.dividerLine}></div>
              <span style={styles.dividerText}>OR</span>
              <div style={styles.dividerLine}></div>
            </div>

            <div style={styles.optionCardSecondary} onClick={() => setShowManualEntry(true)}>
              <div style={styles.optionIcon}>💬</div>
              <div style={styles.optionContent}>
                <h3 style={styles.optionTitleSecondary}>Paste M-Pesa Message</h3>
                <p style={styles.optionDescSecondary}>Already paid? Paste your confirmation message</p>
              </div>
              <div style={styles.optionArrow}>→</div>
            </div>
          </div>
        ) : (
          <div style={styles.manualEntrySection}>
            <div style={styles.manualEntryHeader}>
              <button style={styles.backToOptionsBtn} onClick={() => setShowManualEntry(false)}>← Back</button>
              <h3 style={styles.manualEntryTitle}>Enter M-Pesa Details</h3>
            </div>

            <div style={styles.instructionBox}>
              <p style={styles.instructionTitle}>📋 How to submit:</p>
              <ol style={styles.instructionList}>
                <li>Open your M-Pesa messages</li>
                <li>Find the confirmation message for KES 100</li>
                <li>Copy or type the message in the box below</li>
                <li>Click Submit for admin review</li>
              </ol>
            </div>

            <div style={styles.mpesaInputWrapper}>
              <textarea
                style={styles.mpesaTextarea}
                placeholder="Paste your M-Pesa confirmation message here...

Example:
M-Pesa confirmed. 
You sent KES 100 to BUSINESS NO.
Transaction completed on 10/04/2026 at 5:30 PM.
Confirmation No. ABC123XYZ"
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value)}
                rows={6}
              />
            </div>

            {codeError && <div style={styles.codeError}>{codeError}</div>}
            
            {codeSuccess ? (
              <div style={styles.codeSuccessBox}>
                <div style={styles.successIcon}>✓</div>
                <h4 style={styles.successTitle}>Payment Submitted!</h4>
                <p style={styles.successText}>Your payment is pending admin approval. You'll be logged in once approved.</p>
              </div>
            ) : (
              <button 
                style={styles.submitCodeBtn} 
                onClick={handleManualMpesaSubmit}
                disabled={submittingCode}
              >
                {submittingCode ? "Submitting..." : "Submit for Approval"}
              </button>
            )}
          </div>
        )}

        {message && !message.includes("✓") && (
          <div style={styles.messageBox}>{message}</div>
        )}

        <div style={styles.helpSection}>
          <div style={styles.helpIcon}>❓</div>
          <p style={styles.helpText}>Having trouble?</p>
          <button style={styles.whatsappBtn} onClick={handleWhatsAppSupport}>
            💬 WhatsApp Support
          </button>
        </div>

        <button 
          style={styles.backBtn} 
          onClick={() => navigate("/auth?mode=login", { replace: true })}
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
  },
  loadingBox: {
    textAlign: "center",
    padding: "60px 20px",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #e2e8f0",
    borderTopColor: "#e11d48",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 16px",
  },
  loadingText: { color: "#64748b", fontSize: "16px", margin: 0 },
  progressBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
  },
  progressStep: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  progressStepSpan: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#e2e8f0",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
  },
  progressActive: {
    color: "#e11d48",
  },
  progressActiveSpan: {
    background: "#e11d48",
    color: "#ffffff",
  },
  progressActiveSpanColor: {
    background: "#e11d48",
    color: "#ffffff",
  },
  progressLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#94a3b8",
    marginTop: "4px",
  },
  progressLine: {
    width: "40px",
    height: "2px",
    background: "#e2e8f0",
    margin: "0 8px",
    marginBottom: "20px",
  },
  header: { textAlign: "center", marginBottom: "20px" },
  iconBox: { fontSize: "40px", marginBottom: "8px" },
  title: { fontSize: "22px", fontWeight: "800", color: "#1e293b", margin: "0 0 4px 0" },
  subtitle: { fontSize: "14px", color: "#64748b", margin: 0 },
  amountCard: {
    background: "linear-gradient(135deg, #e11d48, #be123c)",
    borderRadius: "16px",
    padding: "20px",
    textAlign: "center",
    marginBottom: "20px",
  },
  amountLabel: { color: "rgba(255,255,255,0.7)", fontSize: "13px", fontWeight: "600", marginBottom: "4px" },
  amount: { color: "#ffffff", fontSize: "36px", fontWeight: "900" },
  amountHint: { color: "rgba(255,255,255,0.6)", fontSize: "12px", marginTop: "4px" },
  paymentSection: { marginBottom: "20px" },
  instruction: { fontSize: "14px", color: "#475569", textAlign: "center", marginBottom: "16px" },
  primaryBtn: {
    width: "100%",
    padding: "18px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white",
    border: "none",
    borderRadius: "14px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxShadow: "0 4px 15px rgba(34,197,94,0.4)",
  },
  btnIcon: { fontSize: "20px" },
  stkSection: {
    background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
    borderRadius: "16px",
    padding: "24px",
    textAlign: "center",
    marginBottom: "20px",
    border: "2px solid #22c55e",
  },
  stkIcon: {
    width: "48px", height: "48px", background: "#22c55e", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "white", fontSize: "24px", margin: "0 auto 12px",
  },
  stkTitle: { fontSize: "18px", fontWeight: "700", color: "#065f46", margin: "0 0 8px 0" },
  stkText: { fontSize: "14px", color: "#047857", marginBottom: "16px" },
  stkSteps: { display: "flex", gap: "16px", justifyContent: "center" },
  stkStep: { display: "flex", alignItems: "center", gap: "8px" },
  stkStepText: { fontSize: "12px", color: "#047857", margin: 0 },
  stkStepSpan: {
    width: "24px", height: "24px", background: "#22c55e", borderRadius: "50%",
    color: "white", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center",
  },
  errorSection: { textAlign: "center", padding: "20px" },
  errorText: { color: "#dc2626", fontSize: "14px", marginBottom: "12px" },
  retryBtn: {
    padding: "12px 24px", background: "#e2e8f0", color: "#475569",
    border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer",
  },
  verifyBtn: {
    width: "100%",
    padding: "14px",
    background: "#f1f5f9",
    color: "#475569",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "16px",
  },
  messageBox: {
    padding: "12px",
    background: "#fef3c7",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#92400e",
    textAlign: "center",
    marginBottom: "16px",
  },
  helpSection: {
    textAlign: "center",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    marginBottom: "16px",
  },
  helpIcon: { fontSize: "24px", marginBottom: "4px" },
  helpText: { fontSize: "13px", color: "#64748b", margin: "0 0 8px 0" },
  whatsappBtn: {
    padding: "10px 20px",
    background: "#25D366",
    color: "white",
    border: "none",
    borderRadius: "25px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  backBtn: {
    width: "100%",
    padding: "12px",
    background: "transparent",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  paymentOptionsSection: {
    marginBottom: "20px",
  },
  optionCard: {
    display: "flex",
    alignItems: "center",
    padding: "16px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    borderRadius: "14px",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(34,197,94,0.3)",
    marginBottom: "12px",
  },
  optionIcon: {
    fontSize: "28px",
    marginRight: "12px",
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#ffffff",
    margin: "0 0 4px 0",
  },
  optionDesc: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.8)",
    margin: 0,
  },
  optionArrow: {
    fontSize: "20px",
    color: "#ffffff",
    fontWeight: "700",
  },
  dividerContainer: {
    display: "flex",
    alignItems: "center",
    margin: "16px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#e2e8f0",
  },
  dividerText: {
    padding: "0 12px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#94a3b8",
  },
  optionCardSecondary: {
    display: "flex",
    alignItems: "center",
    padding: "16px",
    background: "#ffffff",
    border: "2px dashed #6366f1",
    borderRadius: "14px",
    cursor: "pointer",
  },
  optionTitleSecondary: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#6366f1",
    margin: "0 0 4px 0",
  },
  optionDescSecondary: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0,
  },
  manualEntrySection: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e2e8f0",
  },
  manualEntryHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "16px",
  },
  backToOptionsBtn: {
    padding: "8px 12px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    cursor: "pointer",
    marginRight: "12px",
  },
  manualEntryTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  instructionBox: {
    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px",
    border: "1px solid #bfdbfe",
  },
  instructionTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#1e40af",
    margin: "0 0 8px 0",
  },
  instructionList: {
    fontSize: "12px",
    color: "#1e40af",
    margin: 0,
    paddingLeft: "20px",
    lineHeight: "1.8",
  },
  mpesaInputWrapper: {
    marginBottom: "12px",
  },
  mpesaTextarea: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    fontSize: "13px",
    fontFamily: "monospace",
    resize: "vertical",
    minHeight: "120px",
    boxSizing: "border-box",
  },
  codeError: {
    padding: "12px",
    background: "#fef2f2",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#dc2626",
    marginBottom: "12px",
    textAlign: "center",
  },
  submitCodeBtn: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
  },
  codeSuccessBox: {
    textAlign: "center",
    padding: "24px",
    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
    borderRadius: "12px",
    border: "2px solid #22c55e",
  },
  successIcon: {
    width: "48px",
    height: "48px",
    background: "#22c55e",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "24px",
    margin: "0 auto 12px",
  },
  successTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#166534",
    margin: "0 0 8px 0",
  },
  successText: {
    fontSize: "13px",
    color: "#15803d",
    margin: 0,
    lineHeight: "1.5",
  },
};