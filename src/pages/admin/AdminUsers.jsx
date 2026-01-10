import { useEffect, useState } from "react";

// ✅ FIX: use adminApi instead of api
import { adminApi } from "../../api/adminApi";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  /* ===========================
     FETCH USERS (ADMIN)
  =========================== */
  const fetchUsers = async () => {
    try {
      const res = await adminApi.get("/admin/users"); // ✅ JWT auto-attached
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>👑 Admin — Registered Users</h2>

      <table style={styles.table} border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Phone Number</th>
            <th>Email</th>
            <th>Registered</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.full_name}</td>
              <td>{user.phone}</td>
              <td>{user.email || "—"}</td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ===========================
   STYLES
=========================== */
const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
  },
};
