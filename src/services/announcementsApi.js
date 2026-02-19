/**
 * announcementsApi.js
 * Path: src/services/announcementsApi.js
 *
 * API service for announcements management
 */
import api from "./api";

const BASE = "/api/announcements.php";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
export const CATEGORY_OPTIONS = [
  {
    value: "general",
    label: "General",
    icon: "fa-solid fa-megaphone",
    color: "#6b7280",
  },
  {
    value: "urgent",
    label: "Urgent",
    icon: "fa-solid fa-exclamation-triangle",
    color: "#ef4444",
  },
  {
    value: "events",
    label: "Events",
    icon: "fa-solid fa-calendar-alt",
    color: "#3b82f6",
  },
  {
    value: "training",
    label: "Training",
    icon: "fa-solid fa-graduation-cap",
    color: "#10b981",
  },
];

export const TARGET_ROLE_OPTIONS = [
  {
    value: "all",
    label: "All Users",
    icon: "fa-solid fa-users",
    color: "#6b7280",
  },
  {
    value: "super",
    label: "Super Admin",
    icon: "fa-solid fa-crown",
    color: "#c41e3a",
  },
  {
    value: "safety",
    label: "Safety Services",
    icon: "fa-solid fa-shield-heart",
    color: "#15803d",
  },
  {
    value: "welfare",
    label: "Welfare Services",
    icon: "fa-solid fa-hand-holding-heart",
    color: "#7c3aed",
  },
  {
    value: "health",
    label: "Health Services",
    icon: "fa-solid fa-heart-pulse",
    color: "#c41e3a",
  },
  {
    value: "disaster",
    label: "Disaster Management",
    icon: "fa-solid fa-triangle-exclamation",
    color: "#c2410c",
  },
  {
    value: "youth",
    label: "Red Cross Youth",
    icon: "fa-solid fa-people-group",
    color: "#003d6b",
  },
];

export const STATUS_OPTIONS = [
  {
    value: "published",
    label: "Published",
    icon: "fa-solid fa-globe",
    color: "#10b981",
  },
  { value: "draft", label: "Draft", icon: "fa-solid fa-pen", color: "#6b7280" },
];

// ─── GET ANNOUNCEMENTS ────────────────────────────────────────────────────────
export const getAnnouncements = async (filters = {}) => {
  const params = {};

  if (filters.search) params.search = filters.search;
  if (filters.category) params.category = filters.category;
  if (filters.target_role) params.target_role = filters.target_role;
  if (filters.status) params.status = filters.status;
  if (filters.archived) params.archived = filters.archived;

  const { data } = await api.get(BASE, { params });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch announcements");

  return {
    success: true,
    data: data.data ?? [],
    stats: data.stats ?? {
      total: 0,
      published: 0,
      draft: 0,
      archived: 0,
      by_category: {},
      by_target_role: {},
    },
  };
};

// ─── GET SINGLE ANNOUNCEMENT ──────────────────────────────────────────────────
export const getAnnouncement = async (id) => {
  if (!id) throw new Error("Announcement ID is required");

  const { data } = await api.get(BASE, { params: { id } });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch announcement");

  return { success: true, data: data.data };
};
// ─── IMAGE UPDATE ──────────────────────────────────────────────────
export const updateAnnouncementWithImage = async (id, formData) => {
  if (!id) throw new Error("Announcement ID is required");

  const { data } = await api.put(BASE, formData, {
    params: { id },
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to update announcement");

  return { success: true, message: data.message, image_path: data.image_path };
};

// ─── CREATE ANNOUNCEMENT ──────────────────────────────────────────────────────
export const createAnnouncement = async (formData) => {
  // Validate required fields
  if (!formData.get("title")?.trim()) throw new Error("Title is required");
  if (!formData.get("content")?.trim()) throw new Error("Content is required");

  const { data } = await api.post(BASE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to create announcement");

  return { success: true, message: data.message, id: data.id };
};

// ─── UPDATE ANNOUNCEMENT ──────────────────────────────────────────────────────
export const updateAnnouncement = async (id, announcementData) => {
  if (!id) throw new Error("Announcement ID is required");

  const { data } = await api.put(BASE, announcementData, {
    params: { id },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to update announcement");

  return { success: true, message: data.message };
};

// ─── ARCHIVE ANNOUNCEMENT ─────────────────────────────────────────────────────
export const archiveAnnouncement = async (id) => {
  if (!id) throw new Error("Announcement ID is required");

  const { data } = await api.delete(BASE, { params: { id } });
  if (!data.success)
    throw new Error(data.message || "Failed to archive announcement");

  return { success: true, message: data.message };
};

// ─── RESTORE ANNOUNCEMENT ─────────────────────────────────────────────────────
export const restoreAnnouncement = async (id) => {
  if (!id) throw new Error("Announcement ID is required");

  const { data } = await api.put(BASE, null, {
    params: { id, action: "restore" },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to restore announcement");

  return { success: true, message: data.message };
};

// ─── DELETE ANNOUNCEMENT PERMANENTLY ──────────────────────────────────────────
export const deleteAnnouncementPermanently = async (id) => {
  if (!id) throw new Error("Announcement ID is required");

  const { data } = await api.delete(BASE, {
    params: { id, permanent: "true" },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to delete announcement");

  return { success: true, message: data.message };
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
export const formatCategory = (category) => {
  const option = CATEGORY_OPTIONS.find((opt) => opt.value === category);
  return option
    ? option.label
    : category.charAt(0).toUpperCase() + category.slice(1);
};

export const formatTargetRole = (targetRole) => {
  const option = TARGET_ROLE_OPTIONS.find((opt) => opt.value === targetRole);
  return option
    ? option.label
    : targetRole.charAt(0).toUpperCase() + targetRole.slice(1);
};

export const formatStatus = (status) => {
  const option = STATUS_OPTIONS.find((opt) => opt.value === status);
  return option
    ? option.label
    : status.charAt(0).toUpperCase() + status.slice(1);
};

export const getCategoryColor = (category) => {
  const option = CATEGORY_OPTIONS.find((opt) => opt.value === category);
  return option ? option.color : "#6b7280";
};

export const getTargetRoleColor = (targetRole) => {
  const option = TARGET_ROLE_OPTIONS.find((opt) => opt.value === targetRole);
  return option ? option.color : "#6b7280";
};

export default {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  archiveAnnouncement,
  restoreAnnouncement,
  deleteAnnouncementPermanently,
  CATEGORY_OPTIONS,
  TARGET_ROLE_OPTIONS,
  STATUS_OPTIONS,
  formatCategory,
  formatTargetRole,
  formatStatus,
  getCategoryColor,
  getTargetRoleColor,
};
