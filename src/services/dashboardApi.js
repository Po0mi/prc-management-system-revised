/**
 * dashboardApi.js
 * Path: src/services/dashboardApi.js
 * Aggregates stats from all backend APIs for the admin dashboard
 */
import api from "./api";

export const getDashboardStats = async () => {
  const results = await Promise.allSettled([
    api.get("/api/users.php", { params: { action: "stats" } }),
    api.get("/api/events.php", { params: { action: "stats" } }),
    api.get("/api/training_sessions.php", { params: { action: "stats" } }),
    api.get("/api/training_requests.php", { params: { action: "stats" } }),
    api.get("/api/volunteers.php"),
    api.get("/api/inventory.php"),
    api.get("/api/merchandise.php"),
    api.get("/api/blood_bank.php"),
    api.get("/api/announcements.php"),
  ]);

  const safe = (i, path, fallback) => {
    if (results[i].status !== "fulfilled") return fallback;
    const d = results[i].value.data;
    if (!d?.success) return fallback;
    return path.split(".").reduce((o, k) => o?.[k], d) ?? fallback;
  };

  return {
    users: {
      total:        safe(0, "stats.total", 0),
      admins:       safe(0, "stats.admins", 0),
      users:        safe(0, "stats.users", 0),
      rcy_members:  safe(0, "stats.rcy_members", 0),
      new_this_week:safe(0, "stats.new_this_week", 0),
    },
    events: {
      total:               safe(1, "stats.total", 0),
      upcoming:            safe(1, "stats.upcoming", 0),
      completed:           safe(1, "stats.completed", 0),
      total_registrations: safe(1, "stats.total_registrations", 0),
    },
    training: {
      total:               safe(2, "stats.total", 0),
      upcoming:            safe(2, "stats.upcoming", 0),
      completed:           safe(2, "stats.completed", 0),
      total_registrations: safe(2, "stats.total_registrations", 0),
    },
    requests: {
      total:     safe(3, "stats.total", 0),
      by_status: safe(3, "stats.by_status", []),
    },
    volunteers: {
      total:     safe(4, "stats.total", 0),
      by_status: safe(4, "stats.by_status", {}),
    },
    inventory: {
      total_items: safe(5, "stats.total_items", 0),
      total_value: safe(5, "stats.total_value", 0),
      low_stock:   safe(5, "stats.low_stock", 0),
      out_of_stock:safe(5, "stats.out_of_stock", 0),
    },
    merchandise: {
      total:       safe(6, "stats.total", 0),
      available:   safe(6, "stats.available", 0),
      total_stock: safe(6, "stats.total_stock", 0),
      total_value: safe(6, "stats.total_value", 0),
    },
    blood_bank: {
      total_units:    safe(7, "stats.total_units", 0),
      total_locations:safe(7, "stats.total_locations", 0),
      low_stock:      safe(7, "stats.low_stock", 0),
      critical_stock: safe(7, "stats.critical_stock", 0),
      by_blood_type:  safe(7, "stats.by_blood_type", {}),
    },
    announcements: {
      total:     safe(8, "stats.total", 0),
      published: safe(8, "stats.published", 0),
      draft:     safe(8, "stats.draft", 0),
      archived:  safe(8, "stats.archived", 0),
    },
  };
};

// Pending items that need admin attention
export const getPendingItems = async () => {
  const results = await Promise.allSettled([
    api.get("/api/registrations.php"),
    api.get("/api/session_registrations.php"),
    api.get("/api/training_requests.php"),
  ]);

  const safeRegs   = results[0].status === "fulfilled" ? results[0].value.data?.registrations ?? [] : [];
  const safeSeRegs = results[1].status === "fulfilled" ? results[1].value.data?.registrations ?? [] : [];
  const safeReqs   = results[2].status === "fulfilled" ? results[2].value.data?.requests ?? [] : [];

  return {
    event_registrations:    safeRegs.filter(r => r.status === "pending").length,
    training_registrations: safeSeRegs.filter(r => r.status === "pending").length,
    training_requests:      safeReqs.filter(r => r.status === "pending").length,
  };
};

// Recent events for activity feed
export const getRecentEvents = async (limit = 5) => {
  try {
    const { data } = await api.get("/api/events.php", { params: { limit } });
    if (!data?.success) return [];
    return (data.events ?? []).slice(0, limit);
  } catch { return []; }
};

// Recent announcements for feed
export const getRecentAnnouncements = async (limit = 3) => {
  try {
    const { data } = await api.get("/api/announcements.php", {
      params: { status: "published", limit },
    });
    if (!data?.success) return [];
    return (data.data ?? []).slice(0, limit);
  } catch { return []; }
};
