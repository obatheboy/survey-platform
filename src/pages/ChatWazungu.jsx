import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function ChatWazungu() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await api.get("/chat/messages");
      setMessages(res.data.messages || []);
    } catch {
      setMessages([
        { id: 1, sender: "support", text: "👋 Hello! Welcome to Chat Wazungu support. How can I help you today?", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        { id: 2, sender: "support", text: "I can help you with survey earnings, withdrawals, account activation, and more.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: input,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setLoading(true);
    try {
      await api.post("/chat/send", { message: input });
      const reply = {
        id: Date.now() + 1,
        sender: "support",
        text: "Thanks for your message! Our support team will get back to you shortly.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setTimeout(() => setMessages((prev) => [...prev, reply]), 1500);
    } catch {
      const reply = {
        id: Date.now() + 1,
        sender: "support",
        text: "We're having trouble connecting. Please try again later.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setTimeout(() => setMessages((prev) => [...prev, reply]), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-wazungu-page">
      <div className="chat-header">
        <button
          onClick={() => navigate("/dashboard")}
          className="chat-back-btn"
        >
          ← Back
        </button>
        <div className="chat-title">
          <span style={{ fontSize: "24px", marginRight: "8px" }}>💬</span>
          <span>Chat Wazungu</span>
        </div>
      </div>

      <div className="chat-messages" ref={messagesEndRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.sender}`}
          >
            <div className="chat-bubble">{msg.text}</div>
            <div className="chat-time">{msg.time}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-message support">
            <div className="chat-bubble">Typing…</div>
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <form onSubmit={sendMessage} className="chat-form">
          <input
            type="text"
            placeholder="Type your message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="chat-input"
          />
          <button type="submit" disabled={loading || !input.trim()} className="chat-send-btn">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
