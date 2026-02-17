import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";

// Move Input component outside to prevent recreation
const Input = ({ type = "text", icon, ...props }) => (
  <div style={styles.inputContainer}>
    {icon && <span style={styles.inputIcon}>{icon}</span>}
    <input
      type={type}
      style={{
        ...styles.input,
        paddingLeft: icon ? "45px" : "20px",
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

  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regData, setRegData] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
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
      });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.removeItem("active_plan");
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
      {/* Animated Background Elements */}
      <div style={styles.backgroundBlob1}></div>
      <div style={styles.backgroundBlob2}></div>
      <div style={styles.backgroundBlob3}></div>
      <div style={styles.backgroundGrid}></div>

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

        {/* SIMPLIFIED: Remove the problematic wrapper divs */}
        {mode === "register" ? (
          <form onSubmit={handleRegister} key="register">
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
          <form onSubmit={handleLogin} key="login">
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

        {/* Terms and Conditions - Auto Accepted */}
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

      {/* WhatsApp Support - Premium Floating Button */}
      <div style={styles.contactContainer}>
        <div style={styles.contactPulse}></div>
        <button
          style={styles.contactButton}
          onClick={() => {
            const message = encodeURIComponent(
              "Hello, I need help with the Survey App."
            );
            const whatsappUrl = `https://wa.me/254102074596?text=${message}`;
            window.open(whatsappUrl, "_blank", "noopener,noreferrer");
          }}
          title="Contact Support on WhatsApp"
        >
          <span style={styles.contactButtonIcon}>💬</span>
        </button>
        <span style={styles.contactCaption}>Support</span>
      </div>

      {/* Footer - Perfectly Positioned */}
      <div style={styles.footer}>
        <div style={styles.footerContent}>
          <span style={styles.footerCopyright}>© 2024 SurveyEarn</span>
          <span style={styles.footerDot}>•</span>
          <button style={styles.footerLink} onClick={() => navigate("/terms")}>
            Terms
          </button>
          <span style={styles.footerDot}>•</span>
          <button style={styles.footerLink} onClick={() => navigate("/privacy")}>
            Privacy
          </button>
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
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.5); opacity: 0.8; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          @keyframes blob {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
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

          @media (max-height: 700px) {
            .compact-mode {
              padding-top: 10px !important;
              padding-bottom: 10px !important;
            }
            
            .compact-form {
              margin-top: 10px !important;
            }
          }
        `}
      </style>
    </div>
  );
}

// PREMIUM STYLES OPTIMIZED FOR MOBILE
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    background: "linear-gradient(145deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  backgroundBlob1: {
    position: "absolute",
    width: "250px",
    height: "250px",
    background: "rgba(255, 182, 193, 0.2)",
    borderRadius: "50%",
    top: "-80px",
    left: "-80px",
    animation: "blob 12s ease-in-out infinite",
    zIndex: 0,
  },
  backgroundBlob2: {
    position: "absolute",
    width: "300px",
    height: "300px",
    background: "rgba(135, 206, 235, 0.15)",
    borderRadius: "50%",
    bottom: "-120px",
    right: "-100px",
    animation: "blob 15s ease-in-out infinite reverse",
    zIndex: 0,
  },
  backgroundBlob3: {
    position: "absolute",
    width: "200px",
    height: "200px",
    background: "rgba(255, 215, 0, 0.1)",
    borderRadius: "50%",
    top: "40%",
    left: "60%",
    animation: "float 8s ease-in-out infinite",
    zIndex: 0,
  },
  backgroundGrid: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundImage: `
      linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
    `,
    backgroundSize: "30px 30px",
    zIndex: 0,
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    padding: "24px 20px",
    borderRadius: "28px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    zIndex: 1,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    margin: "auto",
    maxHeight: "calc(100vh - 100px)",
    overflowY: "auto",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
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
    filter: "blur(12px)",
    opacity: 0.6,
    animation: "pulse 3s ease-in-out infinite",
  },
  logoIcon: {
    position: "relative",
    fontSize: "26px",
    background: "linear-gradient(135deg, #FF6B6B, #4ECDC4)",
    padding: "11px",
    borderRadius: "14px",
    boxShadow: "0 8px 20px -5px rgba(255, 107, 107, 0.4)",
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
    gap: "6px",
    background: "rgba(255, 107, 107, 0.08)",
    padding: "6px 10px",
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
    fontSize: "12px",
  },
  modeSelector: {
    display: "flex",
    background: "rgba(0, 0, 0, 0.03)",
    borderRadius: "14px",
    padding: "4px",
    marginBottom: "20px",
    gap: "4px",
  },
  modeButton: {
    flex: 1,
    padding: "10px",
    border: "none",
    background: "transparent",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#666",
    cursor: "pointer",
    transition: "all 0.2s ease",
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
    color: "#FF6B6B",
    boxShadow: "0 4px 10px -2px rgba(255, 107, 107, 0.2)",
  },
  modeButtonActiveRegister: {
    background: "#ffffff",
    color: "#4ECDC4",
    boxShadow: "0 4px 10px -2px rgba(78, 205, 196, 0.2)",
  },
  formGroup: {
    marginBottom: "12px",
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
    padding: "12px 16px 12px 42px",
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
    padding: "6px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  forgotPassword: {
    textAlign: "right",
    marginBottom: "12px",
  },
  forgotButton: {
    background: "none",
    border: "none",
    color: "#FF6B6B",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "4px 6px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
  },
  primaryButtonLogin: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
    color: "white",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "4px",
    boxShadow: "0 8px 16px -4px rgba(255, 107, 107, 0.3)",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  primaryButtonRegister: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%)",
    color: "white",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "4px",
    boxShadow: "0 8px 16px -4px rgba(78, 205, 196, 0.3)",
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
    padding: "10px",
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
  benefits: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "2px solid rgba(0, 0, 0, 0.05)",
  },
  benefit: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
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
  footer: {
    position: "fixed",
    bottom: "10px",
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    zIndex: 2,
  },
  footerContent: {
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(10px)",
    padding: "8px 18px",
    borderRadius: "40px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
  },
  footerCopyright: {
    color: "white",
    fontSize: "11px",
    fontWeight: "500",
    opacity: 0.9,
  },
  footerDot: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "11px",
  },
  footerLink: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0",
    opacity: 0.9,
    transition: "opacity 0.2s ease",
  },
  contactContainer: {
    position: "fixed",
    bottom: "80px",
    right: "15px",
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  contactPulse: {
    position: "absolute",
    width: "50px",
    height: "50px",
    background: "#25D366",
    borderRadius: "50%",
    animation: "pulse 2s ease-in-out infinite",
    opacity: 0.3,
  },
  contactButton: {
    position: "relative",
    background: "#25D366",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    fontSize: "24px",
    boxShadow: "0 6px 16px rgba(37, 211, 102, 0.3)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    color: "white",
    transition: "all 0.3s ease",
  },
  contactButtonIcon: {
    fontSize: "24px",
  },
  contactCaption: {
    background: 'rgba(0,0,0,0.8)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '10px',
    fontWeight: '600',
    margin: 0,
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    whiteSpace: 'nowrap',
  },
  termsContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "16px",
    padding: "10px 0",
    background: "rgba(0, 0, 0, 0.02)",
    borderRadius: "10px",
    justifyContent: "center",
  },
  termsCheckbox: {
    width: "16px",
    height: "16px",
    minWidth: "16px",
    cursor: "pointer",
    accentColor: "#FF6B6B",
    borderRadius: "5px",
  },
  termsLabel: {
    fontSize: "11px",
    color: "#666",
    fontWeight: "500",
    cursor: "pointer",
    lineHeight: "1.4",
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