import { useState, useEffect } from "react";
import {
  useNavigate,
  useSearchParams
} from "react-router-dom";
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
     🔥 WAKE RENDER BACKEND
  ========================= */
  useEffect(() => {
    const wakeBackend = async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 8000);

      try {
        await api.get("/health", {
          signal: controller.signal,
        });
      } catch {
        // Silent – backend is waking up
      }
    };

    wakeBackend();
  }, []);

  /* =========================
     KEEP URL IN SYNC
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
      setRegMessage(
        err.response?.data?.message || "Registration failed"
      );
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

      await api.post("/auth/login", {
        phone: loginData.phone,
        password: loginData.password,
      });

      await api.get("/auth/me");

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setLoginMessage(
        err.response?.data?.message ||
          "Login failed. Try again."
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

        {/* ================= REGISTER ================= */}
        {mode === "register" && (
          <form onSubmit={handleRegister}>
            <Input
              placeholder="Full Name"
              value={regData.full_name}
              onChange={(e) =>
                setRegData({
                  ...regData,
                  full_name: e.target.value,
                })
              }
            />

            <Input
              placeholder="Phone Number"
              value={regData.phone}
              onChange={(e) =>
                setRegData({
                  ...regData,
                  phone: e.target.value,
                })
              }
            />

            <Input
              type="email"
              placeholder="Email (optional)"
              required={false}
              value={regData.email}
              onChange={(e) =>
                setRegData({
                  ...regData,
                  email: e.target.value,
                })
              }
            />

            <PasswordInput
              placeholder="Password"
              value={regData.password}
              show={showRegPassword}
              toggle={() =>
                setShowRegPassword(!showRegPassword)
              }
              onChange={(e) =>
                setRegData({
                  ...regData,
                  password: e.target.value,
                })
              }
            />

            <PasswordInput
              placeholder="Confirm Password"
              value={regData.confirmPassword}
              show={showRegConfirm}
              toggle={() =>
                setShowRegConfirm(!showRegConfirm)
              }
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

            {regMessage && (
              <p style={message}>{regMessage}</p>
            )}

            <p style={switchText}>
              Already have an account?{" "}
              <span
                style={link}
                onClick={() => setMode("login")}
              >
                Login
              </span>
            </p>
          </form>
        )}

        {/* ================= LOGIN ================= */}
        {mode === "login" && (
          <form onSubmit={handleLogin}>
            <Input
              placeholder="Phone Number"
              value={loginData.phone}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  phone: e.target.value,
                })
              }
            />

            <PasswordInput
              placeholder="Password"
              value={loginData.password}
              show={showLoginPassword}
              toggle={() =>
                setShowLoginPassword(!showLoginPassword)
              }
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  password: e.target.value,
                })
              }
            />

            <button style={button} type="submit">
              {loading ? "Logging in..." : "Login"}
            </button>

            {loginMessage && (
              <p style={message}>{loginMessage}</p>
            )}

            <p style={switchText}>
              Don’t have an account?{" "}
              <span
                style={link}
                onClick={() => setMode("register")}
              >
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
   REUSABLE INPUTS
========================= */
function Input({ type = "text", required = true, ...props }) {
  return (
    <input
      type={type}
      style={input}
      required={required}
      {...props}
    />
  );
}

function PasswordInput({ show, toggle, ...props }) {
  return (
    <div style={passwordWrap}>
      <input
        {...props}
        required
        type={show ? "text" : "password"}
        style={input}
      />
      <span style={eye} onClick={toggle}>
        👁
      </span>
    </div>
  );
}
/* =========================
   MODERN STYLES
========================= */

const page = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at top, #0f172a, #020617)",
  padding: "20px",
};

const card = {
  width: "100%",
  maxWidth: "420px",
  background: "rgba(255,255,255,0.96)",
  padding: "32px 28px",
  borderRadius: "20px",
  boxShadow:
    "0 30px 80px rgba(0,0,0,0.35)",
  backdropFilter: "blur(14px)",
};

const logo = {
  textAlign: "center",
  marginBottom: "6px",
  color: "#020617",
  fontSize: "26px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
};

const subtitle = {
  textAlign: "center",
  fontSize: "14px",
  color: "#475569",
  marginBottom: "26px",
};

const input = {
  width: "100%",
  padding: "14px 16px",
  marginBottom: "14px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  fontSize: "15px",
  outline: "none",
  transition: "all 0.25s ease",
};

const passwordWrap = {
  position: "relative",
};

const eye = {
  position: "absolute",
  right: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  cursor: "pointer",
  color: "#64748b",
};

const button = {
  width: "100%",
  padding: "14px",
  borderRadius: "14px",
  border: "none",
  background:
    "linear-gradient(135deg, #2563eb, #4f46e5)",
  color: "#ffffff",
  fontWeight: "700",
  fontSize: "15px",
  cursor: "pointer",
  marginTop: "10px",
  boxShadow:
    "0 12px 30px rgba(79,70,229,0.45)",
  transition: "transform 0.25s ease, box-shadow 0.25s ease",
};

const message = {
  marginTop: "14px",
  fontSize: "14px",
  textAlign: "center",
  color: "#dc2626",
};

const switchText = {
  marginTop: "20px",
  textAlign: "center",
  fontSize: "14px",
  color: "#475569",
};

const link = {
  color: "#2563eb",
  fontWeight: "600",
  cursor: "pointer",
  textDecoration: "none",
};
