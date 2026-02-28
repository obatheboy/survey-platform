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
        {/* Premium Header with Glass Effect */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <div style={styles.logoWrapper}>
              <div style={styles.logoGlow}></div>
              <div style={styles.logoIcon}>📊</div>
            </div>
            <div style={styles.logoTextContainer}>
              <h1 style={styles.logo}>Survey<span style={styles.logoAccent}>Earn</span></h1>
              <p style={styles.tagline}>Turn your opinions into cash</p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div style={styles.trustIndicators}>
            <div style={styles.trustBadge}>
              <span style={styles.trustBadgeIcon}>✓</span>
              <span>10k+ Happy Users</span>
            </div>
            <div style={styles.trustBadge}>
              <span style={styles.trustBadgeIcon}>⭐</span>
              <span>4.8 Rating</span>
            </div>
            <div style={styles.trustBadge}>
              <span style={styles.trustBadgeIcon}>🔒</span>
              <span>Secure</span>
            </div>
          </div>
        </div>

        {/* Premium Mode Selector */}
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
            <span style={styles.modeButtonIcon}>✨</span>
            <span>Create Account</span>
          </button>
        </div>

        {/* Form Section */}
        {mode === "register" ? (
          <form onSubmit={handleRegister} key="register" style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <Input
                  placeholder="Enter your full name"
                  value={regData.full_name}
                  onChange={(e) =>
                    setRegData(prev => ({ ...prev, full_name: e.target.value }))
                  }
                  icon="👤"
                  error={errors.full_name}
                  required
                />
                {errors.full_name && <span style={styles.errorText}>{errors.full_name}</span>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <Input
                  placeholder="07XX XXX XXX"
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
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email (Optional)</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={regData.email}
                  onChange={(e) =>
                    setRegData(prev => ({ ...prev, email: e.target.value }))
                  }
                  icon="✉️"
                  error={errors.email}
                />
                {errors.email && <span style={styles.errorText}>{errors.email}</span>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.passwordContainer}>
                  <Input
                    placeholder="Create a strong password"
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
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm Password</label>
                <div style={styles.passwordContainer}>
                  <Input
                    placeholder="Re-enter your password"
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
              </div>

              {/* Referral Code - Premium Display */}
              {referralCodeFromUrl && (
                <div style={styles.referralBadge}>
                  <span style={styles.referralIcon}>🎁</span>
                  <div style={styles.referralContent}>
                    <span style={styles.referralLabel}>Referral Applied</span>
                    <span style={styles.referralCode}>{referralCodeFromUrl}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Auto-accepted Terms - Display only, no checkbox */}
            <div style={styles.termsNotice}>
              <span style={styles.termsNoticeIcon}>✓</span>
              <span style={styles.termsNoticeText}>
                By creating an account, you automatically agree to our{" "}
                <button
                  type="button"
                  style={styles.termsLink}
                  onClick={() => navigate("/terms")}
                >
                  Terms of Service
                </button>
                {" and "}
                <button
                  type="button"
                  style={styles.termsLink}
                  onClick={() => navigate("/privacy")}
                >
                  Privacy Policy
                </button>
              </span>
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
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <Input
                  placeholder="Enter your phone number"
                  type="tel"
                  value={loginData.phone}
                  onChange={(e) =>
                    setLoginData(prev => ({ ...prev, phone: e.target.value }))
                  }
                  icon="📱"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.passwordContainer}>
                  <Input
                    placeholder="Enter your password"
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
            </div>

            <div style={styles.forgotPassword}>
              <button type="button" style={styles.forgotButton}>
                Forgot password?
              </button>
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

        {/* Premium Features Section */}
        <div style={styles.featuresSection}>
          <div style={styles.feature}>
            <div style={styles.featureIconWrapper}>
              <span style={styles.featureIcon}>💰</span>
            </div>
            <div style={styles.featureContent}>
              <span style={styles.featureTitle}>Instant Cashout</span>
              <span style={styles.featureDesc}>Withdraw earnings instantly</span>
            </div>
          </div>

          <div style={styles.featureDivider}></div>

          <div style={styles.feature}>
            <div style={styles.featureIconWrapper}>
              <span style={styles.featureIcon}>⚡</span>
            </div>
            <div style={styles.featureContent}>
              <span style={styles.featureTitle}>Quick Surveys</span>
              <span style={styles.featureDesc}>5-10 minutes each</span>
            </div>
          </div>

          <div style={styles.featureDivider}></div>

          <div style={styles.feature}>
            <div style={styles.featureIconWrapper}>
              <span style={styles.featureIcon}>🔒</span>
            </div>
            <div style={styles.featureContent}>
              <span style={styles.featureTitle}>Bank-Level Security</span>
              <span style={styles.featureDesc}>Your data is safe</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Support - Premium */}
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
            <div style={styles.supportContent}>
              <span style={styles.supportTitle}>Need Help?</span>
              <span style={styles.supportText}>Chat with our support team</span>
            </div>
          </button>
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

// Professional Styles
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
    padding: "20px",
    boxSizing: "border-box",
  },
  backgroundBlur1: {
    position: "absolute",
    width: "300px",
    height: "300px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    top: "-100px",
    right: "-100px",
    filter: "blur(100px)",
    animation: "float 8s ease-in-out infinite",
  },
  backgroundBlur2: {
    position: "absolute",
    width: "400px",
    height: "400px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    bottom: "-150px",
    left: "-150px",
    filter: "blur(120px)",
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
    filter: "blur(80px)",
    animation: "pulse 4s ease-in-out infinite",
  },
  card: {
    maxWidth: "520px",
    width: "100%",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "32px",
    padding: "32px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    position: "relative",
    zIndex: 1,
    animation: "fadeIn 0.5s ease-out",
  },
  header: {
    marginBottom: "24px",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px",
  },
  logoWrapper: {
    position: "relative",
    width: "56px",
    height: "56px",
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
    fontSize: "28px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    padding: "12px",
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
    fontSize: "13px",
    fontWeight: "500",
    marginTop: "4px",
  },
  trustIndicators: {
    display: "flex",
    gap: "16px",
    padding: "12px 0",
    borderTop: "1px solid rgba(0, 0, 0, 0.05)",
    borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
  },
  trustBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
  },
  trustBadgeIcon: {
    color: "#10b981",
    fontSize: "12px",
  },
  modeSelector: {
    display: "flex",
    background: "#f1f5f9",
    borderRadius: "16px",
    padding: "4px",
    marginBottom: "28px",
    gap: "4px",
  },
  modeButton: {
    flex: 1,
    padding: "14px 8px",
    border: "none",
    background: "transparent",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  modeButtonIcon: {
    fontSize: "16px",
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
    gap: "20px",
  },
  formGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
    marginLeft: "4px",
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
    borderRadius: "14px",
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
    right: "12px",
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
    marginLeft: "4px",
  },
  referralBadge: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))",
    borderRadius: "14px",
    border: "1px solid rgba(16, 185, 129, 0.3)",
  },
  referralIcon: {
    fontSize: "24px",
  },
  referralContent: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  referralLabel: {
    fontSize: "11px",
    color: "#10b981",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  referralCode: {
    fontSize: "14px",
    color: "#065f46",
    fontWeight: "700",
    fontFamily: "monospace",
  },
  termsNotice: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
    background: "rgba(99, 102, 241, 0.05)",
    borderRadius: "12px",
    border: "1px solid rgba(99, 102, 241, 0.1)",
    marginTop: "8px",
  },
  termsNoticeIcon: {
    color: "#10b981",
    fontSize: "14px",
    fontWeight: "bold",
  },
  termsNoticeText: {
    fontSize: "12px",
    color: "#475569",
    fontWeight: "500",
    lineHeight: "1.4",
  },
  termsLink: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0 2px",
    textDecoration: "underline",
  },
  primaryButtonLogin: {
    width: "100%",
    padding: "16px",
    borderRadius: "14px",
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
  },
  primaryButtonRegister: {
    width: "100%",
    padding: "16px",
    borderRadius: "14px",
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
  },
  buttonIcon: {
    fontSize: "18px",
  },
  loadingSpinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  message: {
    padding: "12px",
    borderRadius: "12px",
    textAlign: "center",
    fontSize: "13px",
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
    marginTop: "16px",
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
    padding: "5px 8px",
    borderRadius: "6px",
  },
  featuresSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "28px",
    padding: "20px 0",
    borderTop: "2px solid rgba(0, 0, 0, 0.05)",
    borderBottom: "2px solid rgba(0, 0, 0, 0.05)",
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
  },
  featureIconWrapper: {
    width: "36px",
    height: "36px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  featureIcon: {
    fontSize: "18px",
    color: "white",
  },
  featureContent: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  featureTitle: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#1e293b",
  },
  featureDesc: {
    fontSize: "9px",
    color: "#64748b",
    fontWeight: "500",
  },
  featureDivider: {
    width: "1px",
    height: "30px",
    background: "rgba(0, 0, 0, 0.1)",
    margin: "0 8px",
  },
  supportSection: {
    marginTop: "24px",
  },
  supportButton: {
    width: "100%",
    background: "linear-gradient(135deg, #25D366, #128C7E)",
    border: "none",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    boxShadow: "0 10px 20px -5px rgba(37, 211, 102, 0.3)",
  },
  supportIcon: {
    fontSize: "24px",
    color: "white",
  },
  supportContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "2px",
  },
  supportTitle: {
    color: "white",
    fontSize: "14px",
    fontWeight: "700",
  },
  supportText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "11px",
    fontWeight: "500",
  },
  footer: {
    marginTop: "20px",
    textAlign: "center",
  },
  copyright: {
    fontSize: "10px",
    color: "#94a3b8",
    fontWeight: "500",
  },
};