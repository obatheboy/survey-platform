
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import toast from "react-hot-toast";

const MPESA_NUMBER = "0794101450";
const CEO_NAME = "Obadiah Otoki";
const ACTIVATION_FEE = 100;
const WELCOME_BONUS = 1200;
const WHATSAPP_NUMBER = "254786357584";

export default function ActivationPayment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("PENDING");
  const [mpesaCode, setMpesaCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    checkStatus();
    
    // Poll for status updates every 10 seconds
    const interval = setInterval(() => {
      checkStatus();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-redirect when status becomes APPROVED
  useEffect(() => {
    if (status === "APPROVED") {
      toast.success("Account activated successfully! Redirecting to dashboard...");
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 2000);
    }
  }, [status, navigate]);

  const checkStatus = async () => {
    if (checkingStatus) return;
    
    setCheckingStatus(true);
    try {
      const res = await api.get("/initial-activation/status");
      setStatus(res.data.status);
      if (res.data.mpesa_code) {
        setMpesaCode(res.data.mpesa_code);
      }
    } catch (err) {
      console.error("Error checking status:", err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(MPESA_NUMBER);
    setCopied(true);
    toast.success("Number copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      "Hello, I need help with my account activation. I have made a payment of KES 100 to 0794101450."
    );
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!mpesaCode.trim()) {
      toast.error("Please enter the M-Pesa confirmation code");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/initial-activation/submit", {
        mpesa_code: mpesaCode.trim()
      });
      
      if (res.data.success) {
        toast.success("Payment submitted! Waiting for admin approval.");
        setStatus("SUBMITTED");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit payment");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate("/auth?mode=register");
  };

  return (
    <div style={styles.page}>
      {/* Professional gradient background */}
      <div style={styles.backgroundBlur1}></div>
      <div style={styles.backgroundBlur2}></div>
      <div style={styles.backgroundBlur3}></div>
      
      <div style={styles.card}>
        {/* Header - Professional */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <div style={styles.logoWrapper}>
              <span style={styles.logoIcon}>✓</span>
            </div>
            <div style={styles.headerText}>
              <h1 style={styles.title}>Account Activation</h1>
              <p style={styles.subtitle}>
                One-time payment of <span style={styles.highlight}>KES {ACTIVATION_FEE}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Status Banner - APPROVED */}
        {status === "APPROVED" && (
          <div style={styles.approvedBanner}>
            <div style={styles.approvedIconWrapper}>
              <span style={styles.approvedIcon}>✓</span>
            </div>
            <div style={styles.approvedContent}>
              <span style={styles.approvedText}>Account Activated Successfully!</span>
              <span style={styles.approvedSubtext}>Redirecting to dashboard...</span>
            </div>
          </div>
        )}

        {/* Status Banner - SUBMITTED */}
        {status === "SUBMITTED" && (
          <div style={styles.pendingBanner}>
            <div style={styles.pendingIconWrapper}>
              <span style={styles.pendingIcon}>⏳</span>
            </div>
            <div style={styles.pendingContent}>
              <span style={styles.pendingText}>Payment Submitted</span>
              <span style={styles.pendingNote}>Awaiting verification (2-5 min)</span>
            </div>
            <div style={styles.pendingActions}>
              <button onClick={checkStatus} style={styles.refreshButton} disabled={checkingStatus}>
                {checkingStatus ? "Checking..." : "↻ Refresh"}
              </button>
              <button onClick={handleWhatsApp} style={styles.whatsappPendingButton}>
                💬 Support
              </button>
            </div>
          </div>
        )}

        {/* Payment Form - PENDING or other */}
        {status !== "APPROVED" && status !== "SUBMITTED" && (
          <div style={styles.paymentContainer}>
            {/* Payment Summary Card */}
            <div style={styles.summaryCard}>
              <div style={styles.summaryHeader}>
                <span style={styles.summaryIcon}>🔒</span>
                <span style={styles.summaryTitle}>Activation Payment Required</span>
              </div>
              <div style={styles.summaryContent}>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Amount:</span>
                  <span style={styles.summaryValue}>KES {ACTIVATION_FEE}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>You'll receive:</span>
                  <span style={styles.summaryBonus}>KES {WELCOME_BONUS} Welcome Bonus</span>
                </div>
              </div>
            </div>

            {/* Instructions Card */}
            <div style={styles.instructionsCard}>
              <h2 style={styles.instructionsTitle}>📲 How to Pay via M-Pesa</h2>
              
              {/* Important Notice */}
              <div style={styles.importantNotice}>
                <span style={styles.importantIcon}>⚠️</span>
                <span style={styles.importantText}>
                  Pay to CEO's number only: <strong>{MPESA_NUMBER}</strong>
                </span>
              </div>

              {/* Steps Grid */}
              <div style={styles.stepsGrid}>
                <div style={styles.stepItem}>
                  <span style={styles.stepNumber}>1</span>
                  <span style={styles.stepText}>Open M-Pesa</span>
                </div>
                <div style={styles.stepItem}>
                  <span style={styles.stepNumber}>2</span>
                  <span style={styles.stepText}>Send Money</span>
                </div>
                <div style={styles.stepItem}>
                  <span style={styles.stepNumber}>3</span>
                  <span style={styles.stepText}>Enter <strong>0794101450</strong></span>
                </div>
                <div style={styles.stepItem}>
                  <span style={styles.stepNumber}>4</span>
                  <span style={styles.stepText}>Confirm <strong>{CEO_NAME}</strong></span>
                </div>
                <div style={styles.stepItem}>
                  <span style={styles.stepNumber}>5</span>
                  <span style={styles.stepText}>Amount <strong>KES {ACTIVATION_FEE}</strong></span>
                </div>
                <div style={styles.stepItem}>
                  <span style={styles.stepNumber}>6</span>
                  <span style={styles.stepText}>Enter PIN</span>
                </div>
                <div style={styles.stepItem}>
                  <span style={styles.stepNumber}>7</span>
                  <span style={styles.stepText}>Copy SMS</span>
                </div>
                <div style={styles.stepItem}>
                  <span style={styles.stepNumber}>8</span>
                  <span style={styles.stepText}>Paste below</span>
                </div>
              </div>

              {/* Copy Number */}
              <div style={styles.copyNumberCard}>
                <div style={styles.numberDisplay}>
                  <span style={styles.numberIcon}>📞</span>
                  <span style={styles.numberText}>{MPESA_NUMBER}</span>
                </div>
                <button onClick={copyNumber} style={styles.copyNumberButton}>
                  {copied ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>

              {/* Bonus Highlight */}
              <div style={styles.bonusCard}>
                <span style={styles.bonusIcon}>🎁</span>
                <span style={styles.bonusText}>
                  Get KES {WELCOME_BONUS} welcome bonus immediately after activation!
                </span>
              </div>
            </div>

            {/* Form Card */}
            <div style={styles.formCard}>
              <h3 style={styles.formTitle}>Confirm Your Payment</h3>
              <p style={styles.formSubtitle}>
                Paste the complete M-Pesa confirmation message
              </p>
              
              <textarea
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value)}
                placeholder="Paste your M-Pesa confirmation SMS here..."
                style={styles.textarea}
                rows={3}
              />

              <div style={styles.formActions}>
                <button 
                  type="submit" 
                  onClick={handleSubmit}
                  disabled={loading || !mpesaCode.trim()}
                  style={{
                    ...styles.submitButton,
                    opacity: loading || !mpesaCode.trim() ? 0.6 : 1,
                  }}
                >
                  {loading ? "Processing..." : "Confirm Payment"}
                </button>
                
                <button 
                  type="button" 
                  onClick={checkStatus} 
                  style={styles.statusButton}
                  disabled={checkingStatus}
                >
                  {checkingStatus ? "..." : "↻ Status"}
                </button>
              </div>
            </div>

            {/* Support Card */}
            <div style={styles.supportCard}>
              <button onClick={handleWhatsApp} style={styles.whatsappButton}>
                <span style={styles.whatsappIcon}>💬</span>
                <span style={styles.whatsappText}>Need Help? Chat with Support</span>
                <span style={styles.whatsappArrow}>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={handleGoBack} style={styles.goBackButton}>
            ← Back to Registration
          </button>
          <div style={styles.footerBadge}>
            <span style={styles.footerBadgeIcon}>✓</span>
            <span style={styles.footerBadgeText}>Secured by M-Pesa</span>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slideIn {
            from { transform: translateX(-10px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}
      </style>
    </div>
  );
}

// Professional, well-spaced styles
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
  },
  backgroundBlur1: {
    position: "fixed",
    top: "-20%",
    right: "-10%",
    width: "400px",
    height: "400px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    filter: "blur(60px)",
    zIndex: 0,
  },
  backgroundBlur2: {
    position: "fixed",
    bottom: "-20%",
    left: "-10%",
    width: "350px",
    height: "350px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    filter: "blur(50px)",
    zIndex: 0,
  },
  backgroundBlur3: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "300px",
    height: "300px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "50%",
    filter: "blur(40px)",
    zIndex: 0,
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    background: "#ffffff",
    borderRadius: "32px",
    padding: "28px 24px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    position: "relative",
    zIndex: 1,
    animation: "fadeIn 0.4s ease-out",
    maxHeight: "95vh",
    overflowY: "auto",
  },
  header: {
    marginBottom: "28px",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  logoWrapper: {
    width: "56px",
    height: "56px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 20px -5px rgba(102, 126, 234, 0.4)",
  },
  logoIcon: {
    fontSize: "28px",
    color: "#ffffff",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 4px 0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "15px",
    color: "#64748b",
    margin: 0,
    fontWeight: "500",
  },
  highlight: {
    color: "#667eea",
    fontWeight: "700",
  },
  approvedBanner: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    borderRadius: "20px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
    animation: "slideIn 0.3s ease-out",
  },
  approvedIconWrapper: {
    width: "48px",
    height: "48px",
    background: "rgba(255, 255, 255, 0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  approvedIcon: {
    fontSize: "28px",
    color: "#ffffff",
  },
  approvedContent: {
    flex: 1,
  },
  approvedText: {
    display: "block",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "4px",
  },
  approvedSubtext: {
    display: "block",
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "14px",
  },
  pendingBanner: {
    background: "#fef3c7",
    borderRadius: "20px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
    border: "1px solid #fbbf24",
    flexWrap: "wrap",
  },
  pendingIconWrapper: {
    width: "40px",
    height: "40px",
    background: "#fbbf24",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingIcon: {
    fontSize: "22px",
  },
  pendingContent: {
    flex: 1,
  },
  pendingText: {
    display: "block",
    color: "#92400e",
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "2px",
  },
  pendingNote: {
    display: "block",
    color: "#b45309",
    fontSize: "13px",
  },
  pendingActions: {
    display: "flex",
    gap: "8px",
    width: "100%",
    marginTop: "8px",
  },
  paymentContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  summaryCard: {
    background: "linear-gradient(135deg, #1e293b, #0f172a)",
    borderRadius: "20px",
    padding: "20px",
  },
  summaryHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid #334155",
  },
  summaryIcon: {
    fontSize: "20px",
  },
  summaryTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#fbbf24",
    letterSpacing: "0.5px",
  },
  summaryContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: "14px",
    color: "#94a3b8",
  },
  summaryValue: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#fbbf24",
  },
  summaryBonus: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#4ade80",
  },
  instructionsCard: {
    background: "#f8fafc",
    borderRadius: "20px",
    padding: "24px",
    border: "1px solid #e2e8f0",
  },
  instructionsTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 20px 0",
    textAlign: "center",
  },
  importantNotice: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
  },
  importantIcon: {
    fontSize: "20px",
  },
  importantText: {
    fontSize: "14px",
    color: "#b91c1c",
    fontWeight: "500",
    flex: 1,
  },
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  stepNumber: {
    width: "32px",
    height: "32px",
    background: "#e2e8f0",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
    color: "#475569",
  },
  stepText: {
    fontSize: "13px",
    color: "#334155",
    flex: 1,
  },
  copyNumberCard: {
    background: "#ffffff",
    border: "2px solid #667eea",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  numberDisplay: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  numberIcon: {
    fontSize: "24px",
  },
  numberText: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: "1px",
  },
  copyNumberButton: {
    background: "#667eea",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  bonusCard: {
    background: "#f0fdf4",
    border: "2px dashed #22c55e",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  bonusIcon: {
    fontSize: "28px",
  },
  bonusText: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#15803d",
    flex: 1,
    lineHeight: "1.5",
  },
  formCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "24px",
    border: "1px solid #e2e8f0",
  },
  formTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  formSubtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 20px 0",
  },
  textarea: {
    width: "100%",
    padding: "16px",
    border: "2px solid #e2e8f0",
    borderRadius: "16px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "none",
    boxSizing: "border-box",
    marginBottom: "20px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  formActions: {
    display: "flex",
    gap: "12px",
  },
  submitButton: {
    flex: 2,
    padding: "16px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#ffffff",
    border: "none",
    borderRadius: "14px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  statusButton: {
    flex: 1,
    padding: "16px",
    background: "#ffffff",
    color: "#475569",
    border: "2px solid #e2e8f0",
    borderRadius: "14px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  supportCard: {
    marginTop: "8px",
  },
  whatsappButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "16px",
    background: "linear-gradient(135deg, #25D366, #128C7E)",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    color: "white",
    fontWeight: "600",
    fontSize: "15px",
    transition: "all 0.2s",
    boxShadow: "0 10px 20px -5px rgba(37, 211, 102, 0.3)",
  },
  whatsappIcon: {
    fontSize: "20px",
  },
  whatsappText: {
    fontSize: "15px",
  },
  whatsappArrow: {
    fontSize: "18px",
    opacity: 0.8,
  },
  whatsappPendingButton: {
    flex: 1,
    padding: "10px",
    background: "#25D366",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  refreshButton: {
    flex: 1,
    padding: "10px",
    background: "#fbbf24",
    color: "#92400e",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  footer: {
    marginTop: "28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "20px",
  },
  goBackButton: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "8px 0",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  footerBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    background: "#f1f5f9",
    borderRadius: "30px",
  },
  footerBadgeIcon: {
    fontSize: "12px",
    color: "#10b981",
  },
  footerBadgeText: {
    fontSize: "11px",
    color: "#475569",
    fontWeight: "500",
  },
};