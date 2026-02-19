/**
 * inventoryApi.js
 * Path: src/services/inventoryApi.js
 *
 * API service for inventory and vehicle management
 */
import api from "./api";

const BASE = "/api/inventory.php";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export const SERVICE_AREAS = [
  { value: "health", label: "Health Services", color: "#c41e3a" },
  { value: "safety", label: "Safety Services", color: "#15803d" },
  { value: "welfare", label: "Welfare Services", color: "#7c3aed" },
  { value: "disaster", label: "Disaster Management", color: "#c2410c" },
  { value: "youth", label: "Red Cross Youth", color: "#003d6b" },
  { value: "super", label: "Super Admin", color: "#6b7280" },
];

export const VEHICLE_STATUS = [
  { value: "operational", label: "Operational", color: "#10b981" },
  { value: "maintenance", label: "In Maintenance", color: "#f59e0b" },
  { value: "out_of_service", label: "Out of Service", color: "#ef4444" },
];

export const VEHICLE_FUEL_TYPES = [
  { value: "gasoline", label: "Gasoline", icon: "fa-solid fa-gas-pump" },
  { value: "diesel", label: "Diesel", icon: "fa-solid fa-gas-pump" },
  { value: "hybrid", label: "Hybrid", icon: "fa-solid fa-car" },
  {
    value: "electric",
    label: "Electric",
    icon: "fa-solid fa-charging-station",
  },
];

export const MAINTENANCE_TYPES = [
  { value: "routine", label: "Routine", color: "#10b981" },
  { value: "repair", label: "Repair", color: "#f59e0b" },
  { value: "inspection", label: "Inspection", color: "#3b82f6" },
  { value: "emergency", label: "Emergency", color: "#ef4444" },
];

export const INVENTORY_UNITS = [
  { value: "pcs", label: "Pieces" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "kg", label: "Kilogram" },
  { value: "liter", label: "Liter" },
  { value: "meter", label: "Meter" },
];

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export const getCategories = async (type = "inventory") => {
  const { data } = await api.get(BASE, {
    params: { action: "categories", type },
  });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch categories");

  return { success: true, data: data.data };
};

// ─── INVENTORY ITEMS ─────────────────────────────────────────────────────────

export const getInventoryItems = async (filters = {}) => {
  const params = { action: "inventory", ...filters };

  const { data } = await api.get(BASE, { params });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch inventory items");

  return {
    success: true,
    data: data.data ?? [],
    stats: data.stats ?? {
      total_items: 0,
      total_value: 0,
      low_stock: 0,
      out_of_stock: 0,
      by_service_area: {},
      by_category: {},
    },
  };
};

export const getInventoryItem = async (id) => {
  if (!id) throw new Error("Item ID is required");

  const { data } = await api.get(BASE, { params: { action: "inventory", id } });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch inventory item");

  return { success: true, data: data.data };
};

