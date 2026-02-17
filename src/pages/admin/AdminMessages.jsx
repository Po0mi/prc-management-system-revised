import { useState, useEffect } from 'react';
import ChatBox from '../../components/ChatBox';
import './AdminMessages.scss';

function AdminMessages() {
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, []);

  const fetchConversations = async () => {
    try {
      // TODO: Replace with actual API call
      const mockConversations = [
        {
          id: 1,
          userId: 101,
          name: 'John Doe',
          role: 'Volunteer',
          lastMessage: 'Thank you for the information',
          timestamp: '2026-02-17T10:30:00',
          unread: 0,
          avatar: 'J',
        },
        {
          id: 2,
          userId: 102,
          name: 'Jane Smith',
          role: 'Member',
          lastMessage: 'When is the next event?',
          timestamp: '2026-02-16T15:20:00',
          unread: 1,
          avatar: 'J',
        },
      ];
      setConversations(mockConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      // TODO: Replace with actual API call to get all users
      const mockUsers = [
        { id: 101, name: 'John Doe', role: 'Volunteer' },
        { id: 102, name: 'Jane Smith', role: 'Member' },
        { id: 103, name: 'Bob Johnson', role: 'Volunteer' },
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const startNewChat = (user) => {
    setSelectedChat({
      id: Date.now(),
      userId: user.id,
      name: user.name,
      role: user.role,
      avatar: user.name.charAt(0),
    });
    setShowNewChat(false);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="admin-messages">
      <div className="messages-header">
        <h1>Messages</h1>
        <button className="btn-new-chat" onClick={() => setShowNewChat(!showNewChat)}>
          + New Message
        </button>
      </div>

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

          {showNewChat && (
            <div className="new-chat-section">
              <h4>Start New Conversation</h4>
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="user-item"
                  onClick={() => startNewChat(user)}
                >
                  <div className="avatar">{user.name.charAt(0)}</div>
                  <div className="user-info">
                    <h5>{user.name}</h5>
                    <span className="role">{user.role}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="conversations-list">
            {filteredConversations.length === 0 ? (
              <div className="empty-state">
                <p>No conversations yet</p>
                <button onClick={() => setShowNewChat(true)}>Start a conversation</button>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-item ${
                    selectedChat?.id === conv.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedChat(conv)}
                >
                  <div className="avatar">{conv.avatar}</div>
                  <div className="conversation-info">
                    <div className="header">
                      <div>
                        <h4>{conv.name}</h4>
                        <span className="role">{conv.role}</span>
                      </div>
                      <span className="time">{formatTimestamp(conv.timestamp)}</span>
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
              recipientId={selectedChat.userId}
              recipientName={selectedChat.name}
              onClose={() => setSelectedChat(null)}
            />
          ) : (
            <div className="no-chat-selected">
              <div className="icon">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose a conversation or start a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminMessages;
