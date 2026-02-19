/**
 * volunteersApi.js
 * Path: src/services/volunteersApi.js
 *
 * PHP response shape (volunteers.php):
 *   { success: true, message: "OK", data: [...], stats: {...} }
 *   { success: true, message: "OK", data: {...} }
 *   { success: false, message: "..." }
 */
import api from "./api";

const BASE = "/api/volunteers.php";

// ─── GET VOLUNTEERS ───────────────────────────────────────────────────────────
export const getVolunteers = async (filters = {}) => {
  const params = {};

  if (filters.search) params.search = filters.search;
  if (filters.service) params.service = filters.service;
  if (filters.status) params.status = filters.status;

  const { data } = await api.get(BASE, { params });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch volunteers");

  return {
    success: true,
    data: data.data ?? [],
    stats: data.stats ?? {
      total: 0,
      by_status: {},
      by_service: {},
    },
  };
};

// ─── GET SINGLE VOLUNTEER ─────────────────────────────────────────────────────
export const getVolunteer = async (id) => {
  if (!id) throw new Error("Volunteer ID is required");

  const { data } = await api.get(BASE, { params: { id } });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch volunteer");

  return { success: true, data: data.data };
};

// ─── CREATE VOLUNTEER ─────────────────────────────────────────────────────────
export const createVolunteer = async (volunteerData) => {
  // Validate required fields
  if (!volunteerData.full_name?.trim())
    throw new Error("Full name is required");
  if (!volunteerData.age) throw new Error("Age is required");
  if (!volunteerData.location?.trim()) throw new Error("Location is required");
  if (!volunteerData.contact_number?.trim())
    throw new Error("Contact number is required");
  if (!volunteerData.service) throw new Error("Service is required");

  const { data } = await api.post(BASE, volunteerData);
  if (!data.success)
    throw new Error(data.message || "Failed to create volunteer");

  return { success: true, message: data.message, id: data.id };
};

// ─── UPDATE VOLUNTEER ─────────────────────────────────────────────────────────
export const updateVolunteer = async (id, volunteerData) => {
  if (!id) throw new Error("Volunteer ID is required");

  const { data } = await api.put(BASE, volunteerData, {
    params: { id },
  });
  if (!data.success)
    throw new Error(data.message || "Failed to update volunteer");

  return { success: true, message: data.message };
};

// ─── DELETE VOLUNTEER ─────────────────────────────────────────────────────────
export const deleteVolunteer = async (id) => {
  if (!id) throw new Error("Volunteer ID is required");

  const { data } = await api.delete(BASE, { params: { id } });
  if (!data.success)
    throw new Error(data.message || "Failed to delete volunteer");

  return { success: true, message: data.message };
};

// ─── SERVICE OPTIONS ──────────────────────────────────────────────────────────
export const SERVICE_OPTIONS = [
  { value: "first_aid", label: "First Aid", icon: "fa-solid fa-kit-medical" },
  {
    value: "disaster_response",
    label: "Disaster Response",
    icon: "fa-solid fa-triangle-exclamation",
  },
  {
    value: "blood_services",
    label: "Blood Services",
    icon: "fa-solid fa-droplet",
  },
  {
    value: "safety_services",
    label: "Safety Services",
    icon: "fa-solid fa-shield-heart",
  },
  {
    value: "youth_services",
    label: "Youth Services",
    icon: "fa-solid fa-users",
  },
  {
    value: "welfare_services",
    label: "Welfare Services",
    icon: "fa-solid fa-hand-holding-heart",
  },
];

// ─── STATUS OPTIONS ───────────────────────────────────────────────────────────
export const STATUS_OPTIONS = [
  { value: "current", label: "Current", icon: "fa-solid fa-check-circle" },
  {
    value: "graduated",
    label: "Graduated",
    icon: "fa-solid fa-graduation-cap",
  },
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
export const formatService = (service) => {
  const option = SERVICE_OPTIONS.find((opt) => opt.value === service);
  return option
    ? option.label
    : service.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export const formatStatus = (status) => {
  const option = STATUS_OPTIONS.find((opt) => opt.value === status);
  return option
    ? option.label
    : status.charAt(0).toUpperCase() + status.slice(1);
};

export default {
  getVolunteers,
  getVolunteer,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  SERVICE_OPTIONS,
  STATUS_OPTIONS,
  formatService,
  formatStatus,
};
