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
    overflowX: "auto",
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
  processingBadge: {
    background: "#fff3cd",
    color: "#856404",
  },
  approvedBadge: {
    background: "#d4edda",
    color: "#155724",
  },
  rejectedBadge: {
    background: "#f8d7da",
    color: "#721c24",
  },
  typeBadge: {
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    background: "#e7f3ff",
    color: "#0066cc",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  approveBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#28a745",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  rejectBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#dc3545",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  doneText: {
    fontWeight: "600",
    fontSize: "12px",
    color: "#666",
  },
  successMessage: {
    padding: "14px",
    marginBottom: "16px",
    borderRadius: "10px",
    background: "#d4edda",
    color: "#155724",
    fontWeight: "600",
    border: "1px solid #c3e6cb",
  },
  errorMessage: {
    padding: "14px",
    marginBottom: "16px",
    borderRadius: "10px",
    background: "#f8d7da",
    color: "#721c24",
    fontWeight: "600",
    border: "1px solid #f5c6cb",
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
