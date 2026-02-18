/**
 * trainingRequestsApi.js
 * Path: src/services/trainingRequestsApi.js
 *
 * Frontend service for training request management
 */
import api from "./api";

const BASE = "/api/training_requests.php";

// ─── SUBMIT TRAINING REQUEST ──────────────────────────────────────────────────
export const submitTrainingRequest = async (formData) => {
  // formData should already be a FormData object from the request form
  const { data } = await api.post(BASE, formData, {
    params: { action: "submit" },
    headers: {
      "Content-Type": "multipart/form-data",
    },
    transformRequest: [(data) => data], // Don't transform FormData to JSON
  });

  if (!data.success)
    throw new Error(data.message || "Request submission failed");

  return {
    success: true,
    message: data.message,
    request_id: data.request_id,
  };
};

// ─── GET MY TRAINING REQUESTS ─────────────────────────────────────────────────
export const getMyTrainingRequests = async () => {
  const { data } = await api.get(BASE, { params: { action: "my-requests" } });

  if (!data.success)
    throw new Error(data.message || "Failed to fetch requests");

  return { success: true, requests: data.requests ?? [] };
};

// ─── GET TRAINING REQUESTS (ADMIN) ────────────────────────────────────────────
export const getTrainingRequests = async ({
  status = null,
  search = "",
} = {}) => {
  const params = { action: "list" };

  if (status && status !== "all") params.status = status;
  if (search.trim()) params.search = search.trim();

  const { data } = await api.get(BASE, { params });

  if (!data.success)
    throw new Error(data.message || "Failed to fetch requests");

  return { success: true, requests: data.requests ?? [] };
};

// ─── GET REQUEST DETAILS ──────────────────────────────────────────────────────
export const getRequestDetails = async (requestId) => {
  if (!requestId) throw new Error("Request ID is required");

  const { data } = await api.get(BASE, {
    params: { action: "details", id: requestId },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to fetch request details");

  return { success: true, request: data.request };
};

// ─── UPDATE REQUEST STATUS ────────────────────────────────────────────────────
export const updateRequestStatus = async (
  requestId,
  status,
  adminNotes = "",
) => {
  if (!requestId) throw new Error("Request ID is required");
  if (!status) throw new Error("Status is required");

  const { data } = await api.put(
    BASE,
    { status, admin_notes: adminNotes },
    { params: { action: "update-status", id: requestId } },
  );

  if (!data.success) throw new Error(data.message || "Failed to update status");

  return { success: true, message: data.message };
};

// ─── CREATE SESSION FROM REQUEST ──────────────────────────────────────────────
export const createSessionFromRequest = async (requestId) => {
  if (!requestId) throw new Error("Request ID is required");

  const formData = new FormData();
  formData.append("request_id", requestId);

  const { data } = await api.post(BASE, formData, {
    params: { action: "create-session" },
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to create session");

  return {
    success: true,
    message: data.message,
    session_id: data.session_id,
  };
};

// ─── GET REQUEST STATS ────────────────────────────────────────────────────────
export const getRequestStats = async () => {
  const { data } = await api.get(BASE, { params: { action: "stats" } });

  if (!data.success) throw new Error(data.message || "Failed to fetch stats");

  return { success: true, stats: data.stats ?? {} };
};

// ─── EXPORT DEFAULT ───────────────────────────────────────────────────────────
export default {
  submitTrainingRequest,
  getMyTrainingRequests,
  getTrainingRequests,
  getRequestDetails,
  updateRequestStatus,
  createSessionFromRequest,
  getRequestStats,
};
