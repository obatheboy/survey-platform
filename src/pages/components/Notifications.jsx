// ========================= Notifications.jsx =========================
import { useEffect, useState } from "react";
import api from "../api/api"; // your axios instance
import { useNavigate } from "react-router-dom";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  /* =========================
     FETCH NOTIFICATIONS
  ========================== */
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  /* =========================
     MARK NOTIFICATION READ
  ========================== */
  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification read:", error);
    }
  };

  /* =========================
     HANDLE WITHDRAW FROM NOTIF
  ========================== */
  const handleWithdraw = async (notif) => {
    if (!notif.is_welcome_bonus) return alert("Withdrawal not supported for this notification");

    try {
      await api.post("/withdraw", {
        type: "welcome_bonus",
        amount: notif.amount || 1200, // fallback if amount not provided
        phone_number: notif.phone_number || "", // should ideally be user's saved phone
      });

      alert("🎉 Withdrawal request sent!");
      markRead(notif.id);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to request withdrawal");
    }
  };

  /* =========================
     RENDER
  ========================== */
  return (
    <>
      <div className="notifications-container">
        {notifications.length === 0 && <p style={{ color: "#fff", textAlign: "center" }}>No notifications</p>}

        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`notification-card ${notif.is_read ? "read" : "unread"}`}
          >
            <h3>{notif.title}</h3>
            <p>{notif.message}</p>

            <div className="notification-actions">
              {notif.is_welcome_bonus && (
                <button className="withdraw-btn" onClick={() => handleWithdraw(notif)}>
                  Withdraw
                </button>
              )}

              <button
                className="dashboard-btn"
                onClick={() => {
                  navigate(notif.action_route || "/dashboard");
                  markRead(notif.id);
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* =========================
          STYLES
      ========================== */}
      <style>{`
        .notifications-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 20px;
        }

        .notification-card {
          padding: 16px;
          border-radius: 12px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.15);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
        }

        .notification-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .notification-card.read {
          opacity: 0.6;
        }

        .notification-card h3 {
          margin: 0 0 6px 0;
          font-size: 1.1rem;
        }

        .notification-card p {
          margin: 0;
          font-size: 0.95rem;
        }

        .notification-actions {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }

        .notification-actions button {
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: bold;
        }

        .withdraw-btn {
          background-color: #4ade80;
          color: #000;
          transition: background 0.2s;
        }

        .withdraw-btn:hover {
          background-color: #22c55e;
        }

        .dashboard-btn {
          background-color: #60a5fa;
          color: #fff;
          transition: background 0.2s;
        }

        .dashboard-btn:hover {
          background-color: #2563eb;
        }
      `}</style>
    </>
  );
}
