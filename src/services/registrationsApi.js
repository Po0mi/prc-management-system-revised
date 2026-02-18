/**
 * registrationsApi.js
 * Path: src/services/registrationsApi.js
 */
import api from "./api";

const BASE = "/api/registrations.php";

// ─── GET REGISTRATIONS FOR EVENT ──────────────────────────────────────────────
export const getRegistrations = async (eventId) => {
  if (!eventId) throw new Error("Event ID is required");

  const { data } = await api.get(BASE, {
    params: { action: "list", event_id: eventId },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to fetch registrations");
  return {
    success: true,
    registrations: data.registrations ?? [],
    total: data.total ?? 0,
  };
};

// ─── GET MY REGISTRATIONS ─────────────────────────────────────────────────────
export const getMyRegistrations = async () => {
  const { data } = await api.get(BASE, {
    params: { action: "my-registrations" },
  });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch registrations");
  return {
    success: true,
    registrations: data.registrations ?? [],
    total: data.total ?? 0,
  };
};

// ─── REGISTER FOR EVENT ───────────────────────────────────────────────────────
export const registerForEvent = async (formData) => {
  // formData should be a FormData object with files
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

// ─── APPROVE REGISTRATION ─────────────────────────────────────────────────────
export const approveRegistration = async (registrationId) => {
  if (!registrationId) throw new Error("Registration ID is required");

  const { data } = await api.put(
    BASE,
    {},
    {
      params: { action: "approve", id: registrationId },
    },
  );

  if (!data.success) throw new Error(data.message || "Failed to approve");
  return { success: true, message: data.message };
};

// ─── REJECT REGISTRATION ──────────────────────────────────────────────────────
export const rejectRegistration = async (registrationId) => {
  if (!registrationId) throw new Error("Registration ID is required");

  const { data } = await api.put(
    BASE,
    {},
    {
      params: { action: "reject", id: registrationId },
    },
  );

  if (!data.success) throw new Error(data.message || "Failed to reject");
  return { success: true, message: data.message };
};

// ─── DELETE REGISTRATION ──────────────────────────────────────────────────────
export const deleteRegistration = async (registrationId) => {
  if (!registrationId) throw new Error("Registration ID is required");

  const { data } = await api.delete(BASE, {
    params: { action: "delete", id: registrationId },
  });

  if (!data.success) throw new Error(data.message || "Failed to delete");
  return { success: true, message: data.message };
};

export default {
  getRegistrations,
  getMyRegistrations,
  registerForEvent,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
};
