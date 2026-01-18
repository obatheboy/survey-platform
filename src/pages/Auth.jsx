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
      setMode("login");
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
              required={false}
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
   INPUTS
========================= */
function Input({ type = "text", required = true, ...props }) {
  return <input type={type} required={required} style={input} {...props} />;
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
      <span style={eye} onClick={toggle}>👁</span>
    </div>
  );
}

/* =========================
   COLOR-RICH STYLES (NO WHITE)
========================= */

const page = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  background: `
    radial-gradient(circle at 10% 10%, #2563eb55, transparent 40%),
    radial-gradient(circle at 90% 20%, #7c3aed55, transparent 45%),
    radial-gradient(circle at 30% 90%, #0ea5e955, transparent 45%),
    linear-gradient(135deg, #020617, #020617)
  `,
};

const card = {
  width: "100%",
  maxWidth: "420px",
  padding: "32px 28px",
  borderRadius: "22px",
  background:
    "linear-gradient(160deg, #1e1b4b, #312e81, #1e293b)",
  boxShadow: "0 40px 90px rgba(0,0,0,0.6)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const logo = {
  textAlign: "center",
  fontSize: "26px",
  fontWeight: "800",
  marginBottom: "6px",
  background:
    "linear-gradient(135deg, #38bdf8, #a78bfa, #22d3ee)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const subtitle = {
  textAlign: "center",
  fontSize: "14px",
  color: "#c7d2fe",
  marginBottom: "26px",
};

const input = {
  width: "100%",
  padding: "14px 16px",
  marginBottom: "14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)",
  color: "#ffffff",
  fontSize: "15px",
  outline: "none",
};

const passwordWrap = { position: "relative" };

const eye = {
  position: "absolute",
  right: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  cursor: "pointer",
  color: "#c7d2fe",
};

const button = {
  width: "100%",
  padding: "14px",
  borderRadius: "16px",
  border: "none",
  background:
    "linear-gradient(135deg, #2563eb, #7c3aed, #0ea5e9)",
  color: "#ffffff",
  fontWeight: "800",
  fontSize: "15px",
  cursor: "pointer",
  marginTop: "12px",
  boxShadow: "0 20px 40px rgba(59,130,246,0.6)",
};

const message = {
  marginTop: "14px",
  fontSize: "14px",
  textAlign: "center",
  color: "#fca5a5",
};

const switchText = {
  marginTop: "22px",
  textAlign: "center",
  fontSize: "14px",
  color: "#c7d2fe",
};

const link = {
  color: "#60a5fa",
  fontWeight: "700",
  cursor: "pointer",
};
