/**
 * notificationsApi.js
 * Path: src/services/notificationsApi.js
 *
 * Uses axios with withCredentials: true so the PHP session cookie
 * (set by auth.php on login) is sent with every request.
 */

import axios from "axios";

// ── Must match the base URL your other API calls use ─────────────────────────
// Check your other service files (eventsApi, usersApi, etc.) and make
// sure this matches. Common patterns: http://localhost/prc/backend/api
const BASE_URL =
  "http://localhost/prc-management-system/backend/api/notifications.php";

// ── Axios instance — mirrors auth.php's CORS expectations ────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends the PHPSESSID cookie
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

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
  return request({ method: "GET", params: { limit, offset } });
}

/** Get just the unread badge count — safe to poll every 30 s. */
export function getUnreadCount() {
  return request({ method: "GET", params: { action: "unread-count" } });
}

/** Mark a single notification as read. */
export function markAsRead(id) {
  return request({ method: "PUT", params: { action: "mark-read", id } });
}

/** Mark every notification for the current user as read. */
export function markAllAsRead() {
  return request({ method: "PUT", params: { action: "mark-all-read" } });
}

/** Permanently delete a notification. */
export function deleteNotification(id) {
  return request({ method: "DELETE", params: { action: "delete", id } });
}
