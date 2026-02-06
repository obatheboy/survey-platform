import { useState } from "react";
import { adminApi } from "../../api/adminApi";
import "./Admin.css";
import { useAdminTable } from "./useAdminTable";
import AdminTableLayout from "./AdminTableLayout";
import ActionButtons from "./ActionButtons";
import StatusBadge from "./StatusBadge";

const filterConfig = {
  all: { label: 'All', value: 'all' },
  pending: { label: 'Pending', value: 'SUBMITTED' },
  approved: { label: 'Approved', value: 'APPROVED' },
  rejected: { label: 'Rejected', value: 'REJECTED' },
};

const statusMap = {
  SUBMITTED: { label: '⏳ PENDING', className: 'pending-badge' },
  APPROVED: { label: '✅ APPROVED', className: 'approved-badge' },
  REJECTED: { label: '❌ REJECTED', className: 'rejected-badge' },
};

export default function AdminActivations() {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [roleMessage, setRoleMessage] = useState("");

  const {
    items: payments,
    loading,
    error,
    processingId,
    successMessage,
    setSuccessMessage,
    failureMessage,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    approveItem,
    rejectItem,
    filteredItems: filteredPayments,
  } = useAdminTable({
    fetchData: async () => {
      try {
        const response = await adminApi.get('/admin/activations');
        console.log("🔍 API Response:", response.data);
        
        // Handle the new response format { success: true, payments: [...] }
        if (response.data && response.data.success && Array.isArray(response.data.payments)) {
          console.log("✅ Using payments array from response");
          return response.data.payments;
        }
        
        // Handle old format (direct array) or error
        if (Array.isArray(response.data)) {
          console.log("⚠️ Using direct array (old format)");
          return response.data;
        }
        
        console.error("❌ Invalid response format:", response.data);
        return [];
      } catch (err) {
        console.error("❌ API Error:", err);
        return [];
      }
    },
    approveData: (id) => adminApi.patch(`/admin/activations/${id}/approve`),
    rejectData: (id) => adminApi.patch(`/admin/activations/${id}/reject`),
    searchFields: ['full_name', 'phone', 'email', 'mpesa_code'],
    filterConfig,
    initialFilterStatus: 'pending',
  });

  /* =========================
     UPDATE USER ROLE
  ========================= */
  const updateUserRole = async (userId, newRole) => {
    try {
      setRoleMessage("Updating role...");
      await adminApi.patch(`/admin/users/${userId}/role`, { role: newRole });
      setRoleMessage(`✅ Role updated to ${newRole.toUpperCase()}`);
      
      // Auto-close on success
      setTimeout(() => {
        setShowRoleModal(false);
        setSelectedPayment(null);
        setRoleMessage("");
      }, 1500);
    } catch (err) {
      console.error("Role update failed:", err);
      setRoleMessage("❌ Failed to update role");
      
      // Auto-clear error after 3 seconds
      setTimeout(() => {
        setRoleMessage("");
      }, 3000);
    }
  };

  const handleApprove = (id) => {
    approveItem(id, (approvedId) => {
      setSuccessMessage("✅ Activation approved! User can now withdraw.");
      const payment = payments.find((p) => p.id === approvedId);
      if (payment) {
        setSelectedPayment(payment);
        setShowRoleModal(true);
      }
    }, "Approve this activation?");
  };

  const handleReject = (id) => {
    rejectItem(id, "Reject this activation?");
  };

  // Add safety check for filteredPayments
  const safeFilteredPayments = Array.isArray(filteredPayments) ? filteredPayments : [];
  const safePayments = Array.isArray(payments) ? payments : [];

  return (
    <>
      <AdminTableLayout
        header={{
          title: '💳 Activation Payments Dashboard',
          stats: (items) => {
            const safeItems = Array.isArray(items) ? items : [];
            return `Total: ${safeItems.length} | Pending: ${
              safeItems.filter((p) => p.status === 'SUBMITTED').length
            } | Approved: ${
              safeItems.filter((p) => p.status === 'APPROVED').length
            }`;
          },
          loadingText: 'Loading activation payments...',
        }}
        filterConfig={filterConfig}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchInputPlaceholder="🔍 Search by name, phone, email, or M-Pesa code..."
        successMessage={successMessage}
        failureMessage={failureMessage}
        loading={loading}
        error={error}
        items={safePayments}
      >
        {safeFilteredPayments.length === 0 ? (
          <p className="no-results">
            {loading ? 'Loading...' : 'No activation payments found.'}
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>M-Pesa Code</th>
                  <th>Amount (KES)</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {safeFilteredPayments.map((p) => (
                  <tr key={p.id || p._id}>
                    <td>{p.full_name || p.user_name || "—"}</td>
                    <td>{p.phone || "—"}</td>
                    <td>{p.email || "—"}</td>
                    <td style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.mpesa_code}>
                      <strong style={{ fontFamily: "monospace" }}>
                        {p.mpesa_code || "N/A"}
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: "#0a7c4a", fontSize: "16px" }}>
                        {Number(p.amount || 0).toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <StatusBadge status={p.status} statusMap={statusMap} />
                    </td>
                    <td>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"} 
                      <br />
                      {p.created_at && <small>{new Date(p.created_at).toLocaleTimeString()}</small>}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <ActionButtons
                          item={p}
                          processingId={processingId}
                          onApprove={() => handleApprove(p.id || p._id)}
                          onReject={() => handleReject(p.id || p._id)}
                        />
                        {p.status === "APPROVED" && (
                          <button
                            onClick={() => {
                              setSelectedPayment(p);
                              setShowRoleModal(true);
                            }}
                            className="role-btn"
                          >
                            👤 Set Role
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminTableLayout>
      
      {/* ROLE MODAL */}
      {showRoleModal && selectedPayment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>👤 Set User Role</h3>
            <p>
              User: <strong>{selectedPayment.full_name || selectedPayment.user_name || "Unknown"}</strong>
            </p>

            {roleMessage && (
              <div className={`response-message ${roleMessage.startsWith("✅") ? "success-message" : "error-message"}`}>
                {roleMessage}
              </div>
            )}

            <div className="action-buttons" style={{ marginBottom: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => updateUserRole(selectedPayment.user_id || selectedPayment.id, "user")}
                className="role-option-btn"
              >
                👤 Regular User
              </button>
              <button
                onClick={() => updateUserRole(selectedPayment.user_id || selectedPayment.id, "admin")}
                className="role-option-btn admin"
              >
                👨‍💼 Admin User
              </button>
            </div>

            <button
              onClick={() => {
                setShowRoleModal(false);
                setSelectedPayment(null);
                setRoleMessage("");
              }}
              className="modal-close-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}