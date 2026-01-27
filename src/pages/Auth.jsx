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

  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regData, setRegData] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: true,
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

    if (!regData.termsAccepted) {
      setRegMessage("You must accept the Terms and Conditions to register");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

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
      {/* Decorative elements - reduced size */}
      <div style={styles.decorativeCircle1}></div>
      <div style={styles.decorativeCircle2}></div>

      <div
        style={{
          ...styles.card,
          opacity: loading ? 0.7 : 1,
          pointerEvents: loading ? "none" : "auto",
          animation: shake ? "shake 0.5s ease-in-out" : "none",
        }}
      >
        {/* Logo and greeting - more compact */}
        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>📊</div>
          <h1 style={styles.logo}>SurveyEarn</h1>
        </div>
        <p style={styles.tagline}>Share Opinions • Earn Rewards</p>

        {/* Mode selector - compact */}
        <div style={styles.modeSelector}>
          <button
            style={{
              ...styles.modeButton,
              ...(mode === "login" ? styles.modeButtonActive : {}),
            }}
            onClick={() => setMode("login")}
            type="button"
          >
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
              <p style={styles.emailCaption}>You can skip this if you don't have an email address</p>
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

            <div style={styles.termsContainer}>
              <input
                type="checkbox"
                id="termsAccepted"
                checked={regData.termsAccepted}
                onChange={(e) =>
                  setRegData(prev => ({ ...prev, termsAccepted: e.target.checked }))
                }
                style={styles.termsCheckbox}
              />
              <label htmlFor="termsAccepted" style={styles.termsLabel}>
                I agree to the{" "}
                <button
                  type="button"
                  style={styles.termsLink}
                  onClick={() => navigate("/terms")}
                >
                  Terms and Conditions
                </button>
              </label>
            </div>

            <button
              style={styles.primaryButton}
              type="submit"
            >
              {loading ? (
                <div style={styles.loadingSpinner}></div>
              ) : (
                "Create Account 🚀"
              )}
            </button>

            {regMessage && (
              <p style={styles.message}>{regMessage}</p>
            )}

            <p style={styles.switchText}>
              Have an account?{" "}
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
                "Sign In 🔐"
              )}
            </button>

            {loginMessage && (
              <p style={styles.message}>{loginMessage}</p>
            )}

            <p style={styles.switchText}>
              New user?{" "}
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

        {/* Benefits showcase - more compact */}
        <div style={styles.benefits}>
          <div style={styles.benefit}>
            <span style={styles.benefitIcon}>💰</span>
            <span>Earn Cash</span>
          </div>
          <div style={styles.benefit}>
            <span style={styles.benefitIcon}>⚡</span>
            <span>Quick</span>
          </div>
          <div style={styles.benefit}>
            <span style={styles.benefitIcon}>🔒</span>
            <span>Secure</span>
          </div>
        </div>
      </div>

      {/* Footer - compact */}
      <div style={styles.footer}>
        <p>
          By continuing, you agree to our{" "}
          <button
            style={styles.footerLink}
            onClick={() => navigate("/terms")}
            type="button"
          >
            Terms and Privacy Policy
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
          
          input:focus {
            border-color: #667eea !important;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
          }
          
          button:hover {
            transform: translateY(-2px);
            transition: transform 0.2s ease;
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

// COMPACT STYLES FOR MOBILE
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "15px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  decorativeCircle1: {
    position: "absolute",
    width: "200px",
    height: "200px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
    top: "-80px",
    left: "-80px",
    zIndex: 0,
  },
  decorativeCircle2: {
    position: "absolute",
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
    bottom: "-50px",
    right: "-50px",
    zIndex: 0,
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "25px 20px",
    borderRadius: "20px",
    background: "rgba(255, 255, 255, 0.97)",
    backdropFilter: "blur(8px)",
    boxShadow: `
      0 15px 40px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.6)
    `,
    border: "1px solid rgba(255, 255, 255, 0.3)",
    zIndex: 1,
    position: "relative",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "8px",
  },
  logoIcon: {
    fontSize: "32px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    padding: "12px",
    borderRadius: "16px",
    boxShadow: "0 6px 15px rgba(102, 126, 234, 0.3)",
  },
  logo: {
    fontSize: "32px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  tagline: {
    textAlign: "center",
    color: "#666",
    fontSize: "14px",
    marginBottom: "20px",
    fontWeight: "500",
  },
  modeSelector: {
    display: "flex",
    background: "rgba(102, 126, 234, 0.1)",
    borderRadius: "14px",
    padding: "5px",
    marginBottom: "20px",
  },
  modeButton: {
    flex: 1,
    padding: "12px",
    border: "none",
    background: "transparent",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#667eea",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  modeButtonActive: {
    background: "#667eea",
    color: "white",
    boxShadow: "0 3px 8px rgba(102, 126, 234, 0.3)",
  },
  formGroup: {
    marginBottom: "15px",
  },
  emailCaption: {
    fontSize: "12px",
    color: "#999",
    marginTop: "6px",
    marginBottom: 0,
    fontStyle: "italic",
  },
  inputContainer: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "16px",
    color: "#667eea",
  },
  input: {
    width: "100%",
    padding: "15px 15px 15px 40px",
    borderRadius: "14px",
    border: "2px solid #e0e0e0",
    background: "white",
    fontSize: "15px",
    fontWeight: "500",
    color: "#333",
    outline: "none",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
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
    color: "#667eea",
    padding: "4px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
  },
  forgotPassword: {
    textAlign: "right",
    marginBottom: "15px",
  },
  forgotButton: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "5px",
    transition: "all 0.2s ease",
  },
  primaryButton: {
    width: "100%",
    padding: "16px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
    boxShadow: "0 6px 15px rgba(102, 126, 234, 0.3)",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
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
    marginTop: "12px",
    padding: "10px",
    borderRadius: "10px",
    textAlign: "center",
    fontSize: "13px",
    fontWeight: "600",
    background: "rgba(255, 87, 87, 0.1)",
    color: "#ff5757",
    border: "1px solid rgba(255, 87, 87, 0.2)",
  },
  switchText: {
    textAlign: "center",
    marginTop: "18px",
    color: "#666",
    fontSize: "14px",
  },
  switchButton: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    textDecoration: "underline",
    padding: "3px 6px",
    borderRadius: "5px",
    transition: "all 0.2s ease",
  },
  benefits: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "22px",
    paddingTop: "18px",
    borderTop: "1px solid rgba(0,0,0,0.1)",
  },
  benefit: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "#666",
    fontWeight: "500",
  },
  benefitIcon: {
    fontSize: "20px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  footer: {
    position: "absolute",
    bottom: "15px",
    width: "100%",
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "12px",
    padding: "0 15px",
    zIndex: 1,
  },
  termsContainer: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    marginBottom: "15px",
    padding: "12px",
    backgroundColor: "rgba(102, 126, 234, 0.05)",
    borderRadius: "10px",
    border: "1px solid rgba(102, 126, 234, 0.2)",
  },
  termsCheckbox: {
    width: "18px",
    height: "18px",
    minWidth: "18px",
    marginTop: "2px",
    cursor: "pointer",
    accentColor: "#667eea",
  },
  termsLabel: {
    fontSize: "13px",
    color: "#555",
    fontWeight: "500",
    cursor: "pointer",
    lineHeight: "1.4",
  },
  termsLink: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    padding: "0",
    textDecoration: "underline",
    transition: "color 0.2s ease",
  },
  footerLink: {
    background: "none",
    border: "none",
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    padding: "0",
    textDecoration: "underline",
    transition: "opacity 0.2s ease",
  },
};