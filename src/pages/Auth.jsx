import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";

// Enhanced Input component with professional styling
const Input = ({ type = "text", icon, readOnly, disabled, error, ...props }) => (
  <div style={styles.inputContainer}>
    {icon && <span style={styles.inputIcon}>{icon}</span>}
    <input
      type={type}
      readOnly={readOnly}
      disabled={disabled}
      style={{
        ...styles.input,
        paddingLeft: icon ? "48px" : "20px",
        cursor: disabled ? 'not-allowed' : readOnly ? 'default' : 'text',
        pointerEvents: disabled ? 'none' : 'auto',
        borderColor: error ? '#ef4444' : '#e2e8f0',
        backgroundColor: readOnly ? '#f8fafc' : '#ffffff',
      }}
      {...props}
    />
  </div>
);

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "register";
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Get referral code from URL
  const referralCodeFromUrl = searchParams.get("ref");

  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Validation states
  const [errors, setErrors] = useState({});

  const [regData, setRegData] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: referralCodeFromUrl || "",
  });
  const [regMessage, setRegMessage] = useState("");

  const [loginData, setLoginData] = useState({
    phone: "",
    password: "",
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

  // Validate registration data
  const validateRegistration = () => {
    const newErrors = {};
    
    if (!regData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    } else if (regData.full_name.length < 3) {
      newErrors.full_name = "Name must be at least 3 characters";
    }
    
    if (!regData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9+\-\s]{10,}$/.test(regData.phone.replace(/\D/g, ''))) {
      newErrors.phone = "Enter a valid phone number";
    }
    
    if (regData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regData.email)) {
      newErrors.email = "Enter a valid email address";
    }
    
    if (!regData.password) {
      newErrors.password = "Password is required";
    } else if (regData.password.length < 4) {
      newErrors.password = "Password must be at least 4 characters";
    }
    
    if (regData.password !== regData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
        email: regData.email || null,
        password: regData.password,
        referral_code: regData.referralCode || referralCodeFromUrl || null,
      });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.removeItem("active_plan");
        // Store welcome bonus status for Dashboard popup
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

    if (!loginData.phone || !loginData.password) {
      setLoginMessage("Please enter both phone and password");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/login", loginData);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.removeItem("active_plan");
        // Store welcome bonus status for Dashboard popup
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

      setLoginMessage(err.response?.data?.message || "Login failed. Try again.");
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
      
      <div
        style={{
          ...styles.card,
          opacity: loading ? 0.7 : 1,
          pointerEvents: loading ? "none" : "auto",
          animation: shake ? "shake 0.5s ease-in-out" : "none",
        }}
      >
        {/* Bold Large Logo Header */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <div style={styles.logoWrapper}>
              <div style={styles.logoGlow}></div>
              <div style={styles.logoIcon}>📊</div>
            </div>
            <div style={styles.logoTextContainer}>
              <h1 style={styles.logo}>Survey<span style={styles.logoAccent}>Earn</span></h1>
              <p style={styles.tagline}>Turn opinions into cash</p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div style={styles.trustIndicators}>
            <span style={styles.trustBadge}>✓ 10k+ Earners</span>
            <span style={styles.trustBadge}>⭐ 4.8 Rating</span>
            <span style={styles.trustBadge}>🔒 Secure</span>
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
            <span>Create Account</span>
          </button>
        </div>

        {/* Form Section */}
        {mode === "register" ? (
          <form onSubmit={handleRegister} key="register" style={styles.form}>
            <div style={styles.formGrid}>
              <Input
                placeholder="Full Name"
                value={regData.full_name}
                onChange={(e) =>
                  setRegData(prev => ({ ...prev, full_name: e.target.value }))
                }
                icon="👤"
                error={errors.full_name}
                required
              />
              {errors.full_name && <span style={styles.errorText}>{errors.full_name}</span>}

              <Input
                placeholder="Phone Number"
                type="tel"
                value={regData.phone}
                onChange={(e) =>
                  setRegData(prev => ({ ...prev, phone: e.target.value }))
                }
                icon="📱"
                error={errors.phone}
                required
              />
              {errors.phone && <span style={styles.errorText}>{errors.phone}</span>}

              <Input
                type="email"
                placeholder="Email (optional)"
                value={regData.email}
                onChange={(e) =>
                  setRegData(prev => ({ ...prev, email: e.target.value }))
                }
                icon="✉️"
                error={errors.email}
              />
              {errors.email && <span style={styles.errorText}>{errors.email}</span>}

              <div style={styles.passwordContainer}>
                <Input
                  placeholder="Password"
                  type={showRegPassword ? "text" : "password"}
                  value={regData.password}
                  onChange={(e) =>
                    setRegData(prev => ({ ...prev, password: e.target.value }))
                  }
                  icon="🔒"
                  error={errors.password}
                  required
                />
                <button
                  type="button"
                  style={styles.passwordToggle}
                  onClick={() => setShowRegPassword(!showRegPassword)}
                >
                  {showRegPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && <span style={styles.errorText}>{errors.password}</span>}

              <div style={styles.passwordContainer}>
                <Input
                  placeholder="Confirm Password"
                  type={showRegConfirm ? "text" : "password"}
                  value={regData.confirmPassword}
                  onChange={(e) =>
                    setRegData(prev => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  icon="✅"
                  error={errors.confirmPassword}
                  required
                />
                <button
                  type="button"
                  style={styles.passwordToggle}
                  onClick={() => setShowRegConfirm(!showRegConfirm)}
                >
                  {showRegConfirm ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.confirmPassword && <span style={styles.errorText}>{errors.confirmPassword}</span>}

              {/* Referral Code */}
              {referralCodeFromUrl && (
                <div style={styles.referralBadge}>
                  <span style={styles.referralIcon}>🎁</span>
                  <span style={styles.referralCode}>Referral: {referralCodeFromUrl}</span>
                </div>
              )}
            </div>

            {/* Create Account Button - Prominent */}
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

            {/* Terms Notice */}
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
                Sign In
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin} key="login" style={styles.form}>
            <div style={styles.formGrid}>
              <Input
                placeholder="Phone Number"
                type="tel"
                value={loginData.phone}
                onChange={(e) =>
                  setLoginData(prev => ({ ...prev, phone: e.target.value }))
                }
                icon="📱"
                required
              />

              <div style={styles.passwordContainer}>
                <Input
                  placeholder="Password"
                  type={showLoginPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData(prev => ({ ...prev, password: e.target.value }))
                  }
                  icon="🔒"
                  required
                />
                <button
                  type="button"
                  style={styles.passwordToggle}
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                >
                  {showLoginPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div style={styles.forgotPassword}>
              <button type="button" style={styles.forgotButton}>
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
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
                  Sign In
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
                Create Account
              </button>
            </p>
          </form>
        )}

        {/* WhatsApp Support - Prominent */}
        <div style={styles.supportSection}>
          <button
            style={styles.supportButton}
            onClick={() => {
              const message = encodeURIComponent(
                "Hello, I need help with my SurveyEarn account."
              );
              const whatsappUrl = `https://wa.me/254786357584?text=${message}`;
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

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.copyright}>© 2024 SurveyEarn. All rights reserved.</p>
        </div>
      </div>

      {/* Add CSS animations */}
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
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.8; }
          }

          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          input:focus {
            border-color: #6366f1 !important;
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
          }
          
          button {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          
          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
          }
          
          button:active {
            transform: translateY(0px);
          }
        `}
      </style>
    </div>
  );
}

// Balanced Styles - Not too compact, not too large
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
    padding: "16px",
    boxSizing: "border-box",
  },
  backgroundBlur1: {
    position: "absolute",
    width: "300px",
    height: "300px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    top: "-80px",
    right: "-80px",
    filter: "blur(80px)",
    animation: "float 8s ease-in-out infinite",
  },
  backgroundBlur2: {
    position: "absolute",
    width: "350px",
    height: "350px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    bottom: "-100px",
    left: "-100px",
    filter: "blur(90px)",
    animation: "float 10s ease-in-out infinite reverse",
  },
  backgroundBlur3: {
    position: "absolute",
    width: "200px",
    height: "200px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    filter: "blur(70px)",
    animation: "pulse 4s ease-in-out infinite",
  },
  card: {
    maxWidth: "480px",
    width: "100%",
    background: "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(20px)",
    borderRadius: "32px",
    padding: "28px 24px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    position: "relative",
    zIndex: 1,
    maxHeight: "98vh",
    overflowY: "auto",
  },
  header: {
    marginBottom: "20px",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "12px",
  },
  logoWrapper: {
    position: "relative",
    width: "60px",
    height: "60px",
  },
  logoGlow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    borderRadius: "16px",
    filter: "blur(12px)",
    opacity: 0.6,
    animation: "pulse 3s ease-in-out infinite",
  },
  logoIcon: {
    position: "relative",
    fontSize: "32px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    padding: "14px",
    borderRadius: "16px",
    boxShadow: "0 10px 20px -5px rgba(102, 126, 234, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
  logoTextContainer: {
    flex: 1,
  },
  logo: {
    fontSize: "32px",
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
    fontSize: "13px",
    fontWeight: "500",
    marginTop: "4px",
  },
  trustIndicators: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  trustBadge: {
    background: "rgba(255,255,255,0.9)",
    padding: "6px 12px",
    borderRadius: "30px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  modeSelector: {
    display: "flex",
    background: "#f1f5f9",
    borderRadius: "40px",
    padding: "4px",
    marginBottom: "24px",
    gap: "4px",
  },
  modeButton: {
    flex: 1,
    padding: "12px 8px",
    border: "none",
    background: "transparent",
    borderRadius: "36px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  modeButtonActiveLogin: {
    background: "#ffffff",
    color: "#667eea",
    boxShadow: "0 4px 10px -2px rgba(102, 126, 234, 0.2)",
  },
  modeButtonActiveRegister: {
    background: "#ffffff",
    color: "#764ba2",
    boxShadow: "0 4px 10px -2px rgba(118, 75, 162, 0.2)",
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
  inputContainer: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "16px",
    color: "#94a3b8",
    zIndex: 1,
  },
  input: {
    width: "100%",
    padding: "14px 14px 14px 48px",
    borderRadius: "40px",
    border: "2px solid #e2e8f0",
    background: "#ffffff",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordToggle: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#64748b",
    padding: "8px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  errorText: {
    fontSize: "11px",
    color: "#ef4444",
    fontWeight: "500",
    marginLeft: "12px",
    marginTop: "2px",
  },
  referralBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))",
    borderRadius: "40px",
    border: "1px solid rgba(16, 185, 129, 0.3)",
  },
  referralIcon: {
    fontSize: "18px",
  },
  referralCode: {
    fontSize: "13px",
    color: "#065f46",
    fontWeight: "700",
  },
  primaryButtonLogin: {
    width: "100%",
    padding: "16px",
    borderRadius: "40px",
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 10px 20px -5px rgba(102, 126, 234, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    marginTop: "8px",
  },
  primaryButtonRegister: {
    width: "100%",
    padding: "16px",
    borderRadius: "40px",
    border: "none",
    background: "linear-gradient(135deg, #764ba2, #667eea)",
    color: "white",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 10px 20px -5px rgba(118, 75, 162, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    marginTop: "8px",
  },
  buttonIcon: {
    fontSize: "18px",
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
    padding: "10px",
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
    marginTop: "12px",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "500",
  },
  switchButton: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "6px",
  },
  forgotPassword: {
    textAlign: "right",
    marginBottom: "8px",
  },
  forgotButton: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: "6px",
  },
  termsNotice: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
    background: "rgba(99, 102, 241, 0.05)",
    borderRadius: "40px",
    border: "1px solid rgba(99, 102, 241, 0.1)",
    marginTop: "8px",
  },
  termsNoticeIcon: {
    color: "#10b981",
    fontSize: "14px",
    fontWeight: "bold",
  },
  termsNoticeText: {
    fontSize: "11px",
    color: "#475569",
    fontWeight: "500",
    lineHeight: "1.4",
  },
  termsLink: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0 2px",
    textDecoration: "underline",
  },
  featuresSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    padding: "16px 0",
    borderTop: "1px solid rgba(0, 0, 0, 0.05)",
    borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
  },
  feature: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    flex: 1,
  },
  featureIcon: {
    fontSize: "20px",
  },
  featureText: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },
  featureDivider: {
    width: "1px",
    height: "30px",
    background: "rgba(0, 0, 0, 0.1)",
  },
  supportSection: {
    marginTop: "16px",
  },
  supportButton: {
    width: "100%",
    background: "linear-gradient(135deg, #25D366, #128C7E)",
    border: "none",
    borderRadius: "40px",
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
    boxShadow: "0 10px 20px -5px rgba(37, 211, 102, 0.3)",
  },
  supportIcon: {
    fontSize: "20px",
    color: "white",
  },
  supportText: {
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
  },
  supportArrow: {
    color: "white",
    fontSize: "16px",
    opacity: 0.8,
  },
  footer: {
    marginTop: "16px",
    textAlign: "center",
  },
  copyright: {
    fontSize: "10px",
    color: "#94a3b8",
    fontWeight: "500",
  },
};