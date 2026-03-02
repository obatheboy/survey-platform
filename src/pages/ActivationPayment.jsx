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
      <div style={styles.backgroundBlur1}></div>
      <div style={styles.backgroundBlur2}></div>
      
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <div style={styles.logoIcon}>🔒</div>
            <h1 style={styles.title}>Account Activation</h1>
          </div>
          <p style={styles.subtitle}>
            Pay KES {ACTIVATION_FEE} to activate your account
          </p>
        </div>

        {/* Status Banner - APPROVED */}
        {status === "APPROVED" && (
          <div style={styles.approvedBanner}>
            <span style={styles.approvedIcon}>✓</span>
            <span>Your account is activated!</span>
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
            <span>Payment submitted! Waiting for admin approval.</span>
            <p style={styles.pendingNote}>
              This usually takes a few minutes. Please wait or contact support.
            </p>
            <button onClick={checkStatus} style={styles.refreshButton}>
              🔄 Refresh Status
            </button>
          </div>
        )}

        {/* Status Banner - PENDING or other */}
        {status !== "APPROVED" && status !== "SUBMITTED" && (
          <div>
            {/* Payment Instructions */}
            <div style={styles.instructionSection}>
              <h2 style={styles.sectionTitle}>📲 HOW TO PAY & ACTIVATE</h2>
              
              <div style={styles.warningBox}>
                <span style={styles.warningIcon}>⚠️</span>
                <span style={styles.warningText}>IMPORTANT: Pay to this number of the CEO</span>
                <span style={styles.ceoNumber}>🚀{MPESA_NUMBER}🚀</span>
              </div>

              <div style={styles.stepsContainer}>
                <div style={styles.step}>
                  <span style={styles.stepNumber}>1</span>
                  <span>Open M-Pesa → Lipa na M-PESA</span>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepNumber}>2</span>
                  <span>Send Money → Enter {MPESA_NUMBER}</span>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepNumber}>3</span>
                  <span>Confirm: {CEO_NAME}</span>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepNumber}>4</span>
                  <span>Amount: KES {ACTIVATION_FEE}</span>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepNumber}>5</span>
                  <span>Enter PIN & Complete</span>
                </div>
              </div>

              {/* Copy Number Section */}
              <div style={styles.copySection}>
                <div style={styles.phoneDisplay}>
                  <span style={styles.phoneIcon}>📞</span>
                  <span style={styles.phoneNumber}>{MPESA_NUMBER}</span>
                </div>
                <button onClick={copyNumber} style={styles.copyButton}>
                  {copied ? "✓ Copied!" : "📋 Copy Number"}
                </button>
              </div>
            </div>

            {/* Submission Form */}
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
                rows={4}
              />

              <button 
                type="submit" 
                disabled={loading || !mpesaCode.trim()}
                style={{
                  ...styles.submitButton,
                  opacity: loading || !mpesaCode.trim() ? 0.7 : 1,
                }}
              >
                {loading ? "Submitting..." : "✅ Submit Payment"}
              </button>
            </form>
          </div>
        )}

        {/* Logout Button */}
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
  },
  backgroundBlur1: {
    position: "fixed",
    top: "-20%",
    left: "-10%",
    width: "500px",
    height: "500px",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderRadius: "50%",
    filter: "blur(80px)",
    zIndex: 0,
  },
  backgroundBlur2: {
    position: "fixed",
    bottom: "-20%",
    right: "-10%",
    width: "400px",
    height: "400px",
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    borderRadius: "50%",
    filter: "blur(80px)",
    zIndex: 0,
  },
  card: {
    maxWidth: "500px",
    margin: "40px auto",
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "30px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    position: "relative",
    zIndex: 1,
  },
  header: {
    textAlign: "center",
    marginBottom: "25px",
  },
  logoContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: {
    fontSize: "48px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  subtitle: {
    fontSize: "16px",
    color: "#64748b",
    marginTop: "8px",
  },
  approvedBanner: {
    backgroundColor: "#dcfce7",
    border: "1px solid #22c55e",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
    color: "#166534",
    fontWeight: "600",
  },
  approvedIcon: {
    fontSize: "24px",
    color: "#22c55e",
  },
  pendingBanner: {
    backgroundColor: "#fef3c7",
    border: "1px solid #f59e0b",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    marginBottom: "20px",
    color: "#92400e",
    fontWeight: "600",
  },
  pendingIcon: {
    fontSize: "24px",
  },
  pendingNote: {
    fontSize: "14px",
    fontWeight: "400",
    margin: 0,
  },
  instructionSection: {
    marginBottom: "25px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "16px",
    textAlign: "center",
  },
  warningBox: {
    backgroundColor: "#fef2f2",
    border: "2px solid #ef4444",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    marginBottom: "20px",
  },
  warningIcon: {
    fontSize: "20px",
  },
  warningText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#dc2626",
  },
  ceoNumber: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#dc2626",
  },
  stepsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "20px",
  },
  step: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    color: "#374151",
  },
  stepNumber: {
    width: "28px",
    height: "28px",
    backgroundColor: "#6366f1",
    color: "#ffffff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "14px",
  },
  copySection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f1f5f9",
    borderRadius: "12px",
    padding: "12px 16px",
    marginBottom: "10px",
  },
  phoneDisplay: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  phoneIcon: {
    fontSize: "20px",
  },
  phoneNumber: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
  },
  copyButton: {
    backgroundColor: "#6366f1",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  formSection: {
    borderTop: "1px solid #e2e8f0",
    paddingTop: "20px",
  },
  formTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "4px",
    textAlign: "center",
  },
  formNote: {
    fontSize: "13px",
    color: "#ef4444",
    marginBottom: "16px",
    textAlign: "center",
    marginTop: 0,
  },
  textarea: {
    width: "100%",
    padding: "14px",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
    marginBottom: "16px",
  },
  submitButton: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#22c55e",
    padding: "14px",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
    marginBottom: "16px",
  },
  submitButton: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#22c55e",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  logoutButton: {
    width: "100%",
    marginTop: "16px",
    padding: "12px",
    backgroundColor: "transparent",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  goToDashboardBtn: {
    backgroundColor: "#22c55e",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  refreshButton: {
    backgroundColor: "#f59e0b",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
  },
};
