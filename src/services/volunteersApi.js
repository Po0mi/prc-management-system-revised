// Path: src/services/volunteersApi.js
const API_URL =
  "http://localhost/prc-management-system/backend/api/volunteers.php";

// Helper function to handle responses
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
};

// Helper function to get auth headers
const getHeaders = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return {
    "Content-Type": "application/json",
    "User-ID": user?.user_id || "",
  };
};

// Get all volunteers with optional filters
export const getVolunteers = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.search) queryParams.append("search", filters.search);
    if (filters.service) queryParams.append("service", filters.service);
    if (filters.status) queryParams.append("status", filters.status);

    const url = `${API_URL}${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

    const response = await fetch(url, {
      headers: getHeaders(),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching volunteers:", error);
    throw error;
  }
};

// Get single volunteer by ID
export const getVolunteer = async (id) => {
  try {
    const response = await fetch(`${API_URL}?id=${id}`, {
      headers: getHeaders(),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching volunteer:", error);
    throw error;
  }
};

// Create new volunteer
export const createVolunteer = async (volunteerData) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(volunteerData),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error("Error creating volunteer:", error);
    throw error;
  }
};

// Update volunteer
export const updateVolunteer = async (id, volunteerData) => {
  try {
    const response = await fetch(`${API_URL}?id=${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(volunteerData),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error("Error updating volunteer:", error);
    throw error;
  }
};

// Delete volunteer
export const deleteVolunteer = async (id) => {
  try {
    const response = await fetch(`${API_URL}?id=${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error("Error deleting volunteer:", error);
    throw error;
  }
};

// Service options for dropdowns
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

// Status options for dropdowns
export const STATUS_OPTIONS = [
  { value: "current", label: "Current", icon: "fa-solid fa-check-circle" },
  {
    value: "graduated",
    label: "Graduated",
    icon: "fa-solid fa-graduation-cap",
  },
];

// Format service label for display
export const formatService = (service) => {
  const option = SERVICE_OPTIONS.find((opt) => opt.value === service);
  return option
    ? option.label
    : service.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// Format status label for display
export const formatStatus = (status) => {
  const option = STATUS_OPTIONS.find((opt) => opt.value === status);
  return option
    ? option.label
    : status.charAt(0).toUpperCase() + status.slice(1);
};
