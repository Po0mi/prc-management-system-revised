/**
 * Notifications.jsx
 * Path: src/components/Notifications.jsx
 *
 * Requires Font Awesome in your index.html:
 * <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import "./Notifications.scss";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../services/notificationsApi";

const POLL_MS = 30_000;

const TYPE_ICONS = {
  event: { icon: "fa-solid fa-calendar-days", color: "#3b82f6" },
  training: { icon: "fa-solid fa-graduation-cap", color: "#8b5cf6" },
  announcement: { icon: "fa-solid fa-bullhorn", color: "#f59e0b" },
  message: { icon: "fa-solid fa-envelope", color: "#10b981" },
  donation: { icon: "fa-solid fa-hand-holding-heart", color: "#ef4444" },
  system: { icon: "fa-solid fa-bell", color: "#6b7280" },
};

const TYPE_LABELS = {
  event: "Event",
  training: "Training",
  announcement: "Announcement",
  message: "Message",
  donation: "Donation",
  system: "System",
};

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts);
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function NotifIcon({ type, size = "sm" }) {
  const def = TYPE_ICONS[type] ?? TYPE_ICONS.system;
  return (
    <span
      className={`notif-icon-wrap notif-icon-wrap--${size}`}
      style={{ "--icon-color": def.color }}
    >
      <i className={def.icon} />
    </span>
  );
}

// ── Shared notification item used in both dropdown + modal ────────────────────
function NotifItem({ n, onRead, onDelete, onClick, showFull = false }) {
  return (
    <div
      className={`notif-item${n.is_read ? "" : " unread"}${showFull ? " notif-item--full" : ""}`}
    >
      {!n.is_read && <span className="notif-dot" />}

      <Link
        to={n.link || "#"}
        className="notif-content"
        onClick={() => {
          if (!n.is_read) onRead(n.notification_id);
          if (onClick) onClick();
        }}
      >
        <NotifIcon type={n.type} size={showFull ? "md" : "sm"} />
        <div className="notif-text">
          {showFull && (
            <span
              className="notif-type-tag"
              style={{
                "--icon-color": (TYPE_ICONS[n.type] ?? TYPE_ICONS.system).color,
              }}
            >
              {TYPE_LABELS[n.type] ?? "System"}
            </span>
          )}
          <strong>{n.title}</strong>
          <p>{n.message}</p>
          <time>
            <i className="fa-regular fa-clock" />
            {timeAgo(n.created_at)}
          </time>
        </div>
      </Link>

      <button
        className="notif-del"
        onClick={(e) => onDelete(n.notification_id, e)}
        title="Dismiss"
        aria-label="Delete notification"
      >
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}

// ── All Notifications Modal ───────────────────────────────────────────────────
function AllNotificationsModal({ onClose, onRead, onDelete, onMarkAll }) {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      const offset = reset ? 0 : page * LIMIT;
      const res = await getNotifications(LIMIT, offset);
      if (res.success) {
        const items = res.notifications ?? [];
        setAll((prev) => (reset ? items : [...prev, ...items]));
        setUnreadCount(res.unread_count ?? 0);
        setHasMore(items.length === LIMIT);
        if (!reset) setPage((p) => p + 1);
      }
      setLoading(false);
    },
    [page],
  );

  useEffect(() => {
    load(true);
  }, []); // eslint-disable-line

  // Lock body scroll while modal open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleRead = (id) => {
    onRead(id);
    setAll((prev) =>
      prev.map((n) => (n.notification_id === id ? { ...n, is_read: 1 } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    const wasUnread = all.find((n) => n.notification_id === id && !n.is_read);
    onDelete(id, e);
    setAll((prev) => prev.filter((n) => n.notification_id !== id));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAll = async () => {
    await onMarkAll();
    setAll((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  };

  const FILTERS = [
    "all",
    "unread",
    "event",
    "training",
    "announcement",
    "donation",
    "system",
  ];

  const filtered =
    filter === "all"
      ? all
      : filter === "unread"
        ? all.filter((n) => !n.is_read)
        : all.filter((n) => n.type === filter);

  return (
    <div
      className="notif-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="notif-modal"
        role="dialog"
        aria-modal="true"
        aria-label="All Notifications"
      >
        {/* Modal header */}
        <div className="notif-modal-head">
          <div className="notif-modal-head-left">
            <i className="fa-solid fa-bell" />
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <span className="notif-modal-badge">{unreadCount} unread</span>
            )}
          </div>
          <div className="notif-modal-head-right">
            {unreadCount > 0 && (
              <button className="notif-modal-markall" onClick={handleMarkAll}>
                <i className="fa-solid fa-check-double" />
                Mark all read
              </button>
            )}
            <button
              className="notif-modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="notif-modal-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`notif-filter-tab${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
              style={
                f !== "all" && f !== "unread"
                  ? {
                      "--icon-color": (TYPE_ICONS[f] ?? TYPE_ICONS.system)
                        .color,
                    }
                  : {}
              }
            >
              {f !== "all" && f !== "unread" && (
                <i className={TYPE_ICONS[f]?.icon ?? "fa-solid fa-bell"} />
              )}
              {f === "unread" && <i className="fa-solid fa-circle" />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Modal body */}
        <div className="notif-modal-body">
          {loading && filtered.length === 0 ? (
            <div className="notif-modal-empty">
              <i className="fa-solid fa-circle-notch fa-spin" />
              <p>Loading notifications…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="notif-modal-empty">
              <i className="fa-regular fa-bell-slash" />
              <p>No {filter !== "all" ? filter : ""} notifications</p>
            </div>
          ) : (
            <>
              {filtered.map((n) => (
                <NotifItem
                  key={n.notification_id}
                  n={n}
                  onRead={handleRead}
                  onDelete={handleDelete}
                  showFull
                />
              ))}
              {hasMore && (
                <div className="notif-modal-loadmore">
                  <button onClick={() => load(false)} disabled={loading}>
                    {loading ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin" />{" "}
                        Loading…
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-chevron-down" /> Load more
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Notifications component ──────────────────────────────────────────────
export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef(null);

  const refreshCount = useCallback(async () => {
    const res = await getUnreadCount();
    if (res.success) setUnreadCount(res.unreadCount ?? res.unread_count ?? 0);
  }, []);

  const refreshList = useCallback(async () => {
    setLoading(true);
    const res = await getNotifications(15);
    if (res.success) setNotifications(res.notifications ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshCount();
    refreshList();
  }, [refreshCount, refreshList]);
  useEffect(() => {
    if (isOpen) refreshList();
  }, [isOpen, refreshList]);

  useEffect(() => {
    const id = setInterval(() => {
      refreshCount();
      if (isOpen) refreshList();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [isOpen, refreshCount, refreshList]);

  useEffect(() => {
    const fn = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleMarkRead = async (id) => {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.notification_id === id ? { ...n, is_read: 1 } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const wasUnread = notifications.find(
      (n) => n.notification_id === id && !n.is_read,
    );
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
  };

  const openModal = () => {
    setIsOpen(false);
    setShowModal(true);
  };

  return (
    <>
      <div className="notif-wrap" ref={dropRef}>
        {/* Bell */}
        <button
          className={`notif-bell${isOpen ? " active" : ""}`}
          onClick={() => setIsOpen((o) => !o)}
          aria-label="Notifications"
        >
          <i className="fa-solid fa-bell" />
          {unreadCount > 0 && (
            <span className="notif-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="notif-dropdown">
            <div className="notif-head">
              <div className="notif-head-left">
                <i className="fa-solid fa-bell" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="notif-head-count">{unreadCount}</span>
                )}
              </div>
              {unreadCount > 0 && (
                <button className="notif-mark-all" onClick={handleMarkAll}>
                  <i className="fa-solid fa-check-double" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="notif-body">
              {loading && notifications.length === 0 ? (
                <div className="notif-empty">
                  <i className="fa-solid fa-circle-notch fa-spin" />
                  <p>Loading…</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="notif-empty">
                  <i className="fa-regular fa-bell-slash" />
                  <p>You're all caught up!</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <NotifItem
                    key={n.notification_id}
                    n={n}
                    onRead={handleMarkRead}
                    onDelete={handleDelete}
                    onClick={() => setIsOpen(false)}
                  />
                ))
              )}
            </div>

            <div className="notif-foot">
              <button className="notif-view-all" onClick={openModal}>
                <i className="fa-solid fa-list" />
                View all notifications
                {unreadCount > 0 && (
                  <span className="notif-foot-badge">{unreadCount}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal portal */}
      {showModal && (
        <AllNotificationsModal
          onClose={() => {
            setShowModal(false);
            refreshCount();
            refreshList();
          }}
          onRead={handleMarkRead}
          onDelete={handleDelete}
          onMarkAll={handleMarkAll}
        />
      )}
    </>
  );
}
