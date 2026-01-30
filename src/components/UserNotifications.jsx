import { useEffect, useState } from "react";
import api from "../api/api";
import "./UserNotifications.css"; // Create this CSS file

export default function UserNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="spinner"></div>
        <p>Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notifications-error">
        <div className="error-icon">⚠️</div>
        <div>
          <p className="error-text">{error}</p>
          <button className="retry-btn" onClick={loadNotifications}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="no-notifications">
        <div className="empty-icon">📭</div>
        <div className="empty-content">
          <h4>No notifications yet</h4>
          <p>Admin announcements and updates will appear here</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const hasUnread = unreadCount > 0;

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="header-left">
          <h3 className="notifications-title">
            <span className="title-icon">🔔</span>
            Notifications
            {hasUnread && (
              <span className="unread-count-badge">{unreadCount}</span>
            )}
          </h3>
          <div className="header-stats">
            {notifications.length} total • {unreadCount} unread
          </div>
        </div>
        
        <div className="header-actions">
          {hasUnread && (
            <button 
              className="header-btn mark-all-read-btn"
              onClick={markAllAsRead}
              title="Mark all as read"
            >
              <span className="btn-icon">✓</span>
              Mark all read
            </button>
          )}
          <button 
            className="header-btn clear-all-btn"
            onClick={clearAll}
            title="Clear all notifications"
          >
            <span className="btn-icon">🗑️</span>
            Clear all
          </button>
        </div>
      </div>

      <div className="notifications-list">
        {notifications.slice(0, 10).map(notification => {
          const isUnread = !notification.is_read;
          const isExpanded = expandedId === notification.id;
          const showMore = notification.message?.length > 100;
          
          return (
            <div 
              key={notification.id} 
              className={`notification-item ${isUnread ? 'unread' : ''} ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleExpand(notification.id)}
            >
              <div className="notification-main">
                <div className="notification-icon-container">
                  <div className={`notification-icon ${notification.type}`}>
                    {getNotificationIcon(notification.type, notification.is_welcome_bonus)}
                  </div>
                  {isUnread && <div className="unread-indicator"></div>}
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <div className="notification-title-row">
                      <h4 className="notification-title">
                        {notification.title || "Notification"}
                        {notification.is_important && <span className="important-badge">!</span>}
                      </h4>
                      <div className="notification-actions">
                        {isUnread && (
                          <button 
                            className="action-btn mark-read-btn"
                            onClick={(e) => markAsRead(notification.id, e)}
                            title="Mark as read"
                          >
                            ✓
                          </button>
                        )}
                        <button 
                          className="action-btn remove-btn"
                          onClick={(e) => removeNotification(notification.id, e)}
                          title="Remove notification"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    
                    <div className="notification-meta">
                      <span className="notification-time">
                        {formatTime(notification.created_at)}
                      </span>
                      <span className={`notification-type ${notification.type}`}>
                        {notification.type?.replace('_', ' ') || 'General'}
                      </span>
                      {notification.priority === 'high' && (
                        <span className="priority-badge high">High Priority</span>
                      )}
                    </div>
                  </div>
                  
                  <div className={`notification-message ${isExpanded ? 'expanded' : ''}`}>
                    {notification.message || "No message content"}
                    {showMore && !isExpanded && (
                      <span className="show-more">... Read more</span>
                    )}
                  </div>
                </div>
              </div>
              
              {notification.action_route && (
                <div className="notification-footer">
                  <a 
                    href={notification.action_route}
                    className="action-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="link-icon">→</span>
                    Take action
                  </a>
                  {notification.action_deadline && (
                    <span className="deadline">
                      ⏰ Until {new Date(notification.action_deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {notifications.length > 10 && (
        <div className="notifications-footer">
          <div className="footer-info">
            Showing 10 of {notifications.length} notifications
          </div>
          <button 
            className="view-all-btn"
            onClick={() => window.location.href = "/notifications"}
          >
            <span className="btn-icon">📋</span>
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}