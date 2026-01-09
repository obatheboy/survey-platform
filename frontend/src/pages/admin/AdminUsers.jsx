import { useEffect, useState } from "react";

import api from "../../api/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ===========================
     FETCH USERS
  =========================== */
  const fetchUsers = async () => {
    try {
      const res = await adminApi.get("/admin/users"); // ✅ FIX
      setUsers(res.data);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     UPDATE STATUS
     ✅ ONLY ACTIVE / SUSPENDED
  =========================== */
  const updateStatus = async (userId, newStatus) => {
    if (!window.confirm(`Change status to ${newStatus}?`)) return;

    try {
      await adminApi.patch(`/admin/users/${userId}/status`, {
        status: newStatus,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: newStatus } : u
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  /* ===========================
     ADJUST BALANCE
  =========================== */
  const adjustBalance = async (type) => {
    if (!balanceAmount || isNaN(balanceAmount)) {
      return alert("Enter valid amount");
    }

    try {
      await adminApi.patch(
        `/admin/users/${editingUser.id}/balance`,
        {
          amount: Number(balanceAmount),
          type, // CREDIT | DEBIT
        }
      );

      fetchUsers();
      setEditingUser(null);
      setBalanceAmount("");
    } catch (err) {
      alert(err.response?.data?.message || "Balance update failed");
    }
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>👑 Admin — Users Control</h2>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Balance</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>

              <td>
                <span style={statusStyle(user.status)}>
                  {user.status}
                </span>
              </td>

              <td>{user.balance}</td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>

              <td>
                {user.status !== "ACTIVE" && (
                  <button
                    onClick={() => updateStatus(user.id, "ACTIVE")}
                  >
                    Activate
                  </button>
                )}

                {user.status !== "SUSPENDED" && (
                  <button
                    onClick={() =>
                      updateStatus(user.id, "SUSPENDED")
                    }
                    style={{ color: "red" }}
                  >
                    Suspend
                  </button>
                )}

                <br />

                <button
                  style={{ marginTop: 6 }}
                  onClick={() => setEditingUser(user)}
                >
                  💰 Adjust Balance
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===========================
          BALANCE MODAL
      =========================== */}
      {editingUser && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3>
              Adjust Balance — {editingUser.username}
            </h3>

            <input
              type="number"
              placeholder="Amount"
              value={balanceAmount}
              onChange={(e) =>
                setBalanceAmount(e.target.value)
              }
            />

            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => adjustBalance("CREDIT")}
              >
                Credit
              </button>

              <button
                onClick={() => adjustBalance("DEBIT")}
              >
                Debit
              </button>
            </div>

            <button
              style={{ marginTop: 10 }}
              onClick={() => setEditingUser(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===========================
   STYLES
=========================== */

const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
  },
  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    background: "#fff",
    padding: 20,
    borderRadius: 6,
    width: 300,
  },
};

const statusStyle = (status) => ({
  padding: "4px 8px",
  borderRadius: 4,
  color: "#fff",
  background:
    status === "ACTIVE"
      ? "green"
      : status === "INACTIVE"
      ? "gray"
      : "red",
});
