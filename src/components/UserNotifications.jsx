import { useEffect, useState } from "react";
import api from "../api/api";

export default function UserNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      // ✅ Handle both response formats:
      // Format 1: { success: true, notifications: [...] }
      // Format 2: Direct array [...]
      const notificationsData = res.data.notifications || res.data || [];
      setNotifications(notificationsData);
      setError("");
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      // ✅ Use PATCH instead of PUT (matches your route)
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const clearAll = async () => {
    try {
      // ✅ Use DELETE /notifications/clear (not /clear)
      await api.delete("/notifications/clear");
      setNotifications([]);
      // Show success message
      alert("All notifications cleared successfully!");
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      alert("Failed to clear notifications. Please try again.");
    }
  };

  // Helper function to format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="loading-spinner-small"></div>
        <p>Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notifications-error">
        <p>⚠️ {error}</p>
        <button onClick={loadNotifications}>Retry</button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="no-notifications">
        <div className="empty-state-icon">📭</div>
        <p>No notifications yet</p>
        <p className="empty-state-sub">Admin announcements will appear here</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="notifications-title">
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
        </div>
        {notifications.length > 0 && (
          <button 
            className="clear-all-btn" 
            onClick={() => {
              if (window.confirm("Are you sure you want to clear all notifications?")) {
                clearAll();
              }
            }}
          >
            Clear All
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.slice(0, 5).map(notification => (
          <div 
            key={notification.id} 
            className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
            onClick={() => !notification.is_read && markAsRead(notification.id)}
            style={{ cursor: !notification.is_read ? 'pointer' : 'default' }}
          >
            <div className="notification-icon">
              {notification.type === 'bulk' ? '📢' : 
               notification.type === 'admin_bulk' ? '👑' : 
               notification.type === 'welcome_bonus' ? '🎁' : 
               notification.is_welcome_bonus ? '🎁' : '💬'}
            </div>
            <div className="notification-content">
              <div className="notification-title-row">
                <span className="notification-title">
                  {notification.title || "Notification"}
                </span>
                {!notification.is_read && <span className="unread-dot"></span>}
              </div>
              <div className="notification-message">
                {notification.message || "No message"}
              </div>
              <div className="notification-meta">
                <span className="notification-time">
                  {formatTime(notification.created_at)}
                </span>
                {notification.type && (
                  <span className={`notification-type badge-${notification.type}`}>
                    {notification.type.replace('_', ' ')}
                  </span>
                )}
                {notification.action_route && (
                  <a 
                    href={notification.action_route} 
                    className="notification-action"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {notifications.length > 5 && (
        <div className="notifications-footer">
          <button 
            className="view-all-btn"
            onClick={() => window.location.href = "/notifications"}
          >
            View all ({notifications.length})
          </button>
        </div>
      )}
    </div>
  );
}