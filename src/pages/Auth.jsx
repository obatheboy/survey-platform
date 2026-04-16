import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "register";
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

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
        await api.get("/health", { timeout: 10000 });
      } catch (error) {
        console.warn("Backend health check failed:", error.message);
      }
    };
    wakeBackend();
  }, []);

  useEffect(() => {
    const hasSeenInstallPrompt = localStorage.getItem("hasSeenInstallPrompt");
    
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!hasSeenInstallPrompt) {
        setTimeout(() => setShowInstallPrompt(true), 1500);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem("hasSeenInstallPrompt", "true");
    }
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const dismissInstall = () => {
    localStorage.setItem("hasSeenInstallPrompt", "true");
    setShowInstallPrompt(false);
  };

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
      let res;
      let lastError = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          res = await api.post("/auth/register", {
            full_name: regData.full_name,
            phone: regData.phone,
            referral_code: regData.referralCode || referralCodeFromUrl || null,
          });
          break;
        } catch (attemptError) {
          lastError = attemptError;
          if (attemptError.response) {
            throw attemptError;
          }
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }
      
      if (!res) {
        throw lastError;
      }

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("lastLoginTime", Date.now().toString());
        localStorage.removeItem("active_plan");
        localStorage.setItem("showWelcomeBonusOnDashboard", "true");
      }

      // Direct to dashboard after registration
      navigate("/dashboard", { replace: true });
    } catch (err) {
      let errorMessage;
      
      if (!err.response) {
        errorMessage = "Server unavailable. Please try again in a moment.";
      } else if (err.response.status === 0) {
        errorMessage = "Network error. Please check your internet connection.";
      } else {
        errorMessage = err.response?.data?.message || "Registration failed";
      }
      
      if (errorMessage.toLowerCase().includes("already exists") || errorMessage.toLowerCase().includes("already registered") || errorMessage.toLowerCase().includes("exists")) {
        setRegMessage("✓ Phone already registered!");
        setTimeout(() => setMode("login"), 1500);
      } else {
        setRegMessage(errorMessage);
      }
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
      const res = await api.post("/auth/login", { phone: loginData.phone });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("lastLoginTime", Date.now().toString());
        localStorage.setItem("showWelcomeBonusOnDashboard", "true");
      }

      navigate("/dashboard", { replace: true });
      return;
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

      setLoginMessage(err.response?.data?.message || "Phone number not found");
    } finally {
      setLoading(false);
    }
  }, [loginData, navigate]);

  return (
    <div style={styles.page}>
      {showInstallPrompt && (
        <div style={styles.installPromptStyles.overlay}>
          <div style={styles.installPromptStyles.popup}>
            <div style={styles.installPromptStyles.icon}>📱</div>
            <h3 style={styles.installPromptStyles.title}>Install SurveyEarn App</h3>
            <p style={styles.installPromptStyles.text}>Install our app for the best experience with faster loading and offline access.</p>
            <div style={styles.installPromptStyles.buttons}>
              <button style={styles.installPromptStyles.installBtn} onClick={handleInstall}>Install Now</button>
              <button style={styles.installPromptStyles.dismissBtn} onClick={dismissInstall}>Not Now</button>
            </div>
          </div>
        </div>
      )}
      <div style={styles.container}>
        {/* Government Verification Badge */}
        <div style={styles.govBadge}>
          <span style={styles.govIcon}>🇰🇪</span>
          <span style={styles.govText}>LEGIT - Approved by Kenya Govt</span>
          <span style={styles.govCheck}>✓</span>
        </div>

        {/* Logo */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>💰</div>
          <h1 style={styles.logo}>Survey<span style={styles.logoAccent}>Earn</span></h1>
          <p style={styles.tagline}>Kenya's Most Trusted Survey Platform</p>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statBadge}>✓ 50K+ Users</div>
          <div style={styles.statBadge}>⭐ 4.9 Rating</div>
          <div style={styles.statBadge}>🔒 Licensed</div>
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
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>👤</span>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={regData.full_name}
                  onChange={(e) => setRegData(prev => ({ ...prev, full_name: e.target.value }))}
                  style={{
                    ...styles.input,
                    paddingLeft: "42px",
                    borderColor: errors.full_name ? '#ef4444' : '#e2e8f0',
                  }}
                  required
                />
              </div>
              {errors.full_name && <span style={styles.error}>{errors.full_name}</span>}

              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>📱</span>
                <input
                  type="tel"
                  placeholder="Phone Number (0712345678)"
                  value={regData.phone}
                  onChange={(e) => setRegData(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    ...styles.input,
                    paddingLeft: "42px",
                    borderColor: errors.phone ? '#ef4444' : '#e2e8f0',
                  }}
                  required
                />
              </div>
              {errors.phone && <span style={styles.error}>{errors.phone}</span>}

              <button style={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? <span style={styles.spinner}></span> : "Create Free Account"}
              </button>

              <p style={styles.termsText}>
                By registering, you agree to our{" "}
                <span style={styles.termsLink} onClick={() => navigate("/terms")}>Terms</span> &{" "}
                <span style={styles.termsLink} onClick={() => navigate("/privacy")}>Privacy</span>
              </p>

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
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>📱</span>
                <input
                  type="tel"
                  placeholder="Phone Number (0712345678)"
                  value={loginData.phone}
                  onChange={(e) => setLoginData(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    ...styles.input,
                    paddingLeft: "42px",
                  }}
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
            <span style={styles.benefitIcon}>💸</span>
            <span>Instant Pay</span>
          </div>
          <div style={styles.benefitItem}>
            <span style={styles.benefitIcon}>🎁</span>
            <span>KES 1,200 Bonus</span>
          </div>
          <div style={styles.benefitItem}>
            <span style={styles.benefitIcon}>🏆</span>
            <span>Top Rated</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div style={styles.trustBadges}>
          <div style={styles.trustBadge}>
            <span style={styles.trustIcon}>🛡️</span>
            <span>100% Secure</span>
          </div>
          <div style={styles.trustBadge}>
            <span style={styles.trustIcon}>✓</span>
            <span>Verified</span>
          </div>
          <div style={styles.trustBadge}>
            <span style={styles.trustIcon}>📋</span>
            <span>Licensed</span>
          </div>
        </div>

        <button
          style={styles.supportBtn}
          onClick={() => {
            const message = encodeURIComponent("Hello, I need help with creating my survey account.");
            window.open(`https://wa.me/254785619533?text=${message}`, "_blank");
          }}
        >
          💬 Chat Support
        </button>

        <button
          style={styles.whatsappGroupBtn}
          onClick={() => window.open("https://chat.whatsapp.com/D0lrxZA5yTx7fLlNQi7tB2", "_blank")}
        >
          👥 Join WhatsApp Group
        </button>

        {/* Footer */}
        <p style={styles.footer}>
          © 2026 SurveyEarn • Licensed by Kenya Govt
        </p>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; width: 100%; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        input:focus { outline: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "12px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
    paddingTop: "20px",
  },
  container: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "24px",
    padding: "32px 24px",
    boxShadow: "0 25px 80px rgba(0, 0, 0, 0.4)",
  },
  govBadge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    padding: "6px 12px",
    borderRadius: "30px",
    marginBottom: "12px",
    boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
  },
  govIcon: {
    fontSize: "14px",
  },
  govText: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: "0.3px",
  },
  govCheck: {
    fontSize: "11px",
    color: "#4ade80",
    fontWeight: "bold",
  },
  logoSection: {
    textAlign: "center",
    marginBottom: "12px",
  },
  logoIcon: {
    fontSize: "40px",
    marginBottom: "6px",
  },
  logo: {
    fontSize: "28px",
    fontWeight: "900",
    color: "#1e293b",
    margin: 0,
  },
  logoAccent: {
    color: "#667eea",
  },
  tagline: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "2px",
  },
  statsRow: {
    display: "flex",
    justifyContent: "center",
    gap: "6px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  statBadge: {
    background: "#f1f5f9",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "600",
    color: "#475569",
    whiteSpace: "nowrap",
  },
  tabs: {
    display: "flex",
    background: "#f1f5f9",
    borderRadius: "16px",
    padding: "6px",
    marginBottom: "20px",
  },
  tab: {
    flex: 1,
    padding: "14px 4px",
    border: "none",
    background: "transparent",
    borderRadius: "14px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#64748b",
    cursor: "pointer",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  tabActive: {
    background: "#3b82f6",
    color: "#ffffff",
    boxShadow: "0 4px 12px rgba(59,130,246,0.4)",
  },
  formSection: {
    marginBottom: "12px",
  },
  inputWrapper: {
    position: "relative",
    marginBottom: "10px",
  },
  inputIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "14px",
    zIndex: 1,
  },
  inputGroup: {
    marginBottom: "12px",
  },
  input: {
    width: "100%",
    padding: "16px 16px",
    borderRadius: "14px",
    border: "2px solid #e2e8f0",
    background: "#f8fafc",
    color: "#1e293b",
    fontSize: "16px",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
  },
  inputPlaceholder: {
    color: "rgba(255,255,255,0.5)",
  },
  error: {
    color: "#ff6b6b",
    fontSize: "12px",
    marginTop: "-8px",
    marginBottom: "6px",
    display: "block",
  },
  submitBtn: {
    width: "100%",
    padding: "18px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: "800",
    cursor: "pointer",
    marginTop: "12px",
    boxShadow: "0 6px 20px rgba(59,130,246,0.4)",
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
    borderRadius: "10px",
    textAlign: "center",
    fontSize: "13px",
    marginTop: "12px",
    background: "rgba(255,107,107,0.2)",
    color: "#ff6b6b",
  },
  successMsg: {
    background: "rgba(0,255,150,0.2)",
    color: "#00ff96",
  },
  termsText: {
    fontSize: "10px",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: "10px",
    lineHeight: "1.4",
  },
  termsLink: {
    color: "#667eea",
    cursor: "pointer",
    fontWeight: "600",
    textDecoration: "underline",
  },
  benefits: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  benefitItem: {
    fontSize: "10px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "3px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  benefitIcon: {
    fontSize: "12px",
  },
  trustBadges: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  trustBadge: {
    display: "flex",
    alignItems: "center",
    gap: "3px",
    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    padding: "5px 8px",
    borderRadius: "20px",
    fontSize: "9px",
    fontWeight: "600",
    color: "#92400e",
    border: "1px solid #fcd34d",
  },
  trustIcon: {
    fontSize: "11px",
  },
  surveyBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "2px dashed #667eea",
    background: "rgba(102, 126, 234, 0.08)",
    color: "#667eea",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  arrow: {
    fontSize: "14px",
  },
  supportBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "#25D366",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "8px",
  },
  whatsappGroupBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #128C7E, #25D366)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  footer: {
    textAlign: "center",
    fontSize: "11px",
    color: "#94a3b8",
  },
  installPromptStyles: {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "20px",
    },
    popup: {
      background: "white",
      borderRadius: "20px",
      padding: "30px",
      textAlign: "center",
      maxWidth: "340px",
      animation: "slideUp 0.3s ease",
    },
    icon: {
      fontSize: "56px",
      marginBottom: "12px",
    },
    title: {
      fontSize: "20px",
      fontWeight: "800",
      color: "#1e293b",
      margin: "0 0 12px 0",
    },
    text: {
      fontSize: "14px",
      color: "#64748b",
      margin: "0 0 20px 0",
      lineHeight: "1.5",
    },
    buttons: {
      display: "flex",
      gap: "12px",
    },
    installBtn: {
      flex: 1,
      padding: "14px",
      background: "linear-gradient(135deg, #22c55e, #16a34a)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
    },
    dismissBtn: {
      flex: 1,
      padding: "14px",
      background: "#f1f5f9",
      color: "#64748b",
      border: "none",
      borderRadius: "12px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
    },
  },
};
