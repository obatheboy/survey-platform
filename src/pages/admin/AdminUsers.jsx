import { useState } from "react";
import { adminApi } from "../../api/adminApi";
import "./Admin.css";
import "./AdminUsers.css";
import { useAdminTable } from "./useAdminTable";
import AdminTableLayout from "./AdminTableLayout";

const filterConfig = {
  all: { label: 'All Users', value: 'all' },
  active: { label: 'Active', value: 'active' },
  inactive: { label: 'Inactive', value: 'inactive' },
};

export default function AdminUsers() {
  const [processingId, setProcessingId] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleMessage, setRoleMessage] = useState("");

  const {
    items: users,
    setItems,
    loading,
    error,
    successMessage,
    failureMessage,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filteredItems: filteredUsers,
    selectedIds,
    handleSelectOne,
    handleSelectAll,
    deleteSelectedItems: deleteSelectedUsers,
  } = useAdminTable({
    fetchData: () => adminApi.get("/admin/users"),
    deleteBulkData: (userIds) => adminApi.post('/admin/users/bulk-delete', { userIds }),
    searchFields: ['full_name', 'phone', 'email'],
    filterConfig,
    initialFilterStatus: 'all',
    customFilter: (item, filterKey) => {
      if (filterKey === 'all') return true;
      if (filterKey === 'active') return item.is_activated;
      if (filterKey === 'inactive') return !item.is_activated;
      return true;
    }
  });

  /* ===========================
     ACTIVATE USER
  =========================== */
  const activateUser = async (id) => {
    if (!window.confirm("Activate this account?")) return;

    setProcessingId(id);
    try {
      await adminApi.patch(`/admin/users/${id}/activate`);
      setItems((prev) =>
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
      setItems((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Deletion failed");
    }
  };

  /* ===========================
     UPDATE USER ROLE
  =========================== */
  const updateUserRole = async (userId, newRole) => {
    try {
      setRoleMessage("Updating role...");
      await adminApi.patch(`/admin/users/${userId}/role`, { role: newRole });
      setItems((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
      setRoleMessage(`✅ Role updated to ${newRole.toUpperCase()}`);
      setTimeout(() => {
        setShowRoleModal(false);
        setSelectedUser(null);
        setRoleMessage("");
      }, 1500);
    } catch (err) {
      setRoleMessage(err.response?.data?.message || "❌ Failed to update role");
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected users? This action cannot be undone.`)) {
      deleteSelectedUsers();
    }
  };

  const handleClearSelection = () => {
    handleSelectAll({ target: { checked: false } });
  };

  return (
    <AdminTableLayout
      header={{
        title: '👥 User Management Dashboard',
        stats: (items) => `Total Users: ${items.length} | Activated: ${items.filter(u => u.is_activated).length}`,
        loadingText: 'Loading users...',
      }}
      filterConfig={filterConfig}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      searchInputPlaceholder="🔍 Search by name, phone, or email..."
      successMessage={successMessage}
      failureMessage={failureMessage}
      loading={loading}
      error={error}
      items={users} // Pass original items for stats
    >
      {selectedIds.size > 0 && (
        <div className="bulk-actions" style={{ 
            margin: '0 20px 1rem', 
            padding: '12px 20px', 
            background: '#eff6ff', 
            border: '1px solid #dbeafe', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: '600', color: '#1e40af' }}>
                    {selectedIds.size} selected
                </span>
                <button onClick={handleClearSelection} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}>
                    Cancel
                </button>
            </div>
            <button onClick={handleBulkDelete} className="delete-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                🗑️ Delete Selected
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
                <th style={{ width: '50px' }}>
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
                <tr key={user.id} style={selectedIds.has(user.id) ? { backgroundColor: '#eff6ff' } : {}}>
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
                 
                  <td>{(user.role || 'user').toUpperCase()}</td>
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
                        onClick={() => {
                          setSelectedUser(user);
                          setShowRoleModal(true);
                        }}
                        className="role-btn"
                      >
                        Set Role
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
      {/* ROLE MODAL */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>👤 Set User Role</h3>
            <p>
              User: <strong>{selectedUser.full_name}</strong>
            </p>

            {roleMessage && (
              <div className={`response-message ${roleMessage.startsWith("✅") ? "success-message" : "error-message"}`}>
                {roleMessage}
              </div>
            )}

            <div className="action-buttons" style={{ marginBottom: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => updateUserRole(selectedUser.id, "user")}
                className="role-option-btn"
              >
                👤 Regular User
              </button>
              <button
                onClick={() => updateUserRole(selectedUser.id, "admin")}
                className="role-option-btn admin"
              >
                👨‍💼 Admin User
              </button>
            </div>

            <button
              onClick={() => {
                setShowRoleModal(false);
                setSelectedUser(null);
                setRoleMessage("");
              }}
              className="modal-close-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminTableLayout>
  );
}
