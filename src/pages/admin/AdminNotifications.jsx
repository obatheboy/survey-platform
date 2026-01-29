import { useState } from "react";
import { adminApi } from "../../api/adminApi";

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
      await adminApi.post("/admin/notifications/bulk", { title, message });
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
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>📢 Send Bulk Notification</h2>
        <p style={styles.subheader}>
          Broadcast a message to all registered users.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {response.text && (
          <div
            style={{
              ...styles.responseBox,
              background: response.type === "success" ? "#d1fae5" : "#fee2e2",
              color: response.type === "success" ? "#065f46" : "#991b1b",
              borderColor: response.type === "success" ? "#a7f3d0" : "#fecaca",
            }}
          >
            {response.text}
          </div>
        )}

        <div style={styles.formGroup}>
          <label htmlFor="title" style={styles.label}>Notification Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Platform Maintenance Alert"
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="message" style={styles.label}>Notification Message</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter the message you want to send to all users."
            style={{ ...styles.input, height: 120, resize: 'vertical' }}
            rows={5}
            required
          />
        </div>

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Sending..." : "🚀 Send to All Users"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { padding: "24px", background: "#f9fafb", minHeight: "100vh" },
  header: { marginBottom: "24px" },
  subheader: { color: "#6b7280" },
  form: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
    maxWidth: "700px",
  },
  formGroup: { marginBottom: "20px" },
  label: { display: "block", fontWeight: "600", marginBottom: "8px", color: "#374151" },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "16px",
  },
  responseBox: {
    padding: "14px",
    marginBottom: "16px",
    borderRadius: "8px",
    fontWeight: "600",
    border: "1px solid",
  },
};