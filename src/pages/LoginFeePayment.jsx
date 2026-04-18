import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginFeeApi } from "../api/api";

const LOGIN_FEE = 100;

export default function LoginFeePayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [stkPushSent, setStkPushSent] = useState(false);
  const [stkPushMessage, setStkPushMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [checkStatusMessage, setCheckStatusMessage] = useState("");

  const pendingUser = JSON.parse(localStorage.getItem("pendingLoginUser") || "{}");
  const userId = location.state?.userId || pendingUser.id;
  const phone = location.state?.phone || pendingUser.phone;
  const [mpesaPhone, setMpesaPhone] = useState(phone || "");

  useEffect(() => {
    if (!userId || !phone) {
      navigate("/auth?mode=login", { replace: true });
      return;
    }
  }, [userId, phone, navigate]);

  // Check if user is already approved on page load
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const res = await loginFeeApi.checkStatus(userId);
        if (res.data.success && res.data.login_fee_paid) {
          // Already approved! Login and redirect
          const loginRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone })
          }).then(r => r.json());
          
          if (loginRes.token) {
            localStorage.setItem("token", loginRes.token);
            localStorage.setItem("lastLoginTime", Date.now().toString());
            localStorage.removeItem("pendingLoginUser");
            localStorage.removeItem("pendingLoginFeeApproval");
            navigate("/dashboard", { replace: true });
          }
        }
      } catch (err) {
        // User not approved yet, that's fine
        console.log("User not approved yet");
      }
    };
    
    checkInitialStatus();
  }, [userId, phone, navigate]);

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    setCheckStatusMessage("");
    try {
      const res = await loginFeeApi.checkStatus(userId);
      if (res.data.success && res.data.login_fee_paid) {
        setCheckStatusMessage("✅ Payment approved! Redirecting to dashboard...");
        localStorage.removeItem("pendingLoginFeeApproval");
        
        const loginRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone })
        }).then(r => r.json());
        
        if (loginRes.token) {
          localStorage.setItem("token", loginRes.token);
          localStorage.setItem("lastLoginTime", Date.now().toString());
          localStorage.removeItem("pendingLoginUser");
          localStorage.removeItem("pendingLoginFeeApproval");
          setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
        } else {
          setCheckStatusMessage("✅ Payment approved! Please sign in again.");
        }
      } else {
        setCheckStatusMessage("⏳ Payment not yet approved. Please wait for admin to verify your payment.");
      }
    } catch (err) {
      setCheckStatusMessage("Unable to check status. Please try again later.");
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleStkPush = async () => {
    if (!mpesaPhone.trim()) {
      setErrorMessage("Please enter your M-Pesa phone number");
      return;
    }
    
    setErrorMessage("");
    setLoading(true);
    setStkPushMessage("");
    
    try {
      // Call the initiate endpoint to send STK push
      const res = await loginFeeApi.initiate(userId);
      
      console.log("STK Push response:", res.data);
      
      if (res.data.success) {
        setStkPushSent(true);
        setStkPushMessage(`✅ ${res.data.message || "STK Push sent!"} Check your phone and enter your M-Pesa PIN.`);
        setErrorMessage("");
        
        // Store reference for admin verification
        if (res.data.reference) {
          localStorage.setItem("lastPaymentReference", res.data.reference);
        }
      } else {
        setErrorMessage(res.data.message || "Failed to send STK Push. Please try again.");
      }
    } catch (err) {
      console.error("STK Push error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to send STK Push";
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppSupport = () => {
    const msg = encodeURIComponent(`Hello Survopay Support, I need help with login fee payment. Phone: ${phone}`);
    window.open(`https://wa.me/2547785619533?text=${msg}`, '_blank');
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

        {/* STK Push Section - Main Payment Method */}
        <div style={styles.stkPushBox}>
          <p style={styles.stkPushTitle}>📱 Pay Instantly with M-Pesa STK Push</p>
          <p style={styles.stkPushHint}>No need to leave the app. STK push will be sent to your phone.</p>
          
          <input
            style={styles.mpesaPhoneInput}
            placeholder="Enter M-Pesa phone (e.g., 0740834185)"
            value={mpesaPhone}
            onChange={(e) => setMpesaPhone(e.target.value)}
          />
          
          <button 
            style={styles.stkPushBtn} 
            onClick={handleStkPush}
            disabled={loading || stkPushSent}
          >
            {loading ? "Sending STK Push..." : stkPushSent ? "✅ STK Push Sent!" : "Pay KES 100 via STK Push"}
          </button>
          
          {stkPushMessage && (
            <div style={styles.successMessageBox}>
              <p style={styles.successMessageText}>{stkPushMessage}</p>
              <p style={styles.approvalNote}>⏳ After payment, admin will verify and approve your account.</p>
            </div>
          )}
          
          {errorMessage && (
            <div style={styles.errorMessageBox}>
              <p style={styles.errorMessageText}>{errorMessage}</p>
            </div>
          )}
          
          {stkPushSent && (
            <button style={styles.checkStatusBtnSmall} onClick={handleCheckStatus} disabled={checkingStatus}>
              {checkingStatus ? "Checking..." : "✅ Already Paid? Click Here to Check Status"}
            </button>
          )}
        </div>

        {checkStatusMessage && (
          <div style={styles.checkStatusMessage}>{checkStatusMessage}</div>
        )}

        {/* Admin Approval Notice */}
        <div style={styles.noticeBox}>
          <p style={styles.noticeIcon}>⏳</p>
          <p style={styles.noticeTitle}>Manual Approval Required</p>
          <p style={styles.noticeText}>
            After completing payment, admin will verify and approve your account within 24 hours.
            Contact support if you don't receive approval.
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
            <span>Fast STK Push</span>
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
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
  },
  header: { textAlign: "center", marginBottom: "12px" },
  iconBox: { fontSize: "36px", marginBottom: "4px" },
  title: { fontSize: "22px", fontWeight: "800", color: "#1e293b", margin: "0 0 4px 0" },
  subtitle: { fontSize: "13px", color: "#64748b", margin: 0 },
  amountCard: {
    background: "linear-gradient(135deg, #e11d48, #be123c)",
    borderRadius: "12px",
    padding: "14px",
    textAlign: "center",
    marginBottom: "14px",
  },
  amountLabel: { color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: "600", marginBottom: "2px" },
  amount: { color: "#ffffff", fontSize: "28px", fontWeight: "900" },
  amountHint: { color: "rgba(255,255,255,0.6)", fontSize: "11px", marginTop: "2px" },
  stkPushBox: {
    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
    borderRadius: "12px",
    padding: "14px",
    textAlign: "center",
    marginBottom: "14px",
    border: "2px solid #22c55e",
  },
  stkPushTitle: { fontSize: "16px", fontWeight: "800", color: "#166534", margin: "0 0 4px 0" },
  stkPushHint: { fontSize: "12px", color: "#15803d", margin: "0 0 12px 0" },
  mpesaPhoneInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "2px solid #bbf7d0",
    fontSize: "15px",
    marginBottom: "10px",
    boxSizing: "border-box",
    textAlign: "center",
  },
  stkPushBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(34,197,94,0.4)",
  },
  checkStatusBtnSmall: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "10px",
  },
  successMessageBox: {
    marginTop: "12px",
    padding: "10px",
    background: "#bbf7d0",
    borderRadius: "8px",
  },
  successMessageText: { color: "#166534", fontSize: "13px", fontWeight: "600", margin: 0 },
  approvalNote: { color: "#15803d", fontSize: "11px", margin: "8px 0 0 0" },
  errorMessageBox: {
    marginTop: "12px",
    padding: "10px",
    background: "#fee2e2",
    borderRadius: "8px",
  },
  errorMessageText: { color: "#dc2626", fontSize: "13px", fontWeight: "600", margin: 0 },
  checkStatusMessage: {
    padding: "12px",
    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#92400e",
    textAlign: "center",
    marginBottom: "14px",
    border: "1px solid #f59e0b",
  },
  noticeBox: {
    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "12px",
    border: "1px solid #3b82f6",
    textAlign: "center",
  },
  noticeIcon: { fontSize: "24px", marginBottom: "4px" },
  noticeTitle: { fontSize: "14px", fontWeight: "700", color: "#1e40af", margin: "0 0 6px 0" },
  noticeText: { fontSize: "12px", color: "#1e3a8a", margin: 0, lineHeight: "1.5" },
  whyPayBox: {
    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "12px",
    border: "1px solid #f59e0b",
    textAlign: "center",
  },
  whyPayIcon: { fontSize: "20px", marginBottom: "4px" },
  whyPayTitle: { fontSize: "13px", fontWeight: "700", color: "#92400e", margin: "0 0 6px 0" },
  whyPayList: { fontSize: "11px", color: "#78350f", margin: 0, paddingLeft: "16px", textAlign: "left", lineHeight: "1.6" },
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