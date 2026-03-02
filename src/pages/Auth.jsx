import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import toast from "react-hot-toast";

const MPESA_NUMBER = "0794101450";
const CEO_NAME = "Obadiah Otoki";
const ACTIVATION_FEE = 100;

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
              <span style={styles.trustIcon}>🔒</span>
              <span style={styles.trustText}>Secured by M-Pesa</span>
            </div>

            {/* Payment Instructions - Simplified */}
            <div style={styles.instructionBox}>
              <div style={styles.instructionHeader}>
                <span style={styles.instructionIcon}>📱</span>
                <span style={styles.instructionTitle}>Pay via M-Pesa</span>
              </div>
              
              <div style={styles.paymentDetails}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Business No:</span>
                  <div style={styles.numberContainer}>
                    <span style={styles.detailValue}>{MPESA_NUMBER}</span>
                    <button onClick={copyNumber} style={styles.copySmallBtn}>
                      {copied ? "✓" : "📋"}
                    </button>
                  </div>
                </div>
                
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Account:</span>
                  <span style={styles.detailValue}>{CEO_NAME}</span>
                </div>
                
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Amount:</span>
                  <span style={styles.detailValue}>KES {ACTIVATION_FEE}</span>
                </div>
              </div>

              {/* Quick Steps */}
              <div style={styles.stepsGrid}>
                <div style={styles.step}>
                  <span style={styles.stepDot}>1</span>
                  <span style={styles.stepText}>Lipa na M-PESA</span>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepDot}>2</span>
                  <span style={styles.stepText}>Enter PIN</span>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepDot}>3</span>
                  <span style={styles.stepText}>Confirm</span>
                </div>
              </div>
            </div>

            {/* Form Section - Compact */}
            <form onSubmit={handleSubmit} style={styles.formSection}>
              <label style={styles.formLabel}>
                <span style={styles.labelIcon}>📋</span>
                Paste M-Pesa confirmation
              </label>
              
              <textarea
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value)}
                placeholder="Paste the full M-Pesa SMS here..."
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
                  🔄 Check Status
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
    padding: "12px",
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
    padding: "20px 16px",
    boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.4)",
    position: "relative",
    zIndex: 1,
    animation: "fadeIn 0.3s ease-out",
  },
  header: {
    marginBottom: "16px",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoWrapper: {
    width: "44px",
    height: "44px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 16px -4px rgba(102, 126, 234, 0.3)",
  },
  logoIcon: {
    fontSize: "24px",
    color: "#ffffff",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: "2px 0 0 0",
    fontWeight: "500",
  },
  approvedBanner: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  approvedIcon: {
    fontSize: "24px",
    color: "#ffffff",
  },
  approvedText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "15px",
  },
  pendingBanner: {
    background: "#fef3c7",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    marginBottom: "16px",
    border: "1px solid #fbbf24",
  },
  pendingIcon: {
    fontSize: "22px",
  },
  pendingText: {
    color: "#92400e",
    fontWeight: "600",
    fontSize: "15px",
  },
  pendingNote: {
    fontSize: "12px",
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
    padding: "6px",
    background: "#f1f5f9",
    borderRadius: "30px",
    fontSize: "12px",
    color: "#334155",
    fontWeight: "600",
    marginBottom: "4px",
  },
  trustIcon: {
    fontSize: "14px",
  },
  instructionBox: {
    background: "#f8fafc",
    borderRadius: "20px",
    padding: "16px",
    border: "1px solid #e2e8f0",
  },
  instructionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  instructionIcon: {
    fontSize: "20px",
  },
  instructionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
  },
  paymentDetails: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "12px",
    marginBottom: "16px",
    border: "1px solid #e2e8f0",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  detailLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },
  numberContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  copySmallBtn: {
    background: "#e2e8f0",
    border: "none",
    borderRadius: "6px",
    padding: "4px 8px",
    fontSize: "12px",
    cursor: "pointer",
    color: "#334155",
  },
  stepsGrid: {
    display: "flex",
    justifyContent: "space-between",
    gap: "6px",
  },
  step: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  stepDot: {
    width: "24px",
    height: "24px",
    background: "#e2e8f0",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
    color: "#334155",
  },
  stepText: {
    fontSize: "9px",
    color: "#64748b",
    fontWeight: "500",
    textAlign: "center",
  },
  formSection: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "16px",
    border: "1px solid #e2e8f0",
  },
  formLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "8px",
  },
  labelIcon: {
    fontSize: "16px",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    border: "2px solid #e2e8f0",
    borderRadius: "14px",
    fontSize: "13px",
    fontFamily: "inherit",
    resize: "none",
    boxSizing: "border-box",
    marginBottom: "12px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
  },
  submitButton: {
    flex: 2,
    padding: "14px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#ffffff",
    border: "none",
    borderRadius: "40px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  checkButton: {
    flex: 1,
    padding: "14px",
    background: "#ffffff",
    color: "#334155",
    border: "2px solid #e2e8f0",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  supportSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "10px",
    background: "#f1f5f9",
    borderRadius: "30px",
    fontSize: "12px",
    color: "#334155",
  },
  supportIcon: {
    fontSize: "14px",
  },
  footer: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "12px",
  },
  logoutButton: {
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    padding: "4px 0",
  },
  footerText: {
    fontSize: "11px",
    color: "#94a3b8",
  },
  goToDashboardBtn: {
    background: "#ffffff",
    color: "#10b981",
    border: "none",
    borderRadius: "30px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "4px",
  },
  refreshButton: {
    background: "#fbbf24",
    color: "#92400e",
    border: "none",
    borderRadius: "30px",
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "6px",
  },
};