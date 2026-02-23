/**
 * notificationsApi.js
 * Path: src/services/notificationsApi.js
 */
import api from "./api"; // Import the centralized api instance

const BASE = "/api/notifications.php";

// ── Safe wrapper — never throws, always returns { success, ...rest } ──────────
async function request(config) {
  try {
    const { data } = await api(config);
    // Normalize snake_case unread_count → unreadCount for React
    if (typeof data.unread_count !== "undefined") {
      data.unreadCount = data.unread_count;
    }
    return data;
  } catch (err) {
    const msg = err?.response?.data?.message ?? err.message ?? "Request failed";
    console.error("[notificationsApi]", msg, err?.response?.data);
    return { success: false, message: msg };
  }
}

// ── API methods ───────────────────────────────────────────────────────────────

/** Fetch a list of notifications (latest first). */
export function getNotifications(limit = 20, offset = 0) {
  return request({ method: "GET", url: BASE, params: { limit, offset } });
}

/** Get just the unread badge count — safe to poll every 30 s. */
export function getUnreadCount() {
  return request({
    method: "GET",
    url: BASE,
    params: { action: "unread-count" },
  });
}

/** Mark a single notification as read. */
export function markAsRead(id) {
  return request({
    method: "PUT",
    url: BASE,
    params: { action: "mark-read", id },
  });
}

/** Mark every notification for the current user as read. */
export function markAllAsRead() {
  return request({
    method: "PUT",
    url: BASE,
    params: { action: "mark-all-read" },
  });
}

/** Permanently delete a notification. */
export function deleteNotification(id) {
  return request({
    method: "DELETE",
    url: BASE,
    params: { action: "delete", id },
  });
}
