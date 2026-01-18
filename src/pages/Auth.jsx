import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";

/* =========================
   INLINE GLOBAL STYLES
========================= */
const GlobalStyles = () => (
  <style>{`
    @keyframes gradientMove {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    @keyframes blobFloat {
      0%,100% { transform: translate(0,0); }
      50% { transform: translate(60px,-40px); }
    }

    .neon-btn:hover {
      transform: translateY(-2px) scale(1.04);
      box-shadow:
        0 0 18px rgba(99,102,241,.9),
        0 0 40px rgba(124,58,237,.8);
    }
  `}</style>
);

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialMode =
    searchParams.get("mode") === "login" ? "login" : "register";

  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);

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
    api.get("/health").catch(() => {});
  }, []);

  useEffect(() => {
    navigate(`/auth?mode=${mode}`, { replace: true });
  }, [mode, navigate]);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMessage("");

    try {
      setLoading(true);
      await api.post("/auth/login", loginData);
      await api.get("/auth/me");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setLoginMessage(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      <GlobalStyles />

      {/* FLOATING BLOBS */}
      <div style={{ ...blob, top: "-80px", left: "-80px" }} />
      <div
        style={{
          ...blob,
          bottom: "-100px",
          right: "-80px",
          animationDelay: "6s",
        }}
      />

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
            <Input placeholder="Full Name" value={regData.full_name}
              onChange={(e) => setRegData({ ...regData, full_name: e.target.value })} />
            <Input placeholder="Phone Number" value={regData.phone}
              onChange={(e) => setRegData({ ...regData, phone: e.target.value })} />
            <Input type="email" required={false} placeholder="Email (optional)"
              value={regData.email}
              onChange={(e) => setRegData({ ...regData, email: e.target.value })} />
            <PasswordInput placeholder="Password" show={showRegPassword}
              toggle={() => setShowRegPassword(!showRegPassword)}
              value={regData.password}
              onChange={(e) => setRegData({ ...regData, password: e.target.value })} />
            <PasswordInput placeholder="Confirm Password" show={showRegConfirm}
              toggle={() => setShowRegConfirm(!showRegConfirm)}
              value={regData.confirmPassword}
              onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })} />
            <button className="neon-btn" style={button}>
              {loading ? "Creating..." : "Create Account"}
            </button>
            {regMessage && <p style={message}>{regMessage}</p>}
          </form>
        )}

        {mode === "login" && (
          <form onSubmit={handleLogin}>
            <Input placeholder="Phone Number" value={loginData.phone}
              onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })} />
            <PasswordInput placeholder="Password" show={showLoginPassword}
              toggle={() => setShowLoginPassword(!showLoginPassword)}
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
            <button className="neon-btn" style={button}>
              {loading ? "Logging in..." : "Login"}
            </button>
            {loginMessage && <p style={message}>{loginMessage}</p>}
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
  return <input type={type} style={input} required={required} {...props} />;
}

function PasswordInput({ show, toggle, ...props }) {
  return (
    <div style={passwordWrap}>
      <input {...props} type={show ? "text" : "password"} style={input} required />
      <span style={eye} onClick={toggle}>👁</span>
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
  position: "relative",
  overflow: "hidden",
  background:
    "linear-gradient(135deg,#020617,#1e1b4b,#020617)",
  backgroundSize: "400% 400%",
  animation: "gradientMove 18s ease infinite",
};

const blob = {
  position: "absolute",
  width: "260px",
  height: "260px",
  background:
    "radial-gradient(circle, rgba(99,102,241,.6), transparent 60%)",
  filter: "blur(60px)",
  animation: "blobFloat 20s ease-in-out infinite",
};

const card = {
  width: "100%",
  maxWidth: "420px",
  padding: "32px 28px",
  borderRadius: "22px",
  background:
    "linear-gradient(145deg, rgba(255,255,255,.9), rgba(224,231,255,.9))",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,.4)",
  boxShadow: "0 40px 90px rgba(0,0,0,.45)",
  position: "relative",
  zIndex: 1,
};

const logo = {
  textAlign: "center",
  fontSize: "26px",
  fontWeight: "800",
  marginBottom: "6px",
  background:
    "linear-gradient(135deg,#2563eb,#7c3aed,#0ea5e9)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const subtitle = {
  textAlign: "center",
  fontSize: "14px",
  color: "#334155",
  marginBottom: "26px",
};

const input = {
  width: "100%",
  padding: "14px 16px",
  marginBottom: "14px",
  borderRadius: "14px",
  border: "1px solid rgba(148,163,184,.35)",
  background: "#f8fafc",
};

const passwordWrap = { position: "relative" };

const eye = {
  position: "absolute",
  right: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  cursor: "pointer",
};

const button = {
  width: "100%",
  padding: "14px",
  borderRadius: "16px",
  border: "none",
  background:
    "linear-gradient(135deg,#2563eb,#4f46e5,#7c3aed)",
  color: "#fff",
  fontWeight: "800",
  cursor: "pointer",
  marginTop: "12px",
};

const message = {
  marginTop: "14px",
  textAlign: "center",
  color: "#dc2626",
};
