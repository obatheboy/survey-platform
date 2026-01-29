import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import "./AdminWithdrawals.css";

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

  if (loading) return <p className="loading-text">Loading withdrawals...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>💰 Withdrawal Requests Dashboard</h2>
        <p>
          Total: {withdrawals.length} | Pending: {withdrawals.filter(w => w.status === "PROCESSING").length} | Approved: {withdrawals.filter(w => w.status === "APPROVED").length}
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
            All
          </button>
          <button
            className={`filter-btn ${filterStatus === "processing" ? "filter-btn-active" : ""}`}
            onClick={() => setFilterStatus("processing")}
          >
            Processing
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

      {filteredWithdrawals.length === 0 ? (
        <p className="no-results">No withdrawals found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Gross (KES)</th>
                <th>Fee (KES)</th>
                <th>Net (KES)</th>
                <th>Type</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.map((w) => (
                <tr key={w.id}>
                  <td>{w.full_name || "—"}</td>
                  <td>{w.phone_number}</td>
                  <td>{w.email || "—"}</td>
                  <td>
                    <strong>{Number(w.amount).toLocaleString()}</strong>
                  </td>
                  <td>{Number(w.fee).toLocaleString()}</td>
                  <td>
                    <strong style={{ color: "#0a7c4a", fontSize: "16px" }}>
                      {Number(w.net_amount).toLocaleString()}
                    </strong>
                  </td>
                  <td>
                    <span className="type-badge">
                      {w.type === "normal" ? "💵 Normal" : "🎁 Bonus"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      w.status === "PROCESSING" ? "processing-badge" :
                      w.status === "APPROVED" ? "approved-badge" : "rejected-badge"
                    }`}>
                      {w.status === "PROCESSING" ? "⏳ PENDING" :
                        w.status === "APPROVED" ? "✅ APPROVED" :
                          "❌ REJECTED"}
                    </span>
                  </td>
                  <td>
                    {new Date(w.created_at).toLocaleDateString()} <br />
                    <small>{new Date(w.created_at).toLocaleTimeString()}</small>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {w.status === "PROCESSING" ? (
                        <>
                          <button
                            onClick={() => approve(w.id)}
                            disabled={processingId === w.id}
                            className="approve-btn"
                          >
                            {processingId === w.id ? "..." : "✓ Approve"}
                          </button>
                          <button
                            onClick={() => reject(w.id)}
                            disabled={processingId === w.id}
                            className="reject-btn"
                          >
                            ✕ Reject
                          </button>
                        </>
                      ) : (
                        <span className="done-text">
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
