import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const TOTAL_SURVEYS = 10;

export default function Withdraw() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [withdrawalCode, setWithdrawalCode] = useState("");
  const [shared, setShared] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [withdrawalStatus, setWithdrawalStatus] = useState("PROCESSING");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/auth/me?_t=${Date.now()}`);
        const u = res.data;

        if (!u.is_activated) {
          navigate("/activation-notice", { replace: true });
          return;
        }

        if (u.surveys_completed < TOTAL_SURVEYS) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (!u.total_earned || u.total_earned <= 0) {
          navigate("/dashboard", { replace: true });
          return;
        }

        setUser(u);
      } catch {
        navigate("/auth", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  // Fetch withdrawal status every 5 seconds when withdrawal is submitted
  useEffect(() => {
    if (!submitted || !user) return;

    const checkStatus = async () => {
      try {
        const res = await api.get(`/auth/me?_t=${Date.now()}`);
        const latestUser = res.data;
        // Get the most recent withdrawal request status (could be stored in user object)
        const withdrawalData = latestUser.withdrawal_status || "PROCESSING";
        setWithdrawalStatus(withdrawalData);
      } catch (err) {
        console.error("Failed to check withdrawal status:", err);
      }
    };

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [submitted, user]);

  if (loading) {
    return <p style={styles.loadingText}>Loading withdrawal…</p>;
  }

  if (!user) return null;

  const submitWithdraw = async () => {
    if (!phone.trim()) {
      setMessage("❌ Phone number is required");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setMessage("❌ Please enter a valid amount");
      return;
    }

    try {
      setMessage("Submitting withdrawal request…");

      await api.post("/withdraw/request", {
        phone_number: phone,
        amount: parseFloat(amount),
      });

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setWithdrawalCode(code);
      setSubmitted(true);
      setMessage("✓ Your withdrawal is being processed. Share the link to 3+ members to speed up your payment!");
      
      // Auto-scroll to top to show the processing message
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    } catch (err) {
      setMessage(
        err.response?.data?.message || "❌ Withdrawal request failed"
      );
    }
  };

  const shareToWhatsApp = () => {
    const text = `Hey! I'm earning money on the Survey App. Join me and complete surveys to earn cash! 🎉\n\nDownload now: ${window.location.origin}\n\nCode: ${withdrawalCode}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank"
    );
    incrementShareCount();
  };

  const shareToEmail = () => {
    const text = `Hey! I'm earning money on the Survey App. Join me and complete surveys to earn cash! You can use my referral code: ${withdrawalCode}`;
    window.location.href = `mailto:?subject=Join Survey App&body=${encodeURIComponent(text)}`;
    incrementShareCount();
  };

  const shareToSMS = () => {
    const text = `Hi! Join me on Survey App and earn money. Code: ${withdrawalCode} ${window.location.origin}`;
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
    incrementShareCount();
  };

  const copyLink = () => {
    const text = `Survey App Referral - Code: ${withdrawalCode} - ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setMessage("✓ Referral link copied!");
    incrementShareCount();
  };

  const incrementShareCount = () => {
    const newCount = shareCount + 1;
    setShareCount(newCount);
    if (newCount >= 3) {
      setShared(true);
      setMessage("✓ Shared to 3+ members! Your payment will be processed soon.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>💸 Withdraw Your Earnings</h2>

        <div style={styles.balanceBox}>
          <span style={styles.balanceLabel}>Available Balance</span>
          <span style={styles.balanceAmount}>
            KES {Number(user.total_earned).toLocaleString()}
          </span>
          <div style={styles.surveyStatus}>
            <span>Surveys Completed: {user.surveys_completed || 0}/10</span>
          </div>
        </div>

        {!submitted ? (
          <>
            <div style={styles.formGroup}>
              <label style={styles.label}>Withdrawal Amount</label>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={user.total_earned}
                style={styles.input}
              />
              <p style={styles.helperText}>
                Max: KES {Number(user.total_earned).toLocaleString()}
              </p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number (M-Pesa)</label>
              <input
                type="tel"
                placeholder="07XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={styles.input}
              />
            </div>

            <button
              onClick={submitWithdraw}
              style={styles.submitBtn}
            >
              Submit Withdrawal
            </button>
          </>
        ) : (
          <div style={styles.processingContainer}>
            <div style={styles.successBox}>
              <h3 style={styles.successTitle}>🎉 Processing Your Withdrawal</h3>
              <p style={styles.successText}>
                Your withdrawal request is being processed. To speed up your payment, share this link to <strong>3 or more members</strong> and your payment will be prioritized!
              </p>

              <div style={styles.codeBox}>
                <span style={styles.codeLabel}>Your Referral Code:</span>
                <span style={styles.codeValue}>{withdrawalCode}</span>
              </div>

              <div style={styles.shareProgress}>
                <span>Shares: {shareCount}/3</span>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${Math.min((shareCount / 3) * 100, 100)}%`,
                  }}></div>
                </div>
              </div>

              <p style={styles.shareInstruction}>Share via:</p>

              <div style={styles.shareButtons}>
                <button
                  onClick={shareToWhatsApp}
                  style={styles.whatsappBtn}
                  title="Share on WhatsApp"
                >
                  💬 WhatsApp
                </button>
                <button
                  onClick={shareToEmail}
                  style={styles.emailBtn}
                  title="Share via Email"
                >
                  📧 Email
                </button>
                <button
                  onClick={shareToSMS}
                  style={styles.smsBtn}
                  title="Share via SMS"
                >
                  📱 SMS
                </button>
                <button
                  onClick={copyLink}
                  style={styles.copyBtn}
                  title="Copy link"
                >
                  📋 Copy
                </button>
              </div>

              {shared && (
                <div style={styles.completedBox}>
                  <p style={styles.completedText}>
                    ✓ You've shared with 3+ members! Your withdrawal will be processed soon.
                  </p>
                </div>
              )}

              <div style={styles.withdrawalStatus}>
                <span style={styles.statusLabel}>Withdrawal Status:</span>
                <span style={{
                  ...styles.statusBadge,
                  ...(withdrawalStatus === "APPROVED" ? styles.statusApproved :
                    withdrawalStatus === "REJECTED" ? styles.statusRejected :
                      styles.statusProcessing),
                }}>
                  {withdrawalStatus === "APPROVED" ? "✅ APPROVED" :
                    withdrawalStatus === "REJECTED" ? "❌ REJECTED" :
                      "⏳ PROCESSING"}
                </span>
              </div>

              {withdrawalStatus === "REJECTED" && (
                <div style={styles.rejectedBox}>
                  <p style={styles.rejectedText}>
                    ❌ Your withdrawal has been rejected. Please contact admin for details.
                  </p>
                </div>
              )}

              {withdrawalStatus === "APPROVED" && (
                <div style={styles.approvedBox}>
                  <p style={styles.approvedText}>
                    ✅ Withdrawal approved! Your payment will be transferred to your M-Pesa account within 24 hours.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {message && <div style={styles.messageBox}>{message}</div>}
      </div>
    </div>
  );
}

