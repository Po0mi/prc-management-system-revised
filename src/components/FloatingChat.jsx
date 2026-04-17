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

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploadState, setUploadState] = useState(null); // { name, preview, file, mime }
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const myPhpId = currentUserId?.toString();

  // ── FIREBASE INIT ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!myPhpId) return;
    const init = async () => {
      try {
        const result = await signInAnonymously(auth);
        await registerUser(result.user.uid, myPhpId, currentUserName, userRole);
        setIsLoading(false);
      } catch (err) {
        console.error("Firebase auth error:", err);
        setAuthError(err.message);
        setIsLoading(false);
      }
    };
    init();
  }, [myPhpId, currentUserName, userRole]);

  // ── CONVERSATIONS SUBSCRIPTION ─────────────────────────────────────────────
  useEffect(() => {
    if (!myPhpId || isLoading) return;
    const unsub = subscribeToConversations(myPhpId, (convs) => {
      setConversations(convs);
      setUnreadCount(convs.reduce((s, c) => s + (c.unread || 0), 0));
    });
    return unsub;
  }, [myPhpId, isLoading]);

  // ── MESSAGES SUBSCRIPTION ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedChat?.conversationId || !myPhpId) return;
    const unsub = subscribeToMessages(selectedChat.conversationId, (msgs) => {
      setMessages(msgs);
      if (msgs.length > 0)
        markMessagesAsRead(selectedChat.conversationId, myPhpId).catch(console.error);
    });
    inputRef.current?.focus();
    return unsub;
  }, [selectedChat?.conversationId, myPhpId]);

  // ── SCROLL TO BOTTOM ───────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [messages]);

  // ── FETCH USERS ────────────────────────────────────────────────────────────
  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await api.get("/api/users.php");
      if (data?.success) {
        setAvailableUsers(
          (data.users || [])
            .filter((u) => u.user_id.toString() !== myPhpId)
            .map(({ user_id, full_name, role }) => ({ user_id, full_name, role })),
        );
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // ── HANDLERS ───────────────────────────────────────────────────────────────
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
      const conv = await getOrCreateConversation(myPhpId, user.user_id.toString());
      setSelectedChat({
        conversationId: conv.id,
        recipientId: user.user_id.toString(),
        recipientName: user.full_name,
      });
    } catch (err) {
      console.error("Error creating conversation:", err);
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

  const handleBack = () => {
    setSelectedChat(null);
    setMessages([]);
    setUploadState(null);
  };

  // File picked — show preview, don't upload yet
  const handleFilePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Max size is 10 MB.");
      return;
    }
    const isImage = file.type.startsWith("image/");
    setUploadState({
      file,
      name: file.name,
      mime: file.type,
      preview: isImage ? URL.createObjectURL(file) : null,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    inputRef.current?.focus();
  };

  const clearUpload = () => {
    if (uploadState?.preview) URL.revokeObjectURL(uploadState.preview);
    setUploadState(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const hasText = newMessage.trim();
    const hasFile = !!uploadState;
    if ((!hasText && !hasFile) || sending || !selectedChat || !myPhpId) return;

    setSending(true);
    try {
      if (hasFile) {
        const result = await uploadChatFile(uploadState.file);
        if (result.success) {
          await sendMessage(
            selectedChat.conversationId,
            myPhpId,
            selectedChat.recipientId,
            hasText || uploadState.name,
            uploadState.mime.startsWith("image/") ? "image" : "file",
            result.fileUrl,
            result.fileType,
          );
        }
        clearUpload();
        if (hasText) {
          await sendMessage(
            selectedChat.conversationId,
            myPhpId,
            selectedChat.recipientId,
            hasText,
          );
        }
      } else {
        await sendMessage(
          selectedChat.conversationId,
          myPhpId,
          selectedChat.recipientId,
          hasText,
        );
      }
      setNewMessage("");
      inputRef.current?.focus();
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // ── HELPERS ────────────────────────────────────────────────────────────────
  const formatTime = (date) =>
    date
      ? new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "";

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderMessage = (msg, index) => {
    const isOwn = msg.senderId === myPhpId;
    const showDate =
      index === 0 ||
      !messages[index - 1]?.createdAt ||
      formatDate(msg.createdAt) !== formatDate(messages[index - 1].createdAt);

    const isImage = msg.messageType === "image";
    const isFile = msg.messageType === "file";

    return (
      <div key={msg.id}>
        {showDate && (
          <div className="chat-date-divider">
            <span>{formatDate(msg.createdAt)}</span>
          </div>
        )}
        <div className={`msg-row ${isOwn ? "own" : "other"}`}>
          <div className={`bubble ${isImage ? "bubble--image" : ""} ${isFile ? "bubble--file" : ""}`}>
            {isImage ? (
              <a
                href={getFileDownloadUrl(msg.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={getFileDownloadUrl(msg.fileUrl)}
                  alt={msg.content}
                  className="chat-img"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </a>
            ) : isFile ? (
              <a
                className="file-row"
                href={getFileDownloadUrl(msg.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <i className="fa-solid fa-file-arrow-down" />
                <span>{msg.content}</span>
              </a>
            ) : (
              <p>{msg.content}</p>
            )}
            <span className="bubble-meta">
              {formatTime(msg.createdAt)}
              {isOwn && (
                <i className={`fa-solid ${msg.read ? "fa-check-double" : "fa-check"}`} />
              )}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  if (authError || !myPhpId) return null;

  return (
    <>
      <button className="chat-fab" onClick={toggleChat} aria-label="Toggle chat">
        {isLoading ? (
          <i className="fa-solid fa-circle-notch fa-spin" />
        ) : (
          <i className="fa-solid fa-comment-dots" />
        )}
        {!isLoading && unreadCount > 0 && (
          <span className="chat-fab__badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {isOpen && !isLoading && (
        <div className="chat-window">
          {selectedChat ? (
            // ── CHAT VIEW ────────────────────────────────────────────────────
            <>
              <header className="chat-header">
                <button className="icon-btn" onClick={handleBack} aria-label="Back">
                  <i className="fa-solid fa-arrow-left" />
                </button>
                <div className="chat-header__avatar">{selectedChat.recipientName?.charAt(0).toUpperCase()}</div>
                <span className="chat-header__name">{selectedChat.recipientName}</span>
                <button className="icon-btn ml-auto" onClick={() => { handleBack(); setIsOpen(false); }} aria-label="Close">
                  <i className="fa-solid fa-xmark" />
                </button>
              </header>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <i className="fa-regular fa-comments" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg, i) => renderMessage(msg, i))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Upload preview */}
              {uploadState && (
                <div className="upload-preview">
                  {uploadState.preview ? (
                    <img src={uploadState.preview} alt="preview" />
                  ) : (
                    <i className="fa-solid fa-file" />
                  )}
                  <span className="upload-preview__name">{uploadState.name}</span>
                  <button className="icon-btn" onClick={clearUpload} aria-label="Remove">
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              )}

              <form className="chat-input" onSubmit={handleSend}>
                <button
                  type="button"
                  className="icon-btn attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                  aria-label="Attach file"
                >
                  <i className="fa-solid fa-paperclip" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFilePick}
                  accept="image/*,.pdf,.doc,.docx"
                  style={{ display: "none" }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={uploadState ? "Add a caption…" : "Message…"}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="send-btn"
                  disabled={(!newMessage.trim() && !uploadState) || sending}
                  aria-label="Send"
                >
                  {sending ? (
                    <i className="fa-solid fa-circle-notch fa-spin" />
                  ) : (
                    <i className="fa-solid fa-paper-plane" />
                  )}
                </button>
              </form>
            </>
          ) : showUserList ? (
            // ── USER LIST VIEW ────────────────────────────────────────────────
            <>
              <header className="chat-header">
                <button className="icon-btn" onClick={() => setShowUserList(false)}>
                  <i className="fa-solid fa-arrow-left" />
                </button>
                <span className="chat-header__name">New Message</span>
                <button className="icon-btn ml-auto" onClick={() => setIsOpen(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </header>
              <div className="chat-list">
                {loadingUsers ? (
                  <div className="chat-empty">
                    <i className="fa-solid fa-circle-notch fa-spin" />
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="chat-empty"><p>No users available</p></div>
                ) : (
                  availableUsers.map((u) => (
                    <button key={u.user_id} className="conv-item" onClick={() => handleSelectUser(u)}>
                      <div className="conv-item__avatar">{u.full_name?.charAt(0).toUpperCase()}</div>
                      <div className="conv-item__info">
                        <strong>{u.full_name}</strong>
                        <small>{u.role}</small>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            // ── CONVERSATIONS LIST ─────────────────────────────────────────────
            <>
              <header className="chat-header">
                <span className="chat-header__name" style={{ marginLeft: 0 }}>Messages</span>
                <button className="icon-btn ml-auto new-chat-icon" onClick={handleNewChat} aria-label="New chat">
                  <i className="fa-solid fa-pen-to-square" />
                </button>
                <button className="icon-btn" onClick={() => setIsOpen(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </header>
              <div className="chat-list">
                {conversations.length === 0 ? (
                  <div className="chat-empty">
                    <i className="fa-regular fa-comment-dots" />
                    <p>No conversations yet</p>
                    <button className="start-btn" onClick={handleNewChat}>Start a chat</button>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button key={conv.id} className="conv-item" onClick={() => handleSelectChat(conv)}>
                      <div className="conv-item__avatar">
                        {conv.otherUser?.full_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="conv-item__info">
                        <strong>{conv.otherUser?.full_name || "Unknown"}</strong>
                        <small className="last-msg">{conv.lastMessage || "No messages"}</small>
                      </div>
                      {conv.unread > 0 && (
                        <span className="unread-dot">{conv.unread}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default FloatingChat;
