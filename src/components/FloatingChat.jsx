// src/components/FloatingChat.jsx
import { useState, useEffect, useRef } from "react";
import { auth } from "../firebase/config";
import { signInAnonymously } from "firebase/auth";
import {
  registerUser,
  getOrCreateConversation,
  sendMessage,
  subscribeToMessages,
  subscribeToConversations,
  markMessagesAsRead,
} from "../services/chatService";
import { uploadChatFile, getFileDownloadUrl } from "../services/chatUploadApi";
import api from "../services/api";
import "./FloatingChat.scss";

function FloatingChat({ userRole = "user", currentUserId, currentUserName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserList, setShowUserList] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [authError, setAuthError] = useState(null);

  // ChatBox states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // myPhpId is the PHP user_id as a string — this is our consistent identifier
  const myPhpId = currentUserId?.toString();

  // ── FIREBASE AUTH + USER REGISTRATION ──────────────────────────────────────
  // We sign in anonymously just to satisfy Firebase security rules.
  // We do NOT use the Firebase UID for conversations — PHP user_id is used instead.
  useEffect(() => {
    if (!myPhpId) return;

    const init = async () => {
      try {
        const result = await signInAnonymously(auth);
        // Register this user in Firestore userRegistry so others can look them up
        await registerUser(result.user.uid, myPhpId, currentUserName, userRole);
        setIsLoading(false);
      } catch (error) {
        console.error("Firebase auth error:", error);
        setAuthError(error.message);
        setIsLoading(false);
      }
    };

    init();
  }, [myPhpId, currentUserName, userRole]);

  // ── SUBSCRIBE TO CONVERSATIONS (keyed by PHP user ID) ──────────────────────
  useEffect(() => {
    if (!myPhpId || isLoading) return;

    const unsubscribe = subscribeToConversations(myPhpId, (convs) => {
      setConversations(convs);
      const totalUnread = convs.reduce((sum, c) => sum + (c.unread || 0), 0);
      setUnreadCount(totalUnread);
    });

    return () => unsubscribe();
  }, [myPhpId, isLoading]);

  // ── SUBSCRIBE TO MESSAGES ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedChat?.conversationId || !myPhpId) return;

    const unsubscribe = subscribeToMessages(
      selectedChat.conversationId,
      (msgs) => {
        setMessages(msgs);
        if (msgs.length > 0) {
          markMessagesAsRead(selectedChat.conversationId, myPhpId).catch(
            console.error,
          );
        }
      },
    );

    inputRef.current?.focus();
    return () => unsubscribe();
  }, [selectedChat?.conversationId, myPhpId]);

  // ── SCROLL TO BOTTOM ──────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      100,
    );
  }, [messages]);

  // ── FETCH AVAILABLE USERS ─────────────────────────────────────────────────
  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get("/api/users.php");
      if (response.data?.success) {
        const filtered = (response.data.users || [])
          .filter((u) => u.user_id.toString() !== myPhpId)
          .map((u) => ({
            user_id: u.user_id,
            full_name: u.full_name,
            role: u.role,
          }));
        setAvailableUsers(filtered);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  const toggleChat = () => {
    setIsOpen((o) => !o);
    if (isOpen) {
      setShowUserList(false);
      setSelectedChat(null);
      setMessages([]);
    }
  };

  const handleNewChat = () => {
    fetchAvailableUsers();
    setShowUserList(true);
    setSelectedChat(null);
    setMessages([]);
  };

  const handleSelectUser = async (user) => {
    if (!myPhpId) return;
    setShowUserList(false);
    setLoadingUsers(true);
    try {
      // Both sides use PHP user IDs — conversation will be found by either user
      const conversation = await getOrCreateConversation(
        myPhpId,
        user.user_id.toString(),
      );
      setSelectedChat({
        conversationId: conversation.id,
        recipientId: user.user_id.toString(),
        recipientName: user.full_name,
      });
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSelectChat = (conv) => {
    setSelectedChat({
      conversationId: conv.id,
      recipientId: conv.otherUser.user_id.toString(),
      recipientName: conv.otherUser.full_name,
    });
    setShowUserList(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !selectedChat || !myPhpId) return;

    setSending(true);
    try {
      await sendMessage(
        selectedChat.conversationId,
        myPhpId, // sender PHP ID
        selectedChat.recipientId, // recipient PHP ID
        newMessage.trim(),
        "text",
        null,
      );
      setNewMessage("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedChat || !myPhpId) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Max size is 10MB.");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadChatFile(file);
      if (result.success) {
        await sendMessage(
          selectedChat.conversationId,
          myPhpId,
          selectedChat.recipientId,
          `Sent a file: ${result.fileName}`,
          "file",
          result.fileUrl,
        );
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // ── HELPERS ───────────────────────────────────────────────────────────────
  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const d = new Date(date);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderMessage = (msg, index) => {
    const isCurrentUser = msg.senderId === myPhpId;
    const showDate =
      index === 0 ||
      !messages[index - 1]?.createdAt ||
      formatDate(msg.createdAt) !== formatDate(messages[index - 1].createdAt);

    return (
      <div key={msg.id}>
        {showDate && (
          <div className="chat-date-divider">
            <span>{formatDate(msg.createdAt)}</span>
          </div>
        )}
        <div className={`message-wrapper ${isCurrentUser ? "own" : "other"}`}>
          <div
            className={`message-bubble ${msg.messageType === "file" ? "file-message" : ""}`}
          >
            {msg.messageType === "file" ? (
              <div className="file-attachment">
                <i className="fa-solid fa-paperclip" />
                <a
                  href={getFileDownloadUrl(msg.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  {msg.content.replace("Sent a file: ", "")}
                </a>
              </div>
            ) : (
              <p>{msg.content}</p>
            )}
            <span className="message-time">
              {formatTime(msg.createdAt)}
              {isCurrentUser && (
                <i
                  className={`fa-solid ${msg.read ? "fa-check-double" : "fa-check"}`}
                />
              )}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ── RENDER STATES ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="floating-chat-button" onClick={toggleChat}>
        <div className="chat-icon">⏳</div>
      </div>
    );
  }

  if (authError || !myPhpId) {
    return null;
  }

  return (
    <>
      <div className="floating-chat-button" onClick={toggleChat}>
        <div className="chat-icon">💬</div>
        {unreadCount > 0 && (
          <div className="notification-badge">{unreadCount}</div>
        )}
      </div>

      {isOpen && (
        <div className="floating-chat-window expanded">
          {selectedChat ? (
            // ── CHAT VIEW ──────────────────────────────────────────────────
            <div className="chat-view">
              <div className="chat-header">
                <div className="chat-header-info">
                  <button
                    className="back-btn"
                    onClick={() => {
                      setSelectedChat(null);
                      setMessages([]);
                    }}
                  >
                    <i className="fa-solid fa-arrow-left" />
                  </button>
                  <div className="chat-avatar">
                    {selectedChat.recipientName?.charAt(0).toUpperCase()}
                  </div>
                  <h3>{selectedChat.recipientName}</h3>
                </div>
                <button
                  className="chat-close-btn"
                  onClick={() => {
                    setSelectedChat(null);
                    setIsOpen(false);
                    setMessages([]);
                  }}
                >
                  <i className="fa-solid fa-times" />
                </button>
              </div>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <i className="fa-regular fa-message" />
                    <p>No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => renderMessage(msg, index))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input" onSubmit={handleSendMessage}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sending || uploading}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                />
                <button
                  type="button"
                  className="file-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || sending}
                >
                  <i
                    className={`fa-solid ${uploading ? "fa-spinner fa-spin" : "fa-paperclip"}`}
                  />
                </button>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || uploading}
                >
                  <i className="fa-solid fa-paper-plane" />
                </button>
              </form>
            </div>
          ) : showUserList ? (
            // ── USER LIST VIEW ─────────────────────────────────────────────
            <div className="conversations-view">
              <div className="chat-header">
                <button
                  className="back-btn"
                  onClick={() => setShowUserList(false)}
                >
                  <i className="fa-solid fa-arrow-left" />
                </button>
                <h3>Select User</h3>
                <button
                  className="minimize-btn"
                  onClick={() => setIsOpen(false)}
                >
                  ✕
                </button>
              </div>
              <div className="conversations-list">
                {loadingUsers ? (
                  <div className="empty-state">
                    <i className="fa-solid fa-spinner fa-spin" />
                    <p>Loading users...</p>
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="empty-state">
                    <p>No other users available</p>
                  </div>
                ) : (
                  availableUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className="conversation-item"
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="avatar">
                        {user.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="conversation-info">
                        <h4>{user.full_name}</h4>
                        <p>{user.role}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            // ── CONVERSATIONS LIST VIEW ────────────────────────────────────
            <div className="conversations-view">
              <div className="chat-header">
                <h3>Messages</h3>
                <button
                  className="minimize-btn"
                  onClick={() => setIsOpen(false)}
                >
                  ✕
                </button>
              </div>
              <button className="new-chat-btn" onClick={handleNewChat}>
                <i className="fa-solid fa-plus" /> New Chat
              </button>
              <div className="conversations-list">
                {conversations.length === 0 ? (
                  <div className="empty-state">
                    <p>No conversations yet</p>
                    <button className="start-chat-btn" onClick={handleNewChat}>
                      Start a new chat
                    </button>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="conversation-item"
                      onClick={() => handleSelectChat(conv)}
                    >
                      <div className="avatar">
                        {conv.otherUser?.full_name?.charAt(0).toUpperCase() ||
                          "?"}
                      </div>
                      <div className="conversation-info">
                        <h4>{conv.otherUser?.full_name || "Unknown User"}</h4>
                        <p className="last-message">
                          {conv.lastMessage || "No messages yet"}
                        </p>
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
