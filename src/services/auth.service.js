import api from "./api";

// auth.php lives at: backend/api/auth.php
// register.php lives at: backend/api/register.php
const AUTH = "/api/auth.php";
const REGISTER = "/api/register.php";

// Google reCAPTCHA site key
// export const RECAPTCHA_SITE_KEY = "6LdKInQsAAAAAFJZRd65k9ftb0AqHunJZehNU7fu";

const authService = {
  // ── LOGIN ───────────────────────────────────────────────────────────────────
  async login(username, password) {
    const response = await api.post(
      AUTH,
      { username, password },
      {
        params: { action: "login" },
      },
    );

    if (response.data.success) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data;
    }

    throw new Error(response.data.message || "Login failed");
  },

  // ── REGISTER ────────────────────────────────────────────────────────────────
  async register(userData) {
    try {
      let response;

      // If userData is FormData (with files), send directly
      if (userData instanceof FormData) {
        response = await api.post(REGISTER, userData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await api.post(REGISTER, userData);
      }

      // Handle mixed PHP warnings + JSON response
      let data = response.data;
      if (typeof data === "string") {
        // Strip PHP warnings and extract JSON
        const jsonMatch = data.match(/\{.*\}/s);
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0]);
        }
      }

      return data;
    } catch (error) {
      // Extract error message from response
      const message =
        error.response?.data?.message || error.message || "Registration failed";

      throw new Error(message);
    }
  },

  // ── VERIFY EMAIL ────────────────────────────────────────────────────────────
  async verifyEmail(token) {
    try {
      const response = await api.post("/api/verify-email.php", { token });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Email verification failed";
      throw new Error(message);
    }
  },

  // ── LOGOUT ──────────────────────────────────────────────────────────────────
  async logout() {
    try {
      await api.post(AUTH, {}, { params: { action: "logout" } });
    } catch (_) {
      // ignore network errors — still clear local state
    } finally {
      localStorage.removeItem("user");
      // Also clear Firebase state if needed
      try {
        const { getAuth, signOut } = await import("firebase/auth");
        const auth = getAuth();
        await signOut(auth);
      } catch (e) {
        // Firebase might not be initialized, ignore
      }
      window.location.href = "/login";
    }
  },

  // ── SESSION CHECK ────────────────────────────────────────────────────────────
  async checkSession() {
    try {
      const response = await api.get(AUTH, { params: { action: "check" } });

      // If session is valid, update localStorage
      if (response.data.success && response.data.loggedIn) {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          // Update existing user data if needed
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...currentUser,
              ...response.data.user,
            }),
          );
        }
      }

      return response.data;
    } catch {
      return { success: false, loggedIn: false };
    }
  },

  // ── LOCAL HELPERS ────────────────────────────────────────────────────────────
  getCurrentUser() {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },

  getCurrentUserId() {
    const user = this.getCurrentUser();
    return user?.user_id || null;
  },

  getCurrentUserName() {
    const user = this.getCurrentUser();
    return user?.full_name || user?.username || "User";
  },

  getCurrentUserEmail() {
    const user = this.getCurrentUser();
    return user?.email || null;
  },

  isAuthenticated() {
    return !!this.getCurrentUser();
  },

  isAdmin() {
    const user = this.getCurrentUser();
    // Check for any admin role (super_admin, safety_admin, welfare_admin, etc.)
    return user?.role?.includes("_admin") || user?.is_admin === 1;
  },

  // ── NEW: Get admin role type ─────────────────────────────────────────────────
  getAdminRole() {
    const user = this.getCurrentUser();
    if (!this.isAdmin()) return null;
    return user?.role;
  },

  // ── NEW: Check if super admin ────────────────────────────────────────────────
  isSuperAdmin() {
    const user = this.getCurrentUser();
    return user?.role === "super_admin";
  },

  // ── NEW: Check if service admin ──────────────────────────────────────────────
  isServiceAdmin() {
    const user = this.getCurrentUser();
    const serviceRoles = [
      "safety_admin",
      "welfare_admin",
      "health_admin",
      "disaster_admin",
      "youth_admin",
    ];
    return serviceRoles.includes(user?.role);
  },

  // ── NEW: Get user's service area (for service admins) ────────────────────────
  getServiceArea() {
    const user = this.getCurrentUser();
    const serviceMap = {
      safety_admin: "safety",
      welfare_admin: "welfare",
      health_admin: "health",
      disaster_admin: "disaster",
      youth_admin: "youth",
      super_admin: "all",
    };
    return serviceMap[user?.role] || null;
  },

  // ── UPDATE USER DATA ─────────────────────────────────────────────────────────
  updateUserData(userData) {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    }
    return null;
  },

  // ── CLEAR USER DATA ─────────────────────────────────────────────────────────
  clearUserData() {
    localStorage.removeItem("user");
  },
};

export default authService;
