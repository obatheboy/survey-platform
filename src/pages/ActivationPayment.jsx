import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import toast from "react-hot-toast";

const MPESA_NUMBER = "0794101450";
const CEO_NAME = "Obadiah Otoki";
const ACTIVATION_FEE = 100;
const WELCOME_BONUS = 1200;

export default function ActivationPayment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("PENDING");
  const [mpesaCode, setMpesaCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkStatus();
    
    // Poll for status updates every 10 seconds
    const interval = setInterval(() => {
      checkStatus();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const res = await api.get("/initial-activation/status");
      setStatus(res.data.status);
      if (res.data.mpesa_code) {
        setMpesaCode(res.data.mpesa_code);
      }
    } catch (err) {
      console.error("Error checking status:", err);
    }
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(MPESA_NUMBER);
    setCopied(true);
    toast.success("Number copied!");
    setTimeout(() => setCopied(false), 2000);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cachedUser");
    navigate("/auth?mode=login");
  };

  return (
    <div style={styles.page}>
      {/* Simplified background for mobile */}
      <div style={styles.backgroundBlur1}></div>
      <div style={styles.backgroundBlur2}></div>
      
      <div style={styles.card}>
        {/* Header - Compact */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <div style={styles.logoWrapper}>
              <span style={styles.logoIcon}>✓</span>
            </div>
            <div style={styles.headerText}>
              <h1 style={styles.title}>Account Activation</h1>
              <p style={styles.subtitle}>
                Pay KES {ACTIVATION_FEE} to start earning
              </p>
            </div>
          </div>
        </div>

        {/* Status Banner - APPROVED */}
        {status === "APPROVED" && (
          <div style={styles.approvedBanner}>
            <span style={styles.approvedIcon}>✓</span>
            <span style={styles.approvedText}>Your account is activated!</span>
            <button 
              onClick={() => navigate("/dashboard")}
              style={styles.goToDashboardBtn}
            >
              Go to Dashboard →
            </button>
          </div>
        )}

        {/* Status Banner - SUBMITTED */}
        {status === "SUBMITTED" && (
          <div style={styles.pendingBanner}>
            <span style={styles.pendingIcon}>⏳</span>
            <span style={styles.pendingText}>Payment submitted!</span>
            <p style={styles.pendingNote}>Waiting for admin approval (usually 2-5 min)</p>
            <button onClick={checkStatus} style={styles.refreshButton}>
              Refresh Status
            </button>
          </div>
        )}

        {/* Payment Form - PENDING or other */}
        {status !== "APPROVED" && status !== "SUBMITTED" && (
          <div style={styles.paymentContainer}>
            {/* Trust Badge */}
            <div style={styles.trustBadge}>
              <span style={styles.trustIcon}>⚡</span>
              <span style={styles.trustText}>Get KES {WELCOME_BONUS} instantly after activation!</span>
            </div>

            {/* HOW TO PAY section - exactly as requested */}
            <div style={styles.instructionSection}>
              <h2 style={styles.sectionTitle}>📲 HOW TO PAY & ACTIVATE</h2>
              
              <div style={styles.warningBox}>
                <span style={styles.warningIcon}>⚠️</span>
                <span style={styles.warningText}>IMPORTANT: Pay to this number of the CEO</span>
                <span style={styles.ceoNumber}>🚀0794 101 450🚀</span>
                <span style={styles.verifiedText}>and payments are verified instantly after payment</span>
              </div>

              <div style={styles.stepsContainer}>
                <div style={styles.step}>
                  <span style={styles.stepNumber}>1</span>
                  <span>Open M-Pesa → Lipa na M-PESA</span>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepNumber}>2</span>
                  <span>Send Money → Enter 0794101450</span>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepNumber}>3</span>
                  <span>Confirm: Obadiah Otoki</span>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepNumber}>4</span>
                  <span>Amount: KES 100</span>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepNumber}>5</span>
                  <span>Enter PIN & Complete</span>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepNumber}>6</span>
                  <span>Paste confirmation below</span>
                </div>
              </div>

              {/* Bonus Highlight */}
              <div style={styles.bonusBox}>
                <span style={styles.bonusIcon}>🎁</span>
                <span style={styles.bonusText}>Get KES {WELCOME_BONUS} instantly!</span>
              </div>

              {/* Copy Number Section - Prominent */}
              <div style={styles.copySection}>
                <div style={styles.phoneDisplay}>
                  <span style={styles.phoneIcon}>📞</span>
                  <span style={styles.phoneNumber}>0794101450</span>
                </div>
                <button onClick={copyNumber} style={styles.copyButton}>
                  {copied ? "✓ Copied!" : "📋 Copy Number"}
                </button>
              </div>
            </div>

            {/* Form Section - with requested text */}
            <form onSubmit={handleSubmit} style={styles.formSection}>
              <h3 style={styles.formTitle}>📌 Paste the FULL M-Pesa SMS below</h3>
              <p style={styles.formNote}>
                ⚠ Include Transaction ID, Amount & Time
              </p>
              
              <textarea
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value)}
                placeholder="Paste your M-Pesa confirmation message here..."
                style={styles.textarea}
                rows={3}
              />

              <div style={styles.buttonGroup}>
                <button 
                  type="submit" 
                  disabled={loading || !mpesaCode.trim()}
                  style={{
                    ...styles.submitButton,
                    opacity: loading || !mpesaCode.trim() ? 0.6 : 1,
                  }}
                >
                  {loading ? "Submitting..." : "✅ Confirm Payment"}
                </button>
                
                <button 
                  type="button" 
                  onClick={checkStatus} 
                  style={styles.checkButton}
                >
                  🔄 Check
                </button>
              </div>
            </form>

            {/* Support Info */}
            <div style={styles.supportSection}>
              <span style={styles.supportIcon}>💬</span>
              <span style={styles.supportText}>
                Having issues? Contact support
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={handleLogout} style={styles.logoutButton}>
            ← Logout
          </button>
          <span style={styles.footerText}>© 2024 SurveyEarn</span>
        </div>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
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

