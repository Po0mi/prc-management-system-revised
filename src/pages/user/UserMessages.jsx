import { useState, useEffect } from "react";

import "./UserMessages.scss";

function UserMessages() {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      // TODO: Replace with actual API call
      const mockConversations = [
        {
          id: 1,
          name: "Admin Support",
          lastMessage: "How can I help you today?",
          timestamp: "2026-02-17T10:30:00",
          unread: 2,
          avatar: "A",
        },
        {
          id: 2,
          name: "Event Coordinator",
          lastMessage: "Your registration has been confirmed",
          timestamp: "2026-02-16T15:20:00",
          unread: 0,
          avatar: "E",
        },
      ];
      setConversations(mockConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatTimestamp = (timestamp) => {
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
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      }
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div className="user-messages">
      <div className="container">
        <h1>Messages</h1>

        <div className="messages-layout">
          {/* Conversations List */}
          <div className="conversations-panel">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="conversations-list">
              {filteredConversations.length === 0 ? (
                <div className="empty-state">
                  <p>No conversations found</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${
                      selectedChat?.id === conv.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedChat(conv)}
                  >
                    <div className="avatar">{conv.avatar}</div>
                    <div className="conversation-info">
                      <div className="header">
                        <h4>{conv.name}</h4>
                        <span className="time">
                          {formatTimestamp(conv.timestamp)}
                        </span>
                      </div>
                      <div className="preview">
                        <p>{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                          <span className="unread-badge">{conv.unread}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Box */}
          <div className="chat-panel">
            {selectedChat ? (
              <ChatBox
                recipientId={selectedChat.id}
                recipientName={selectedChat.name}
              />
            ) : (
              <div className="no-chat-selected">
                <div className="icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserMessages;
