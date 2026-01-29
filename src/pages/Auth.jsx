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
          <h1 style={styles.logo}>OFFICIAL SURVEY APP</h1>
        </div>
        <p style={styles.tagline}>Share Your Opinions • Earn to Mpesa</p>

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
              <p style={styles.emailCaption}>💡 Skip this if you don't have an email address</p>
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
            I accept the{" "}
            <button
              type="button"
              style={styles.termsLink}
              onClick={() => navigate("/terms")}
            >
              Terms and Conditions
            </button>
          </label>
        </div>
      </div>

      <div style={styles.contactContainer}>
        <p style={styles.contactCaption}>Need help? Chat us..</p>
        <button
          style={styles.contactButton}
          onClick={() => {
            const message = encodeURIComponent(
              "Hello, I'm having trouble with registration or login on the Survey App."
            );
            const whatsappUrl = `https://wa.me/254102074596?text=${message}`;
            window.open(whatsappUrl, "_blank", "noopener,noreferrer");
          }}
          title="Contact Support on WhatsApp"
        >
          💬
        </button>
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
            border-color: #2563eb !important;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
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
    background: "#f8fafc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "32px 24px",
    borderRadius: "24px",
    background: "#ffffff",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
    border: "1px solid #f1f5f9",
    zIndex: 1,
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    marginBottom: "8px",
  },
  logoIcon: {
    fontSize: "32px",
    background: "linear-gradient(135deg, #2563eb, #1e40af)",
    padding: "12px",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.2)",
  },
  logo: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  tagline: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "24px",
    fontWeight: "500",
  },
  modeSelector: {
    display: "flex",
    background: "#f1f5f9",
    borderRadius: "14px",
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
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  modeButtonActive: {
    background: "#ffffff",
    color: "#2563eb",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
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
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: "100%",
    padding: "14px 16px 14px 44px",
    borderRadius: "16px",
    border: "1.5px solid #e2e8f0",
    background: "#ffffff",
    fontSize: "15px",
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
    color: "#2563eb",
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
    background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
    color: "white",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
    boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
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
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "500",
  },
  switchButton: {
    background: "none",
    border: "none",
    color: "#2563eb",
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
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid #f1f5f9",
  },
  benefit: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "600",
  },
  benefitIcon: {
    fontSize: "20px",
  },
  footer: {
    position: "absolute",
    bottom: "20px",
    width: "100%",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "12px",
    padding: "0 15px",
    zIndex: 1,
  },
  contactContainer: {
    position: "fixed",
    bottom: "90px",
    right: "20px",
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  contactButton: {
    background: "#25D366",
    ,
    borderRadius: "50%",
    width: "60px",
    height: "60px",
    fontSize: "28px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  contactCaption: {
    background: 'rgba(0,0,0,0.75)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    margin: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    whiteSpace: 'nowrap',
  },
  termsContainer: {
    display: "flex","flex-start",
    gap: "10px",
    marginTop: "16px",
    padding: "4px 0px",
  },
  termsCheckbox: {
    width: "18px",
    height: "18px",
    minWidth: "18px",
    marginTop: "2px",
    cursor: "pointer",
    accentColor: "#2563eb",
    borderRadius: "6px",
  },
  termsLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "400",
    cursor: "pointer",
    lineHeight: "1.5",
  },
  termsLink: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0",
    textDecoration: "underline",
  },
  emailCaption: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "6px",
    fontWeight: "400",
    fontStyle: "italic",
    paddingLeft: "4px",
  },
  footerLink: {
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    padding: "0",
    textDecoration: "underline",
  },
};