/* =========================
   STYLES
========================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    fontFamily: "'Inter', sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: 500,
    background: "#ffffff",
    padding: 32,
    borderRadius: 24,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
    border: "1px solid #f1f5f9",
  },

  title: {
    textAlign: "center",
    marginBottom: 24,
    color: "#0f172a",
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: "-0.5px",
  },

  balanceBox: {
    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
    borderRadius: 20,
    padding: 24,
    textAlign: "center",
    marginBottom: 28,
    border: "1px solid #bfdbfe",
  },

  balanceLabel: {
    display: "block",
    fontSize: 14,
    color: "#1e40af",
    fontWeight: 700,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  balanceAmount: {
    fontSize: 36,
    fontWeight: 900,
    color: "#2563eb",
  },

  surveyStatus: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid rgba(37, 99, 235, 0.1)",
    fontWeight: 600,
  },

  formGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
    display: "block",
    color: "#334155",
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    border: "2px solid #f1f5f9",
    marginBottom: 6,
    fontSize: 16,
    fontWeight: 500,
    boxSizing: "border-box",
    transition: "all 0.2s ease",
    background: "#f8fafc",
    color: "#0f172a",
  },

  helperText: {
    fontSize: 12,
    color: "#94a3b8",
    margin: "0",
    fontWeight: "500",
  },

  submitBtn: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1e40af)",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.2)",
    marginTop: 8,
  },

  processingContainer: {
    marginTop: 10,
  },

  successBox: {
    padding: 24,
    background: "#f8fafc",
    borderRadius: 20,
    border: "1px solid #e2e8f0",
  },

  successTitle: {
    textAlign: "center",
    color: "#0f172a",
    marginTop: 0,
    marginBottom: 12,
    fontSize: 20,
    fontWeight: 800,
  },

  successText: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    lineHeight: 1.6,
    marginBottom: 20,
  },

  codeBox: {
    background: "#fff",
    border: "2px dashed #cbd5e1",
    borderRadius: 16,
    padding: 20,
    textAlign: "center",
    marginBottom: 20,
  },

  codeLabel: {
    display: "block",
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
    fontWeight: 600,
  },

  codeValue: {
    display: "block",
    fontSize: 28,
    fontWeight: 900,
    color: "#2563eb",
    letterSpacing: "2px",
  },

  shareProgress: {
    marginBottom: 20,
  },

  progressBar: {
    width: "100%",
    height: 10,
    background: "#f1f5f9",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 8,
    border: "1px solid #e2e8f0",
  },

  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #10b981, #059669)",
    transition: "width 0.4s ease",
  },

  shareInstruction: {
    fontSize: 14,
    fontWeight: 700,
    color: "#334155",
    textAlign: "center",
    marginBottom: 12,
    marginTop: 0,
  },

  shareButtons: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 20,
  },

  whatsappBtn: {
    padding: 12,
    borderRadius: 12,
    border: "none",
    background: "#25D366",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s ease",
  },

  emailBtn: {
    padding: 12,
    borderRadius: 12,
    border: "none",
    background: "#EA4335",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s ease",
  },

  smsBtn: {
    padding: 12,
    borderRadius: 12,
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s ease",
  },

  copyBtn: {
    padding: 12,
    borderRadius: 12,
    border: "1.5px solid #e2e8f0",
    background: "#fff",
    color: "#475569",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s ease",
  },

  completedBox: {
    background: "#ecfdf5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    border: "1px solid #10b981",
  },

  completedText: {
    color: "#065f46",
    fontSize: 14,
    fontWeight: 700,
    margin: 0,
    textAlign: "center",
  },

  withdrawalStatus: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    background: "#f8fafc",
    borderRadius: 14,
    border: "1px solid #f1f5f9",
    marginTop: 16,
  },

  statusLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "#475569",
  },

  statusBadge: {
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 800,
  },

  statusPending: {
    background: "#fef3c7",
    color: "#92400e",
  },

  statusProcessing: {
    background: "#eff6ff",
    color: "#1e40af",
  },

  statusApproved: {
    background: "#d1fae5",
    color: "#065f46",
  },

  statusRejected: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  rejectedBox: {
    background: "#fee2e2",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    border: "1px solid #fecaca",
  },

  rejectedText: {
    color: "#991b1b",
    fontSize: 14,
    fontWeight: 700,
    margin: 0,
    textAlign: "center",
  },

  approvedBox: {
    background: "#d1fae5",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    border: "1px solid #a7f3d0",
  },

  approvedText: {
    color: "#065f46",
    fontSize: 14,
    fontWeight: 700,
    margin: 0,
    textAlign: "center",
  },

  messageBox: {
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    background: "#f1f5f9",
    fontSize: 14,
    fontWeight: 600,
    textAlign: "center",
    color: "#475569",
    border: "1px solid #e2e8f0",
  },

  loadingText: {
    textAlign: "center",
    marginTop: 80,
    fontSize: 16,
    color: "#64748b",
  },
};
