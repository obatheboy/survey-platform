import { useEffect, useState } from "react";
import api from "../api/api";
import "./UserNotifications.css";

export default function UserNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications");
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

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
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

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(notif => 
          api.patch(`/notifications/${notif.id}/read`)
        )
      );
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const removeNotification = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Remove this notification?")) return;
    
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (err) {
      console.error("Failed to remove notification:", err);
      alert("Failed to remove notification");
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    
    try {
      await api.delete("/notifications/clear");
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      alert("Failed to clear notifications");
    }
  };

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

  const getNotificationIcon = (type, isWelcomeBonus) => {
    const icons = {
      'bulk': '📢',
      'admin_bulk': '👑',
      'welcome_bonus': '🎁',
      'system': '⚙️',
      'payment': '💰',
      'survey': '📝',
      'warning': '⚠️',
      'info': 'ℹ️',
      'success': '✅',
      'error': '❌'
    };
    
    if (isWelcomeBonus) return '🎁';
    return icons[type] || '💬';
  };

  const toggleNotificationExpand = (id, e) => {
    if (e) e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const togglePanelExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (loading) {
    return (
      <div className="notifications-mini-card">
        <div className="notifications-loading">
          <div className="spinner-small"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notifications-mini-card error">
        <div className="error-icon">⚠️</div>
        <span className="error-text">Failed to load</span>
        <button className="retry-btn-small" onClick={loadNotifications}>
          Retry
        </button>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const hasUnread = unreadCount > 0;
  const latestNotification = notifications[0];

  // Mini Card View (Collapsed State)
  if (!isExpanded) {
    return (
      <div className="notifications-mini-card" onClick={togglePanelExpand}>
        <div className="mini-card-header">
          <div className="bell-icon">
            🔔
            {hasUnread && <span className="unread-pulse"></span>}
          </div>
          <div className="mini-card-content">
            <div className="mini-card-title">
              {notifications.length === 0 ? (
                <span className="empty-text">No notifications</span>
              ) : (
                <>
                  <span className="notification-preview">
                    {latestNotification.title || "New notification"}
                  </span>
                  <span className="notification-time">
                    {formatTime(latestNotification.created_at)}
                  </span>
                </>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="mini-card-stats">
                {hasUnread && (
                  <span className="unread-badge-mini">
                    {unreadCount} new
                  </span>
                )}
                <span className="total-count">
                  {notifications.length} total
                </span>
              </div>
            )}
          </div>
          <div className="expand-icon">
            {isExpanded ? '▲' : '▼'}
          </div>
        </div>
      </div>
    );
  }

  // Expanded Panel View
  return (
    <div className="notifications-expanded-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-icon">🔔</span>
          <h3>Notifications</h3>
          {hasUnread && (
            <span className="unread-count">{unreadCount}</span>
          )}
        </div>
        <div className="panel-actions">
          {hasUnread && (
            <button 
              className="panel-btn mark-all-btn"
              onClick={markAllAsRead}
              title="Mark all as read"
            >
              ✓ Mark all
            </button>
          )}
          <button 
            className="panel-btn clear-btn"
            onClick={clearAll}
            title="Clear all notifications"
          >
            🗑️ Clear
          </button>
          <button 
            className="panel-btn collapse-btn"
            onClick={togglePanelExpand}
            title="Collapse"
          >
            ▲
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="panel-content">
        {notifications.length === 0 ? (
          <div className="empty-panel">
            <div className="empty-icon">📭</div>
            <div className="empty-message">
              <h4>No notifications</h4>
              <p>You're all caught up!</p>
            </div>
          </div>
        ) : (
          <div className="notifications-scrollable">
            {notifications.map(notification => {
              const isUnread = !notification.is_read;
              const isExpandedItem = expandedId === notification.id;
              const messagePreview = notification.message?.substring(0, 80) + 
                (notification.message?.length > 80 ? '...' : '');
              
              return (
                <div 
                  key={notification.id} 
                  className={`panel-notification-item ${isUnread ? 'unread' : ''} ${isExpandedItem ? 'expanded' : ''}`}
                >
                  <div className="panel-item-header">
                    <div className="panel-item-icon">
                      {getNotificationIcon(notification.type, notification.is_welcome_bonus)}
                    </div>
                    <div className="panel-item-content">
                      <div className="panel-item-title-row">
                        <h4 className="panel-item-title">
                          {notification.title || "Notification"}
                          {isUnread && <span className="unread-dot"></span>}
                        </h4>
                        <div className="panel-item-actions">
                          {isUnread && (
                            <button 
                              className="action-btn-small mark-btn"
                              onClick={(e) => markAsRead(notification.id, e)}
                              title="Mark as read"
                            >
                              ✓
                            </button>
                          )}
                          <button 
                            className="action-btn-small delete-btn"
                            onClick={(e) => removeNotification(notification.id, e)}
                            title="Delete"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      
                      <div className="panel-item-meta">
                        <span className="panel-item-time">
                          {formatTime(notification.created_at)}
                        </span>
                        <span className={`panel-item-type ${notification.type}`}>
                          {notification.type?.replace('_', ' ') || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="panel-item-body">
                    <p className={`panel-item-message ${isExpandedItem ? 'expanded' : ''}`}>
                      {isExpandedItem ? notification.message : messagePreview}
                      {notification.message?.length > 80 && !isExpandedItem && (
                        <button 
                          className="read-more-btn"
                          onClick={(e) => toggleNotificationExpand(notification.id, e)}
                        >
                          Read more
                        </button>
                      )}
                      {isExpandedItem && notification.message?.length > 80 && (
                        <button 
                          className="read-less-btn"
                          onClick={(e) => toggleNotificationExpand(notification.id, e)}
                        >
                          Show less
                        </button>
                      )}
                    </p>
                    
                    {notification.action_route && (
                      <div className="panel-item-actions-footer">
                        <a 
                          href={notification.action_route}
                          className="action-link-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Take action →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="panel-footer">
          <div className="footer-stats">
            Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            {hasUnread && ` • ${unreadCount} unread`}
          </div>
          {notifications.length > 10 && (
            <button 
              className="view-all-link"
              onClick={() => window.location.href = "/notifications"}
            >
              View all →
            </button>
          )}
        </div>
      )}
    </div>
  );
}