// Mobile-optimized styles
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
    padding: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
  },
  backgroundBlur1: {
    position: "fixed",
    top: "-30%",
    right: "-20%",
    width: "300px",
    height: "300px",
    background: "rgba(99, 102, 241, 0.2)",
    borderRadius: "50%",
    filter: "blur(60px)",
    zIndex: 0,
  },
  backgroundBlur2: {
    position: "fixed",
    bottom: "-30%",
    left: "-20%",
    width: "250px",
    height: "250px",
    background: "rgba(236, 72, 153, 0.15)",
    borderRadius: "50%",
    filter: "blur(50px)",
    zIndex: 0,
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    background: "#ffffff",
    borderRadius: "28px",
    padding: "18px 14px",
    boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.4)",
    position: "relative",
    zIndex: 1,
    animation: "fadeIn 0.3s ease-out",
    maxHeight: "98vh",
    overflowY: "auto",
  },
  header: {
    marginBottom: "14px",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoWrapper: {
    width: "40px",
    height: "40px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 16px -4px rgba(102, 126, 234, 0.3)",
  },
  logoIcon: {
    fontSize: "20px",
    color: "#ffffff",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: "12px",
    color: "#64748b",
    margin: "2px 0 0 0",
    fontWeight: "500",
  },
  approvedBanner: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    marginBottom: "14px",
  },
  approvedIcon: {
    fontSize: "22px",
    color: "#ffffff",
  },
  approvedText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "14px",
  },
  pendingBanner: {
    background: "#fef3c7",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    marginBottom: "14px",
    border: "1px solid #fbbf24",
  },
  pendingIcon: {
    fontSize: "20px",
  },
  pendingText: {
    color: "#92400e",
    fontWeight: "600",
    fontSize: "14px",
  },
  pendingNote: {
    fontSize: "11px",
    color: "#b45309",
    margin: 0,
    textAlign: "center",
  },
  paymentContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  trustBadge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px",
    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
    borderRadius: "30px",
    fontSize: "12px",
    color: "#92400e",
    fontWeight: "700",
    marginBottom: "2px",
    border: "1px solid #fbbf24",
    animation: "pulse 2s ease-in-out infinite",
  },
  trustIcon: {
    fontSize: "14px",
  },
  instructionSection: {
    background: "#f8fafc",
    borderRadius: "20px",
    padding: "14px",
    border: "1px solid #e2e8f0",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 12px 0",
    textAlign: "center",
  },
  warningBox: {
    backgroundColor: "#fef2f2",
    border: "2px solid #ef4444",
    borderRadius: "14px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    marginBottom: "14px",
  },
  warningIcon: {
    fontSize: "18px",
  },
  warningText: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#dc2626",
    textAlign: "center",
  },
  ceoNumber: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#dc2626",
    letterSpacing: "1px",
  },
  verifiedText: {
    fontSize: "12px",
    color: "#059669",
    fontWeight: "600",
    textAlign: "center",
  },
  stepsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "14px",
  },
  step: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    color: "#374151",
  },
  stepNumber: {
    width: "24px",
    height: "24px",
    backgroundColor: "#6366f1",
    color: "#ffffff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "12px",
    flexShrink: 0,
  },
  bonusBox: {
    backgroundColor: "#f0fdf4",
    border: "2px dashed #22c55e",
    borderRadius: "40px",
    padding: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "14px",
  },
  bonusIcon: {
    fontSize: "18px",
  },
  bonusText: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#15803d",
  },
  copySection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: "40px",
    padding: "8px 12px",
    border: "2px solid #6366f1",
  },
  phoneDisplay: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  phoneIcon: {
    fontSize: "18px",
  },
  phoneNumber: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "1px",
  },
  copyButton: {
    backgroundColor: "#6366f1",
    color: "#ffffff",
    border: "none",
    borderRadius: "30px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  formSection: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "14px",
    border: "1px solid #e2e8f0",
  },
  formTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 2px 0",
    textAlign: "center",
  },
  formNote: {
    fontSize: "11px",
    color: "#ef4444",
    margin: "0 0 12px 0",
    textAlign: "center",
    fontWeight: "500",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    border: "2px solid #e2e8f0",
    borderRadius: "14px",
    fontSize: "12px",
    fontFamily: "inherit",
    resize: "none",
    boxSizing: "border-box",
    marginBottom: "12px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  buttonGroup: {
    display: "flex",
    gap: "6px",
  },
  submitButton: {
    flex: 3,
    padding: "12px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#ffffff",
    border: "none",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  checkButton: {
    flex: 1,
    padding: "12px",
    background: "#ffffff",
    color: "#334155",
    border: "2px solid #e2e8f0",
    borderRadius: "40px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  supportSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px",
    background: "#f1f5f9",
    borderRadius: "30px",
    fontSize: "11px",
    color: "#334155",
  },
  supportIcon: {
    fontSize: "12px",
  },
  footer: {
    marginTop: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "10px",
  },
  logoutButton: {
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    padding: "4px 0",
  },
  footerText: {
    fontSize: "10px",
    color: "#94a3b8",
  },
  goToDashboardBtn: {
    background: "#ffffff",
    color: "#10b981",
    border: "none",
    borderRadius: "30px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "4px",
  },
  refreshButton: {
    background: "#fbbf24",
    color: "#92400e",
    border: "none",
    borderRadius: "30px",
    padding: "8px 14px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "4px",
  },
};