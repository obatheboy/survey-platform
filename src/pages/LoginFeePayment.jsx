import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginFeeApi } from "../api/api";

const LOGIN_FEE = 100;

export default function LoginFeePayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [mpesaCode, setMpesaCode] = useState("");
  const [submittingCode, setSubmittingCode] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [codeSuccess, setCodeSuccess] = useState(false);

  const pendingUser = JSON.parse(localStorage.getItem("pendingLoginUser") || "{}");
  const userId = location.state?.userId || pendingUser.id;
  const phone = location.state?.phone || pendingUser.phone;

  useEffect(() => {
    if (!userId || !phone) {
      navigate("/auth?mode=login", { replace: true });
    }
  }, [userId, phone, navigate]);

  const handleWhatsAppSupport = () => {
    const msg = encodeURIComponent(`Hello SurveyEarn Support, I need help with login fee payment. Phone: ${phone}`);
    window.open(`https://wa.me/2547140834185?text=${msg}`, '_blank');
  };

  const handleManualMpesaSubmit = async () => {
    if (!mpesaCode.trim()) {
      setCodeError("Please paste your M-Pesa confirmation message");
      return;
    }
    
    setCodeError("");
    setSubmittingCode(true);
    
    try {
      const res = await loginFeeApi.submitMpesaCode({ mpesa_code: mpesaCode.trim() });
      
      if (res.data.success) {
        setCodeSuccess(true);
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

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.iconBox}>💰</div>
          <h1 style={styles.title}>Activation Fee</h1>
          <p style={styles.subtitle}>Complete payment to unlock your account and start earning!</p>
        </div>

        <div style={styles.amountCard}>
          <div style={styles.amountLabel}>One-time Payment</div>
          <div style={styles.amount}>KES {LOGIN_FEE}</div>
          <div style={styles.amountHint}>Get KES 1,200+ in rewards</div>
        </div>

        <div style={styles.instructionBox}>
          <p style={styles.instructionTitle}>💳 How to Pay via M-Pesa:</p>
          <ol style={styles.instructionList}>
            <li>Go to M-Pesa on your phone</li>
            <li>Select "Send Money"</li>
            <li>Enter phone number: <strong>07140834185</strong></li>
            <li>Enter amount: <strong>KES {LOGIN_FEE}</strong></li>
            <li>Enter your PIN and confirm</li>
            <li>Copy the confirmation message you receive</li>
          </ol>
          <p style={styles.mpesaNumberHighlight}>
            📱 Send exactly KES {LOGIN_FEE} to: <br/>
            <span style={styles.phoneNumber}>07140834185</span>
          </p>
        </div>

        <div style={styles.whyPayBox}>
          <div style={styles.whyPayIcon}>🌟</div>
          <h4 style={styles.whyPayTitle}>Why Pay KES 100?</h4>
          <ul style={styles.whyPayList}>
            <li>✅ Access to all paid surveys</li>
            <li>✅ KES 1,200 welcome bonus</li>
            <li>✅ Instant withdrawal to M-Pesa</li>
            <li>✅ Verified member status</li>
            <li>✅ Priority customer support</li>
            <li>✅ 50,000+ successful users</li>
          </ul>
        </div>

        <div style={styles.mpesaInputWrapper}>
          <textarea
            style={styles.mpesaTextarea}
            placeholder="Paste your M-Pesa confirmation message here...

Example:
M-Pesa confirmed. 
You sent KES 100 to SurveyEarn.
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

        <div style={styles.trustSection}>
          <div style={styles.trustItem}>
            <span style={styles.trustIcon}>🛡️</span>
            <span>100% Secure</span>
          </div>
          <div style={styles.trustItem}>
            <span style={styles.trustIcon}>✓</span>
            <span>Licensed</span>
          </div>
          <div style={styles.trustItem}>
            <span style={styles.trustIcon}>⚡</span>
            <span>Fast</span>
          </div>
        </div>

        <div style={styles.helpSection}>
          <div style={styles.helpIcon}>❓</div>
          <p style={styles.helpText}>Need help?</p>
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
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
  header: { textAlign: "center", marginBottom: "20px" },
  iconBox: { fontSize: "48px", marginBottom: "8px" },
  title: { fontSize: "26px", fontWeight: "900", color: "#1e293b", margin: "0 0 4px 0" },
  subtitle: { fontSize: "14px", color: "#64748b", margin: 0 },
  amountCard: {
    background: "linear-gradient(135deg, #e11d48, #be123c)",
    borderRadius: "16px",
    padding: "20px",
    textAlign: "center",
    marginBottom: "20px",
  },
  amountLabel: { color: "rgba(255,255,255,0.7)", fontSize: "13px", fontWeight: "600", marginBottom: "4px" },
  amount: { color: "#ffffff", fontSize: "42px", fontWeight: "900" },
  amountHint: { color: "rgba(255,255,255,0.6)", fontSize: "13px", marginTop: "4px" },
  instructionBox: {
    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px",
    border: "1px solid #bfdbfe",
  },
  instructionTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#1e40af",
    margin: "0 0 10px 0",
  },
  instructionList: {
    fontSize: "13px",
    color: "#1e40af",
    margin: 0,
    paddingLeft: "20px",
    lineHeight: "1.9",
  },
  mpesaNumberHighlight: {
    fontSize: "14px",
    color: "#1e40af",
    textAlign: "center",
    marginTop: "14px",
    padding: "12px",
    background: "#dbeafe",
    borderRadius: "10px",
    border: "2px dashed #3b82f6",
  },
  phoneNumber: {
    fontSize: "22px",
    fontWeight: "900",
    color: "#1d4ed8",
    letterSpacing: "2px",
  },
  whyPayBox: {
    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px",
    border: "2px solid #f59e0b",
    textAlign: "center",
  },
  whyPayIcon: { fontSize: "28px", marginBottom: "8px" },
  whyPayTitle: { fontSize: "15px", fontWeight: "700", color: "#92400e", margin: "0 0 10px 0" },
  whyPayList: { fontSize: "12px", color: "#78350f", margin: 0, paddingLeft: "20px", textAlign: "left", lineHeight: "1.9" },
  mpesaInputWrapper: { marginBottom: "12px" },
  mpesaTextarea: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    fontSize: "13px",
    fontFamily: "monospace",
    resize: "vertical",
    minHeight: "130px",
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
    padding: "18px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#ffffff",
    border: "none",
    borderRadius: "14px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(34,197,94,0.4)",
    marginBottom: "16px",
  },
  codeSuccessBox: {
    textAlign: "center",
    padding: "24px",
    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
    borderRadius: "14px",
    border: "2px solid #22c55e",
    marginBottom: "16px",
  },
  successIcon: {
    width: "56px", height: "56px", background: "#22c55e", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#ffffff", fontSize: "28px", margin: "0 auto 12px",
  },
  successTitle: { fontSize: "20px", fontWeight: "700", color: "#166534", margin: "0 0 8px 0" },
  successText: { fontSize: "13px", color: "#15803d", margin: 0, lineHeight: "1.5" },
  trustSection: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: "16px",
    padding: "14px",
    background: "#f0fdf4",
    borderRadius: "12px",
    border: "1px solid #86efac",
  },
  trustItem: { display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "600", color: "#166534" },
  trustIcon: { fontSize: "16px" },
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
};