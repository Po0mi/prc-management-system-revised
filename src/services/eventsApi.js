/**
 * eventsApi.js
 * Path: src/services/eventsApi.js
 */
import api from "./api";

const BASE = "/api/events.php";

// ─── GET EVENTS ───────────────────────────────────────────────────────────────
export const getEvents = async ({
  filter = "all",
  search = "",
  service = null,
} = {}) => {
  const params = { action: "list", filter };
  if (search.trim()) params.search = search.trim();
  if (service && service !== "All Services") params.service = service;

  const { data } = await api.get(BASE, { params });
  if (!data.success) throw new Error(data.message || "Failed to fetch events");
  return { success: true, events: data.events ?? [], total: data.total ?? 0 };
};

// ─── GET STATS ────────────────────────────────────────────────────────────────
export const getEventStats = async () => {
  const { data } = await api.get(BASE, { params: { action: "stats" } });
  if (!data.success) throw new Error(data.message || "Failed to fetch stats");
  return { success: true, stats: data.stats };
};

// ─── GET EVENT DETAILS ────────────────────────────────────────────────────────
export const getEventDetails = async (eventId) => {
  if (!eventId) throw new Error("Event ID is required");
  const { data } = await api.get(BASE, {
    params: { action: "details", id: eventId },
  });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch event details");
  return { success: true, event: data.event };
};

// ─── CREATE EVENT ─────────────────────────────────────────────────────────────
export const createEvent = async (eventData) => {
  if (!eventData.title?.trim()) throw new Error("Title is required");
  if (!eventData.major_service) throw new Error("Service is required");
  if (!eventData.event_date) throw new Error("Start date is required");
  if (!eventData.location?.trim()) throw new Error("Location is required");

  const { data } = await api.post(BASE, eventData, {
    params: { action: "create" },
  });
  if (!data.success) throw new Error(data.message || "Failed to create event");
  return { success: true, message: data.message, event_id: data.event_id };
};

// ─── UPDATE EVENT ─────────────────────────────────────────────────────────────
export const updateEvent = async (id, eventData) => {
  if (!id) throw new Error("Event ID is required");

  const { data } = await api.put(BASE, eventData, {
    params: { action: "update", id },
  });
  if (!data.success) throw new Error(data.message || "Failed to update event");
  return { success: true, message: data.message };
};

// ─── DELETE EVENT ─────────────────────────────────────────────────────────────
export const deleteEvent = async (id) => {
  if (!id) throw new Error("Event ID is required");
  const { data } = await api.delete(BASE, { params: { action: "delete", id } });
  if (!data.success) throw new Error(data.message || "Failed to delete event");
  return { success: true, message: data.message };
};

export default {
  getEvents,
  getEventStats,
  getEventDetails,
  createEvent,
  updateEvent,
  deleteEvent,
};
