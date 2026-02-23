/**
 * trainingSessions.js
 * Path: src/services/trainingSessions.js
 *
 * Frontend service for training sessions management
 */
import api from "./api";

const BASE = "/api/training_sessions.php";

// ─── GET TRAINING SESSIONS ────────────────────────────────────────────────────
export const getTrainingSessions = async ({
  filter = "all",
  search = "",
  service = null,
  status = "active",
  archived = false,
} = {}) => {
  const params = { action: "list", filter, status };

  if (search.trim()) params.search = search.trim();
  if (service && service !== "All Services") params.service = service;
  if (archived) params.archived = "true";

  const { data } = await api.get(BASE, { params });
  console.log("getTrainingSessions response:", data); // ← Add this
  if (!data.success)
    throw new Error(data.message || "Failed to fetch training sessions");

  return {
    success: true,
    sessions: data.sessions ?? [],
    total: data.total ?? 0,
  };
};

// ─── GET SESSION STATS ────────────────────────────────────────────────────────
export const getSessionStats = async () => {
  const { data } = await api.get(BASE, { params: { action: "stats" } });
  if (!data.success) throw new Error(data.message || "Failed to fetch stats");

  return { success: true, stats: data.stats };
};

// ─── GET SESSION DETAILS ──────────────────────────────────────────────────────
export const getSessionDetails = async (sessionId) => {
  if (!sessionId) throw new Error("Session ID is required");

  const { data } = await api.get(BASE, {
    params: { action: "details", id: sessionId },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to fetch session details");

  return { success: true, session: data.session };
};

// ─── CREATE TRAINING SESSION ──────────────────────────────────────────────────
export const createTrainingSession = async (sessionData) => {
  // Validation
  if (!sessionData.title?.trim()) throw new Error("Session title is required");
  if (!sessionData.major_service) throw new Error("Major service is required");
  if (!sessionData.session_date) throw new Error("Session date is required");
  if (!sessionData.venue?.trim()) throw new Error("Venue is required");

  const { data } = await api.post(BASE, sessionData, {
    params: { action: "create" },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to create session");

  return {
    success: true,
    message: data.message,
    session_id: data.session_id,
  };
};

// ─── UPDATE TRAINING SESSION ──────────────────────────────────────────────────
export const updateTrainingSession = async (sessionId, sessionData) => {
  if (!sessionId) throw new Error("Session ID is required");

  const { data } = await api.put(BASE, sessionData, {
    params: { action: "update", id: sessionId },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to update session");

  return { success: true, message: data.message };
};

// ─── DELETE TRAINING SESSION ──────────────────────────────────────────────────
export const deleteTrainingSession = async (sessionId) => {
  if (!sessionId) throw new Error("Session ID is required");

  const { data } = await api.delete(BASE, {
    params: { action: "delete", id: sessionId },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to delete session");

  return { success: true, message: data.message };
};

// ─── TOGGLE ARCHIVE STATUS ────────────────────────────────────────────────────
export const toggleSessionArchive = async (sessionId) => {
  if (!sessionId) throw new Error("Session ID is required");

  const { data } = await api.put(
    BASE,
    {},
    {
      params: { action: "toggle-archive", id: sessionId },
    },
  );

  if (!data.success)
    throw new Error(data.message || "Failed to toggle archive");

  return { success: true, message: data.message };
};

// ─── EXPORT DEFAULT ───────────────────────────────────────────────────────────
export default {
  getTrainingSessions,
  getSessionStats,
  getSessionDetails,
  createTrainingSession,
  updateTrainingSession,
  deleteTrainingSession,
  toggleSessionArchive,
};
