/**
 * merchandiseApi.js
 * Path: src/services/merchandiseApi.js
 *
 * API service for merchandise management
 */
import api from "./api";

const BASE = "/api/merchandise.php";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
export const CATEGORY_OPTIONS = [
  {
    value: "clothing",
    label: "Clothing",
    icon: "fa-solid fa-shirt",
    color: "#c41e3a",
  },
  {
    value: "accessories",
    label: "Accessories",
    icon: "fa-solid fa-hat-cowboy",
    color: "#15803d",
  },
  {
    value: "supplies",
    label: "Supplies",
    icon: "fa-solid fa-kit-medical",
    color: "#7c3aed",
  },
  {
    value: "books",
    label: "Books",
    icon: "fa-solid fa-book",
    color: "#c2410c",
  },
  {
    value: "collectibles",
    label: "Collectibles",
    icon: "fa-solid fa-star",
    color: "#003d6b",
  },
  { value: "other", label: "Other", icon: "fa-solid fa-box", color: "#6b7280" },
];

// ─── GET MERCHANDISE ──────────────────────────────────────────────────────────
export const getMerchandise = async (filters = {}) => {
  const params = {};

  if (filters.search) params.search = filters.search;
  if (filters.category) params.category = filters.category;
  if (filters.show_unavailable)
    params.show_unavailable = filters.show_unavailable;

  const { data } = await api.get(BASE, { params });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch merchandise");

  return {
    success: true,
    data: data.data ?? [],
    stats: data.stats ?? {
      total: 0,
      available: 0,
      unavailable: 0,
      total_stock: 0,
      total_value: 0,
      by_category: {},
    },
  };
};

// ─── GET SINGLE MERCHANDISE ITEM ─────────────────────────────────────────────
export const getMerchandiseItem = async (id) => {
  if (!id) throw new Error("Merchandise ID is required");

  const { data } = await api.get(BASE, { params: { id } });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch merchandise item");

  return { success: true, data: data.data };
};

// ─── CREATE MERCHANDISE ITEM ──────────────────────────────────────────────────
export const createMerchandise = async (formData) => {
  // Validate required fields
  if (!formData.get("name")?.trim()) throw new Error("Item name is required");

  const { data } = await api.post(BASE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to create merchandise item");

  return {
    success: true,
    message: data.message,
    id: data.id,
    image_url: data.image_url,
  };
};

// ─── UPDATE MERCHANDISE ITEM ──────────────────────────────────────────────────
export const updateMerchandise = async (id, formData) => {
  if (!id) throw new Error("Merchandise ID is required");

  const { data } = await api.put(BASE, formData, {
    params: { id },
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to update merchandise item");

  return { success: true, message: data.message, image_url: data.image_url };
};

// ─── UPDATE MERCHANDISE WITHOUT IMAGE ─────────────────────────────────────────
export const updateMerchandiseWithoutImage = async (id, itemData) => {
  if (!id) throw new Error("Merchandise ID is required");

  const { data } = await api.put(BASE, itemData, {
    params: { id },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to update merchandise item");

  return { success: true, message: data.message };
};

// ─── DELETE MERCHANDISE ITEM (soft delete) ────────────────────────────────────
export const deleteMerchandise = async (id) => {
  if (!id) throw new Error("Merchandise ID is required");

  const { data } = await api.delete(BASE, { params: { id } });
  if (!data.success)
    throw new Error(data.message || "Failed to delete merchandise item");

  return { success: true, message: data.message };
};

// ─── RESTORE MERCHANDISE ITEM ─────────────────────────────────────────────────
export const restoreMerchandise = async (id) => {
  if (!id) throw new Error("Merchandise ID is required");

  const { data } = await api.put(BASE, null, {
    params: { id, action: "restore" },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to restore merchandise item");

  return { success: true, message: data.message };
};

// ─── DELETE MERCHANDISE PERMANENTLY ───────────────────────────────────────────
export const deleteMerchandisePermanently = async (id) => {
  if (!id) throw new Error("Merchandise ID is required");

  const { data } = await api.delete(BASE, {
    params: { id, permanent: "true" },
  });

  if (!data.success)
    throw new Error(
      data.message || "Failed to delete merchandise item permanently",
    );

  return { success: true, message: data.message };
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
export const formatCategory = (category) => {
  const option = CATEGORY_OPTIONS.find((opt) => opt.value === category);
  return option
    ? option.label
    : category.charAt(0).toUpperCase() + category.slice(1);
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(price);
};

export const getCategoryColor = (category) => {
  const option = CATEGORY_OPTIONS.find((opt) => opt.value === category);
  return option ? option.color : "#6b7280";
};

export const getCategoryIcon = (category) => {
  const option = CATEGORY_OPTIONS.find((opt) => opt.value === category);
  return option ? option.icon : "fa-solid fa-box";
};

export const getImageUrl = (item) => {
  if (!item.image_url) return null;
  if (item.image_url.startsWith("http")) return item.image_url;
  // Use the API base URL to construct the full URL
  const baseURL = api.defaults.baseURL;
  return `${baseURL}/${item.image_url}`;
};

export default {
  getMerchandise,
  getMerchandiseItem,
  createMerchandise,
  updateMerchandise,
  updateMerchandiseWithoutImage,
  deleteMerchandise,
  restoreMerchandise,
  deleteMerchandisePermanently,
  CATEGORY_OPTIONS,
  formatCategory,
  formatPrice,
  getCategoryColor,
  getCategoryIcon,
  getImageUrl,
};
