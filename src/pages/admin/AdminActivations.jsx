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
                    <span className={`status-badge ${
                      p.status === "SUBMITTED" ? "pending-badge" :
                      p.status === "APPROVED" ? "approved-badge" : "rejected-badge"
                    }`}>
                      {p.status === "SUBMITTED" ? "⏳ PENDING" :
                        p.status === "APPROVED" ? "✅ APPROVED" :
                          "❌ REJECTED"}
                    </span>
                  </td>
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
    </div>
  );
}
