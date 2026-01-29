import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import "./AdminActivations.css";

export default function AdminActivations() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [failureMessage, setFailureMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [roleMessage, setRoleMessage] = useState("");

  /* =========================
     FETCH ACTIVATIONS
  ========================= */
  const fetchActivations = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await adminApi.get("/admin/activations");
      setPayments(res.data);
    } catch (err) {
      console.error("Fetch activations error:", err);
      setError("Failed to load activation payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivations();
  }, []);

  /* =========================
     APPROVE ACTIVATION
  ========================= */
  const approve = async (id) => {
    if (!window.confirm("Approve this activation?")) return;

    setProcessingId(id);
    setSuccessMessage("");
    setFailureMessage("");

    try {
      await adminApi.patch(`/admin/activations/${id}/approve`);
      setPayments((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: "APPROVED" } : p
        )
      );
      setSuccessMessage("✅ Activation approved! User can now withdraw.");
      // Auto-open role modal after approval
      const payment = payments.find(p => p.id === id);
      if (payment) {
        setSelectedPayment(payment);
        setShowRoleModal(true);
      }
    } catch (err) {
      setFailureMessage(err.response?.data?.message || "Approval failed");
    } finally {
      setProcessingId(null);
    }
  };

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

  const reject = async (id) => {
    if (!window.confirm("Reject this activation?")) return;

    setProcessingId(id);
    setSuccessMessage("");
    setFailureMessage("");

    try {
      await adminApi.patch(`/admin/activations/${id}/reject`);
      setPayments((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: "REJECTED" } : p
        )
      );
      setSuccessMessage("❌ Activation rejected.");
    } catch (err) {
      setFailureMessage(err.response?.data?.message || "Rejection failed");
    } finally {
      setProcessingId(null);
    }
  };

  /* =========================
     FILTER & SEARCH
  ========================= */
  const filteredPayments = payments.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      p.full_name?.toLowerCase().includes(searchLower) ||
      p.phone?.includes(searchTerm) ||
      p.email?.toLowerCase().includes(searchLower) ||
      p.mpesa_code?.includes(searchTerm);

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "pending" && p.status === "SUBMITTED") ||
      (filterStatus === "approved" && p.status === "APPROVED") ||
      (filterStatus === "rejected" && p.status === "REJECTED");

    return matchesSearch && matchesStatus;
  });

  if (loading) return <p className="loading-text">Loading activation payments...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>💳 Activation Payments Dashboard</h2>
        <p>
          Total: {payments.length} | Pending: {payments.filter(p => p.status === "SUBMITTED").length} | Approved: {payments.filter(p => p.status === "APPROVED").length}
        </p>
      </div>

      {/* MESSAGES */}
      {successMessage && <div className="response-message success-message">{successMessage}</div>}
      {failureMessage && <div className="response-message error-message">{failureMessage}</div>}

      {/* SEARCH & FILTER SECTION */}
      <div className="search-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="🔍 Search by name, phone, email, or M-Pesa code..."
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
            All
          </button>
          <button
            className={`filter-btn ${filterStatus === "pending" ? "filter-btn-active" : ""}`}
            onClick={() => setFilterStatus("pending")}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${filterStatus === "approved" ? "filter-btn-active" : ""}`}
            onClick={() => setFilterStatus("approved")}
          >
            Approved
          </button>
          <button
            className={`filter-btn ${filterStatus === "rejected" ? "filter-btn-active" : ""}`}
            onClick={() => setFilterStatus("rejected")}
          >
            Rejected
          </button>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <p style={styles.noResults}>No activation payments found.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>User Name</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>M-Pesa Code</th>
                <th style={styles.th}>Amount (KES)</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Submitted</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => (
                <tr key={p.id} style={styles.row}>
                  <td style={styles.td}>{p.full_name || "—"}</td>
                  <td style={styles.td}>{p.phone || "—"}</td>
                  <td style={styles.td}>{p.email || "—"}</td>
                  <td style={styles.td}>
                    <strong style={{ fontFamily: "monospace" }}>{p.mpesa_code}</strong>
                  </td>
                  <td style={styles.td}>
                    <strong style={{ color: "#0a7c4a", fontSize: "16px" }}>
                      {Number(p.amount).toLocaleString()}
                    </strong>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      ...(p.status === "SUBMITTED" ? styles.pendingBadge :
                        p.status === "APPROVED" ? styles.approvedBadge :
                          styles.rejectedBadge)
                    }}>
                      {p.status === "SUBMITTED" ? "⏳ PENDING" :
                        p.status === "APPROVED" ? "✅ APPROVED" :
                          "❌ REJECTED"}
                    </span>
                  </td>p.status === "APPROVED" ? (
                        <button
                          onClick={() => {
                            setSelectedPayment(p);
                            setShowRoleModal(true);
                          }}
                          style={styles.roleBtn}
                        >
                          👤 Set Role
                        </button>
                      ) : 
                  <td style={styles.td}>
                    {new Date(p.created_at).toLocaleDateString()} <br />

      {/* ROLE MODAL */}
      {showRoleModal && selectedPayment && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>👤 Set User Role</h3>
            <p style={styles.modalSubtext}>
              User: <strong>{selectedPayment.full_name}</strong>
            </p>

            {roleMessage && (
              <div style={{
                ...styles.modalMessage,
                ...(roleMessage.startsWith("✅") ? { background: "#d4edda", color: "#155724" } : { background: "#f8d7da", color: "#721c24" })
              }}>
                {roleMessage}
              </div>
            )}

            <div style={styles.roleButtons}>
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
                  <td>
                    {new Date(p.created_at).toLocaleDateString()} <br />
                    <small>{new Date(p.created_at).toLocaleTimeString()}</small>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {p.status === "SUBMITTED" ? (
                        <>
                          <button
                            onClick={() => approve(p.id)}
                            disabled={processingId === p.id}
                            className="approve-btn"
                          >
                            {processingId === p.id ? "..." : "✓ Approve"}
                          </button>
                          <button
                            onClick={() => reject(p.id)}
                            disabled={processingId === p.id}
                            className="reject-btn"
                          >
                            ✕ Reject
                          </button>
                        </>
                      ) : (
                        <span className="done-text">
                          {p.status === "APPROVED" ? "✓ Done" : "✕ Done"}
                        </span>
                      )}
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
