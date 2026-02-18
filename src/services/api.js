import axios from "axios";

// ── Relative baseURL — Vite proxy forwards to XAMPP, no CORS ever ─────────────
// /auth.php      → proxy → http://localhost/prc-management-system/backend/auth.php
// /api/users.php → proxy → http://localhost/prc-management-system/backend/api/users.php
const api = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  withCredentials: true,
  timeout: 30000,
});

// ── Request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log("🚀 API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        params: config.params,
      });
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log("✅ API Response:", {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error("❌ API Error:", {
        message: error.message,
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/login")
    ) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
