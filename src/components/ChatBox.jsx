import { useState, useEffect, useRef } from "react";
import authService from "../services/auth.service";
import "./styles/ChatBox.scss";

function ChatBox({ recipientId, recipientName, onClose, compact = false }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `http://localhost/prc-management-system/backend/api/messages.php?recipient=${recipientId}`,
      );
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost/prc-management-system/backend/api/messages.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient_id: recipientId,
            content: newMessage,
          }),
        },
      );

      if (response.ok) {
        setNewMessage("");
        fetchMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  };

  return (
    <div className={`chat-box ${compact ? "compact" : ""}`}>
      <div className="chat-header">
        <div className="recipient-info">
          <div className="avatar">{recipientName?.charAt(0) || "?"}</div>
          <div className="details">
            <h3>{recipientName || "Unknown"}</h3>
            <span className="status online">Online</span>
          </div>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.message_id}
              className={`message ${
                message.sender_id === currentUser?.user_id ? "sent" : "received"
              }`}
            >
              <div className="message-content">
                <p>{message.content}</p>
                <span className="timestamp">{formatTime(message.sent_at)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !newMessage.trim()}>
          {loading ? "⏳" : "📤"}
        </button>
      </form>
    </div>
  );
}

export default ChatBox;
