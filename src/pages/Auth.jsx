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
   COLOR-RICH STYLES (SHOUTING)
========================= */

const page = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  background: `
    radial-gradient(circle at 15% 15%, #2563eb66, transparent 40%),
    radial-gradient(circle at 85% 25%, #7c3aed66, transparent 45%),
    radial-gradient(circle at 35% 85%, #0ea5e966, transparent 45%),
    linear-gradient(135deg, #020617, #020617)
  `,
};

/* =========================
   CARD – ORANGE / YELLOW ENERGY
========================= */

const card = {
  width: "100%",
  maxWidth: "420px",
  padding: "32px 28px",
  borderRadius: "22px",

  /* Dark base + warm energy layers */
  background: `
    linear-gradient(160deg,
      #1e1b4b 0%,
      #312e81 35%,
      #78350f 65%,
      #f59e0b 100%
    )
  `,

  boxShadow: `
    0 40px 90px rgba(0,0,0,0.6),
    0 0 45px rgba(245,158,11,0.35)
  `,

  border: "1px solid rgba(245,158,11,0.35)",
};

/* =========================
   TYPOGRAPHY
========================= */

const logo = {
  textAlign: "center",
  fontSize: "26px",
  fontWeight: "900",
  marginBottom: "6px",

  background: `
    linear-gradient(135deg,
      #fde68a,
      #f59e0b,
      #fb923c
    )
  `,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const subtitle = {
  textAlign: "center",
  fontSize: "14px",
  color: "#fde68a",
  marginBottom: "26px",
};

/* =========================
   INPUTS
========================= */

const input = {
  width: "100%",
  padding: "14px 16px",
  marginBottom: "14px",
  borderRadius: "14px",
  border: "1px solid rgba(251,191,36,0.35)",
  background: "rgba(255,255,255,0.08)",
  color: "#ffffff",
  fontSize: "15px",
  outline: "none",
};

/* =========================
   PASSWORD EYE
========================= */

const passwordWrap = { position: "relative" };

const eye = {
  position: "absolute",
  right: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  cursor: "pointer",
  color: "#fde68a",
};

/* =========================
   BUTTON – HOT ACTION
========================= */

const button = {
  width: "100%",
  padding: "14px",
  borderRadius: "16px",
  border: "none",

  background: `
    linear-gradient(135deg,
      #f97316,
      #f59e0b,
      #fde047
    )
  `,

  color: "#1f2937",
  fontWeight: "900",
  fontSize: "15px",
  cursor: "pointer",
  marginTop: "12px",

  boxShadow: `
    0 18px 45px rgba(249,115,22,0.6),
    0 0 25px rgba(253,224,71,0.6)
  `,
};

/* =========================
   TEXT
========================= */

const message = {
  marginTop: "14px",
  fontSize: "14px",
  textAlign: "center",
  color: "#fecaca",
};

const switchText = {
  marginTop: "22px",
  textAlign: "center",
  fontSize: "14px",
  color: "#fde68a",
};

const link = {
  color: "#fbbf24",
  fontWeight: "800",
  cursor: "pointer",
};