export const createInventoryItem = async (itemData) => {
  // Validate required fields
  const required = [
    "item_code",
    "item_name",
    "category_id",
    "current_stock",
    "unit",
    "service_area",
  ];
  for (const field of required) {
    if (!itemData[field] && itemData[field] !== 0) {
      throw new Error(`${field.replace(/_/g, " ")} is required`);
    }
  }

  const { data } = await api.post(BASE, itemData, {
    params: { action: "inventory" },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to create inventory item");

  return { success: true, message: data.message, id: data.id, data: data.data };
};

export const updateInventoryItem = async (id, itemData) => {
  if (!id) throw new Error("Item ID is required");

  const { data } = await api.put(BASE, itemData, {
    params: { action: "inventory", id },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to update inventory item");

  return { success: true, message: data.message, data: data.data };
};

export const deleteInventoryItem = async (id) => {
  if (!id) throw new Error("Item ID is required");

  const { data } = await api.delete(BASE, {
    params: { action: "inventory", id },
  });
  if (!data.success)
    throw new Error(data.message || "Failed to delete inventory item");

  return { success: true, message: data.message };
};

// ─── VEHICLES ────────────────────────────────────────────────────────────────

export const getVehicles = async (filters = {}) => {
  const params = { action: "vehicles", ...filters };

  const { data } = await api.get(BASE, { params });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch vehicles");

  return {
    success: true,
    data: data.data ?? [],
    stats: data.stats ?? {
      total_vehicles: 0,
      operational: 0,
      maintenance: 0,
      out_of_service: 0,
      maintenance_due: 0,
      by_service_area: {},
      by_category: {},
    },
  };
};

export const getVehicle = async (id) => {
  if (!id) throw new Error("Vehicle ID is required");

  const { data } = await api.get(BASE, { params: { action: "vehicles", id } });
  if (!data.success) throw new Error(data.message || "Failed to fetch vehicle");

  return { success: true, data: data.data };
};

export const createVehicle = async (vehicleData) => {
  // Validate required fields
  const required = [
    "vehicle_code",
    "vehicle_name",
    "category_id",
    "plate_number",
    "model",
    "year",
    "fuel_type",
    "service_area",
  ];
  for (const field of required) {
    if (!vehicleData[field]) {
      throw new Error(`${field.replace(/_/g, " ")} is required`);
    }
  }

  const { data } = await api.post(BASE, vehicleData, {
    params: { action: "vehicles" },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to create vehicle");

  return { success: true, message: data.message, id: data.id, data: data.data };
};

export const updateVehicle = async (id, vehicleData) => {
  if (!id) throw new Error("Vehicle ID is required");

  const { data } = await api.put(BASE, vehicleData, {
    params: { action: "vehicles", id },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to update vehicle");

  return { success: true, message: data.message, data: data.data };
};

export const deleteVehicle = async (id) => {
  if (!id) throw new Error("Vehicle ID is required");

  const { data } = await api.delete(BASE, {
    params: { action: "vehicles", id },
  });
  if (!data.success)
    throw new Error(data.message || "Failed to delete vehicle");

  return { success: true, message: data.message };
};

// ─── MAINTENANCE RECORDS ─────────────────────────────────────────────────────

export const getVehicleMaintenance = async (vehicleId) => {
  if (!vehicleId) throw new Error("Vehicle ID is required");

  const { data } = await api.get(BASE, {
    params: { action: "vehicles", maintenance: true, vehicle_id: vehicleId },
  });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch maintenance records");

  return { success: true, data: data.data };
};

export const addMaintenanceRecord = async (recordData) => {
  // Validate required fields
  const required = [
    "vehicle_id",
    "maintenance_type",
    "description",
    "maintenance_date",
  ];
  for (const field of required) {
    if (!recordData[field]) {
      throw new Error(`${field.replace(/_/g, " ")} is required`);
    }
  }

  const { data } = await api.post(BASE, recordData, {
    params: { action: "maintenance" },
  });

  if (!data.success)
    throw new Error(data.message || "Failed to add maintenance record");

  return { success: true, message: data.message, id: data.id, data: data.data };
};

export const deleteMaintenanceRecord = async (id) => {
  if (!id) throw new Error("Maintenance record ID is required");

  const { data } = await api.delete(BASE, {
    params: { action: "maintenance", id },
  });
  if (!data.success)
    throw new Error(data.message || "Failed to delete maintenance record");

  return { success: true, message: data.message };
};

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

export const getServiceAreaColor = (area) => {
  const option = SERVICE_AREAS.find((a) => a.value === area);
  return option ? option.color : "#6b7280";
};

export const getVehicleStatusColor = (status) => {
  const option = VEHICLE_STATUS.find((s) => s.value === status);
  return option ? option.color : "#6b7280";
};

export const getMaintenanceTypeColor = (type) => {
  const option = MAINTENANCE_TYPES.find((t) => t.value === type);
  return option ? option.color : "#6b7280";
};

export const getStockStatus = (current, minimum) => {
  if (current === 0) return { label: "Out of Stock", color: "#ef4444" };
  if (current <= minimum) return { label: "Low Stock", color: "#f59e0b" };
  return { label: "In Stock", color: "#10b981" };
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
};

export default {
  getCategories,
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleMaintenance,
  addMaintenanceRecord,
  deleteMaintenanceRecord,
  SERVICE_AREAS,
  VEHICLE_STATUS,
  VEHICLE_FUEL_TYPES,
  MAINTENANCE_TYPES,
  INVENTORY_UNITS,
  getServiceAreaColor,
  getVehicleStatusColor,
  getMaintenanceTypeColor,
  getStockStatus,
  formatCurrency,
};
