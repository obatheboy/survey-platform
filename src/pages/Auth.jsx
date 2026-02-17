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
            <p style={styles.tagline}>Turn your opinions into cash!</p>
          </div>
        </div>

        {/* Trust Badge */}
        <div style={styles.trustBadge}>
          <span style={styles.trustBadgeIcon}>✓</span>
          <span style={styles.trustBadgeText}>Trusted by 10,000+ users</span>
        </div>

        {/* Mode selector - Premium Toggle */}
        <div style={styles.modeSelector}>
          <button
            style={{
              ...styles.modeButton,
              ...(mode === "login" ? styles.modeButtonActive : {}),
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
              ...(mode === "register" ? styles.modeButtonActive : {}),
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
              <p style={styles.emailCaption}>💡 Skip if no email</p>
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
              style={styles.primaryButton}
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
              style={styles.primaryButton}
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
            <div style={styles.benefitIconWrapper}>
              <span style={styles.benefitIcon}>💰</span>
            </div>
            <span style={styles.benefitText}>Instant Cashout</span>
          </div>
          <div style={styles.benefitDivider}></div>
          <div style={styles.benefit}>
            <div style={styles.benefitIconWrapper}>
              <span style={styles.benefitIcon}>⚡</span>
            </div>
            <span style={styles.benefitText}>Quick Surveys</span>
          </div>
          <div style={styles.benefitDivider}></div>
          <div style={styles.benefit}>
            <div style={styles.benefitIconWrapper}>
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
              Terms & Privacy
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

      {/* Footer - Premium */}
      <div style={styles.footer}>
        <p>
          © 2024 SurveyEarn •{" "}
          <button
            style={styles.footerLink}
            onClick={() => navigate("/terms")}
            type="button"
          >
            Terms
          </button>
          {" • "}
          <button
            style={styles.footerLink}
            onClick={() => navigate("/privacy")}
            type="button"
          >
            Privacy
          </button>
        </p>
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
            border-color: #2563eb !important;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
          }
          
          button {
            transition: all 0.3s ease !important;
          }
          
          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
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

// PREMIUM STYLES FOR ATTRACTIVE UI
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "15px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  backgroundBlob1: {
    position: "absolute",
    width: "300px",
    height: "300px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    top: "-100px",
    left: "-100px",
    animation: "blob 10s ease-in-out infinite",
    zIndex: 0,
  },
  backgroundBlob2: {
    position: "absolute",
    width: "400px",
    height: "400px",
    background: "rgba(255, 255, 255, 0.08)",
    borderRadius: "50%",
    bottom: "-150px",
    right: "-150px",
    animation: "blob 15s ease-in-out infinite reverse",
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
    backgroundSize: "50px 50px",
    zIndex: 0,
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "35px 28px",
    borderRadius: "32px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    zIndex: 1,
    position: "relative",
    display: "flex",
    flexDirection: "column",
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
    borderRadius: "18px",
    filter: "blur(15px)",
    opacity: 0.5,
    animation: "pulse 3s ease-in-out infinite",
  },
  logoIcon: {
    position: "relative",
    fontSize: "32px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    padding: "14px",
    borderRadius: "18px",
    boxShadow: "0 10px 25px -5px rgba(102, 126, 234, 0.4)",
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
    color: "#1a1a1a",
    letterSpacing: "-0.5px",
  },
  logoAccent: {
    color: "#667eea",
  },
  tagline: {
    color: "#666",
    fontSize: "13px",
    fontWeight: "500",
    marginTop: "2px",
  },
  trustBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(102, 126, 234, 0.1)",
    padding: "8px 12px",
    borderRadius: "30px",
    marginBottom: "20px",
    width: "fit-content",
  },
  trustBadgeIcon: {
    background: "#10b981",
    color: "white",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
  },
  trustBadgeText: {
    color: "#667eea",
    fontSize: "12px",
    fontWeight: "600",
  },
  modeSelector: {
    display: "flex",
    background: "rgba(0, 0, 0, 0.03)",
    borderRadius: "16px",
    padding: "4px",
    marginBottom: "24px",
    gap: "4px",
  },
  modeButton: {
    flex: 1,
    padding: "12px",
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
    gap: "8px",
  },
  modeButtonIcon: {
    fontSize: "16px",
  },
  modeButtonActive: {
    background: "#ffffff",
    color: "#667eea",
    boxShadow: "0 4px 10px -2px rgba(0, 0, 0, 0.1)",
  },
  formGroup: {
    marginBottom: "16px",
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
    color: "#999",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: "100%",
    padding: "14px 16px 14px 44px",
    borderRadius: "16px",
    border: "2px solid #e0e0e0",
    background: "#ffffff",
    fontSize: "15px",
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
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#666",
    padding: "8px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  forgotPassword: {
    textAlign: "right",
    marginBottom: "16px",
  },
  forgotButton: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
  },
  primaryButton: {
    width: "100%",
    padding: "16px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
    boxShadow: "0 10px 20px -5px rgba(102, 126, 234, 0.4)",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  buttonIcon: {
    fontSize: "18px",
  },
  loadingSpinner: {
    width: "20px",
    height: "20px",
    border: "3px solid rgba(255,255,255,0.3)",
    borderTop: "3px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  message: {
    marginTop: "16px",
    padding: "12px",
    borderRadius: "12px",
    textAlign: "center",
    fontSize: "13px",
    fontWeight: "600",
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fee2e2",
  },
  switchText: {
    textAlign: "center",
    marginTop: "20px",
    color: "#666",
    fontSize: "14px",
    fontWeight: "500",
  },
  switchButton: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "14px",
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
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "2px solid rgba(0, 0, 0, 0.05)",
  },
  benefit: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  benefitIconWrapper: {
    background: "rgba(102, 126, 234, 0.1)",
    padding: "10px",
    borderRadius: "12px",
  },
  benefitIcon: {
    fontSize: "20px",
  },
  benefitText: {
    fontSize: "11px",
    color: "#666",
    fontWeight: "600",
  },
  benefitDivider: {
    width: "1px",
    height: "30px",
    background: "rgba(0, 0, 0, 0.1)",
  },
  footer: {
    position: "fixed",
    bottom: "20px",
    width: "100%",
    textAlign: "center",
    color: "white",
    fontSize: "12px",
    padding: "0 15px",
    zIndex: 1,
    textShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  contactContainer: {
    position: "fixed",
    bottom: "100px",
    right: "20px",
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  contactPulse: {
    position: "absolute",
    width: "60px",
    height: "60px",
    background: "#25D366",
    borderRadius: "50%",
    animation: "pulse 2s ease-in-out infinite",
    opacity: 0.3,
  },
  contactButton: {
    position: "relative",
    background: "#25D366",
    borderRadius: "50%",
    width: "60px",
    height: "60px",
    fontSize: "28px",
    boxShadow: "0 8px 20px rgba(37, 211, 102, 0.3)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    color: "white",
    transition: "all 0.3s ease",
  },
  contactButtonIcon: {
    fontSize: "28px",
  },
  contactCaption: {
    background: 'rgba(0,0,0,0.8)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    margin: 0,
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    whiteSpace: 'nowrap',
  },
  termsContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "20px",
    padding: "12px 0",
    background: "rgba(0, 0, 0, 0.02)",
    borderRadius: "12px",
    justifyContent: "center",
  },
  termsCheckbox: {
    width: "18px",
    height: "18px",
    minWidth: "18px",
    cursor: "pointer",
    accentColor: "#667eea",
    borderRadius: "6px",
  },
  termsLabel: {
    fontSize: "12px",
    color: "#666",
    fontWeight: "500",
    cursor: "pointer",
    lineHeight: "1.5",
  },
  termsLink: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    padding: "0",
    textDecoration: "underline",
  },
  emailCaption: {
    fontSize: "11px",
    color: "#999",
    marginTop: "6px",
    fontWeight: "400",
    fontStyle: "italic",
    paddingLeft: "4px",
  },
  footerLink: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0",
    textDecoration: "underline",
    opacity: 0.9,
  },
};