// API Configuration Utility
const getApiBaseUrl = () => {
  // Check if we're in production
  const isProduction = import.meta.env.PROD;

  // Get environment variables
  const prodApiUrl = import.meta.env.VITE_API_URL;
  const localApiUrl = import.meta.env.VITE_LOCAL_API_URL;
  const useLocalApi = import.meta.env.VITE_USE_LOCAL_API === "true";

  // Determine which URL to use
  if (isProduction) {
    // In production, always use the production API URL
    return prodApiUrl;
  } else {
    // In development, use local if enabled, otherwise production
    return useLocalApi ? localApiUrl : prodApiUrl;
  }
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),

  // API Endpoints
  ENDPOINTS: {
    // Auth
    LOGIN: "/auth.php?action=login",
    LOGOUT: "/auth.php?action=logout",
    CHECK_AUTH: "/auth.php?action=check",
    REGISTER: "/register.php",
    VERIFY_EMAIL: "/verify-email.php",

    // Users
    USERS: "/users.php",
    USER_DOCUMENTS: "/users.php?action=docs",
    USER_STATS: "/users.php?action=stats",

    // Announcements
    ANNOUNCEMENTS: "/announcements.php",

    // Blood Bank
    BLOOD_BANK: "/blood_bank.php",
    BLOOD_LOCATIONS: "/blood_bank.php?action=locations",

    // Events
    EVENTS: "/events.php",
    EVENT_DETAILS: "/events.php?action=details",
    EVENT_STATS: "/events.php?action=stats",

    // Registrations
    REGISTRATIONS: "/registrations.php",
    MY_REGISTRATIONS: "/registrations.php?action=my-registrations",

    // Training
    TRAINING_SESSIONS: "/training_sessions.php",
    TRAINING_SESSION_DETAILS: "/training_sessions.php?action=details",
    TRAINING_STATS: "/training_sessions.php?action=stats",
    TRAINING_REQUESTS: "/training_requests.php",
    MY_TRAINING_REQUESTS: "/training_requests.php?action=my-requests",
    SESSION_REGISTRATIONS: "/session_registrations.php",
    MY_SESSION_REGISTRATIONS:
      "/session_registrations.php?action=my-registrations",

    // Inventory
    INVENTORY: "/inventory.php?action=inventory",
    VEHICLES: "/inventory.php?action=vehicles",
    CATEGORIES: "/inventory.php?action=categories",
    MAINTENANCE: "/inventory.php?action=maintenance",

    // Merchandise
    MERCHANDISE: "/merchandise.php",

    // Volunteers
    VOLUNTEERS: "/volunteers.php",

    // Notifications
    NOTIFICATIONS: "/notifications.php",
    UNREAD_COUNT: "/notifications.php?action=unread-count",

    // Reports
    REPORTS: "/reports.php",
    REPORT_SUMMARY: "/reports.php?action=summary",

    // Chat
    CHAT_UPLOAD: "/chat_uploads.php?action=upload",
    CHAT_DOWNLOAD: "/chat_uploads.php?action=download",
  },

  // Helper function to get full URL for an endpoint
  getUrl: (endpoint) => {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
  },

  // Helper function to get URL with query parameters
  getUrlWithParams: (endpoint, params = {}) => {
    const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ""
      ) {
        url.searchParams.append(key, params[key]);
      }
    });
    return url.toString();
  },
};
