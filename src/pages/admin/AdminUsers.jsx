import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ===========================
     FETCH USERS (ADMIN)
  =========================== */
  const fetchUsers = async () => {
    try {
      const res = await adminApi.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     ACTIVATE USER
  =========================== */
  const activateUser = async (id) => {
    if (!window.confirm("Activate this account?")) return;

    setProcessingId(id);
    try {
      await adminApi.patch(`/admin/users/${id}/activate`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, is_activated: true, status: "ACTIVE" } : u
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Activation failed");
    } finally {
      setProcessingId(null);
    }
  };

  /* ===========================
     DELETE USER
  =========================== */
  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await adminApi.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  /* ===========================
     UPDATE USER ROLE
  =========================== */
  const updateUserRole = async (id, role) => {
    const newRole = role === "user" ? "admin" : "user";

    try {
      await adminApi.patch(`/admin/users/${id}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, role: newRole } : u
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Role update failed");
    }
  };

  /* ===========================
     FILTER & SEARCH USERS
  =========================== */
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.phone?.includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchLower);

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && user.is_activated) ||
      (filterStatus === "inactive" && !user.is_activated);

    return matchesSearch && matchesStatus;
  });

  if (loading) return <p style={styles.loadingText}>Loading users...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>👥 User Management Dashboard</h2>
        <p style={styles.subheader}>Total Users: {users.length} | Activated: {users.filter(u => u.is_activated).length}</p>
      </div>

      {/* Search Section */}
      <div style={styles.searchSection}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="🔍 Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterContainer}>
          <button
            style={{
              ...styles.filterBtn,
              ...(filterStatus === "all" ? styles.filterBtnActive : {}),
            }}
            onClick={() => setFilterStatus("all")}
          >
            All Users
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filterStatus === "active" ? styles.filterBtnActive : {}),
            }}
            onClick={() => setFilterStatus("active")}
          >
            Active
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filterStatus === "inactive" ? styles.filterBtnActive : {}),
            }}
            onClick={() => setFilterStatus("inactive")}
          >
            Inactive
          </button>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <p style={styles.noResults}>No users found matching your search.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>Full Name</th>
                <th style={styles.th}>Phone Number</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Registered</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={styles.row}>
                  <td style={styles.td}>{user.full_name}</td>
                  <td style={styles.td}>{user.phone}</td>
                  <td style={styles.td}>{user.email || "—"}</td>
                  <td style={styles.td}>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      ...(user.is_activated ? styles.activeBadge : styles.inactiveBadge)
                    }}>
                      {user.is_activated ? "✓ ACTIVE" : "✗ INACTIVE"}
                    </span>
                  </td>
                  <td style={styles.td}>{user.role.toUpperCase()}</td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      {!user.is_activated ? (
                        <button
                          onClick={() => activateUser(user.id)}
                          disabled={processingId === user.id}
                          style={styles.activateBtn}
                        >
                          {processingId === user.id ? "..." : "Activate"}
                        </button>
                      ) : (
                        <span style={styles.activated}>Activated</span>
                      )}
                      <button
                        onClick={() => updateUserRole(user.id, user.role)}
                        style={styles.roleBtn}
                      >
                        Role
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        style={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ===========================
   STYLES
=========================== */
const styles = {
  container: {
    padding: "24px",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "24px",
  },
  subheader: {
    color: "#666",
    fontSize: "14px",
    marginTop: "6px",
  },
  searchSection: {
    marginBottom: "24px",
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  searchContainer: {
    marginBottom: "16px",
  },
  searchInput: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "2px solid #e0e0e0",
    fontSize: "14px",
    fontWeight: "500",
    boxSizing: "border-box",
  },
  filterContainer: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  filterBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "2px solid #ddd",
    background: "#f9f9f9",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s ease",
  },
  filterBtnActive: {
    background: "#667eea",
    color: "#fff",
    border: "2px solid #667eea",
  },
  tableWrapper: {
    background: "#fff",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  headerRow: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
  },
  th: {
    padding: "16px",
    textAlign: "left",
    fontWeight: "700",
    fontSize: "14px",
  },
  row: {
    borderBottom: "1px solid #eee",
  },
  td: {
    padding: "14px 16px",
    fontSize: "14px",
    color: "#333",
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },
  activeBadge: {
    background: "#d4edda",
    color: "#155724",
  },
  inactiveBadge: {
    background: "#f8d7da",
    color: "#721c24",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  activateBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#28a745",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  activated: {
    padding: "6px 12px",
    color: "#28a745",
    fontWeight: "600",
    fontSize: "12px",
  },
  roleBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#007bff",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  deleteBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#dc3545",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  loadingText: {
    textAlign: "center",
    padding: "40px",
    fontSize: "16px",
  },
  noResults: {
    textAlign: "center",
    padding: "40px",
    fontSize: "16px",
    color: "#999",
  },
};
