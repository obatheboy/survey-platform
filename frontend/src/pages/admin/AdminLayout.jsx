import { useEffect, useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import api from "../../api/api";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await api.get("/auth/me");

        if (res.data.role !== "admin") {
          navigate("/dashboard", { replace: true });
          return;
        }

        setAdmin(res.data);
      } catch {
        navigate("/auth", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  if (loading) return <p>Loading admin panel...</p>;
  if (!admin) return null;

  return (
    <div style={styles.container}>
      {/* ================= SIDEBAR ================= */}
      <aside style={styles.sidebar}>
        <h2 style={{ marginBottom: 20 }}>Admin Panel</h2>

        <NavItem to="/admin/activations" label="Activation Payments" />
        <NavItem to="/admin/withdrawals" label="Withdrawals" />
        <NavItem to="/admin/users" label="Users" />

        <hr style={{ margin: "20px 0", borderColor: "#333" }} />

        <p style={{ fontSize: 12, opacity: 0.8 }}>
          Logged in as:
          <br />
          <strong>{admin.username}</strong>
        </p>
      </aside>

      {/* ================= CONTENT ================= */}
      <main style={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

/* ===============================
   REUSABLE NAV ITEM
================================ */
function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...styles.link,
        background: isActive ? "#222" : "transparent",
        fontWeight: isActive ? "bold" : "normal",
      })}
    >
      {label}
    </NavLink>
  );
}

/* ===============================
   STYLES
================================ */
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
  },
  sidebar: {
    width: 240,
    padding: 20,
    background: "#111",
    color: "#fff",
  },
  link: {
    display: "block",
    margin: "10px 0",
    padding: "10px",
    color: "#fff",
    textDecoration: "none",
    borderRadius: 6,
    transition: "background 0.2s",
  },
  content: {
    flex: 1,
    padding: 20,
    background: "#f5f5f5",
  },
};
