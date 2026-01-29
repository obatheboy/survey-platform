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
    fetchData: () => adminApi.get('/admin/activations'),
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
      setTimeout(() => {
        setShowRoleModal(false);
        setSelectedPayment(null);
        setRoleMessage("");
      }, 1500);
    } catch (err) {
      setRoleMessage("❌ Failed to update role");
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

  return (
    <>
      <AdminTableLayout
        header={{
          title: '💳 Activation Payments Dashboard',
          stats: (items) =>
            `Total: ${items.length} | Pending: ${
              items.filter((p) => p.status === 'SUBMITTED').length
            } | Approved: ${
              items.filter((p) => p.status === 'APPROVED').length
            }`,
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
        items={filteredPayments}
      >
      {filteredPayments.length === 0 ? (
        <p className="no-results">No activation payments found.</p>
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
              {filteredPayments.map((p) => (
                <tr key={p.id}>
                  <td>{p.full_name || "—"}</td>
                  <td>{p.phone || "—"}</td>
                  <td>{p.email || "—"}</td>
                  <td style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.mpesa_code}>
                    <strong style={{ fontFamily: "monospace" }}>{p.mpesa_code}</strong>
                  </td>
                  <td>
                    <strong style={{ color: "#0a7c4a", fontSize: "16px" }}>
                      {Number(p.amount).toLocaleString()}
                    </strong>
                  </td>
                  <td>
                    <StatusBadge status={p.status} statusMap={statusMap} />
                  </td>
                  <td>
                    {new Date(p.created_at).toLocaleDateString()} <br />
                    <small>{new Date(p.created_at).toLocaleTimeString()}</small>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <ActionButtons
                        item={p}
                        processingId={processingId}
                        onApprove={() => handleApprove(p.id)}
                        onReject={() => handleReject(p.id)}
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
              User: <strong>{selectedPayment.full_name}</strong>
            </p>

            {roleMessage && (
              <div className={`response-message ${roleMessage.startsWith("✅") ? "success-message" : "error-message"}`}>
                {roleMessage}
              </div>
            )}

            <div className="action-buttons" style={{ marginBottom: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => updateUserRole(selectedPayment.user_id, "user")}
                className="role-option-btn"
              >
                👤 Regular User
              </button>
              <button
                onClick={() => updateUserRole(selectedPayment.user_id, "admin")}
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
