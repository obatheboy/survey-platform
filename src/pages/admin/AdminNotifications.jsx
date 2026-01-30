import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../api/adminApi";
import "./AdminNotifications.css";

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState({ type: "", text: "" });
  
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [viewMode, setViewMode] = useState("send"); // "send" or "manage"
  const [filterType, setFilterType] = useState("");
  const [manageLoading, setManageLoading] = useState(false);

  // ✅ Wrap in useCallback to prevent infinite re-renders
  const loadAllNotifications = useCallback(async () => {
    try {
      setManageLoading(true);
      const params = filterType ? { type: filterType } : {};
      const res = await adminApi.get("/admin/notifications", { params });
      setNotifications(res.data.notifications || []);
      setStats(res.data.stats || null);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setManageLoading(false);
    }
  }, [filterType]); // ✅ Add filterType as dependency

  useEffect(() => {
    if (viewMode === "manage") {
      loadAllNotifications();
    }
  }, [viewMode, loadAllNotifications]); // ✅ Now includes loadAllNotifications

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      setResponse({ type: "error", text: "Title and message are required." });
      return;
    }

    if (!window.confirm("Are you sure you want to send this notification to ALL users?")) {
      return;
    }

    setLoading(true);
    setResponse({ type: "", text: "" });

    try {
      await adminApi.post("/admin/notifications/bulk", { title, message });
      setResponse({ type: "success", text: "Bulk notification sent successfully!" });
      setTitle("");
      setMessage("");
      // Refresh notifications list if in manage mode
      if (viewMode === "manage") {
        loadAllNotifications();
      }
    } catch (err) {
      console.error("Failed to send bulk notification:", err);
      setResponse({
        type: "error",
        text: err.response?.data?.message || "Failed to send notification.",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id, title) => {
    if (!window.confirm(`Delete notification: "${title}"?`)) return;
    
    try {
      await adminApi.delete(`/admin/notifications/${id}`);
      loadAllNotifications(); // Refresh the list
    } catch (err) {
      console.error("Failed to delete notification:", err);
      alert("Failed to delete notification");
    }
  };

  const deleteByType = async (type) => {
    if (!window.confirm(`Delete ALL ${type} notifications?`)) return;
    
    try {
      await adminApi.delete(`/admin/notifications/type/${type}`);
      loadAllNotifications();
    } catch (err) {
      console.error("Failed to delete by type:", err);
    }
  };

  const cleanupOld = async () => {
    const days = prompt("Delete notifications older than how many days?", "30");
    if (!days) return;
    
    if (!window.confirm(`Delete notifications older than ${days} days?`)) return;
    
    try {
      const res = await adminApi.delete(`/admin/notifications/cleanup?days=${days}`);
      alert(res.data.message);
      loadAllNotifications();
    } catch (err) {
      console.error("Failed to cleanup:", err);
    }
  };

  return (
    <div className="admin-notifications-container">
      {/* MODE SWITCHER */}
      <div className="mode-switcher">
        <button 
          className={`mode-btn ${viewMode === "send" ? "active" : ""}`}
          onClick={() => setViewMode("send")}
        >
          📢 Send Notification
        </button>
        <button 
          className={`mode-btn ${viewMode === "manage" ? "active" : ""}`}
          onClick={() => setViewMode("manage")}
        >
          🔔 Manage Notifications
        </button>
      </div>

      {viewMode === "send" ? (
        <>
          <div className="admin-notifications-header">
            <h2>📢 Send Bulk Notification</h2>
            <p>Broadcast a message to all registered users.</p>
          </div>

          <form onSubmit={handleSubmit} className="notification-form">
            {response.text && (
              <div className={`response-message ${response.type === 'success' ? 'success-message' : 'error-message'}`}>
                {response.text}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="title" className="form-label">Notification Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Platform Maintenance Alert"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message" className="form-label">Notification Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter the message you want to send to all users."
                className="form-textarea"
                rows={5}
                required
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Sending..." : "🚀 Send to All Users"}
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="admin-notifications-header">
            <h2>🔔 Manage Notifications</h2>
            <p>View and manage all user notifications</p>
          </div>

          {manageLoading && notifications.length === 0 ? (
            <div className="loading">Loading notifications...</div>
          ) : (
            <>
              {/* Stats Card */}
              {stats && (
                <div className="stats-card">
                  <div className="stat-item">
                    <span className="stat-label">Total</span>
                    <span className="stat-value">{stats.total}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Unread</span>
                    <span className="stat-value">{stats.unread}</span>
                  </div>
                  {Object.entries(stats.byType || {}).map(([type, count]) => (
                    <div className="stat-item" key={type}>
                      <span className="stat-label">{type}</span>
                      <span className="stat-value">{count}</span>
                      <button 
                        className="delete-type-btn"
                        onClick={() => deleteByType(type)}
                        title={`Delete all ${type} notifications`}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Filter */}
              <div className="filter-section">
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Types</option>
                  <option value="bulk">Bulk</option>
                  <option value="admin_bulk">Admin Bulk</option>
                  <option value="welcome_bonus">Welcome Bonus</option>
                </select>
                <button onClick={cleanupOld} className="cleanup-btn">
                  🗑️ Cleanup Old
                </button>
              </div>

              {/* Notifications List */}
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="empty-state">No notifications found</div>
                ) : (
                  notifications.map(notification => (
                    <div key={notification.id} className="notification-item">
                      <div className="notification-header">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-actions">
                          <span className={`type-badge ${notification.type}`}>
                            {notification.type}
                          </span>
                          <button 
                            onClick={() => deleteNotification(notification.id, notification.title)}
                            className="delete-btn"
                            title="Delete this notification"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-footer">
                        <span className="user-info">
                          {notification.user_name || `User ID: ${notification.user_id}`}
                        </span>
                        <span className="time-info">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                        <span className={`read-status ${notification.is_read ? 'read' : 'unread'}`}>
                          {notification.is_read ? '✓ Read' : '● Unread'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="footer-info">
                Showing {notifications.length} notifications
                {filterType && ` (filtered by: ${filterType})`}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}