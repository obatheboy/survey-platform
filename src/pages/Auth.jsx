import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";

// Move Input component outside to prevent recreation
const Input = ({ type = "text", icon, readOnly, disabled, ...props }) => (
  <div style={styles.inputContainer}>
    {icon && <span style={styles.inputIcon}>{icon}</span>}
    <input
      type={type}
      readOnly={readOnly}
      disabled={disabled}
      style={{
        ...styles.input,
        paddingLeft: icon ? "45px" : "20px",
        cursor: disabled ? 'not-allowed' : readOnly ? 'default' : 'text',
        pointerEvents: disabled ? 'none' : 'auto',
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
  const [termsChecked, setTermsChecked] = useState(false);

  // Get referral code from URL
  const referralCodeFromUrl = searchParams.get("ref");

  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

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

  // Use useCallback for handlers to prevent recreation
  const handleRegister = useCallback(async (e) => {
    e.preventDefault();
    setRegMessage("");
    setShake(false);
    setTermsChecked(true);

    if (regData.password !== regData.confirmPassword) {
      setRegMessage("Passwords do not match");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (regData.password.length < 4) {
      setRegMessage("Password must be at least 4 characters");
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

      setRegMessage("Account created successfully! Redirecting...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    } catch (err) {
      setRegMessage(err.response?.data?.message || "Registration failed");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  }, [regData, navigate]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setLoginMessage("");
    setShake(false);

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
          setLoginMessage("Offline mode: using last saved session.");
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
      <div
        style={{
          ...styles.card,
          opacity: loading ? 0.7 : 1,
          pointerEvents: loading ? "none" : "auto",
          animation: shake ? "shake 0.5s ease-in-out" : "none",
        }}
      >
        {/* Logo and greeting - Premium Design */}
        <div style={styles.logoContainer}>
          <div style={styles.logoWrapper}>
            <div style={styles.logoGlow}></div>
            <div style={styles.logoIcon}>📊</div>
          </div>
          <div style={styles.logoTextContainer}>
            <h1 style={styles.logo}>Survey<span style={styles.logoAccent}>Earn</span></h1>
            <p style={styles.tagline}>Turn opinions into cash 💰</p>
          </div>
        </div>

        {/* Trust Badge */}
        <div style={styles.trustBadge}>
          <span style={styles.trustBadgeIcon}>✓</span>
          <span style={styles.trustBadgeText}>10k+ Happy Earners</span>
          <span style={styles.trustBadgeDot}>•</span>
          <span style={styles.trustBadgeText}>4.8 ★</span>
        </div>

        {/* Mode selector - Premium Toggle */}
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
            Log In
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
            Sign Up
          </button>
        </div>

        {/* Form Section - Conditional */}
        {mode === "register" ? (
          <form onSubmit={handleRegister} key="register" style={styles.form}>
            <div style={styles.formGroup}>
              <Input
                placeholder="Full Name"
                value={regData.full_name}
                onChange={(e) =>
                  setRegData(prev => ({ ...prev, full_name: e.target.value }))
                }
                icon="👤"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <Input
                placeholder="Phone Number"
                type="tel"
                value={regData.phone}
                onChange={(e) =>
                  setRegData(prev => ({ ...prev, phone: e.target.value }))
                }
                icon="📱"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <Input
                type="email"
                placeholder="Email (optional)"
                value={regData.email}
                onChange={(e) =>
                  setRegData(prev => ({ ...prev, email: e.target.value }))
                }
                icon="✉️"
              />
            </div>

            <div style={styles.formGroup}>
              <div style={styles.passwordContainer}>
                <Input
                  placeholder="Password"
                  type={showRegPassword ? "text" : "password"}
                  value={regData.password}
                  onChange={(e) =>
                    setRegData(prev => ({ ...prev, password: e.target.value }))
                  }
                  icon="🔒"
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
            </div>

            <div style={styles.formGroup}>
              <div style={styles.passwordContainer}>
                <Input
                  placeholder="Confirm Password"
                  type={showRegConfirm ? "text" : "password"}
                  value={regData.confirmPassword}
                  onChange={(e) =>
                    setRegData(prev => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  icon="✅"
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
            </div>

            {/* Referral Code - Read Only and Hidden by default, shown only when provided in URL */}
            {referralCodeFromUrl && (
              <div style={{...styles.formGroup, marginTop: '12px', padding: '10px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px', border: '1px solid rgba(76, 175, 80, 0.3)'}}>
                <label style={{fontSize: '12px', color: '#4caf50', marginBottom: '4px', display: 'block'}}>
                  ✓ Referral Code Applied
                </label>
                <Input
                  placeholder="Referral Code"
                  value={referralCodeFromUrl}
                  readOnly
                  icon="🎁"
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    cursor: 'not-allowed',
                  }}
                />
              </div>
            )}

            <button
              style={styles.primaryButtonRegister}
              type="submit"
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
              <p style={styles.message}>{regMessage}</p>
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
            <div style={styles.formGroup}>
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
            </div>

            <div style={styles.formGroup}>
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
                Forgot Password?
              </button>
            </div>

            <button
              style={styles.primaryButtonLogin}
              type="submit"
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
              <p style={styles.message}>{loginMessage}</p>
            )}

            <p style={styles.switchText}>
              New here?{" "}
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

        {/* Bottom Section - All Inside Card */}
        <div style={styles.bottomSection}>
          {/* Benefits showcase - Premium */}
          <div style={styles.benefits}>
            <div style={styles.benefit}>
              <div style={{...styles.benefitIconWrapper, background: "linear-gradient(135deg, #FF6B6B, #FF8E53)"}}>
                <span style={styles.benefitIcon}>💰</span>
              </div>
              <span style={styles.benefitText}>Instant Cashout</span>
            </div>
            <div style={styles.benefitDivider}></div>
            <div style={styles.benefit}>
              <div style={{...styles.benefitIconWrapper, background: "linear-gradient(135deg, #4ECDC4, #45B7D1)"}}>
                <span style={styles.benefitIcon}>⚡</span>
              </div>
              <span style={styles.benefitText}>Quick Surveys</span>
            </div>
            <div style={styles.benefitDivider}></div>
            <div style={styles.benefit}>
              <div style={{...styles.benefitIconWrapper, background: "linear-gradient(135deg, #A8E6CF, #56AB2F)"}}>
                <span style={styles.benefitIcon}>🔒</span>
              </div>
              <span style={styles.benefitText}>Secure</span>
            </div>
          </div>

          {/* WhatsApp Support - Inside Card */}
          <div style={styles.supportContainer}>
            <button
              style={styles.supportButton}
              onClick={() => {
                const message = encodeURIComponent(
                  "Hello, I need help with login/registering in Survey App."
                );
                const whatsappUrl = `https://wa.me/254786357584?text=${message}`;
                window.open(whatsappUrl, "_blank", "noopener,noreferrer");
              }}
              title="Contact Support on WhatsApp"
            >
              <span style={styles.supportIcon}>💬</span>
              <span style={styles.supportText}>Need Help? Chat with us</span>
            </button>
          </div>

          {/* Terms and Footer - All Inside */}
          <div style={styles.termsContainer}>
            <input
              type="checkbox"
              id="termsAccepted"
              checked={termsChecked}
              readOnly
              style={styles.termsCheckbox}
            />
            <label htmlFor="termsAccepted" style={styles.termsLabel}>
              I agree to the{" "}
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
            </label>
          </div>
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

          @keyframes checkmark {
            0% {
              transform: scale(0.5);
              opacity: 0;
            }
            50% {
              transform: scale(1.2);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          input[type="checkbox"]:checked {
            animation: checkmark 0.4s ease-out;
          }
          
          input:focus {
            border-color: #FF6B6B !important;
            box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1) !important;
          }
          
          button {
            transition: all 0.3s ease !important;
          }
          
          button:hover {
            transform: translateY(-2px);
          }
          
          button:active {
            transform: translateY(0px);
          }
        `}
      </style>
    </div>
  );
}

// FULL SCREEN STYLES - CARD FITS ENTIRE SCREEN
const styles = {
  page: {
    minHeight: "100vh",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(145deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    padding: 0,
  },
  card: {
    width: "100%",
    height: "100%",
    padding: "24px 20px",
    background: "linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.95))",
    backdropFilter: "blur(20px)",
    boxShadow: "none",
    border: "none",
    zIndex: 1,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    margin: 0,
    overflowY: "auto",
    overscrollBehavior: "contain",
    WebkitOverflowScrolling: "touch",
    borderRadius: 0,
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  logoWrapper: {
    position: "relative",
    width: "48px",
    height: "48px",
  },
  logoGlow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #FF6B6B, #4ECDC4)",
    borderRadius: "14px",
    filter: "blur(10px)",
    opacity: 0.6,
  },
  logoIcon: {
    position: "relative",
    fontSize: "26px",
    background: "linear-gradient(135deg, #FF6B6B, #4ECDC4)",
    padding: "10px",
    borderRadius: "14px",
    boxShadow: "0 8px 16px -5px rgba(255, 107, 107, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
  logoTextContainer: {
    flex: 1,
  },
  logo: {
    fontSize: "26px",
    fontWeight: "800",
    margin: 0,
    color: "#1a1a1a",
    letterSpacing: "-0.5px",
    lineHeight: 1.2,
  },
  logoAccent: {
    background: "linear-gradient(135deg, #FF6B6B, #4ECDC4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  tagline: {
    color: "#666",
    fontSize: "12px",
    fontWeight: "500",
    marginTop: "2px",
  },
  trustBadge: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "rgba(255, 107, 107, 0.08)",
    padding: "5px 10px",
    borderRadius: "30px",
    marginBottom: "16px",
    width: "fit-content",
  },
  trustBadgeIcon: {
    background: "#10b981",
    color: "white",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "bold",
  },
  trustBadgeText: {
    color: "#FF6B6B",
    fontSize: "11px",
    fontWeight: "600",
  },
  trustBadgeDot: {
    color: "#FF6B6B",
    fontSize: "11px",
  },
  modeSelector: {
    display: "flex",
    background: "rgba(0, 0, 0, 0.03)",
    borderRadius: "14px",
    padding: "3px",
    marginBottom: "24px",
    gap: "3px",
  },
  modeButton: {
    flex: 1,
    padding: "12px 8px",
    border: "none",
    background: "transparent",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#666",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
  },
  modeButtonIcon: {
    fontSize: "15px",
  },
  modeButtonActiveLogin: {
    background: "#ffffff",
    color: "#FF6B6B",
    boxShadow: "0 4px 8px -2px rgba(255, 107, 107, 0.2)",
  },
  modeButtonActiveRegister: {
    background: "#ffffff",
    color: "#4ECDC4",
    boxShadow: "0 4px 8px -2px rgba(78, 205, 196, 0.2)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: 1,
  },
  formGroup: {
    marginBottom: "4px",
  },
  inputContainer: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "15px",
    color: "#999",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: "100%",
    padding: "14px 14px 14px 42px",
    borderRadius: "14px",
    border: "2px solid #f0f0f0",
    background: "#ffffff",
    fontSize: "14px",
    fontWeight: "500",
    color: "#333",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordToggle: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "#666",
    padding: "5px",
    borderRadius: "4px",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  forgotPassword: {
    textAlign: "right",
    marginBottom: "8px",
  },
  forgotButton: {
    background: "none",
    border: "none",
    color: "#FF6B6B",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "5px 8px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
  },
  primaryButtonLogin: {
    width: "100%",
    padding: "16px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
    color: "white",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
    boxShadow: "0 6px 12px -4px rgba(255, 107, 107, 0.3)",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  primaryButtonRegister: {
    width: "100%",
    padding: "16px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%)",
    color: "white",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
    boxShadow: "0 6px 12px -4px rgba(78, 205, 196, 0.3)",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  buttonIcon: {
    fontSize: "16px",
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
    marginTop: "12px",
    padding: "12px",
    borderRadius: "10px",
    textAlign: "center",
    fontSize: "12px",
    fontWeight: "600",
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fee2e2",
  },
  switchText: {
    textAlign: "center",
    marginTop: "16px",
    color: "#666",
    fontSize: "13px",
    fontWeight: "500",
  },
  switchButton: {
    background: "none",
    border: "none",
    color: "#FF6B6B",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    padding: "2px 4px",
    borderRadius: "4px",
    transition: "all 0.2s ease",
  },
  bottomSection: {
    marginTop: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  benefits: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderTop: "2px solid rgba(0, 0, 0, 0.05)",
    borderBottom: "2px solid rgba(0, 0, 0, 0.05)",
  },
  benefit: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
  },
  benefitIconWrapper: {
    padding: "8px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitIcon: {
    fontSize: "18px",
    color: "white",
  },
  benefitText: {
    fontSize: "10px",
    color: "#666",
    fontWeight: "600",
  },
  benefitDivider: {
    width: "1px",
    height: "25px",
    background: "rgba(0, 0, 0, 0.1)",
  },
  supportContainer: {
    display: "flex",
    justifyContent: "center",
  },
  supportButton: {
    background: "linear-gradient(135deg, #25D366, #128C7E)",
    border: "none",
    borderRadius: "30px",
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
    transition: "all 0.3s ease",
    width: "fit-content",
  },
  supportIcon: {
    fontSize: "20px",
    color: "white",
  },
  supportText: {
    color: "white",
    fontSize: "12px",
    fontWeight: "600",
  },
  termsContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  termsCheckbox: {
    width: "16px",
    height: "16px",
    minWidth: "16px",
    cursor: "pointer",
    accentColor: "#FF6B6B",
    borderRadius: "4px",
  },
  termsLabel: {
    fontSize: "11px",
    color: "#666",
    fontWeight: "500",
    cursor: "pointer",
    lineHeight: "1.3",
  },
  termsLink: {
    background: "none",
    border: "none",
    color: "#FF6B6B",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    padding: "0",
    textDecoration: "underline",
  },
};