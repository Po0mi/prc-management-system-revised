/**
 * usersApi.js
 * Path: src/services/usersApi.js
 *
 * PHP response shape (users.php):
 *   { success: true, message: "OK", users: [...], total: N }
 *   { success: true, message: "OK", stats: {...} }
 *   { success: true, message: "OK", documents: [...] }
 *   { success: false, message: "..." }
 */
import api from "./api";

const BASE = "/api/users.php";

// ─── GET USERS ────────────────────────────────────────────────────────────────
export const getUsers = async ({ filter = "all", search = "" } = {}) => {
  const params = { action: "list", filter };
  if (search.trim()) params.search = search.trim();

  const { data } = await api.get(BASE, { params });
  // data = { success, message, users: [...], total: N }
  if (!data.success) throw new Error(data.message || "Failed to fetch users");
  return { success: true, users: data.users ?? [], total: data.total ?? 0 };
};

// ─── GET STATS ────────────────────────────────────────────────────────────────
export const getUserStats = async () => {
  const { data } = await api.get(BASE, { params: { action: "stats" } });
  // data = { success, message, stats: { total, admins, users, rcy_members, new_this_week } }
  if (!data.success) throw new Error(data.message || "Failed to fetch stats");
  return { success: true, stats: data.stats };
};

// ─── GET DOCUMENTS ────────────────────────────────────────────────────────────
export const getUserDocuments = async (userId) => {
  if (!userId) throw new Error("User ID is required");
  const { data } = await api.get(BASE, {
    params: { action: "docs", user_id: userId },
  });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch documents");
  return { success: true, documents: data.documents ?? [] };
};

// ─── CREATE USER ──────────────────────────────────────────────────────────────
export const createUser = async (userData) => {
  if (!userData.username?.trim()) throw new Error("Username is required");
  if (!userData.password?.trim()) throw new Error("Password is required");
  if (!userData.full_name?.trim()) throw new Error("Full name is required");

  const { data } = await api.post(BASE, userData, {
    params: { action: "create" },
  });
  if (!data.success) throw new Error(data.message || "Failed to create user");
  return { success: true, message: data.message, user_id: data.user_id };
};

// ─── UPDATE USER ──────────────────────────────────────────────────────────────
export const updateUser = async (id, userData) => {
  if (!id) throw new Error("User ID is required");

  // Strip empty strings (except password — empty means "keep current")
  const payload = Object.fromEntries(
    Object.entries(userData).filter(([k, v]) => k === "password" || v !== ""),
  );

  const { data } = await api.put(BASE, payload, {
    params: { action: "update", id },
  });
  if (!data.success) throw new Error(data.message || "Failed to update user");
  return { success: true, message: data.message };
};

// ─── DELETE USER ──────────────────────────────────────────────────────────────
export const deleteUser = async (id) => {
  if (!id) throw new Error("User ID is required");
  const { data } = await api.delete(BASE, { params: { action: "delete", id } });
  if (!data.success) throw new Error(data.message || "Failed to delete user");
  return { success: true, message: data.message };
};

export default {
  getUsers,
  getUserStats,
  getUserDocuments,
  createUser,
  updateUser,
  deleteUser,
};
