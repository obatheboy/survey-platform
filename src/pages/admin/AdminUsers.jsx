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
    padding: "var(--space-xl)",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  title: {
    fontSize: "24px",
    fontWeight: "800",
    color: "var(--text-main)",
    marginBottom: "var(--space-xl)",
  },
  searchSection: {
    marginBottom: "var(--space-xl)",
    background: "var(--bg-surface)",
    padding: "var(--space-xl)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--card-shadow)",
  },
  searchContainer: {
    marginBottom: "var(--space-lg)",
  },
  searchInput: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "var(--radius-md)",
    border: "2px solid var(--border-medium)",
    fontSize: "14px",
    fontWeight: "500",
    boxSizing: "border-box",
  },
  filterContainer: {
    display: "flex",
    gap: "var(--space-sm)",
    flexWrap: "wrap",
  },
  filterBtn: {
    padding: "8px 16px",
    borderRadius: "var(--radius-sm)",
    border: "2px solid var(--border-medium)",
    background: "var(--bg-surface)",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all var(--transition-fast)",
  },
  filterBtnActive: {
    background: "var(--primary)",
    color: "#fff",
    border: "2px solid var(--primary)",
  },
  tableWrapper: {
    background: "var(--bg-surface)",
    borderRadius: "var(--radius-xl)",
    overflow: "hidden",
    boxShadow: "var(--card-shadow)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  headerRow: {
    background: "var(--primary)",
    color: "#fff",
  },
  th: {
    padding: "16px",
    textAlign: "left",
    fontWeight: "700",
    fontSize: "14px",
  },
  row: {
    borderBottom: "1px solid var(--border-soft)",
  },
  td: {
    padding: "14px 16px",
    fontSize: "14px",
    color: "var(--text-main)",
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },
  activeBadge: {
    background: "rgba(16, 185, 129, 0.1)",
    color: "var(--regular-color)",
  },
  inactiveBadge: {
    background: "rgba(220, 38, 38, 0.1)",
    color: "#dc2626",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  activateBtn: {
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)",
    border: "none",
    background: "var(--regular-color)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  activated: {
    padding: "6px 12px",
    color: "var(--regular-color)",
    fontWeight: "600",
    fontSize: "12px",
  },
  roleBtn: {
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)",
    border: "none",
    background: "var(--primary)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  deleteBtn: {
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)",
    border: "none",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  loadingText: {
    textAlign: "center",
    padding: "40px",
    fontSize: "16px",
    color: "var(--text-main)",
  },
  noResults: {
    textAlign: "center",
    padding: "40px",
    fontSize: "16px",
    color: "var(--text-light)",
  },
};
