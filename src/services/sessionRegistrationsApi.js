/**
 * sessionRegistrationsApi.js
 * Path: src/services/sessionRegistrationsApi.js
 *
 * Frontend service for training session registrations
 */
import api from "./api";

const BASE = "/api/session_registrations.php";

// ─── REGISTER FOR SESSION ─────────────────────────────────────────────────────
export const registerForSession = async (formData) => {
  // formData should already be a FormData object from the registration form
  const { data } = await api.post(BASE, formData, {
    params: { action: "register" },
    headers: {
      "Content-Type": "multipart/form-data",
    },
    transformRequest: [(data) => data], // Don't transform FormData to JSON
  });

  if (!data.success) throw new Error(data.message || "Registration failed");

  return {
    success: true,
    message: data.message,
    registration_id: data.registration_id,
  };
};

// ─── GET MY SESSION REGISTRATIONS ─────────────────────────────────────────────
export const getMySessionRegistrations = async () => {
  const { data } = await api.get(BASE, {
    params: { action: "my-registrations" },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to fetch registrations");

  return { success: true, registrations: data.registrations ?? [] };
};

// ─── GET SESSION REGISTRATIONS (ADMIN) ───────────────────────────────────────
export const getSessionRegistrations = async (sessionId) => {
  if (!sessionId) throw new Error("Session ID is required");

  const { data } = await api.get(BASE, {
    params: { action: "list", session_id: sessionId },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to fetch registrations");

  return { success: true, registrations: data.registrations ?? [] };
};

// ─── APPROVE SESSION REGISTRATION ─────────────────────────────────────────────
export const approveSessionRegistration = async (registrationId) => {
  if (!registrationId) throw new Error("Registration ID is required");

  const { data } = await api.put(
    BASE,
    {},
    {
      params: { action: "approve", id: registrationId },
    },
  );

  if (!data.success)
    throw new Error(data.message || "Failed to approve registration");

  return { success: true, message: data.message };
};

// ─── REJECT SESSION REGISTRATION ──────────────────────────────────────────────
export const rejectSessionRegistration = async (registrationId) => {
  if (!registrationId) throw new Error("Registration ID is required");

  const { data } = await api.put(
    BASE,
    {},
    {
      params: { action: "reject", id: registrationId },
    },
  );

  if (!data.success)
    throw new Error(data.message || "Failed to reject registration");

  return { success: true, message: data.message };
};

// ─── DELETE SESSION REGISTRATION ──────────────────────────────────────────────
export const deleteSessionRegistration = async (registrationId) => {
  if (!registrationId) throw new Error("Registration ID is required");

  const { data } = await api.delete(BASE, {
    params: { action: "delete", id: registrationId },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to delete registration");

  return { success: true, message: data.message };
};

// ─── EXPORT DEFAULT ───────────────────────────────────────────────────────────
export default {
  registerForSession,
  getMySessionRegistrations,
  getSessionRegistrations,
  approveSessionRegistration,
  rejectSessionRegistration,
  deleteSessionRegistration,
};
