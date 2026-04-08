import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "register";
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const referralCodeFromUrl = searchParams.get("ref");

  const [errors, setErrors] = useState({});

  const [regData, setRegData] = useState({
    full_name: "",
    phone: "",
    referralCode: referralCodeFromUrl || "",
  });
  const [regMessage, setRegMessage] = useState("");

  const [loginData, setLoginData] = useState({
    phone: "",
  });
  const [loginMessage, setLoginMessage] = useState("");

  useEffect(() => {
    const wakeBackend = async () => {
      try {
        await api.get("/health");
      } catch (error) {
        console.warn("Backend health check failed:", error.message);
      }
    };
    wakeBackend();
  }, []);

  useEffect(() => {
    navigate(`/auth?mode=${mode}`, { replace: true });
  }, [mode, navigate]);

  const validateRegistration = () => {
    const newErrors = {};
    
    if (!regData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    } else if (regData.full_name.length < 3) {
      newErrors.full_name = "Name must be at least 3 characters";
    }
    
    if (!regData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\d+\-\s()]+$/.test(regData.phone.trim())) {
      newErrors.phone = "Enter a valid phone number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = useCallback(async (e) => {
    e.preventDefault();
    setRegMessage("");
    setErrors({});

    if (!validateRegistration()) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/register", {
        full_name: regData.full_name,
        phone: regData.phone,
        referral_code: regData.referralCode || referralCodeFromUrl || null,
      });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("lastLoginTime", Date.now().toString());
        localStorage.removeItem("active_plan");
        
        if (res.data.user?.welcome_bonus_received) {
          localStorage.setItem("showWelcomeBonus", "true");
          localStorage.setItem("welcomeBonusAmount", res.data.user?.welcome_bonus || 1200);
        }
      }

      setRegMessage("✓ Account created! Redirecting...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    } catch (err) {
      setRegMessage(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }, [regData, navigate, referralCodeFromUrl]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setLoginMessage("");

    if (!loginData.phone.trim()) {
      setLoginMessage("Please enter your phone number");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/login", { phone: loginData.phone });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("lastLoginTime", Date.now().toString());
        localStorage.removeItem("active_plan");
        
        if (res.data.user?.welcome_bonus_received) {
          localStorage.setItem("showWelcomeBonus", "true");
          localStorage.setItem("welcomeBonusAmount", res.data.user?.welcome_bonus || 1200);
        }
      }

      await api.get("/auth/me");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (!navigator.onLine) {
        const cachedUser = localStorage.getItem("cachedUser");
        const token = localStorage.getItem("token");
        if (cachedUser && token) {
          setLoginMessage("✓ Offline mode: using saved session.");
          navigate("/dashboard", { replace: true });
          return;
        }
        setLoginMessage("Offline. Connect to the internet to log in.");
        return;
      }

      setLoginMessage(err.response?.data?.message || "Phone number not found. Please register first.");
    } finally {
      setLoading(false);
    }
  }, [loginData, navigate]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>💰</div>
          <h1 style={styles.logo}>Survey<span style={styles.logoAccent}>Earn</span></h1>
          <p style={styles.tagline}>Earn money with simple surveys</p>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statBadge}>✓ 10K+ Users</div>
          <div style={styles.statBadge}>⭐ 4.8 Rating</div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(mode === "login" ? styles.tabActive : {}),
            }}
            onClick={() => setMode("login")}
            type="button"
          >
            Sign In
          </button>
          <button
            style={{
              ...styles.tab,
              ...(mode === "register" ? styles.tabActive : {}),
            }}
            onClick={() => setMode("register")}
            type="button"
          >
            Register
          </button>
        </div>

        {/* Form */}
        <div style={styles.formSection}>
          {mode === "register" ? (
            <form onSubmit={handleRegister} key="register">
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={regData.full_name}
                  onChange={(e) => setRegData(prev => ({ ...prev, full_name: e.target.value }))}
                  style={{
                    ...styles.input,
                    borderColor: errors.full_name ? '#ef4444' : '#e2e8f0',
                  }}
                  required
                />
              </div>
              {errors.full_name && <span style={styles.error}>{errors.full_name}</span>}

              <div style={styles.inputGroup}>
                <input
                  type="tel"
                  placeholder="Phone Number (0712345678)"
                  value={regData.phone}
                  onChange={(e) => setRegData(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    ...styles.input,
                    borderColor: errors.phone ? '#ef4444' : '#e2e8f0',
                  }}
                  required
                />
              </div>
              {errors.phone && <span style={styles.error}>{errors.phone}</span>}

              <button style={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? <span style={styles.spinner}></span> : "Create Free Account"}
              </button>

              {regMessage && (
                <div style={{
                  ...styles.message,
                  ...(regMessage.includes('✓') ? styles.successMsg : {})
                }}>
                  {regMessage}
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleLogin} key="login">
              <div style={styles.inputGroup}>
                <input
                  type="tel"
                  placeholder="Phone Number (0712345678)"
                  value={loginData.phone}
                  onChange={(e) => setLoginData(prev => ({ ...prev, phone: e.target.value }))}
                  style={styles.input}
                  required
                />
              </div>

              <button style={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? <span style={styles.spinner}></span> : "Sign In"}
              </button>

              {loginMessage && (
                <div style={{
                  ...styles.message,
                  ...(loginMessage.includes('✓') ? styles.successMsg : {})
                }}>
                  {loginMessage}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Benefits */}
        <div style={styles.benefits}>
          <div style={styles.benefitItem}>
            <span>💸</span> Instant Pay
          </div>
          <div style={styles.benefitItem}>
            <span>🎁</span> KES 1,200 Bonus
          </div>
          <div style={styles.benefitItem}>
            <span>🔒</span> Secure
          </div>
        </div>

        {/* Support */}
        <button
          style={styles.supportBtn}
          onClick={() => {
            const message = encodeURIComponent("Hello, I need help with my account.");
            window.open(`https://wa.me/254752881670?text=${message}`, "_blank");
          }}
        >
          💬 Chat Support
        </button>

        {/* Footer */}
        <p style={styles.footer}>
          © 2024 SurveyEarn
        </p>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        input:focus { outline: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "20px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    width: "100%",
    maxWidth: "360px",
    background: "#ffffff",
    borderRadius: "24px",
    padding: "24px 20px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  logoSection: {
    textAlign: "center",
    marginBottom: "16px",
  },
  logoIcon: {
    fontSize: "48px",
    marginBottom: "8px",
  },
  logo: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#1e293b",
    margin: 0,
  },
  logoAccent: {
    color: "#667eea",
  },
  tagline: {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "4px",
  },
  statsRow: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  statBadge: {
    background: "#f1f5f9",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
  },
  tabs: {
    display: "flex",
    background: "#f1f5f9",
    borderRadius: "12px",
    padding: "4px",
    marginBottom: "20px",
  },
  tab: {
    flex: 1,
    padding: "12px",
    border: "none",
    background: "transparent",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
    cursor: "pointer",
  },
  tabActive: {
    background: "#ffffff",
    color: "#667eea",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  formSection: {
    marginBottom: "16px",
  },
  inputGroup: {
    marginBottom: "12px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  error: {
    color: "#ef4444",
    fontSize: "12px",
    marginTop: "-8px",
    marginBottom: "8px",
    display: "block",
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
  },
  spinner: {
    display: "inline-block",
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  message: {
    padding: "10px",
    borderRadius: "8px",
    textAlign: "center",
    fontSize: "13px",
    marginTop: "12px",
    background: "#fef2f2",
    color: "#dc2626",
  },
  successMsg: {
    background: "#f0fdf4",
    color: "#16a34a",
  },
  benefits: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  benefitItem: {
    fontSize: "12px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  supportBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "#25D366",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "16px",
  },
  footer: {
    textAlign: "center",
    fontSize: "11px",
    color: "#94a3b8",
  },
};
