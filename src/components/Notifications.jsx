import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Notifications.scss";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../services/notificationsApi";

const POLL_MS = 30_000;

const TYPE_META = {
  event:        { icon: "fa-solid fa-calendar-days",      color: "#3b82f6" },
  training:     { icon: "fa-solid fa-graduation-cap",     color: "#8b5cf6" },
  announcement: { icon: "fa-solid fa-bullhorn",           color: "#f59e0b" },
  message:      { icon: "fa-solid fa-envelope",           color: "#10b981" },
  donation:     { icon: "fa-solid fa-hand-holding-heart", color: "#ef4444" },
  system:       { icon: "fa-solid fa-bell",               color: "#6b7280" },
};

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts);
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Notifications() {
  const [isOpen, setIsOpen]           = useState(false);
  const [items, setItems]             = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    const [countRes, listRes] = await Promise.all([
      getUnreadCount(),
      getNotifications(20),
    ]);
    if (countRes.success) setUnreadCount(countRes.unreadCount ?? countRes.unread_count ?? 0);
    if (listRes.success)  setItems(listRes.notifications ?? []);
  }, []);

  // On mount + polling
  useEffect(() => { refresh(); }, [refresh]); // eslint-disable-line react-hooks/set-state-in-effect
  useEffect(() => {
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // Re-fetch list when dropdown opens
  useEffect(() => {
    if (isOpen) refresh(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [isOpen, refresh]);

  // Close on outside click
  useEffect(() => {
    const fn = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleItemClick = async (n) => {
    setIsOpen(false);
    if (!n.is_read) {
      await markAsRead(n.notification_id);
      setItems((prev) =>
        prev.map((x) => x.notification_id === n.notification_id ? { ...x, is_read: 1 } : x)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (n.link) navigate(n.link);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const wasUnread = items.find((n) => n.notification_id === id && !n.is_read);
    await deleteNotification(id);
    setItems((prev) => prev.filter((n) => n.notification_id !== id));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  };

  return (
    <div className="notif" ref={wrapRef}>
      {/* Bell button */}
      <button
        className={`notif__bell${isOpen ? " notif__bell--open" : ""}${unreadCount > 0 ? " notif__bell--active" : ""}`}
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Notifications"
      >
        <i className="fa-solid fa-bell" />
        {unreadCount > 0 && (
          <span className="notif__badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="notif__dropdown">
          {/* Header */}
          <div className="notif__header">
            <span className="notif__heading">
              Notifications
              {unreadCount > 0 && <span className="notif__unread-pill">{unreadCount} new</span>}
            </span>
            {unreadCount > 0 && (
              <button className="notif__mark-all" onClick={handleMarkAll}>
                <i className="fa-solid fa-check-double" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="notif__list">
            {items.length === 0 ? (
              <div className="notif__empty">
                <i className="fa-regular fa-bell-slash" />
                <p>You&apos;re all caught up!</p>
              </div>
            ) : (
              items.map((n) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.system;
                return (
                  <div
                    key={n.notification_id}
                    className={`notif__item${n.is_read ? "" : " notif__item--unread"}`}
                    onClick={() => handleItemClick(n)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleItemClick(n)}
                  >
                    {!n.is_read && <span className="notif__dot" />}
                    <span className="notif__icon" style={{ "--c": meta.color }}>
                      <i className={meta.icon} />
                    </span>
                    <div className="notif__content">
                      <strong>{n.title}</strong>
                      <p>{n.message}</p>
                      <time>{timeAgo(n.created_at)}</time>
                    </div>
                    <button
                      className="notif__del"
                      onClick={(e) => handleDelete(e, n.notification_id)}
                      aria-label="Dismiss"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
