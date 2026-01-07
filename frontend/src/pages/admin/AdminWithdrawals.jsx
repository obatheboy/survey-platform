import { useEffect, useState } from "react";
import api from "../../api/api";

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [view, setView] = useState("PENDING"); // PENDING | ALL
  const [processingId, setProcessingId] = useState(null);

  /* =========================
     FETCH WITHDRAWALS
  ========================= */
  const fetchWithdrawals = async () => {
    try {
      setError("");
      setLoading(true);

      const endpoint =
        view === "PENDING"
          ? "/withdraw/admin/pending"
          : "/withdraw/admin/all";

      const res = await api.get(endpoint);
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
    // eslint-disable-next-line
  }, [view]);

  /* =========================
     ACTIONS
  ========================= */
  const approve = async (id) => {
    if (!window.confirm("Approve this withdrawal?")) return;

    setProcessingId(id);
    try {
      await api.patch(`/withdraw/admin/${id}/approve`);

      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, status: "APPROVED" } : w
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Approval failed");
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (id) => {
    if (!window.confirm("Reject this withdrawal and refund user?")) return;

    setProcessingId(id);
    try {
      await api.patch(`/withdraw/admin/${id}/reject`);

      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, status: "REJECTED" } : w
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Rejection failed");
    } finally {
      setProcessingId(null);
    }
  };

  /* =========================
     SAFE GUARDS
  ========================= */
  if (loading) return <p>Loading withdrawals...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  /* =========================
     UI
  ========================= */
  return (
    <div>
      <h2>Withdraw Requests</h2>

      {/* FILTER */}
      <div style={{ marginBottom: 15 }}>
        <button
          onClick={() => setView("PENDING")}
          disabled={view === "PENDING"}
        >
          Pending
        </button>

        <button
          onClick={() => setView("ALL")}
          disabled={view === "ALL"}
          style={{ marginLeft: 10 }}
        >
          All
        </button>
      </div>

      {withdrawals.length === 0 ? (
        <p>No withdrawals found.</p>
      ) : (
        <table style={styles.table} border="1" cellPadding="8">
          <thead>
            <tr>
              <th>User</th>
              <th>Phone</th>
              <th>Plan</th>
              <th>Gross</th>
              <th>Fee</th>
              <th>Net</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id}>
                <td>{w.username || w.full_name}</td>
                <td>{w.phone_number}</td>
                <td>{w.plan}</td>
                <td>Ksh {w.amount}</td>
                <td>Ksh {w.fee}</td>
                <td>
                  <strong>Ksh {w.net_amount}</strong>
                </td>
                <td>
                  <span style={statusStyle(w.status)}>
                    {w.status}
                  </span>
                </td>
                <td>
                  {new Date(w.created_at).toLocaleString()}
                </td>
                <td>
                  {w.status === "PROCESSING" ? (
                    <>
                      <button
                        onClick={() => approve(w.id)}
                        disabled={processingId === w.id}
                      >
                        {processingId === w.id
                          ? "Processing..."
                          : "Approve"}
                      </button>

                      <button
                        onClick={() => reject(w.id)}
                        disabled={processingId === w.id}
                        style={{ marginLeft: 8, color: "red" }}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <em>—</em>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ───────── styles ───────── */

const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
  },
};

const statusStyle = (status) => ({
  padding: "4px 8px",
  borderRadius: 4,
  color: "#fff",
  fontWeight: "bold",
  background:
    status === "APPROVED"
      ? "green"
      : status === "REJECTED"
      ? "red"
      : "orange",
});
