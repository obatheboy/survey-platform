import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [failureMessage, setFailureMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  /* =========================
     FETCH WITHDRAWALS
  ========================= */
  const fetchWithdrawals = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await adminApi.get("/withdraw/admin/all");
      setWithdrawals(res.data);
    } catch (err) {
      console.error("Fetch withdrawals error:", err);
      setError("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  /* =========================
     APPROVE WITHDRAWAL
  ========================= */
  const approve = async (id) => {
    if (!window.confirm("Approve this withdrawal?")) return;

    setProcessingId(id);
    setSuccessMessage("");
    setFailureMessage("");

    try {
      await adminApi.patch(`/withdraw/admin/${id}/approve`);
      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, status: "APPROVED" } : w
        )
      );
      setSuccessMessage("✅ Withdrawal approved! Payment will be processed.");
    } catch (err) {
      setFailureMessage(err.response?.data?.message || "Approval failed");
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (id) => {
    if (!window.confirm("Reject this withdrawal and refund user?")) return;

    setProcessingId(id);
    setSuccessMessage("");
    setFailureMessage("");

    try {
      await adminApi.patch(`/withdraw/admin/${id}/reject`);
      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, status: "REJECTED" } : w
        )
      );
      setSuccessMessage("❌ Withdrawal rejected and user will be refunded.");
    } catch (err) {
      setFailureMessage(err.response?.data?.message || "Rejection failed");
    } finally {
      setProcessingId(null);
    }
  };

  /* =========================
     FILTER & SEARCH
  ========================= */
  const filteredWithdrawals = withdrawals.filter((w) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      w.full_name?.toLowerCase().includes(searchLower) ||
      w.phone_number?.includes(searchTerm) ||
      w.email?.toLowerCase().includes(searchLower);

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "processing" && w.status === "PROCESSING") ||
      (filterStatus === "approved" && w.status === "APPROVED") ||
      (filterStatus === "rejected" && w.status === "REJECTED");

    return matchesSearch && matchesStatus;
  });

  if (loading) return <p style={styles.loadingText}>Loading withdrawals...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>💰 Withdrawal Requests Dashboard</h2>
        <p style={styles.subheader}>
          Total: {withdrawals.length} | Pending: {withdrawals.filter(w => w.status === "PROCESSING").length} | Approved: {withdrawals.filter(w => w.status === "APPROVED").length}
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
            All
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filterStatus === "processing" ? styles.filterBtnActive : {}),
            }}
            onClick={() => setFilterStatus("processing")}
          >
            Processing
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

      {filteredWithdrawals.length === 0 ? (
        <p style={styles.noResults}>No withdrawals found.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>User Name</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Gross (KES)</th>
                <th style={styles.th}>Fee (KES)</th>
                <th style={styles.th}>Net (KES)</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Requested</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.map((w) => (
                <tr key={w.id} style={styles.row}>
                  <td style={styles.td}>{w.full_name || "—"}</td>
                  <td style={styles.td}>{w.phone_number}</td>
                  <td style={styles.td}>{w.email || "—"}</td>
                  <td style={styles.td}>
                    <strong>{Number(w.amount).toLocaleString()}</strong>
                  </td>
                  <td style={styles.td}>{Number(w.fee).toLocaleString()}</td>
                  <td style={styles.td}>
                    <strong style={{ color: "#0a7c4a", fontSize: "16px" }}>
                      {Number(w.net_amount).toLocaleString()}
                    </strong>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.typeBadge}>
                      {w.type === "normal" ? "💵 Normal" : "🎁 Bonus"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      ...(w.status === "PROCESSING" ? styles.processingBadge :
                        w.status === "APPROVED" ? styles.approvedBadge :
                          styles.rejectedBadge)
                    }}>
                      {w.status === "PROCESSING" ? "⏳ PENDING" :
                        w.status === "APPROVED" ? "✅ APPROVED" :
                          "❌ REJECTED"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {new Date(w.created_at).toLocaleDateString()} <br />
                    <small>{new Date(w.created_at).toLocaleTimeString()}</small>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      {w.status === "PROCESSING" ? (
                        <>
                          <button
                            onClick={() => approve(w.id)}
                            disabled={processingId === w.id}
                            style={styles.approveBtn}
                          >
                            {processingId === w.id ? "..." : "✓ Approve"}
                          </button>
                          <button
                            onClick={() => reject(w.id)}
                            disabled={processingId === w.id}
                            style={styles.rejectBtn}
                          >
                            ✕ Reject
                          </button>
                        </>
                      ) : (
                        <span style={styles.doneText}>
                          {w.status === "APPROVED" ? "✓ Done" : "✕ Done"}
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
    overflowX: "auto",
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
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },
  processingBadge: {
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
  typeBadge: {
    padding: "4px 10px",
    borderRadius: "var(--radius-sm)",
    fontSize: "12px",
    fontWeight: "600",
    background: "rgba(37, 99, 235, 0.1)",
    color: "#3b82f6",
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
