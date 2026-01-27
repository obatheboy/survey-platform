import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
export default function AdminLogin() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await adminApi.post("/admin/auth/login", {
        phone,
        password,
      });

      // ✅ STORE ADMIN TOKEN
      if (res.data.token) {
        localStorage.setItem("adminToken", res.data.token);
        console.log("✅ Admin token stored successfully");
        
        // ✅ REDIRECT TO ADMIN DASHBOARD (with a small delay to ensure token is set)
        setTimeout(() => {
          navigate("/admin", { replace: true });
        }, 100);
      } else {
        setError("No token received from server");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      setError(
        err.response?.data?.message || "Admin login failed. Please check credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h2 style={styles.title}>Admin Login</h2>

        <input
          placeholder="Admin Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={styles.input}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />

        <button style={styles.button} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  );
}

/* =======================
   STYLES
======================= */

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#111",
  },
  card: {
    width: 360,
    padding: 30,
    background: "#fff",
    borderRadius: 8,
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 14,
  },
  button: {
    width: "100%",
    padding: 12,
    background: "#000",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  error: {
    marginTop: 12,
    color: "red",
    textAlign: "center",
  },
};
      