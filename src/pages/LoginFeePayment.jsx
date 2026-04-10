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

        {paymentLink ? (
          <div style={styles.paymentSection}>
            <p style={styles.instruction}>
              Tap the button below to open M-Pesa and complete payment
            </p>
            <button style={styles.primaryBtn} onClick={handlePayWithMpesa}>
              <span style={styles.btnIcon}>📱</span>
              <span>Pay KES {LOGIN_FEE} via M-Pesa</span>
            </button>
          </div>
        ) : checkoutId ? (
          <div style={styles.stkSection}>
            <div style={styles.stkIcon}>✓</div>
            <h3 style={styles.stkTitle}>STK Push Sent</h3>
            <p style={styles.stkText}>
              Check your phone <strong>{phone}</strong> for the M-Pesa prompt
            </p>
            <div style={styles.stkSteps}>
              <div style={styles.stkStep}>
                <span style={styles.stkStepSpan}>1</span>
                <p style={styles.stkStepText}>Enter M-Pesa PIN</p>
              </div>
              <div style={styles.stkStep}>
                <span style={styles.stkStepSpan}>2</span>
                <p style={styles.stkStepText}>Confirm KES {LOGIN_FEE}</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.errorSection}>
            <p style={styles.errorText}>{message}</p>
            <button style={styles.retryBtn} onClick={() => window.location.reload()}>Try Again</button>
          </div>
        )}

        {checkoutId && (
          <button 
            style={styles.verifyBtn} 
            onClick={handleManualVerify}
            disabled={polling}
          >
            {polling ? `⏳ Checking... (${countdown}s)` : "✓ I Already Paid"}
          </button>
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
};