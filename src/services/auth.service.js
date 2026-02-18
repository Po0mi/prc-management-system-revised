import api from "./api";

// auth.php lives at: backend/api/auth.php
// register.php lives at: backend/api/register.php
const AUTH = "/api/auth.php";
const REGISTER = "/api/register.php";

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
      window.location.href = "/login";
    }
  },

  // ── SESSION CHECK ────────────────────────────────────────────────────────────
  async checkSession() {
    try {
      const response = await api.get(AUTH, { params: { action: "check" } });
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

  isAuthenticated() {
    return !!this.getCurrentUser();
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user?.role === "admin" || user?.is_admin === 1;
  },
};

export default authService;
