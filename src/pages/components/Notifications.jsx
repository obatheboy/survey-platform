import { useEffect, useState } from "react";
import api from "../../api/api.js";
import { useNavigate, useLocation } from "react-router-dom";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeNotif, setActiveNotif] = useState(null); // full-screen modal
  const navigate = useNavigate();
  const location = useLocation();

  /* =========================
     🔐 SAFETY GUARD
     Fetch ONLY on /notifications page
  ========================== */
  const isNotificationsPage = location.pathname === "/notifications";

  useEffect(() => {
    if (!isNotificationsPage) return;
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

  /* =========================
     HANDLE WITHDRAW / SHOW FULL-SCREEN NOTIF
  ========================= */
  const handleWithdraw = async (notif) => {
    await markRead(notif.id);

    // ✅ FIXED: welcome bonus redirect includes query param
    if (notif.type === "welcome_bonus") {
      setActiveNotif({
        message: "❌ Your account is not activated. Activate your account with KES 100 to withdraw to M-Pesa",
        goDashboard: false,
        redirect: "/activate?welcome_bonus=1", // <-- fix applied here
      });
      return;
    }

    alert("Withdrawal not supported for this notification.");
  };

  const handleGoDashboard = () => {
    setActiveNotif(null);
    navigate("/dashboard");
  };

  /* =========================
     RENDER
  ========================== */
  if (!isNotificationsPage) return null;

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
            {notif.type === "welcome_bonus" && (
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

      {activeNotif && (
        <div className="full-screen-notif">
          <div className="notif-content">
            <p>{activeNotif.message}</p>
            {activeNotif.goDashboard !== false && (
              <button className="primary-btn" onClick={handleGoDashboard}>
                ⬅ Go to Dashboard
              </button>
            )}
            {activeNotif.redirect && activeNotif.goDashboard === false && (
              <button
                className="primary-btn"
                onClick={() => {
                  const redirect = activeNotif.redirect;
                  setActiveNotif(null);
                  navigate(redirect);
                }}
              >
                Activate
              </button>
            )}
          </div>
        </div>
      )}

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
          background: #f5a623;
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .withdraw-btn:hover {
          background: #d48806;
        }

        .dashboard-btn {
          background: #60a5fa;
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dashboard-btn:hover {
          background: #3b82f6;
        }

        .full-screen-notif {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        .full-screen-notif .notif-content {
          background: #111;
          color: #fff;
          padding: 28px;
          border-radius: 18px;
          max-width: 420px;
          text-align: center;
          line-height: 1.5;
          box-shadow: 0 0 25px #0ff;
        }

        .full-screen-notif .notif-content .primary-btn {
          margin-top: 16px;
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          background: #00ffcc;
          color: #000;
          border: none;
          box-shadow: 0 0 12px #00ffcc;
        }
      `}</style>
    </div>
  );
}
