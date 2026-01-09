import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Auth() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // login | register
  const [loading, setLoading] = useState(false);

  /* =========================
     PASSWORD VISIBILITY
  ========================= */
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  /* =========================
     REGISTER STATE (USERS)
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
     LOGIN STATE (USER ONLY)
  ========================= */
  const [loginData, setLoginData] = useState({
    phone: "",
    password: "",
  });
  const [loginMessage, setLoginMessage] = useState("");

  /* =========================
     REGISTER (USER)
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
     LOGIN (USER)
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

      // verify session
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

        {/* ================= REGISTER ================= */}
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

        {/* ================= LOGIN ================= */}
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
   REUSABLE INPUTS
========================= */
function Input({ type = "text", required = true, ...props }) {
  return <input type={type} style={input} required={required} {...props} />;
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
  background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
  padding: "20px",
};

const card = {
  width: "100%",
  maxWidth: "420px",
  background: "#ddc911ff",
  padding: "32px",
  borderRadius: "16px",
  boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
};

const logo = { textAlign: "center", marginBottom: "6px", color: "#2c5364" };
const subtitle = { textAlign: "center", fontSize: "14px", color: "#555", marginBottom: "24px" };
const input = { width: "100%", padding: "12px 14px", marginBottom: "14px", borderRadius: "8px", border: "1px solid #ccc" };
const passwordWrap = { position: "relative" };
const eye = { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer" };
const button = { width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "#2c5364", color: "#fff", fontWeight: "bold", cursor: "pointer", marginTop: "6px" };
const message = { marginTop: "12px", fontSize: "14px", textAlign: "center" };
const switchText = { marginTop: "18px", textAlign: "center", fontSize: "14px" };
const link = { color: "#2c5364", fontWeight: "bold", cursor: "pointer" };
