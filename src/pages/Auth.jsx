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
      {/* Decorative elements */}
      <div style={styles.decorativeCircle1}></div>
      <div style={styles.decorativeCircle2}></div>
      <div style={styles.decorativeCircle3}></div>

      <div
        style={{
          ...styles.card,
          opacity: loading ? 0.7 : 1,
          pointerEvents: loading ? "none" : "auto",
          animation: shake ? "shake 0.5s ease-in-out" : "none",
        }}
      >
        {/* Logo and greeting */}
        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>📊</div>
          <h1 style={styles.logo}>SurveyEarn</h1>
        </div>
        <p style={styles.tagline}>Share Opinions • Earn Rewards</p>

        {/* Mode selector */}
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
                placeholder="Your Full Name"
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
                placeholder="Email Address (optional)"
                value={regData.email}
                onChange={(e) =>
                  setRegData(prev => ({ ...prev, email: e.target.value }))
                }
                icon="✉️"
              />
              <p style={styles.optionalHint}>Leave empty if you don't have an email</p>
            </div>

            <div style={styles.formGroup}>
              <div style={styles.passwordContainer}>
                <Input
                  placeholder="Create Password"
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
                "Complete Registration 🚀"
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
                Sign In Here
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
                "Go To Your Account 🔐"
              )}
            </button>

            {loginMessage && (
              <p style={styles.message}>{loginMessage}</p>
            )}

            <p style={styles.switchText}>
              New to SurveyEarn?{" "}
              <button
                style={styles.switchButton}
                onClick={() => setMode("register")}
                type="button"
              >
                Create Free Account
              </button>
            </p>
          </form>
        )}

        {/* Benefits showcase */}
        <div style={styles.benefits}>
          <div style={styles.benefit}>
            <span style={styles.benefitIcon}>💰</span>
            <span>Earn Cash Rewards</span>
          </div>
          <div style={styles.benefit}>
            <span style={styles.benefitIcon}>⚡</span>
            <span>Quick Surveys</span>
          </div>
          <div style={styles.benefit}>
            <span style={styles.benefitIcon}>🔒</span>
            <span>Secure & Private</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>By continuing, you agree to our Terms and Privacy Policy</p>
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
        `}
      </style>
    </div>
  );
}

// Keep the styles object exactly the same as before
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  decorativeCircle1: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
    top: "-100px",
    left: "-100px",
    zIndex: 0,
  },
  decorativeCircle2: {
    position: "absolute",
    width: "200px",
    height: "200px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
    bottom: "-50px",
    right: "-50px",
    zIndex: 0,
  },
  decorativeCircle3: {
    position: "absolute",
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
    top: "50%",
    right: "20%",
    zIndex: 0,
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    padding: "40px",
    borderRadius: "24px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    boxShadow: `
      0 20px 60px rgba(0, 0, 0, 0.3),
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
    gap: "15px",
    marginBottom: "10px",
  },
  logoIcon: {
    fontSize: "40px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    padding: "15px",
    borderRadius: "20px",
    boxShadow: "0 8px 20px rgba(102, 126, 234, 0.4)",
  },
  logo: {
    fontSize: "42px",
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
    fontSize: "16px",
    marginBottom: "30px",
    fontWeight: "500",
  },
  modeSelector: {
    display: "flex",
    background: "rgba(102, 126, 234, 0.1)",
    borderRadius: "16px",
    padding: "6px",
    marginBottom: "30px",
  },
  modeButton: {
    flex: 1,
    padding: "14px",
    border: "none",
    background: "transparent",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    color: "#667eea",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  modeButtonActive: {
    background: "#667eea",
    color: "white",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
  },
  formGroup: {
    marginBottom: "20px",
  },
  inputContainer: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "18px",
    color: "#667eea",
  },
  input: {
    width: "100%",
    padding: "18px 20px 18px 45px",
    borderRadius: "16px",
    border: "2px solid #e0e0e0",
    background: "white",
    fontSize: "16px",
    fontWeight: "500",
    color: "#333",
    outline: "none",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    boxSizing: "border-box",
  },
  optionalHint: {
    fontSize: "13px",
    color: "#888",
    marginTop: "6px",
    marginLeft: "10px",
    fontStyle: "italic",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordToggle: {
    position: "absolute",
    right: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#667eea",
    padding: "5px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
  },
  forgotPassword: {
    textAlign: "right",
    marginBottom: "20px",
  },
  forgotButton: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "5px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
  },
  primaryButton: {
    width: "100%",
    padding: "18px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "10px",
    boxShadow: "0 8px 20px rgba(102, 126, 234, 0.4)",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  loadingSpinner: {
    width: "24px",
    height: "24px",
    border: "3px solid rgba(255,255,255,0.3)",
    borderTop: "3px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  message: {
    marginTop: "15px",
    padding: "12px",
    borderRadius: "12px",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "600",
    background: "rgba(255, 87, 87, 0.1)",
    color: "#ff5757",
    border: "1px solid rgba(255, 87, 87, 0.2)",
  },
  switchText: {
    textAlign: "center",
    marginTop: "25px",
    color: "#666",
    fontSize: "15px",
  },
  switchButton: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    textDecoration: "underline",
    padding: "4px 8px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
  },
  benefits: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "30px",
    paddingTop: "25px",
    borderTop: "1px solid rgba(0,0,0,0.1)",
  },
  benefit: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#666",
    fontWeight: "500",
  },
  benefitIcon: {
    fontSize: "24px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  footer: {
    position: "absolute",
    bottom: "20px",
    width: "100%",
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "14px",
    zIndex: 1,
  },
};