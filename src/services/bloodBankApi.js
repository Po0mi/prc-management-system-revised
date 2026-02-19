/**
 * bloodBankApi.js
 * Path: src/services/bloodBankApi.js
 *
 * API service for blood bank management
 */
import api from "./api";

const BASE = "/api/blood_bank.php";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
export const BLOOD_TYPES = [
  { value: "A+", label: "A+", color: "#c41e3a" },
  { value: "A-", label: "A-", color: "#c41e3a" },
  { value: "B+", label: "B+", color: "#15803d" },
  { value: "B-", label: "B-", color: "#15803d" },
  { value: "AB+", label: "AB+", color: "#7c3aed" },
  { value: "AB-", label: "AB-", color: "#7c3aed" },
  { value: "O+", label: "O+", color: "#c2410c" },
  { value: "O-", label: "O-", color: "#c2410c" },
];

export const STOCK_STATUS = {
  CRITICAL: { label: "Critical", threshold: 10, color: "#ef4444" },
  LOW: { label: "Low", threshold: 20, color: "#f59e0b" },
  NORMAL: { label: "Normal", threshold: Infinity, color: "#10b981" },
};

// ─── GET BLOOD INVENTORY ──────────────────────────────────────────────────────
export const getBloodInventory = async (filters = {}) => {
  const params = {};

  if (filters.location) params.location = filters.location;
  if (filters.blood_type) params.blood_type = filters.blood_type;
  if (filters.min_units) params.min_units = filters.min_units;

  const { data } = await api.get(BASE, { params });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch blood inventory");

  return {
    success: true,
    data: data.data ?? [],
    stats: data.stats ?? {
      total_locations: 0,
      total_units: 0,
      by_blood_type: {},
      by_location: {},
      low_stock: 0,
      critical_stock: 0,
      out_of_stock: 0,
    },
  };
};

// ─── GET SINGLE INVENTORY ITEM ────────────────────────────────────────────────
export const getInventoryItem = async (id) => {
  if (!id) throw new Error("Inventory ID is required");

  const { data } = await api.get(BASE, { params: { id } });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch inventory item");

  return { success: true, data: data.data };
};

// ─── GET UNIQUE LOCATIONS ─────────────────────────────────────────────────────
export const getLocations = async () => {
  const { data } = await api.get(BASE, { params: { action: "locations" } });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch locations");

  return { success: true, data: data.data };
};

// ─── CREATE INVENTORY ITEM ────────────────────────────────────────────────────
export const createInventoryItem = async (itemData) => {
  // Validate required fields
  const required = [
    "location_name",
    "blood_type",
    "units_available",
    "contact_number",
    "address",
    "latitude",
    "longitude",
  ];
  for (const field of required) {
    if (!itemData[field] && itemData[field] !== 0) {
      throw new Error(`${field.replace("_", " ")} is required`);
    }
  }

  const { data } = await api.post(BASE, itemData);

  if (!data.success)
    throw new Error(data.message || "Failed to create inventory item");

  return { success: true, message: data.message, id: data.id };
};

// ─── UPDATE INVENTORY ITEM ────────────────────────────────────────────────────
export const updateInventoryItem = async (id, itemData) => {
  if (!id) throw new Error("Inventory ID is required");

  const { data } = await api.put(BASE, itemData, {
    params: { id },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to update inventory item");

  return { success: true, message: data.message };
};

// ─── DELETE INVENTORY ITEM ────────────────────────────────────────────────────
export const deleteInventoryItem = async (id) => {
  if (!id) throw new Error("Inventory ID is required");

  const { data } = await api.delete(BASE, { params: { id } });
  if (!data.success)
    throw new Error(data.message || "Failed to delete inventory item");

  return { success: true, message: data.message };
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
export const getBloodTypeColor = (bloodType) => {
  const type = BLOOD_TYPES.find((t) => t.value === bloodType);
  return type ? type.color : "#6b7280";
};

export const getStockStatus = (units) => {
  if (units === 0) return { label: "Out of Stock", color: "#6b7280" };
  if (units < 10) return STOCK_STATUS.CRITICAL;
  if (units < 20) return STOCK_STATUS.LOW;
  return STOCK_STATUS.NORMAL;
};

export const formatUnits = (units) => {
  return `${units} unit${units !== 1 ? "s" : ""}`;
};

export default {
  getBloodInventory,
  getInventoryItem,
  getLocations,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  BLOOD_TYPES,
  STOCK_STATUS,
  getBloodTypeColor,
  getStockStatus,
  formatUnits,
};
