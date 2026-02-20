// src/components/FloatingChat.jsx
import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase/config";
import { signInAnonymously } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import {
  subscribeToConversations,
  getOrCreateConversation,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
} from "../services/chatService";
import { uploadChatFile, getFileDownloadUrl } from "../services/chatUploadApi";
import api from "../services/api";
import "./FloatingChat.scss";

function FloatingChat({ userRole = "user", currentUserId, currentUserName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserList, setShowUserList] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authError, setAuthError] = useState(null);

  // ChatBox states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Sign in to Firebase
  useEffect(() => {
    const signInToFirebase = async () => {
      try {
        console.log("Signing in to Firebase...");
        const result = await signInAnonymously(auth);
        setFirebaseUser(result.user);
        console.log("Firebase user:", result.user.uid);
        setIsLoading(false);
      } catch (error) {
        console.error("Firebase auth error:", error);
        setAuthError(error.message);
        setIsLoading(false);
      }
    };

    signInToFirebase();
  }, []);

  // Initialize user in Firestore
  useEffect(() => {
    const initializeUser = async () => {
      if (!firebaseUser || !currentUserId) {
        return;
      }

      try {
        console.log("Initializing user in Firestore...");
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            userId: currentUserId,
            firebaseUid: firebaseUser.uid,
            name: currentUserName || "User",
            role: userRole,
            createdAt: new Date(),
            lastActive: new Date(),
          });
          console.log("User created in Firestore");
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      }
    };

    initializeUser();
  }, [firebaseUser, currentUserId, currentUserName, userRole]);

  // Subscribe to conversations
  useEffect(() => {
    if (!firebaseUser) return;

    console.log(
      "Subscribing to conversations for Firebase user:",
      firebaseUser.uid,
    );

    const unsubscribe = subscribeToConversations(firebaseUser.uid, (convs) => {
      console.log("Received conversations:", convs);
      setConversations(convs);
      const totalUnread = convs.reduce(
        (sum, conv) => sum + (conv.unread || 0),
        0,
      );
      setUnreadCount(totalUnread);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  // Subscribe to messages when a chat is selected
  useEffect(() => {
    if (!selectedChat?.conversationId || !firebaseUser) return;

    console.log(
      "Subscribing to messages for conversation:",
      selectedChat.conversationId,
    );

    const unsubscribe = subscribeToMessages(
      selectedChat.conversationId,
      (msgs) => {
        console.log("Received messages:", msgs);
        setMessages(msgs);

        if (msgs.length > 0) {
          markMessagesAsRead(
            selectedChat.conversationId,
            firebaseUser.uid,
          ).catch((err) =>
            console.error("Error marking messages as read:", err),
          );
        }
      },
    );

    inputRef.current?.focus();

    return () => unsubscribe();
  }, [selectedChat?.conversationId, firebaseUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Fetch available users from PHP backend
  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get("/api/users.php");

      if (response.data?.success) {
        const allUsers = response.data.users || [];

        const filtered = allUsers
          .filter((u) => u.user_id.toString() !== currentUserId?.toString())
          .map((u) => ({
            user_id: u.user_id,
            full_name: u.full_name,
            role: u.role,
          }));

        setAvailableUsers(filtered);
      } else {
        // Fallback mock data if API fails
        const mockUsers = [
          { user_id: 2, full_name: "Admin User", role: "admin" },
          { user_id: 3, full_name: "Safety Admin", role: "safety_admin" },
          { user_id: 4, full_name: "Health Admin", role: "health_admin" },
          { user_id: 5, full_name: "Welfare Admin", role: "welfare_admin" },
          { user_id: 6, full_name: "Disaster Admin", role: "disaster_admin" },
          { user_id: 7, full_name: "Youth Admin", role: "youth_admin" },
        ];

        const filtered = mockUsers.filter(
          (u) => u.user_id.toString() !== currentUserId?.toString(),
        );
        setAvailableUsers(filtered);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // Fallback mock data
      const mockUsers = [
        { user_id: 2, full_name: "Admin User", role: "admin" },
        { user_id: 3, full_name: "Safety Admin", role: "safety_admin" },
        { user_id: 4, full_name: "Health Admin", role: "health_admin" },
      ];

      const filtered = mockUsers.filter(
        (u) => u.user_id.toString() !== currentUserId?.toString(),
      );
      setAvailableUsers(filtered);
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
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
    try {
      if (!firebaseUser) {
        console.error("No Firebase user");
        return;
      }

      console.log("Selecting user:", user);
      setShowUserList(false);
      setLoadingUsers(true);

      const conversation = await getOrCreateConversation(
        firebaseUser.uid,
        user.user_id.toString(),
      );

      console.log("Conversation created/retrieved:", conversation);

      setSelectedChat({
        conversationId: conversation.id,
        recipientId: user.user_id,
        recipientName: user.full_name,
      });

      setIsMinimized(false);
      setLoadingUsers(false);
    } catch (error) {
      console.error("Error creating conversation:", error);
      setLoadingUsers(false);
    }
  };

  const handleSelectChat = async (conv) => {
    console.log("Selecting existing chat:", conv);
    setSelectedChat({
      conversationId: conv.id,
      recipientId: conv.otherUser.user_id,
      recipientName: conv.otherUser.full_name,
    });
    setIsMinimized(false);
    setShowUserList(false);
  };

  const handleCloseChat = () => {
    setSelectedChat(null);
    setIsMinimized(true);
    setMessages([]);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
    setShowUserList(false);
    setMessages([]);
  };

  // Chat functions
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !selectedChat) return;

    setSending(true);
    try {
      await sendMessage(
        selectedChat.conversationId,
        firebaseUser.uid,
        selectedChat.recipientId.toString(),
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
    if (!file || !selectedChat) return;

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
          firebaseUser.uid,
          selectedChat.recipientId.toString(),
          `Sent a file: ${result.fileName}`,
          "file",
          result.fileUrl,
        );
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
      fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

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
    const messageDate = new Date(date);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const renderMessage = (msg, index) => {
    const isCurrentUser = msg.senderId === firebaseUser?.uid;
    const showDate =
      index === 0 ||
      !messages[index - 1]?.createdAt ||
      formatDate(new Date(msg.createdAt)) !==
        formatDate(new Date(messages[index - 1].createdAt));

    return (
      <div key={msg.id}>
        {showDate && (
          <div className="chat-date-divider">
            <span>{formatDate(new Date(msg.createdAt))}</span>
          </div>
        )}
        <div className={`message-wrapper ${isCurrentUser ? "own" : "other"}`}>
          <div
            className={`message-bubble ${msg.messageType === "file" ? "file-message" : ""}`}
          >
            {msg.messageType === "file" ? (
              <div className="file-attachment">
                <i className="fa-solid fa-paperclip"></i>
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
                ></i>
              )}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="floating-chat-button" onClick={toggleChat}>
        <div className="chat-icon">⏳</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="floating-chat-button" onClick={toggleChat}>
        <div className="chat-icon">❌</div>
      </div>
    );
  }

  if (!firebaseUser || !currentUserId) {
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
        <div
          className={`floating-chat-window ${isMinimized ? "minimized" : "expanded"}`}
        >
          {selectedChat ? (
            // Chat View (messages)
            <div className="chat-view">
              <div className="chat-header">
                <div className="chat-header-info">
                  <button className="back-btn" onClick={handleBackToList}>
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>
                  <div className="chat-avatar">
                    {selectedChat.recipientName?.charAt(0).toUpperCase()}
                  </div>
                  <h3>{selectedChat.recipientName}</h3>
                </div>
                <button className="chat-close-btn" onClick={handleCloseChat}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <i className="fa-regular fa-message"></i>
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
                  ></i>
                </button>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || uploading}
                >
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </form>
            </div>
          ) : showUserList ? (
            // User List View (select user to chat with)
            <div className="conversations-view">
              <div className="chat-header">
                <button
                  className="back-btn"
                  onClick={() => setShowUserList(false)}
                >
                  <i className="fa-solid fa-arrow-left"></i>
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
                    <i className="fa-solid fa-spinner fa-spin"></i>
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
            // Conversations List View
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
                <i className="fa-solid fa-plus"></i> New Chat
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
