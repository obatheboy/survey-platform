import { useEffect, useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";

// 🔑 FIX: import the correct adminApi instance
import { adminApi } from "../../api/adminApi";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        // ✅ CHECK IF TOKEN EXISTS FIRST - BEFORE MAKING ANY API CALLS
        const token = localStorage.getItem("adminToken");
        if (!token) {
          console.warn("⚠️ No admin token found in localStorage");
          setLoading(false);
          navigate("/admin/login", { replace: true });
          return;
        }

        console.log("✅ Admin token found, verifying session...");
        
        // Now make the API call with the token
        const res = await adminApi.get("/admin/me");

        if (res.data.role !== "admin") {
          throw new Error("Not admin");
        }

        console.log("✅ Admin session verified:", res.data);
        setAdmin(res.data);
        setLoading(false);
      } catch (err) {
        console.error("❌ Admin session check failed:", err.response?.data || err.message);
        setError(err.response?.data?.message || err.message || "Session verification failed");
        localStorage.removeItem("adminToken");
        setLoading(false);
        navigate("/admin/login", { replace: true });
      }
    };

    checkAdminSession();
  }, [navigate]);

  if (loading) return <p>Loading admin panel...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!admin) return null;

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <h2 style={{ marginBottom: 20 }}>Admin Panel</h2>

        <NavItem to="/admin" end label="Dashboard" />
        <NavItem to="/admin/activations" label="Activation Payments" />
        <NavItem to="/admin/withdrawals" label="Withdrawals" />
        <NavItem to="/admin/affiliates" label="Affiliate Referrals" />
        <NavItem to="/admin/affiliate-withdrawals" label="Affiliate Withdrawals" />
        <NavItem to="/admin/users" label="Users" />
        <NavItem to="/admin/notifications" label="Bulk Notifications" />

        <hr style={{ margin: "20px 0", borderColor: "#333" }} />

        <p style={{ fontSize: 12, opacity: 0.8 }}>
          Logged in as:
          <br />
          <strong>{admin.full_name}</strong> {/* Fixed username to full_name */}
        </p>

        <button
          style={styles.logout}
          onClick={() => {
            localStorage.removeItem("adminToken");
            navigate("/admin/login", { replace: true });
          }}
        >
          Logout
        </button>
      </aside>

      <main style={styles.content}>
        <div style={{ color: '#374151' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/* REUSABLE NAV ITEM */
function NavItem({ to, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        ...styles.link,
        background: isActive ? "#3b82f6" : "transparent",
        fontWeight: isActive ? "bold" : "normal",
      })}
    >
      {label}
    </NavLink>
  );
}

/* STYLES */
const styles = {
  container: { display: "flex", minHeight: "100vh" },
  sidebar: { 
    width: 240, 
    padding: 20, 
    background: "#111827", 
    color: "#e5e7eb",
    display: 'flex',
    flexDirection: 'column'
  },
  link: {
    display: "block",
    margin: "10px 0",
    padding: "10px",
    color: "#e5e7eb",
    textDecoration: "none",
    borderRadius: 6,
    transition: "background 0.2s",
  },
  content: { 
    flex: 1, 
    padding: 0, 
    background: "#f9fafb" 
  },
  logout: {
    marginTop: 20,
    padding: 10,
    width: "100%",
    background: "#374151",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
};
