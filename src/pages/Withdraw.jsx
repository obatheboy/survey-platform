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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/auth/me");
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
      setMessage("✓ Withdrawal request submitted successfully!");
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
                  ...(shared ? styles.statusProcessing : styles.statusPending),
                }}>
                  {shared ? "⏳ Processing" : "⏸ Pending"}
                </span>
              </div>
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
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: 500,
    background: "#ffffff",
    padding: 28,
    borderRadius: 20,
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },

  title: {
    textAlign: "center",
    marginBottom: 24,
    color: "#333",
    fontSize: 24,
    fontWeight: 800,
  },

  balanceBox: {
    background: "linear-gradient(135deg, #667eea15, #764ba215)",
    borderRadius: 16,
    padding: 20,
    textAlign: "center",
    marginBottom: 24,
    border: "2px solid #667eea30",
  },

  balanceLabel: {
    display: "block",
    fontSize: 13,
    color: "#666",
    fontWeight: 600,
    marginBottom: 8,
  },

  balanceAmount: {
    fontSize: 32,
    fontWeight: 900,
    color: "#667eea",
  },

  formGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
    display: "block",
    color: "#333",
  },

  input: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    border: "2px solid #e0e0e0",
    marginBottom: 6,
    fontSize: 15,
    fontWeight: 500,
    boxSizing: "border-box",
    transition: "border-color 0.3s ease",
  },

  helperText: {
    fontSize: 12,
    color: "#999",
    margin: "0",
    fontStyle: "italic",
  },

  submitBtn: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
    transition: "transform 0.2s ease",
    boxShadow: "0 6px 20px rgba(102, 126, 234, 0.3)",
  },

  processingContainer: {
    marginTop: 10,
  },

  successBox: {
    padding: 20,
    background: "#f8f9ff",
    borderRadius: 16,
    border: "2px solid #667eea30",
  },

  successTitle: {
    textAlign: "center",
    color: "#667eea",
    marginTop: 0,
    marginBottom: 12,
    fontSize: 18,
  },

  successText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 1.6,
    marginBottom: 16,
  },

  codeBox: {
    background: "#fff",
    border: "2px solid #667eea",
    borderRadius: 12,
    padding: 16,
    textAlign: "center",
    marginBottom: 16,
  },

  codeLabel: {
    display: "block",
    fontSize: 12,
    color: "#999",
    marginBottom: 6,
    fontWeight: 600,
  },

  codeValue: {
    display: "block",
    fontSize: 28,
    fontWeight: 900,
    color: "#667eea",
    fontFamily: "monospace",
  },

  shareProgress: {
    marginBottom: 16,
  },

  progressBar: {
    width: "100%",
    height: 8,
    background: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 8,
  },

  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #667eea, #764ba2)",
    transition: "width 0.3s ease",
  },

  shareInstruction: {
    fontSize: 13,
    fontWeight: 700,
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
    marginTop: 0,
  },

  shareButtons: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 16,
  },

  whatsappBtn: {
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#25D366",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
    transition: "transform 0.2s ease",
  },

  emailBtn: {
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#EA4335",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
    transition: "transform 0.2s ease",
  },

  smsBtn: {
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#007AFF",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
    transition: "transform 0.2s ease",
  },

  copyBtn: {
    padding: 12,
    borderRadius: 10,
    border: "2px solid #667eea",
    background: "#fff",
    color: "#667eea",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
    transition: "transform 0.2s ease",
  },

  completedBox: {
    background: "#d4edda",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    border: "1px solid #c3e6cb",
  },

  completedText: {
    color: "#155724",
    fontSize: 13,
    fontWeight: 700,
    margin: 0,
    textAlign: "center",
  },

  withdrawalStatus: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    background: "#fff",
    borderRadius: 10,
    borderTop: "2px solid #e0e0e0",
    marginTop: 16,
  },

  statusLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#333",
  },

  statusBadge: {
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 800,
  },

  statusPending: {
    background: "#fff3cd",
    color: "#856404",
  },

  statusProcessing: {
    background: "#d1ecf1",
    color: "#0c5460",
  },

  messageBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    background: "#f4f4f4",
    fontSize: 14,
    fontWeight: 600,
    textAlign: "center",
    color: "#333",
  },

  loadingText: {
    textAlign: "center",
    marginTop: 80,
    fontSize: 16,
    color: "#fff",
  },
};
