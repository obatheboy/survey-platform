import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";

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

  if (loading) return <p style={styles.loadingText}>Loading activation payments...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>💳 Activation Payments Dashboard</h2>
        <p style={styles.subheader}>
          Total: {payments.length} | Pending: {payments.filter(p => p.status === "SUBMITTED").length} | Approved: {payments.filter(p => p.status === "APPROVED").length}
        </p>
      </div>

      {/* MESSAGES */}
      {successMessage && <div style={styles.successMessage}>{successMessage}</div>}
      {failureMessage && <div style={styles.errorMessage}>{failureMessage}</div>}

      {/* SEARCH & FILTER SECTION */}
      <div style={styles.searchSection}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="🔍 Search by name, phone, email, or M-Pesa code..."
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
            All
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filterStatus === "pending" ? styles.filterBtnActive : {}),
            }}
            onClick={() => setFilterStatus("pending")}
          >
            Pending
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filterStatus === "approved" ? styles.filterBtnActive : {}),
            }}
            onClick={() => setFilterStatus("approved")}
          >
            Approved
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filterStatus === "rejected" ? styles.filterBtnActive : {}),
            }}
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
                style={styles.roleOptionBtn}
              >
                👤 Regular User
              </button>
              <button
                onClick={() => updateUserRole(selectedPayment.user_id, "admin")}
                style={styles.roleOptionBtnAdmin}
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
              style={styles.modalCloseBtn}
            >
              Close
            </button>
          </div>
        </div>
      )}
                    <small>{new Date(p.created_at).toLocaleTimeString()}</small>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      {p.status === "SUBMITTED" ? (
                        <>
                          <button
                            onClick={() => approve(p.id)}
                            disabled={processingId === p.id}
                            style={styles.approveBtn}
                          >
                            {processingId === p.id ? "..." : "✓ Approve"}
                          </button>
                          <button
                            onClick={() => reject(p.id)}
                            disabled={processingId === p.id}
                            style={styles.rejectBtn}
                          >
                            ✕ Reject
                          </button>
                        </>
                      ) : (
                        <span style={styles.doneText}>
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

/* ===========================
   STYLES
=========================== */
const styles = {
    container: {
        padding: "24px",
        background: "#f9fafb",
        minHeight: "100vh",
    },
  title: {
    fontSize: "24px",
    fontWeight: "800",
    color: "var(--text-main)",
    marginBottom: "var(--space-xl)",
  },
  searchSection: {
    marginBottom: "var(--space-xl)",
    background: "#ffffff",
    padding: "var(--space-xl)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
  },
  searchContainer: {
    marginBottom: "var(--space-lg)",
  },
  searchInput: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "var(--radius-md)",
    border: "1px solid #e5e7eb",
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
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all var(--transition-fast)",
  },
  filterBtnActive: {
    background: "#3b82f6",
    color: "#fff",
    borderColor: "#3b82f6",
  },
  tableWrapper: {
    background: "#ffffff",
    borderRadius: "var(--radius-xl)",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  headerRow: {
    background: "#f9fafb",
    color: "#fff",
  },
  th: {
    padding: "16px",
    textAlign: "left",
    fontWeight: "700",
    fontSize: "14px",
  },
  row: {
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    padding: "14px 16px",
    fontSize: "14px",
    color: "#111827",
  },
  roleBtn: {
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)",
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#ffffff",
    borderRadius: "var(--radius-xl)",
    padding: "32px",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "var(--card-shadow-hover)",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "8px",
    color: "#111827",
  },
  modalSubtext: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "16px",
  },
  modalMessage: {
    padding: "12px",
    borderRadius: "var(--radius-md)",
    marginBottom: "16px",
    fontSize: "14px",
    fontWeight: "600",
  },
  roleButtons: {
    display: "flex",
    gap: "var(--space-sm)",
    marginBottom: "16px",
  },
  roleOptionBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: "var(--radius-md)",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all var(--transition-fast)",
  },
  roleOptionBtnAdmin: {
    flex: 1,
    padding: "12px",
    borderRadius: "var(--radius-md)",
    border: "1px solid #f59e0b",
    background: "rgba(245, 158, 11, 0.1)",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all var(--transition-fast)",
    color: "#f59e0b",
  },
  modalCloseBtn: {
    width: "100%",
    padding: "10px",
    borderRadius: "var(--radius-md)",
    border: "none",
    background: "#6b7280",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },
  pendingBadge: {
    background: "rgba(245, 158, 11, 0.1)",
    color: "#f59e0b",
  },
  approvedBadge: {
    background: "rgba(16, 185, 129, 0.1)",
    color: "#10b981",
  },
  rejectedBadge: {
    background: "rgba(220, 38, 38, 0.1)",
    color: "#ef4444",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  approveBtn: {
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)",
    border: "none",
    background: "#10b981",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  rejectBtn: {
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)",
    border: "none",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  doneText: {
    fontWeight: "600",
    fontSize: "12px",
    color: "#6b7280",
  },
  successMessage: {
    padding: "14px",
    marginBottom: "16px",
    borderRadius: "var(--radius-md)",
    background: "rgba(16, 185, 129, 0.1)",
    color: "#10b981",
    fontWeight: "600",
    border: "1px solid #10b981",
  },
  errorMessage: {
    padding: "14px",
    marginBottom: "16px",
    borderRadius: "var(--radius-md)",
    background: "rgba(220, 38, 38, 0.1)",
    color: "#ef4444",
    fontWeight: "600",
    border: "1px solid #ef4444",
  },
  loadingText: {
    textAlign: "center",
    padding: "40px",
    fontSize: "16px",
    color: "#111827",
  },
  noResults: {
    textAlign: "center",
    padding: "40px",
    fontSize: "16px",
    color: "#6b7280",
  },
};
