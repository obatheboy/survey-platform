import { useState, useRef, useEffect } from "react";
import { chatWazunguApi } from "../api/api";
import { toast } from "react-hot-toast";
import "./ChatWindow.css";

export default function ChatWindow({ profile, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await chatWazunguApi.getChatMessages(profile.id);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
      toast.error("Failed to load chat history");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    if (loading) return;

    const userMsg = {
      role: "user",
      content: inputValue,
      message_id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const res = await chatWazunguApi.sendChatMessage(profile.id, inputValue);
      if (res.data.ai_response) {
        setMessages((prev) => [...prev, res.data.ai_response]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <div className="chat-window-overlay">
      <div className="chat-window-modal">
        <div className="chat-window-header">
          <div className="chat-profile-info">
            <img
              src={profile.avatar || `https://i.pravatar.cc/48?img=${Math.floor(Math.random() * 70) + 1}`}
              alt="profile"
              className="chat-profile-avatar"
            />
            <span className="chat-profile-details">📍 {profile.location}</span>
          </div>
          <button className="chat-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="chat-messages-container">
          {initialLoading ? (
            <div className="chat-loading">Loading conversation...</div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.message_id || msg.timestamp}
                  className={`message-bubble ${msg.role === "ai" ? "ai-message" : "user-message"}`}
                >
                  {msg.role === "ai" && (
                    <div className="message-avatar">
                      <img
                        src={profile.avatar || "https://i.pravatar.cc/32"}
                        alt="AI"
                        className="message-avatar-img"
                      />
                    </div>
                  )}
                  <div className={`message-content ${msg.role === "ai" ? "ai-content" : "user-content"}`}>
                    {msg.content}
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="chat-input-container">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message here..."
            className="chat-input-field"
            disabled={loading}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={loading || !inputValue.trim()}
            className="chat-send-btn"
          >
            {loading ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
