import React, { useState, useRef, useEffect } from "react";
import { chatWazunguApi } from "../api/api";
import { toast } from "react-hot-toast";

const CHATWAZUNGU_GREEN = "#0DAA65";
const CHATWAZUNGU_DARK = "#0A0A0A";
const CHATWAZUNGU_CARD_BG = "#1A1A1A";

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
        <div className="chat-window-header" style={{ backgroundColor: CHATWAZUNGU_DARK }}>
          <div className="chat-profile-info">
            <img
              src={profile.avatar || `https://i.pravatar.cc/48?img=${Math.floor(Math.random() * 70) + 1}`}
              alt={profile.name}
              className="chat-profile-avatar"
            />
            <div>
              <span className="chat-profile-name">{profile.name}</span>
              <span className="chat-profile-details">{profile.age} · {profile.location}</span>
            </div>
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
            style={{ backgroundColor: CHATWAZUNGU_GREEN, opacity: loading || !inputValue.trim() ? 0.5 : 1 }}
          >
            {loading ? "Sending…" : "Send"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .chat-window-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .chat-window-modal {
          background-color: ${CHATWAZUNGU_CARD_BG};
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          border: 1px solid #333;
        }

        .chat-window-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          color: white;
        }

        .chat-profile-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-profile-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid ${CHATWAZUNGU_GREEN};
        }

        .chat-profile-name {
          font-weight: 700;
          font-size: 16px;
          display: block;
          color: white;
        }

        .chat-profile-details {
          font-size: 12px;
          color: #aaa;
          display: block;
        }

        .chat-close-btn {
          background: none;
          border: none;
          color: #aaa;
          font-size: 18px;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .chat-close-btn:hover {
          color: white;
          background-color: #333;
        }

        .chat-messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chat-loading {
          text-align: center;
          color: #888;
          padding: 40px 20px;
        }

        .message-bubble {
          display: flex;
          max-width: 85%;
          gap: 8px;
        }

        .user-message {
          align-self: flex-end;
          justify-content: flex-end;
        }

        .message-avatar {
          flex-shrink: 0;
        }

        .message-avatar-img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .message-content {
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.5;
          position: relative;
        }

        .ai-content {
          background-color: #2A2A2A;
          color: #e0e0e0;
          border-bottom-left-radius: 6px;
          margin-left: 8px;
        }

        .user-content {
          background-color: ${CHATWAZUNGU_GREEN};
          color: white;
          border-bottom-right-radius: 6px;
          margin-right: 8px;
        }

        .message-time {
          display: block;
          font-size: 10px;
          opacity: 0.5;
          margin-top: 4px;
        }

        .chat-input-container {
          display: flex;
          padding: 16px 20px;
          gap: 12px;
          border-top: 1px solid #333;
        }

        .chat-input-field {
          flex: 1;
          background-color: #2A2A2A;
          border: 1px solid #444;
          border-radius: 20px;
          padding: 10px 16px;
          color: white;
          font-size: 14px;
          resize: none;
          outline: none;
          transition: border-color 0.2s;
        }

        .chat-input-field:focus {
          border-color: ${CHATWAZUNGU_GREEN};
        }

        .chat-input-field:disabled {
          opacity: 0.5;
        }

        .chat-send-btn {
          background-color: ${CHATWAZUNGU_GREEN};
          color: white;
          border: none;
          border-radius: 20px;
          padding: 0 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          align-self: center;
        }

        .chat-send-btn:hover:not(:disabled) {
          background-color: #1a8d55;
        }

        .chat-send-btn:disabled {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
