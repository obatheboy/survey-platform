import { useEffect, useState } from "react";
import api from "../../api/api.js";
import { useNavigate, useLocation } from "react-router-dom";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeNotif, setActiveNotif] = useState(null); // full-screen modal
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleWithdraw = async (notif) => {
    await markRead(notif.id);

    if (notif.type === "welcome_bonus") {
      setActiveNotif({
        message:
          "❌ Your account is not activated. Activate your account with KES 100 to withdraw to M-Pesa",
        goDashboard: false,
        redirect: "/activate?welcome_bonus=1",
      });
      return;
    }

    alert("Withdrawal not supported for this notification.");
  };

  const handleGoDashboard = () => {
    setActiveNotif(null);
    navigate("/dashboard");
  };

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
        /* =========================
           CONTAINER & SCROLL
        ========================== */
        .notifications-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin: 16px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch; /* iOS momentum scroll */
          touch-action: pan-y;
          scroll-behavior: smooth;
        }

        /* =========================
           NOTIFICATION CARD
        ========================== */
        .notification-card {
          padding: 16px;
          border-radius: 12px;
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.15);
          transform: translateZ(0); /* GPU acceleration */
        }

        .notification-card.read {
          opacity: 0.6;
        }

        .notification-card h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .notification-card p {
          font-size: 14px;
          opacity: 0.85;
          line-height: 1.4;
        }

        /* =========================
           ACTION BUTTONS
        ========================== */
        .notification-actions {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .withdraw-btn,
        .dashboard-btn {
          flex: 1 1 auto;
          min-width: 120px;
          padding: 10px 14px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .withdraw-btn {
          background: #f5a623;
          color: #fff;
        }

        .withdraw-btn:hover {
          background: #d48806;
        }

        .dashboard-btn {
          background: #60a5fa;
          color: #fff;
        }

        .dashboard-btn:hover {
          background: #3b82f6;
        }

        /* =========================
           FULL SCREEN NOTIF
        ========================== */
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
          padding: 12px;
        }

        .full-screen-notif .notif-content {
          width: 100%;
          max-width: 420px;
          background: #111;
          color: #fff;
          padding: 24px;
          border-radius: 16px;
          text-align: center;
          line-height: 1.5;
          box-shadow: 0 0 25px #0ff;
          overflow-y: auto;
          max-height: 90vh;
        }

        .full-screen-notif .primary-btn {
          margin-top: 16px;
          width: 100%;
          padding: 12px 0;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          background: #00ffcc;
          color: #000;
          border: none;
          box-shadow: 0 0 12px #00ffcc;
          transition: all 0.2s ease;
        }

        .full-screen-notif .primary-btn:hover {
          filter: brightness(1.1);
        }

        /* =========================
           MOBILE RESPONSIVE
        ========================== */
        @media (max-width: 480px) {
          .notification-card h3 {
            font-size: 15px;
          }

          .notification-card p {
            font-size: 13px;
          }

          .withdraw-btn,
          .dashboard-btn {
            font-size: 13px;
            padding: 10px 12px;
            min-width: 100px;
          }

          .full-screen-notif .notif-content {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
