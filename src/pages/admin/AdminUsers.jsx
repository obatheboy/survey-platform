import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import "./AdminUsers.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());

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

  const deleteSelectedUsers = async () => {
    if (selectedIds.size === 0) {
      alert('No users selected.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} selected user(s)?`)) {
      return;
    }

    try {
      const idsToDelete = Array.from(selectedIds);
      await adminApi.post('/admin/users/bulk-delete', { userIds: idsToDelete });
      setUsers((prev) => prev.filter((user) => !idsToDelete.includes(user.id)));
      setSelectedIds(new Set());
      alert(`${idsToDelete.length} user(s) deleted successfully.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Bulk delete failed.');
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

  const handleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(filteredUsers.map((item) => item.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  if (loading) return <p className="loading-text">Loading users...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="admin-users-container">
      <div className="admin-users-header">
        <h2>👥 User Management Dashboard</h2>
        <p>Total Users: {users.length} | Activated: {users.filter(u => u.is_activated).length}</p>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="🔍 Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-container">
          <button
            className={`filter-btn ${filterStatus === "all" ? "filter-btn-active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            All Users
          </button>
          <button
            className={`filter-btn ${filterStatus === "active" ? "filter-btn-active" : ""}`}
            onClick={() => setFilterStatus("active")}
          >
            Active
          </button>
          <button
            className={`filter-btn ${filterStatus === "inactive" ? "filter-btn-active" : ""}`}
            onClick={() => setFilterStatus("inactive")}
          >
            Inactive
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-actions" style={{ marginBottom: '1rem' }}>
          <button onClick={deleteSelectedUsers} className="delete-btn">
            Delete {selectedIds.size} Selected
          </button>
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <p className="no-results">No users found matching your search.</p>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filteredUsers.length > 0 && selectedIds.size === filteredUsers.length}
                    disabled={filteredUsers.length === 0}
                  />
                </th>
                <th>Full Name</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Registered</th>
                <th>Status</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input
                      type="checkbox"
                      onChange={() => handleSelectOne(user.id)}
                      checked={selectedIds.has(user.id)}
                    />
                  </td>
                  <td>{user.full_name}</td>
                  <td>{user.phone}</td>
                  <td>{user.email || "—"}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${user.is_activated ? "active-badge" : "inactive-badge"}`}>
                      {user.is_activated ? "✓ ACTIVE" : "✗ INACTIVE"}
                    </span>
                  </td>
                  <td>{user.role.toUpperCase()}</td>
                  <td>
                    <div className="action-buttons">
                      {!user.is_activated ? (
                        <button
                          onClick={() => activateUser(user.id)}
                          disabled={processingId === user.id}
                          className="activate-btn"
                        >
                          {processingId === user.id ? "..." : "Activate"}
                        </button>
                      ) : (
                        <span className="activated-text">Activated</span>
                      )}
                      <button
                        onClick={() => updateUserRole(user.id, user.role)}
                        className="role-btn"
                      >
                        Role
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="delete-btn"
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
