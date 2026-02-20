/**
 * reportsApi.js
 * Path: src/services/reportsApi.js
 *
 * API service for reports and analytics
 */
import api from "./api";

const BASE = "/api/reports.php";

// ─── GET DASHBOARD SUMMARY ───────────────────────────────────────────────────
export const getReportSummary = async () => {
  try {
    const { data } = await api.get(BASE, { params: { action: "summary" } });
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch summary");
    }
    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error fetching report summary:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

// ─── GET USERS REPORT ────────────────────────────────────────────────────────
export const getUsersReport = async (filters = {}) => {
  try {
    const params = { action: "users", ...filters };
    const { data } = await api.get(BASE, { params });
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch users report");
    }
    return {
      success: true,
      data: data.data,
      stats: data.stats,
    };
  } catch (error) {
    console.error("Error fetching users report:", error);
    return {
      success: false,
      error: error.message,
      data: [],
      stats: {},
    };
  }
};

// ─── GET EVENTS REPORT ───────────────────────────────────────────────────────
export const getEventsReport = async (filters = {}) => {
  try {
    const params = { action: "events", ...filters };
    const { data } = await api.get(BASE, { params });
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch events report");
    }
    return {
      success: true,
      data: data.data,
      stats: data.stats,
    };
  } catch (error) {
    console.error("Error fetching events report:", error);
    return {
      success: false,
      error: error.message,
      data: [],
      stats: {},
    };
  }
};

// ─── GET TRAINING REPORT ─────────────────────────────────────────────────────
export const getTrainingReport = async (filters = {}) => {
  try {
    const params = { action: "training", ...filters };
    const { data } = await api.get(BASE, { params });
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch training report");
    }
    return {
      success: true,
      data: data.data,
      stats: data.stats,
    };
  } catch (error) {
    console.error("Error fetching training report:", error);
    return {
      success: false,
      error: error.message,
      data: [],
      stats: {},
    };
  }
};

// ─── GET VOLUNTEERS REPORT ───────────────────────────────────────────────────
export const getVolunteersReport = async (filters = {}) => {
  try {
    const params = { action: "volunteers", ...filters };
    const { data } = await api.get(BASE, { params });
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch volunteers report");
    }
    return {
      success: true,
      data: data.data,
      stats: data.stats,
    };
  } catch (error) {
    console.error("Error fetching volunteers report:", error);
    return {
      success: false,
      error: error.message,
      data: [],
      stats: {},
    };
  }
};

// ─── GET INVENTORY REPORT ────────────────────────────────────────────────────
export const getInventoryReport = async (filters = {}) => {
  try {
    const params = { action: "inventory", ...filters };
    const { data } = await api.get(BASE, { params });
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch inventory report");
    }
    return {
      success: true,
      data: data.data,
      stats: data.stats,
    };
  } catch (error) {
    console.error("Error fetching inventory report:", error);
    return {
      success: false,
      error: error.message,
      data: [],
      stats: {},
    };
  }
};

// ─── EXPORT REPORT ───────────────────────────────────────────────────────────
export const exportReport = async (reportType, filters = {}) => {
  try {
    const formData = new FormData();
    formData.append("action", "export");
    formData.append("report_type", reportType);
    formData.append("filters", JSON.stringify(filters));

    const response = await api.post(BASE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      responseType: "blob",
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${reportType}_report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Error exporting report:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  getReportSummary,
  getUsersReport,
  getEventsReport,
  getTrainingReport,
  getVolunteersReport,
  getInventoryReport,
  exportReport,
};
