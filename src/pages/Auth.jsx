import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "register";
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
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
        console.log("Backend is awake");
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
    setShake(false);
    setErrors({});

    if (!validateRegistration()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
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

      setRegMessage("✓ Account created successfully! Redirecting...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    } catch (err) {
      setRegMessage(err.response?.data?.message || "Registration failed");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  }, [regData, navigate, referralCodeFromUrl]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setLoginMessage("");
    setShake(false);

    if (!loginData.phone.trim()) {
      setLoginMessage("Please enter your phone number");
      setShake(true);
      setTimeout(() => setShake(false), 500);
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
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  }, [loginData, navigate]);

  return (
    <div style={styles.page}>
      {/* Animated background elements */}
      <div style={styles.backgroundBlur1}></div>
      <div style={styles.backgroundBlur2}></div>
      <div style={styles.backgroundBlur3}></div>
      <div style={styles.backgroundParticles}></div>
      
      <div
        style={{
          ...styles.card,
          opacity: loading ? 0.7 : 1,
          pointerEvents: loading ? "none" : "auto",
          animation: shake ? "shake 0.5s ease-in-out" : "fadeInUp 0.6s ease-out",
        }}
      >
        {/* Government Verification Badge */}
        <div style={styles.govBadge}>
          <div style={styles.govBadgeContent}>
            <span style={styles.govIcon}>🇰🇪</span>
            <span style={styles.govText}>Verified by Government of Kenya</span>
            <span style={styles.govCheck}>✓</span>
          </div>
        </div>

        {/* Bold Large Logo Header */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <div style={styles.logoWrapper}>
              <div style={styles.logoGlow}></div>
              <div style={styles.logoIcon}>
                <span style={styles.logoIconPulse}>📊</span>
              </div>
            </div>
            <div style={styles.logoTextContainer}>
              <h1 style={styles.logo}>Survey<span style={styles.logoAccent}>Earn</span></h1>
              <p style={styles.tagline}>Turn opinions into cash</p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div style={styles.trustIndicators}>
            <span style={styles.trustBadge}>
              <span style={styles.trustBadgeIcon}>✓</span> 10k+ Earners
            </span>
            <span style={styles.trustBadge}>
              <span style={styles.trustBadgeIcon}>⭐</span> 4.8 Rating
            </span>
            <span style={styles.trustBadge}>
              <span style={styles.trustBadgeIcon}>🔒</span> Secure
            </span>
          </div>
        </div>

        {/* Mode Selector */}
        <div style={styles.modeSelector}>
          <button
            style={{
              ...styles.modeButton,
              ...(mode === "login" ? styles.modeButtonActiveLogin : {}),
            }}
            onClick={() => setMode("login")}
            type="button"
          >
            <span style={styles.modeButtonIcon}>🔐</span>
            <span>Sign In</span>
          </button>
          <button
            style={{
              ...styles.modeButton,
              ...(mode === "register" ? styles.modeButtonActiveRegister : {}),
            }}
            onClick={() => setMode("register")}
            type="button"
          >
            <span style={styles.modeButtonIcon}>🚀</span>
            <span>Create Account</span>
          </button>
        </div>

        {/* Form Section */}
        {mode === "register" ? (
          <form onSubmit={handleRegister} key="register" style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.inputWrapper}>
                <div style={{
                  ...styles.inputIcon,
                  ...(focusedField === "name" ? styles.inputIconFocused : {})
                }}>👤</div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={regData.full_name}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) =>
                    setRegData(prev => ({ ...prev, full_name: e.target.value }))
                  }
                  style={{
                    ...styles.input,
                    borderColor: errors.full_name ? '#ef4444' : (focusedField === "name" ? '#667eea' : '#e2e8f0'),
                    boxShadow: focusedField === "name" ? '0 0 0 4px rgba(102, 126, 234, 0.1)' : 'none',
                  }}
                  required
                />
                {regData.full_name && !errors.full_name && (
                  <span style={styles.inputCheck}>✓</span>
                )}
              </div>
              {errors.full_name && <span style={styles.errorText}>{errors.full_name}</span>}

              <div style={styles.inputWrapper}>
                <div style={{
                  ...styles.inputIcon,
                  ...(focusedField === "phone" ? styles.inputIconFocused : {})
                }}>📱</div>
                <input
                  type="tel"
                  placeholder="Phone Number (e.g., 0712345678)"
                  value={regData.phone}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) =>
                    setRegData(prev => ({ ...prev, phone: e.target.value }))
                  }
                  style={{
                    ...styles.input,
                    borderColor: errors.phone ? '#ef4444' : (focusedField === "phone" ? '#667eea' : '#e2e8f0'),
                    boxShadow: focusedField === "phone" ? '0 0 0 4px rgba(102, 126, 234, 0.1)' : 'none',
                  }}
                  required
                />
                {regData.phone && !errors.phone && (
                  <span style={styles.inputCheck}>✓</span>
                )}
              </div>
              {errors.phone && <span style={styles.errorText}>{errors.phone}</span>}
            </div>

            <button
              style={styles.primaryButtonRegister}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div style={styles.loadingSpinner}></div>
              ) : (
                <>
                  <span style={styles.buttonIcon}>🚀</span>
                  Create Free Account
                  <span style={styles.buttonArrow}>→</span>
                </>
              )}
            </button>

            {regMessage && (
              <div style={{
                ...styles.message,
                ...(regMessage.includes('✓') ? styles.messageSuccess : {})
              }}>
                {regMessage}
              </div>
            )}

            <div style={styles.termsNotice}>
              <span style={styles.termsNoticeIcon}>✓</span>
              <span style={styles.termsNoticeText}>
                By creating an account, you agree to our{" "}
                <button
                  type="button"
                  style={styles.termsLink}
                  onClick={() => navigate("/terms")}
                >
                  Terms
                </button>
                {" & "}
                <button
                  type="button"
                  style={styles.termsLink}
                  onClick={() => navigate("/privacy")}
                >
                  Privacy
                </button>
              </span>
            </div>

            <p style={styles.switchText}>
              Already have an account?{" "}
              <button
                style={styles.switchButton}
                onClick={() => setMode("login")}
                type="button"
              >
                Sign In →
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin} key="login" style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.inputWrapper}>
                <div style={{
                  ...styles.inputIcon,
                  ...(focusedField === "loginPhone" ? styles.inputIconFocused : {})
                }}>📱</div>
                <input
                  type="tel"
                  placeholder="Phone Number (e.g., 0712345678)"
                  value={loginData.phone}
                  onFocus={() => setFocusedField("loginPhone")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) =>
                    setLoginData(prev => ({ ...prev, phone: e.target.value }))
                  }
                  style={{
                    ...styles.input,
                    borderColor: focusedField === "loginPhone" ? '#667eea' : '#e2e8f0',
                    boxShadow: focusedField === "loginPhone" ? '0 0 0 4px rgba(102, 126, 234, 0.1)' : 'none',
                  }}
                  required
                />
              </div>
            </div>

            <button
              style={styles.primaryButtonLogin}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div style={styles.loadingSpinner}></div>
              ) : (
                <>
                  <span style={styles.buttonIcon}>🔐</span>
                  Sign In with Phone Number
                  <span style={styles.buttonArrow}>→</span>
                </>
              )}
            </button>

            {loginMessage && (
              <div style={{
                ...styles.message,
                ...(loginMessage.includes('✓') ? styles.messageSuccess : {})
              }}>
                {loginMessage}
              </div>
            )}

            <p style={styles.switchText}>
              New to SurveyEarn?{" "}
              <button
                style={styles.switchButton}
                onClick={() => setMode("register")}
                type="button"
              >
                Create Account →
              </button>
            </p>
          </form>
        )}

        {/* WhatsApp Support */}
        <div style={styles.supportSection}>
          <button
            style={styles.supportButton}
            onClick={() => {
              const message = encodeURIComponent(
                "Hello, I need help with Registering/Login to my SurveyEarn account."
              );
              const whatsappUrl = `https://wa.me/254752881670?text=${message}`;
              window.open(whatsappUrl, "_blank", "noopener,noreferrer");
            }}
          >
            <span style={styles.supportIcon}>💬</span>
            <span style={styles.supportText}>Chat with Support</span>
            <span style={styles.supportArrow}>→</span>
          </button>
        </div>

        {/* Features */}
        <div style={styles.featuresSection}>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>💰</span>
            <span style={styles.featureText}>Instant Cashout</span>
          </div>
          <div style={styles.featureDivider}></div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>⚡</span>
            <span style={styles.featureText}>Quick Surveys</span>
          </div>
          <div style={styles.featureDivider}></div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>🔒</span>
            <span style={styles.featureText}>Bank-Level Security</span>
          </div>
        </div>

        <div style={styles.footer}>
          <p style={styles.copyright}>© 2024 SurveyEarn. All rights reserved.</p>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-20px) translateX(10px); }
          }

          @keyframes floatReverse {
            0%, 100% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(20px) translateX(-10px); }
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.1); }
          }

          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          
          input:focus {
            outline: none;
          }
          
          button {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          
          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15) !important;
          }
          
          button:active {
            transform: translateY(0px);
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(-45deg, #667eea, #764ba2, #6b8cff, #a855f7)",
    backgroundSize: "400% 400%",
    animation: "gradient 15s ease infinite",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    position: "relative",
    padding: "8px",
    boxSizing: "border-box",
  },
  backgroundBlur1: {
    position: "absolute",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, rgba(255,255,255,0.15), transparent)",
    borderRadius: "50%",
    top: "-80px",
    right: "-80px",
    filter: "blur(60px)",
    animation: "float 12s ease-in-out infinite",
  },
  backgroundBlur2: {
    position: "absolute",
    width: "350px",
    height: "350px",
    background: "radial-gradient(circle, rgba(255,255,255,0.1), transparent)",
    borderRadius: "50%",
    bottom: "-100px",
    left: "-100px",
    filter: "blur(70px)",
    animation: "floatReverse 14s ease-in-out infinite",
  },
  backgroundBlur3: {
    position: "absolute",
    width: "200px",
    height: "200px",
    background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent)",
    borderRadius: "50%",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    filter: "blur(50px)",
    animation: "pulse 6s ease-in-out infinite",
  },
  backgroundParticles: {
    position: "absolute",
    width: "100%",
    height: "100%",
    background: "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)",
    pointerEvents: "none",
  },
  card: {
    maxWidth: "400px",
    width: "100%",
    background: "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(20px)",
    borderRadius: "32px",
    padding: "20px 20px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.3)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    position: "relative",
    zIndex: 1,
    maxHeight: "100vh",
    overflowY: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  govBadge: {
    marginBottom: "12px",
    display: "flex",
    justifyContent: "center",
  },
  govBadgeContent: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #1e3c72, #2b4c7c)",
    padding: "6px 16px",
    borderRadius: "40px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 215, 0, 0.4)",
  },
  govIcon: {
    fontSize: "16px",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
    animation: "bounce 2s ease-in-out infinite",
  },
  govText: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#FFD700",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  govCheck: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#4ade80",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    marginBottom: "16px",
    textAlign: "center",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "10px",
    flexWrap: "wrap",
  },
  logoWrapper: {
    position: "relative",
    width: "50px",
    height: "50px",
  },
  logoGlow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    borderRadius: "15px",
    filter: "blur(10px)",
    opacity: 0.7,
    animation: "pulse 3s ease-in-out infinite",
  },
  logoIcon: {
    position: "relative",
    fontSize: "26px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    padding: "10px",
    borderRadius: "15px",
    boxShadow: "0 10px 25px -8px rgba(102, 126, 234, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
  logoIconPulse: {
    animation: "bounce 2s ease-in-out infinite",
    display: "inline-block",
  },
  logoTextContainer: {
    textAlign: "left",
  },
  logo: {
    fontSize: "28px",
    fontWeight: "800",
    margin: 0,
    color: "#1e293b",
    letterSpacing: "-0.5px",
    lineHeight: 1.2,
  },
  logoAccent: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  tagline: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "500",
    marginTop: "4px",
  },
  trustIndicators: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  trustBadge: {
    background: "rgba(255,255,255,0.95)",
    padding: "4px 12px",
    borderRadius: "30px",
    fontSize: "10px",
    fontWeight: "600",
    color: "#475569",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  trustBadgeIcon: {
    fontSize: "11px",
  },
  modeSelector: {
    display: "flex",
    background: "#f1f5f9",
    borderRadius: "40px",
    padding: "4px",
    marginBottom: "16px",
    gap: "4px",
  },
  modeButton: {
    flex: 1,
    padding: "8px 12px",
    border: "none",
    background: "transparent",
    borderRadius: "36px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  modeButtonIcon: {
    fontSize: "14px",
  },
  modeButtonActiveLogin: {
    background: "#ffffff",
    color: "#667eea",
    boxShadow: "0 4px 12px -3px rgba(102, 126, 234, 0.2)",
  },
  modeButtonActiveRegister: {
    background: "#ffffff",
    color: "#764ba2",
    boxShadow: "0 4px 12px -3px rgba(118, 75, 162, 0.2)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  formGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "16px",
    color: "#94a3b8",
    zIndex: 2,
    transition: "all 0.3s ease",
  },
  inputIconFocused: {
    color: "#667eea",
    transform: "translateY(-50%) scale(1.1)",
  },
  input: {
    width: "100%",
    padding: "12px 16px 12px 46px",
    borderRadius: "40px",
    border: "2px solid #e2e8f0",
    background: "#ffffff",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
    outline: "none",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
  },
  inputCheck: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#10b981",
    fontSize: "14px",
    fontWeight: "bold",
    zIndex: 2,
  },
  errorText: {
    fontSize: "11px",
    color: "#ef4444",
    fontWeight: "500",
    marginLeft: "14px",
    marginTop: "2px",
  },
  primaryButtonLogin: {
    width: "100%",
    padding: "12px",
    borderRadius: "40px",
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 8px 20px -5px rgba(102, 126, 234, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    marginTop: "4px",
  },
  primaryButtonRegister: {
    width: "100%",
    padding: "12px",
    borderRadius: "40px",
    border: "none",
    background: "linear-gradient(135deg, #764ba2, #667eea)",
    color: "white",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 8px 20px -5px rgba(118, 75, 162, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    marginTop: "4px",
  },
  buttonIcon: {
    fontSize: "16px",
  },
  buttonArrow: {
    fontSize: "14px",
    transition: "transform 0.3s ease",
  },
  loadingSpinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  message: {
    padding: "8px 12px",
    borderRadius: "40px",
    textAlign: "center",
    fontSize: "12px",
    fontWeight: "500",
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fee2e2",
  },
  messageSuccess: {
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #dcfce7",
  },
  switchText: {
    textAlign: "center",
    marginTop: "10px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "500",
  },
  switchButton: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
  },
  termsNotice: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    background: "rgba(99, 102, 241, 0.06)",
    borderRadius: "40px",
    border: "1px solid rgba(99, 102, 241, 0.12)",
    marginTop: "4px",
  },
  termsNoticeIcon: {
    color: "#10b981",
    fontSize: "12px",
    fontWeight: "bold",
  },
  termsNoticeText: {
    fontSize: "10px",
    color: "#475569",
    fontWeight: "500",
    lineHeight: "1.3",
  },
  termsLink: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "10px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0 2px",
    textDecoration: "underline",
  },
  featuresSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "16px",
    padding: "12px 0",
    borderTop: "1px solid rgba(0, 0, 0, 0.06)",
    borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
  },
  feature: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    flex: 1,
  },
  featureIcon: {
    fontSize: "18px",
  },
  featureText: {
    fontSize: "9px",
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },
  featureDivider: {
    width: "1px",
    height: "25px",
    background: "rgba(0, 0, 0, 0.08)",
  },
  supportSection: {
    marginTop: "14px",
  },
  supportButton: {
    width: "100%",
    background: "linear-gradient(135deg, #25D366, #128C7E)",
    border: "none",
    borderRadius: "40px",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
    boxShadow: "0 8px 20px -5px rgba(37, 211, 102, 0.35)",
  },
  supportIcon: {
    fontSize: "18px",
    color: "white",
  },
  supportText: {
    color: "white",
    fontSize: "13px",
    fontWeight: "600",
  },
  supportArrow: {
    color: "white",
    fontSize: "14px",
    opacity: 0.9,
    transition: "transform 0.3s ease",
  },
  footer: {
    marginTop: "14px",
    textAlign: "center",
  },
  copyright: {
    fontSize: "9px",
    color: "#94a3b8",
    fontWeight: "500",
  },
};