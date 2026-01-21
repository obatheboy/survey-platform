import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /* =========================
     MODE (REGISTER DEFAULT)
  ========================= */
  const initialMode =
    searchParams.get("mode") === "login" ? "login" : "register";

  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);

  /* =========================
     PASSWORD VISIBILITY
  ========================= */
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  /* =========================
     REGISTER STATE
  ========================= */
  const [regData, setRegData] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [regMessage, setRegMessage] = useState("");

  /* =========================
     LOGIN STATE
  ========================= */
  const [loginData, setLoginData] = useState({
    phone: "",
    password: "",
  });
  const [loginMessage, setLoginMessage] = useState("");

  /* =========================
     🔥 WAKE BACKEND
  ========================= */
  useEffect(() => {
    const wakeBackend = async () => {
      try {
        await api.get("/health");
      } catch {}
    };
    wakeBackend();
  }, []);

  /* =========================
     URL SYNC
  ========================= */
  useEffect(() => {
    navigate(`/auth?mode=${mode}`, { replace: true });
  }, [mode, navigate]);

  /* =========================
     REGISTER
  ========================= */
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegMessage("");

    if (regData.password !== regData.confirmPassword) {
      setRegMessage("❌ Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/register", {
        full_name: regData.full_name,
        phone: regData.phone,
        email: regData.email || null,
        password: regData.password,
      });
      setRegMessage("✅ Account created. Please login.");
      setTimeout(() => setMode("login"), 1500);
    } catch (err) {
      setRegMessage(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOGIN
  ========================= */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMessage("");

    try {
      setLoading(true);
      await api.post("/auth/login", loginData);
      await api.get("/auth/me");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setLoginMessage(
        err.response?.data?.message || "Login failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      <div
        style={{
          ...card,
          opacity: loading ? 0.7 : 1,
          pointerEvents: loading ? "none" : "auto",
        }}
      >
        <h1 style={logo}>Survey Platform</h1>
        <p style={subtitle}>
          {mode === "register"
            ? "Create your account to start earning"
            : "Welcome back, login to continue"}
        </p>

        {mode === "register" && (
          <form onSubmit={handleRegister}>
            <Input
              placeholder="Full Name"
              value={regData.full_name}
              onChange={(e) =>
                setRegData({ ...regData, full_name: e.target.value })
              }
            />

            <Input
              placeholder="Phone Number"
              value={regData.phone}
              onChange={(e) =>
                setRegData({ ...regData, phone: e.target.value })
              }
            />

            <Input
              type="email"
              placeholder="Email (optional)"
              value={regData.email}
              onChange={(e) =>
                setRegData({ ...regData, email: e.target.value })
              }
            />

            <PasswordInput
              placeholder="Password"
              value={regData.password}
              show={showRegPassword}
              toggle={() => setShowRegPassword(!showRegPassword)}
              onChange={(e) =>
                setRegData({ ...regData, password: e.target.value })
              }
            />

            <PasswordInput
              placeholder="Confirm Password"
              value={regData.confirmPassword}
              show={showRegConfirm}
              toggle={() => setShowRegConfirm(!showRegConfirm)}
              onChange={(e) =>
                setRegData({
                  ...regData,
                  confirmPassword: e.target.value,
                })
              }
            />

            <button style={button} type="submit">
              {loading ? "Creating..." : "Create Account"}
            </button>

            {regMessage && <p style={message}>{regMessage}</p>}

            <p style={switchText}>
              Already have an account?{" "}
              <span style={link} onClick={() => setMode("login")}>
                Login
              </span>
            </p>
          </form>
        )}

        {mode === "login" && (
          <form onSubmit={handleLogin}>
            <Input
              placeholder="Phone Number"
              value={loginData.phone}
              onChange={(e) =>
                setLoginData({ ...loginData, phone: e.target.value })
              }
            />

            <PasswordInput
              placeholder="Password"
              value={loginData.password}
              show={showLoginPassword}
              toggle={() => setShowLoginPassword(!showLoginPassword)}
              onChange={(e) =>
                setLoginData({ ...loginData, password: e.target.value })
              }
            />

            <button style={button} type="submit">
              {loading ? "Logging in..." : "Login"}
            </button>

            {loginMessage && <p style={message}>{loginMessage}</p>}

            <p style={switchText}>
              Don’t have an account?{" "}
              <span style={link} onClick={() => setMode("register")}>
                Create one
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

/* =========================
   INPUT COMPONENT
========================= */
function Input({ type = "text", ...props }) {
  return <input style={input} type={type} {...props} />;
}

function PasswordInput({ show, toggle, ...props }) {
  return (
    <div style={passwordWrap}>
      <input
        {...props}
        type={show ? "text" : "password"}
        style={input}
        required
      />
      <span style={eye} onClick={toggle}>👁️</span>
    </div>
  );
}

/* =========================
   STYLES
========================= */
const page = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  backgroundColor: "#ffd000",
};

const card = {
  width: "100%",
  maxWidth: "420px",
  padding: "34px 30px",
  borderRadius: "8px",
  backgroundColor: "#2c9c00",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const logo = {
  textAlign: "center",
  fontSize: "24px",
  fontWeight: "700",
  marginBottom: "16px",
  color: "#333",
};

const subtitle = {
  textAlign: "center",
  fontSize: "14px",
  color: "#666",
  marginBottom: "24px",
};

const input = {
  width: "100%",
  padding: "12px 15px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "14px",
  outline: "none",
  marginBottom: "16px",
};

const passwordWrap = {
  position: "relative",
  marginBottom: "16px",
};

const eye = {
  position: "absolute",
  right: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  cursor: "pointer",
  fontSize: "18px",
  color: "#999",
};

const button = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  fontSize: "15px",
  fontWeight: "600",
  cursor: "pointer",
  marginTop: "16px",
  transition: "background-color 0.2s",
};

const message = {
  marginTop: "12px",
  fontSize: "14px",
  color: "red",
  textAlign: "center",
};

const switchText = {
  marginTop: "20px",
  textAlign: "center",
  fontSize: "14px",
  color: "#555",
};

const link = {
  fontWeight: "600",
  color: "#007bff",
  cursor: "pointer",
  textDecoration: "underline",
};