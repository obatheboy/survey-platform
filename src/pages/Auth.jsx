import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";

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
    const wakeBackend = async () => {
      try {
        await api.get("/health");
      } catch {}
    };
    wakeBackend();
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
        {/* Title with vibrant gradient */}
        <h1 style={logo}>Survey Platform</h1>

        <p style={subtitle}>
          {mode === "register"
            ? "Create your account to start earning"
            : "Welcome back, login to continue"}
        </p>

        {/* Placeholder style for shouty colors */}
        <style>
          {`
            input::placeholder {
              color: #ff8800; /* Bright orange, change to #ffff00 for yellow if preferred */
              font-weight: bold;
              opacity: 1;
            }
          `}
        </style>

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
                setRegData({ ...regData, confirmPassword: e.target.value })
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
function Input({ type = "text", required = true, ...props }) {
  return <input type={type} required={required} style={input} {...props} />;
}

/* =========================
   PASSWORD INPUT COMPONENT
========================= */
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
   STYLES: NEW COLOR SCHEME
========================= */

const page = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  background: `
    radial-gradient(circle at 15% 15%, #fbc2eb, transparent 50%),
    radial-gradient(circle at 85% 20%, #a1c4fd, transparent 55%),
    radial-gradient(circle at 50% 85%, #ffd1ff, transparent 50%),
    radial-gradient(circle at 20% 75%, #c2f0f7, transparent 55%),
    linear-gradient(135deg, #0f2027, #203a43, #2c5364)
  `,
};

const card = {
  width: "100%",
  maxWidth: "440px",
  padding: "50px 30px",
  borderRadius: "30px",
  background: `
    linear-gradient(135deg, #15ff00, #ff00f7, #2bff00)
  `,
  boxShadow: `
    0 4px 30px rgba(0, 255, 255, 0.6),
    inset 0 0 20px rgba(255, 255, 255, 0.2)
  `,
  border: "2px solid rgba(255,255,255,0.6)",
  backdropFilter: "blur(8px)", // gives a glassy, high-tech look
  transition: "all 0.4s ease",
};
/* TITLE with vibrant gradient and glow */
const logo = {
  textAlign: "center",
  fontSize: "36px",
  fontWeight: "900",
  marginBottom: "10px",
  background: `
    linear-gradient(135deg, #ff5100, #ffe600, #ea00ff, #eeff00)
  `,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  textShadow: "0 0 20px rgba(255,255,255,0.8)",
  letterSpacing: "2px",
  transition: "all 0.3s ease",
};

/* Subtitle with soft glow */
const subtitle = {
  textAlign: "center",
  fontSize: "16px",
  color: "#fff",
  marginBottom: "30px",
  textShadow: "0 0 8px rgba(255,255,255,0.3)",
};

/* INPUTS styling with glow and smooth transition */
const input = {
  width: "100%",
  padding: "16px",
  marginBottom: "16px",
  borderRadius: "18px",
  border: "2px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.1)",
  color: "#fff",
  fontSize: "16px",
  outline: "none",
  transition: "all 0.2s ease",
  boxShadow: "0 0 10px rgba(255,255,255,0.2)",
};

/* Password eye icon wrapper */
const passwordWrap = {
  position: "relative",
};

/* Eye icon style */
const eye = {
  position: "absolute",
  right: "15px",
  top: "50%",
  transform: "translateY(-50%)",
  cursor: "pointer",
  fontSize: "20px",
  color: "#ffd700",
  transition: "transform 0.2s ease",
};

/* Buttons - keep original colors */
const button = {
  width: "100%",
  padding: "16px",
  borderRadius: "20px",
  border: "none",
  background: `
    linear-gradient(135deg, #f7971e, #ffd200, #f7971e)
  `,
  color: "#1f2937",
  fontWeight: "700",
  fontSize: "16px",
  cursor: "pointer",
  marginTop: "20px",
  boxShadow: `
    0 8px 15px rgba(247, 151, 28, 0.3),
    inset 0 0 10px rgba(255,255,255,0.2)
  `,
  transition: "all 0.2s ease",
};

/* Message for feedback */
const message = {
  marginTop: "15px",
  fontSize: "14px",
  textAlign: "center",
  color: "#f87171",
  fontWeight: "600",
};

/* Switch area with new color palette */
const switchText = {
  marginTop: "30px",
  padding: "15px",
  borderRadius: "20px",
  background: `
    linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255,255,255,0.05))
  `,
  boxShadow: `
    inset 0 0 10px rgba(255,255,255,0.2),
    0 4px 20px rgba(0,0,0,0.2)
  `,
  textAlign: "center",
  fontSize: "15px",
  fontWeight: "600",
  color: "#fff",
};

/* Link style with bright gradient and glow */
const link = {
  marginLeft: "8px",
  padding: "6px 12px",
  borderRadius: "12px",
  background: `
    linear-gradient(135deg, #ffd902, #ff0000)
  `,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  fontWeight: "900",
  cursor: "pointer",
  textShadow: "0 0 10px rgb(251, 255, 4)",
  transition: "all 0.2s ease",
};