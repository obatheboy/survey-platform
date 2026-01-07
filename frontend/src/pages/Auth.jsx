import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("register");
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
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [regMessage, setRegMessage] = useState("");

  /* =========================
     LOGIN STATE
  ========================= */
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [loginMessage, setLoginMessage] = useState("");

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
        fullName: regData.fullName,
        username: regData.username,
        email: regData.email,
        phone: regData.phone,
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
     LOGIN (COOKIE BASED)
     ✅ INACTIVE USERS CAN LOGIN
     ❌ ONLY SUSPENDED USERS BLOCKED
  ========================= */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMessage("");

    try {
      setLoading(true);

      // 1️⃣ Login → sets HttpOnly cookie
      await api.post("/auth/login", {
        username: loginData.username,
        password: loginData.password,
      });

      // 2️⃣ Fetch session
      const meRes = await api.get("/auth/me");
      const user = meRes.data;

      // 3️⃣ ONLY block suspended users
      if (user.status === "SUSPENDED") {
        setLoginMessage(
          "🚫 Your account has been suspended. Contact support."
        );
        return;
      }

      // 4️⃣ Redirect by role
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setLoginMessage(
        err.response?.data?.message || "Invalid username or password"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div
      style={{
        maxWidth: "420px",
        margin: "80px auto",
        padding: "30px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        opacity: loading ? 0.7 : 1,
        pointerEvents: loading ? "none" : "auto",
      }}
    >
      <h1 style={{ textAlign: "center" }}>Survey Platform</h1>

      {/* ================= REGISTER ================= */}
      {mode === "register" && (
        <form onSubmit={handleRegister}>
          <h2>Create Account</h2>

          <input
            placeholder="Full Name"
            value={regData.fullName}
            onChange={(e) =>
              setRegData({ ...regData, fullName: e.target.value })
            }
            required
          />

          <input
            placeholder="Username"
            value={regData.username}
            onChange={(e) =>
              setRegData({ ...regData, username: e.target.value })
            }
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={regData.email}
            onChange={(e) =>
              setRegData({ ...regData, email: e.target.value })
            }
            required
          />

          <input
            placeholder="Phone Number"
            value={regData.phone}
            onChange={(e) =>
              setRegData({ ...regData, phone: e.target.value })
            }
            required
          />

          <div style={{ position: "relative" }}>
            <input
              type={showRegPassword ? "text" : "password"}
              placeholder="Password"
              value={regData.password}
              onChange={(e) =>
                setRegData({ ...regData, password: e.target.value })
              }
              required
            />
            <span
              style={eyeStyle}
              onClick={() => setShowRegPassword(!showRegPassword)}
            >
              👁
            </span>
          </div>

          <div style={{ position: "relative" }}>
            <input
              type={showRegConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              value={regData.confirmPassword}
              onChange={(e) =>
                setRegData({
                  ...regData,
                  confirmPassword: e.target.value,
                })
              }
              required
            />
            <span
              style={eyeStyle}
              onClick={() => setShowRegConfirm(!showRegConfirm)}
            >
              👁
            </span>
          </div>

          <button type="submit" style={{ width: "100%" }}>
            {loading ? "Creating..." : "Create Account"}
          </button>

          {regMessage && <p>{regMessage}</p>}

          <p style={{ marginTop: "15px", textAlign: "center" }}>
            Already have an account?{" "}
            <span style={linkStyle} onClick={() => setMode("login")}>
              Login
            </span>
          </p>
        </form>
      )}

      {/* ================= LOGIN ================= */}
      {mode === "login" && (
        <form onSubmit={handleLogin}>
          <h2>Login</h2>

          <input
            placeholder="Username"
            value={loginData.username}
            onChange={(e) =>
              setLoginData({
                ...loginData,
                username: e.target.value,
              })
            }
            required
          />

          <div style={{ position: "relative" }}>
            <input
              type={showLoginPassword ? "text" : "password"}
              placeholder="Password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  password: e.target.value,
                })
              }
              required
            />
            <span
              style={eyeStyle}
              onClick={() =>
                setShowLoginPassword(!showLoginPassword)
              }
            >
              👁
            </span>
          </div>

          <button type="submit" style={{ width: "100%" }}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {loginMessage && <p>{loginMessage}</p>}

          <p style={{ marginTop: "10px", textAlign: "center" }}>
            Don’t have an account?{" "}
            <span style={linkStyle} onClick={() => setMode("register")}>
              Create one
            </span>
          </p>
        </form>
      )}
    </div>
  );
}

/* =========================
   STYLES
========================= */
const eyeStyle = {
  position: "absolute",
  right: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  cursor: "pointer",
};

const linkStyle = {
  color: "blue",
  cursor: "pointer",
};
