import { useState } from "react";
import { adminApi } from "../../api/adminApi";
import "./AdminNotifications.css";

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState({ type: "", text: "" });

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
      await adminApi.post("/notifications/bulk", { title, message });
      setResponse({ type: "success", text: "Bulk notification sent successfully!" });
      setTitle("");
      setMessage("");
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

  return (
    <div className="admin-notifications-container">
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
    </div>
  );
}