import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginFeeApi } from "../api/api";

const LOGIN_FEE = 100;

export default function LoginFeePayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [paymentLink, setPaymentLink] = useState(null);
  const [checkoutId, setCheckoutId] = useState(null);
  const [message, setMessage] = useState("");
  const [polling, setPolling] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const userId = location.state?.userId;
  const phone = location.state?.phone;

  useEffect(() => {
    if (!userId || !phone) {
      navigate("/auth?mode=login", { replace: true });
    }
  }, [userId, phone, navigate]);

  useEffect(() => {
    const initiatePayment = async () => {
      try {
        const res = await loginFeeApi.initiate();
        
        if (res.data.payment_link) {
          setPaymentLink(res.data.payment_link);
          setCheckoutId(res.data.checkout_id);
          setMessage("Payment link created! Click 'Pay with M-Pesa' to complete payment.");
        } else {
          setMessage("Could not create payment link. Please try again.");
        }
      } catch (err) {
        console.error("Initiate error:", err);
        setMessage("Failed to create payment. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (userId && phone) {
      initiatePayment();
    }
  }, [userId, phone]);

  useEffect(() => {
    if (polling) {
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            checkPayment();
            return 5;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [polling]);

  const handlePayWithMpesa = () => {
    if (paymentLink) {
      window.location.href = paymentLink;
    }
  };

  const checkPayment = async () => {
    if (!checkoutId) return;

    try {
      const res = await loginFeeApi.verify({ checkout_id: checkoutId });
      
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("lastLoginTime", Date.now().toString());
        localStorage.removeItem("pendingLoginUser");
        
        setMessage("✓ Payment verified! Logging you in...");
        
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1500);
      }
    } catch (err) {
      if (err.response?.data?.message === "Login fee already paid") {
        try {
          const loginRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone })
          }).then(r => r.json());

          if (loginRes.token) {
            localStorage.setItem("token", loginRes.token);
            localStorage.setItem("lastLoginTime", Date.now().toString());
            setMessage("✓ Payment verified! Logging you in...");
            setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
          }
        } catch (e) {
          // Continue polling
        }
      }
    }
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
            <p>Creating payment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.lockIcon}>🔐</span>
          <h1 style={styles.title}>Activation Required</h1>
          <p style={styles.subtitle}>
            Pay KES {LOGIN_FEE} to activate your account
          </p>
        </div>

        <div style={styles.paymentCard}>
          <div style={styles.amountDisplay}>
            <span style={styles.amountLabel}>Amount to Pay</span>
            <span style={styles.amount}>KES {LOGIN_FEE}</span>
          </div>

          {paymentLink ? (
            <button 
              style={styles.payBtn} 
              onClick={handlePayWithMpesa}
            >
              💳 Pay with M-Pesa
            </button>
          ) : (
            <div style={styles.fallbackSection}>
              <p style={styles.fallbackText}>
                Click the button below to initiate payment via M-Pesa
              </p>
              <button 
                style={styles.payBtn} 
                onClick={() => window.location.reload()}
              >
                🔄 Try Again
              </button>
            </div>
          )}

          <div style={styles.divider}>
            <span>OR</span>
          </div>

          <button 
            style={styles.checkBtn} 
            onClick={handleManualVerify}
            disabled={polling}
          >
            {polling ? `⏳ Checking... (${countdown}s)` : "✓ I've Already Paid"}
          </button>

          {message && (
            <div style={{
              ...styles.message,
              background: message.includes("✓") ? "#dcfce7" : "#fef3c7",
              color: message.includes("✓") ? "#166534" : "#92400e",
            }}>
              {message}
            </div>
          )}
        </div>

        <div style={styles.supportSection}>
          <p style={styles.supportText}>Need help?</p>
          <button style={styles.whatsappBtn} onClick={handleWhatsAppSupport}>
            💬 Chat on WhatsApp
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
    background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    width: "100%",
    maxWidth: "480px",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  loadingBox: {
    textAlign: "center",
    padding: "40px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTopColor: "#667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 16px",
  },
  header: {
    textAlign: "center",
    marginBottom: "20px",
  },
  lockIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "12px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  paymentCard: {
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
  },
  amountDisplay: {
    textAlign: "center",
    padding: "16px",
    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  amountLabel: {
    display: "block",
    color: "rgba(255,255,255,0.8)",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "4px",
  },
  amount: {
    color: "#ffffff",
    fontSize: "32px",
    fontWeight: "900",
  },
  fallbackSection: {
    textAlign: "center",
    padding: "20px 0",
  },
  fallbackText: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "16px",
  },
  payBtn: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
  },
  divider: {
    textAlign: "center",
    margin: "20px 0",
  },
  checkBtn: {
    width: "100%",
    padding: "14px",
    background: "transparent",
    color: "#64748b",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  message: {
    marginTop: "16px",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    textAlign: "center",
  },
  supportSection: {
    textAlign: "center",
    marginBottom: "20px",
  },
  supportText: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 12px 0",
  },
  whatsappBtn: {
    padding: "12px 20px",
    background: "#25D366",
    color: "white",
    border: "none",
    borderRadius: "25px",
    fontSize: "14px",
    fontWeight: "700",
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
