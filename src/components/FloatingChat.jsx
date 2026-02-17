import { useState, useEffect } from 'react';
import ChatBox from './ChatBox';
import './FloatingChat.scss';

function FloatingChat({ userRole = 'user' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchConversations();
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      // TODO: Replace with actual API call
      const mockConversations = userRole === 'admin' 
        ? [
            {
              id: 1,
              userId: 101,
              name: 'John Doe',
              lastMessage: 'Thank you!',
              timestamp: new Date().toISOString(),
              unread: 1,
              avatar: 'J',
            },
            {
              id: 2,
              userId: 102,
              name: 'Jane Smith',
              lastMessage: 'When is the next event?',
              timestamp: new Date().toISOString(),
              unread: 0,
              avatar: 'J',
            },
          ]
        : [
            {
              id: 1,
              name: 'Admin Support',
              lastMessage: 'How can I help you?',
              timestamp: new Date().toISOString(),
              unread: 2,
              avatar: 'A',
            },
          ];
      
      setConversations(mockConversations);
      const totalUnread = mockConversations.reduce((sum, conv) => sum + conv.unread, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setSelectedChat(null);
  };

  const handleSelectChat = (conv) => {
    setSelectedChat(conv);
    setIsMinimized(false);
  };

  const handleCloseChat = () => {
    setSelectedChat(null);
    setIsMinimized(true);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="floating-chat-button" onClick={toggleChat}>
        <div className="chat-icon">💬</div>
        {unreadCount > 0 && (
          <div className="notification-badge">{unreadCount}</div>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className={`floating-chat-window ${isMinimized ? 'minimized' : 'expanded'}`}>
          {selectedChat ? (
            // Full Chat View
            <div className="chat-view">
              <ChatBox
                recipientId={selectedChat.userId || selectedChat.id}
                recipientName={selectedChat.name}
                onClose={handleCloseChat}
              />
            </div>
          ) : (
            // Conversations List View
            <div className="conversations-view">
              <div className="chat-header">
                <h3>Messages</h3>
                <button className="minimize-btn" onClick={() => setIsOpen(false)}>
                  ✕
                </button>
              </div>

              <div className="conversations-list">
                {conversations.length === 0 ? (
                  <div className="empty-state">
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="conversation-item"
                      onClick={() => handleSelectChat(conv)}
                    >
                      <div className="avatar">{conv.avatar}</div>
                      <div className="conversation-info">
                        <h4>{conv.name}</h4>
                        <p>{conv.lastMessage}</p>
                      </div>
                      {conv.unread > 0 && (
                        <span className="unread-badge">{conv.unread}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default FloatingChat;
