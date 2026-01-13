import { useEffect, useState } from "react";
import api from "../../api/api.js";
import { useNavigate, useLocation } from "react-router-dom";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  /* =========================
     🔐 SAFETY GUARD
     Fetch ONLY on /notifications page
  ========================= */
  const isNotificationsPage = location.pathname === "/notifications";

  useEffect(() => {
    if (!isNotificationsPage) return; // 🚫 critical fix
    fetchNotifications();
  }, [isNotificationsPage]);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

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

  const handleWithdraw = async (notif) => {
    // Not activated → go activate
    if (!notif.is_activated) {
      navigate("/activation?welcome_bonus=true");
      return;
    }

    // Welcome bonus → dashboard handles withdrawal
    if (notif.type === "welcome_bonus") {
      await markRead(notif.id);
      navigate("/dashboard");
      return;
    }

    alert("Withdrawal not supported for this notification.");
  };

  /* =========================
     RENDER
  ========================= */
  if (!isNotificationsPage) return null; // 🚫 never render elsewhere

  return (
    <div className="notifications-container">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`notification-card ${notif.is_read ? "read" : "unread"}`}
        >
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>

          <div className="notification-actions">
            {notif.is_welcome_bonus && (
              <button
                className="withdraw-btn"
                onClick={() => handleWithdraw(notif)}
              >
                Withdraw
              </button>
            )}

            <button
              className="dashboard-btn"
              onClick={() => navigate(notif.action_route || "/dashboard")}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      ))}

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
        }

        .notification-card.read {
          opacity: 0.6;
        }

        .notification-actions {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }

        .withdraw-btn {
          background: #4ade80;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
        }

        .dashboard-btn {
          background: #60a5fa;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
