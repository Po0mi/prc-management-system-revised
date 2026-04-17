import axios from "axios";

// Determine which base URL to use
const getBaseURL = () => {
  const useLocal = import.meta.env.VITE_USE_LOCAL_API === "true";

  if (useLocal) {
    return import.meta.env.VITE_LOCAL_API_URL; // http://localhost/prc-management-system/backend
  }

  return import.meta.env.VITE_API_URL; // https://philippineredcross-iloilochapter.org
};

const api = axios.create({
  baseURL: getBaseURL(), // ← THIS is the key change!
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
    const status = error.response?.status;
    // 404s are often expected (deleted items, empty lookups) — log as warning not error
    if (import.meta.env.DEV) {
      const log = status === 404 ? console.warn : console.error;
      log("❌ API Error:", {
        message: error.message,
        url: error.config?.url,
        status,
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
