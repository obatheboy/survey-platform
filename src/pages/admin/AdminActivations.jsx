import { useEffect, useState } from "react";

import api from "../../api/api";

export default function AdminActivations() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [view, setView] = useState("PENDING"); // PENDING | ALL
  const [processingId, setProcessingId] = useState(null);

  /* =========================
     FETCH PAYMENTS
  ========================= */
  const fetchActivations = async () => {
    try {
      setError("");
      setLoading(true);

      const endpoint =
        view === "PENDING"
          ? "/admin/activations/pending"
          : "/admin/activations";

      const res = await adminApi.get(endpoint); // ✅ FIX
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
    // eslint-disable-next-line
  }, [view]);

  /* =========================
     ACTIONS (OPTIMISTIC)
  ========================= */
  const approve = async (id) => {
    if (!window.confirm("Approve this activation?")) return;

    setProcessingId(id);

    try {
      await adminApi.patch(`/admin/activations/${id}/approve`); // ✅ FIX

      setPayments((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: "APPROVED" } : p
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Approval failed");
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (id) => {
    if (!window.confirm("Reject this activation?")) return;

    setProcessingId(id);

    try {
      await adminApi.patch(`/admin/activations/${id}/reject`); // ✅ OK

      setPayments((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: "REJECTED" } : p
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
  if (loading) return <p>Loading activation payments...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  /* =========================
     UI
  ========================= */
  return (
    <div>
      <h2>Activation Payments</h2>

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

      {payments.length === 0 ? (
        <p>No activation payments found.</p>
      ) : (
        <table style={styles.table} border="1" cellPadding="8">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Mpesa Code</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.username || p.full_name}</td>
                <td>{p.email}</td>
                <td>{p.mpesa_code}</td>
                <td>Ksh {p.amount}</td>
                <td>
                  <span style={statusStyle(p.status)}>
                    {p.status}
                  </span>
                </td>
                <td>
                  {new Date(p.created_at).toLocaleString()}
                </td>
                <td>
                  {p.status === "SUBMITTED" ? (
                    <>
                      <button
                        onClick={() => approve(p.id)}
                        disabled={processingId === p.id}
                      >
                        {processingId === p.id
                          ? "Processing..."
                          : "Approve"}
                      </button>

                      <button
                        onClick={() => reject(p.id)}
                        disabled={processingId === p.id}
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
