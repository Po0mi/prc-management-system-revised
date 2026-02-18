import { useState, useEffect, useCallback, useRef } from "react";
import "./AdminUsers.scss";
import {
  getUsers,
  getUserStats,
  getUserDocuments,
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  deleteUser as apiDeleteUser,
} from "../../services/usersApi";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  super: { label: "SUPER", color: "#c41e3a", bg: "#fef2f2", icon: "fa-bolt" },
  admin: {
    label: "ADMIN",
    color: "#1d4ed8",
    bg: "#eff6ff",
    icon: "fa-shield-halved",
  },
  safety: {
    label: "SAFETY",
    color: "#15803d",
    bg: "#f0fdf4",
    icon: "fa-shield",
  },
  welfare: {
    label: "WELFARE",
    color: "#7c3aed",
    bg: "#faf5ff",
    icon: "fa-hands-holding",
  },
  health: {
    label: "HEALTH",
    color: "#c41e3a",
    bg: "#fff1f2",
    icon: "fa-heart-pulse",
  },
  disaster: {
    label: "DISASTER",
    color: "#c2410c",
    bg: "#fff7ed",
    icon: "fa-triangle-exclamation",
  },
  youth: {
    label: "YOUTH",
    color: "#003d6b",
    bg: "#f0f9ff",
    icon: "fa-people-group",
  },
  user: { label: "USER", color: "#4a5568", bg: "#f7fafc", icon: "fa-user" },
};

const SERVICE_OPTIONS = [
  { key: "health", label: "Health Services", icon: "fa-heart-pulse" },
  { key: "safety", label: "Safety Services", icon: "fa-shield" },
  { key: "welfare", label: "Welfare Services", icon: "fa-hands-holding" },
  {
    key: "disaster_management",
    label: "Disaster Management",
    icon: "fa-triangle-exclamation",
  },
  { key: "red_cross_youth", label: "Red Cross Youth", icon: "fa-people-group" },
];

const EMPTY_FORM = {
  username: "",
  password: "",
  full_name: "",
  first_name: "",
  last_name: "",
  role: "user",
  admin_role: "",
  email: "",
  phone: "",
  gender: "",
  user_type: "non_rcy_member",
  rcy_role: "",
  services: [],
};

const DOC_TYPE_LABEL = {
  maab_id: "MAAB ID",
  supporting_document: "Supporting Doc",
  other: "Other",
};

const STAT_CARD_META = [
  { key: "total", icon: "fa-users", label: "Total Users", color: "#c41e3a" },
  {
    key: "admins",
    icon: "fa-shield-halved",
    label: "Administrators",
    color: "#1d4ed8",
  },
  { key: "users", icon: "fa-user", label: "Regular Users", color: "#7c3aed" },
  {
    key: "rcy_members",
    icon: "fa-heart",
    label: "RCY Members",
    color: "#c41e3a",
  },
];

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({ name, role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";
  return (
    <div
      className="au-avatar"
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `2px solid ${cfg.color}33`,
      }}
    >
      {initials}
    </div>
  );
}

// ─── ROLE BADGE ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  return (
    <span
      className="au-badge"
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}33`,
      }}
    >
      <i className={`fas ${cfg.icon}`} /> {cfg.label}
    </span>
  );
}

// ─── SERVICE BADGE ────────────────────────────────────────────────────────────
function ServiceBadge({ serviceKey }) {
  const svc = SERVICE_OPTIONS.find((s) => s.key === serviceKey);
  if (!svc) return null;
  return (
    <span className="au-service-badge">
      <i className={`fas ${svc.icon}`} /> {svc.label}
    </span>
  );
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`au-toast au-toast--${type}`}>
      <i
        className={`fas ${type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`}
      />
      {message}
      <button className="au-toast__close" onClick={onClose}>
        <i className="fas fa-xmark" />
      </button>
    </div>
  );
}

// ─── DOCUMENTS MODAL ─────────────────────────────────────────────────────────
function DocsModal({ user, onClose }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserDocuments(user.user_id)
      .then((r) => {
        setDocs(r.documents);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user.user_id]);

  const docItemClass = (type) => {
    const map = {
      maab_id: "--maab",
      supporting_document: "--supporting",
      other: "--other",
    };
    return `au-docs__item au-docs__item${map[type] || "--other"}`;
  };

  return (
    <div className="au-overlay" onClick={onClose}>
      <div
        className="au-modal au-modal--sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="au-modal__header">
          <span>
            <i className="fas fa-folder-open" /> Documents —{" "}
            <strong>{user.username}</strong>
          </span>
          <button className="au-modal__close" onClick={onClose}>
            <i className="fas fa-xmark" />
          </button>
        </div>
        <div className="au-modal__body au-modal__body--docs">
          {loading ? (
            <div className="au-docs__loading">
              <i className="fas fa-spinner fa-spin au-docs__empty-icon" />
              <p>Loading documents…</p>
            </div>
          ) : docs.length === 0 ? (
            <div className="au-docs__empty">
              <i className="fas fa-folder-open au-docs__empty-icon" />
              <p className="au-docs__empty-title">No Documents Found</p>
              <p className="au-docs__empty-sub">
                This user hasn't uploaded any documents yet.
              </p>
            </div>
          ) : (
            <div className="au-docs">
              {docs.map((doc, i) => (
                <div key={i} className={docItemClass(doc.document_type)}>
                  <div className="au-docs__file-icon">
                    <i
                      className={`fas ${doc.file_type === "pdf" ? "fa-file-pdf" : "fa-file-image"}`}
                    />
                  </div>
                  <div className="au-docs__info">
                    <div className="au-docs__name">{doc.original_name}</div>
                    <div className="au-docs__meta">
                      <span className="au-docs__type-tag">
                        {DOC_TYPE_LABEL[doc.document_type] || "Other"}
                      </span>
                      {(doc.file_size / 1024).toFixed(1)} KB •{" "}
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>
                  <a
                    href={`http://localhost/prc-management-system/${doc.file_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="au-docs__view-link"
                  >
                    <i className="fas fa-arrow-up-right-from-square" /> View
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── USER FORM MODAL ─────────────────────────────────────────────────────────
function UserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState(
    user
      ? { ...user, password: "", services: user.services || [] }
      : { ...EMPTY_FORM },
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const isEdit = !!user;
  const isRCY = form.user_type === "rcy_member";

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function toggleService(key) {
    set(
      "services",
      form.services.includes(key)
        ? form.services.filter((s) => s !== key)
        : [...form.services, key],
    );
  }

  function validate() {
    const e = {};
    if (!form.username.trim()) e.username = "Required";
    if (!isEdit && !form.password.trim()) e.password = "Required for new users";
    if (!form.full_name.trim()) e.full_name = "Required";
    if (!form.role) e.role = "Required";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      const res = isEdit
        ? await apiUpdateUser(user.user_id, payload)
        : await apiCreateUser(payload);
      onSaved(res.message || "Saved successfully");
    } catch (err) {
      setErrors({ _global: err.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="au-overlay" onClick={onClose}>
      <div
        className="au-modal au-modal--md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="au-modal__header">
          <span>
            <i className={`fas ${isEdit ? "fa-user-pen" : "fa-user-plus"}`} />
            {isEdit ? " Edit User" : " Create User"}
          </span>
          <button className="au-modal__close" onClick={onClose}>
            <i className="fas fa-xmark" />
          </button>
        </div>

        <form className="au-modal__body" onSubmit={handleSubmit}>
          {errors._global && (
            <div className="au-form__error-banner">
              <i className="fas fa-circle-exclamation" /> {errors._global}
            </div>
          )}

          {/* Username + Password */}
          <div className="au-form__row">
            <div className="au-form__field au-form__field--no-mb">
              <label className="au-form__label">
                Username <span className="au-form__required">*</span>
              </label>
              <input
                className={`au-form__input${errors.username ? " au-form__input--error" : ""}`}
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                placeholder="username"
              />
              {errors.username && (
                <span className="au-form__error-text">
                  <i className="fas fa-circle-exclamation" /> {errors.username}
                </span>
              )}
            </div>
            <div className="au-form__field au-form__field--no-mb">
              <label className="au-form__label">
                Password{" "}
                {!isEdit && <span className="au-form__required">*</span>}
              </label>
              <input
                className={`au-form__input${errors.password ? " au-form__input--error" : ""}`}
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder={
                  isEdit ? "Leave blank to keep current" : "Enter password"
                }
              />
              {errors.password && (
                <span className="au-form__error-text">
                  <i className="fas fa-circle-exclamation" /> {errors.password}
                </span>
              )}
            </div>
          </div>

          {/* Full Name */}
          <div className="au-form__field">
            <label className="au-form__label">
              Full Name <span className="au-form__required">*</span>
            </label>
            <input
              className={`au-form__input${errors.full_name ? " au-form__input--error" : ""}`}
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              placeholder="Full name"
            />
            {errors.full_name && (
              <span className="au-form__error-text">
                <i className="fas fa-circle-exclamation" /> {errors.full_name}
              </span>
            )}
          </div>

          {/* First + Last */}
          <div className="au-form__row">
            <div className="au-form__field au-form__field--no-mb">
              <label className="au-form__label">First Name</label>
              <input
                className="au-form__input"
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="au-form__field au-form__field--no-mb">
              <label className="au-form__label">Last Name</label>
              <input
                className="au-form__input"
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Role + User Type */}
          <div className="au-form__row">
            <div className="au-form__field au-form__field--no-mb">
              <label className="au-form__label">
                Role <span className="au-form__required">*</span>
              </label>
              <select
                className={`au-form__select${errors.role ? " au-form__select--error" : ""}`}
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
              >
                <option value="user">User</option>
                <optgroup label="Administrators">
                  <option value="admin">Administrator</option>
                  <option value="safety">Safety Admin</option>
                  <option value="welfare">Welfare Admin</option>
                  <option value="health">Health Admin</option>
                  <option value="disaster">Disaster Admin</option>
                  <option value="youth">Youth Admin</option>
                </optgroup>
              </select>
            </div>
            <div className="au-form__field au-form__field--no-mb">
              <label className="au-form__label">User Type</label>
              <select
                className="au-form__select"
                value={form.user_type}
                onChange={(e) => set("user_type", e.target.value)}
              >
                <option value="non_rcy_member">Non-RCY Member</option>
                <option value="rcy_member">RCY Member</option>
              </select>
            </div>
          </div>

          {/* Email + Phone */}
          <div className="au-form__row">
            <div className="au-form__field au-form__field--no-mb">
              <label className="au-form__label">Email Address</label>
              <input
                className="au-form__input"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="au-form__field au-form__field--no-mb">
              <label className="au-form__label">Phone Number</label>
              <input
                className="au-form__input"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+63 XXX XXX XXXX"
              />
            </div>
          </div>

          {/* Gender + RCY Role */}
          <div className="au-form__row">
            <div className="au-form__field au-form__field--no-mb">
              <label className="au-form__label">Gender</label>
              <select
                className="au-form__select"
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
              >
                <option value="">— Select —</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            {isRCY && (
              <div className="au-form__field au-form__field--no-mb">
                <label className="au-form__label">RCY Role</label>
                <select
                  className="au-form__select"
                  value={form.rcy_role}
                  onChange={(e) => set("rcy_role", e.target.value)}
                >
                  <option value="">— Select —</option>
                  <option value="adviser">Adviser</option>
                  <option value="member">Member</option>
                </select>
              </div>
            )}
          </div>

          {/* RCY Services */}
          {isRCY && (
            <div className="au-form__services">
              <div className="au-form__services-title">
                <i className="fas fa-heart" /> RCY Member Services
              </div>
              <div className="au-form__services-hint">
                Select the services this RCY member will participate in:
              </div>
              <div className="au-form__services-grid">
                {SERVICE_OPTIONS.map((svc) => {
                  const checked = form.services.includes(svc.key);
                  return (
                    <label
                      key={svc.key}
                      className={`au-form__service-option${checked ? " au-form__service-option--checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(svc.key)}
                      />
                      <i className={`fas ${svc.icon}`} /> {svc.label}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} className="au-form__submit">
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Saving…
              </>
            ) : (
              <>
                <i className="fas fa-floppy-disk" /> Save User
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [docsUser, setDocsUser] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const searchRef = useRef();

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── STATS ──────────────────────────────────────────────────────────────────
  const refreshStats = useCallback(async () => {
    try {
      const { stats } = await getUserStats();
      setStats(stats);
    } catch (err) {
      console.error("Stats error:", err);
      // Non-fatal — don't show toast, stats just show fallback counts
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // ── USERS ──────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { users } = await getUsers({ filter, search });
      setUsers(users);
    } catch (err) {
      console.error("Fetch users error:", err);
      showToast(err.message || "Failed to load users", "error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── DELETE ─────────────────────────────────────────────────────────────────
  async function handleDelete(user) {
    if (
      !window.confirm(`Delete user "${user.username}"? This cannot be undone.`)
    )
      return;
    try {
      const res = await apiDeleteUser(user.user_id);
      showToast(res.message || "User deleted");
      fetchUsers();
      refreshStats();
    } catch (err) {
      showToast(err.message || "Failed to delete user", "error");
    }
  }

  // ── SAVED ──────────────────────────────────────────────────────────────────
  function handleSaved(msg) {
    showToast(msg);
    setEditUser(null);
    setCreateOpen(false);
    fetchUsers();
    refreshStats();
  }

  // ── DERIVED COUNTS ─────────────────────────────────────────────────────────
  const totalUsers = stats?.total ?? users.length;
  const admins =
    stats?.admins ?? users.filter((u) => u.role === "admin").length;
  const regularUsers =
    stats?.users ?? users.filter((u) => u.role !== "admin").length;
  const rcyMembers =
    stats?.rcy_members ??
    users.filter((u) => u.user_type === "rcy_member").length;

  const statValues = {
    total: totalUsers,
    admins,
    users: regularUsers,
    rcy_members: rcyMembers,
  };

  const FILTER_TABS = [
    { key: "all", label: "All", count: totalUsers },
    { key: "new", label: "New", count: stats?.new_this_week ?? 0 },
    { key: "admin", label: "Admins", count: admins },
    { key: "user", label: "Users", count: regularUsers },
  ];

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="au-root">
      {/* PAGE HEADER */}
      <div className="au-header">
        <div className="au-header__inner">
          <div>
            <div className="au-header__eyebrow">
              <i className="fas fa-users-cog" /> User Management
            </div>
            <h1 className="au-header__title">User Administration</h1>
            <p className="au-header__subtitle">
              Create, manage, and organize system users
            </p>
          </div>
          <div className="au-header__stats">
            {[
              { n: totalUsers, label: "Total Users" },
              { n: admins, label: "Admins" },
              { n: rcyMembers, label: "RCY Members" },
            ].map(({ n, label }) => (
              <div key={label}>
                <div className="au-header__stat-num">{n ?? "—"}</div>
                <div className="au-header__stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="au-body">
        {/* STAT CARDS */}
        <div className="au-cards">
          {STAT_CARD_META.map(({ key, icon, label, color }) => (
            <div className="au-card" key={key}>
              <div
                className="au-card__icon"
                style={{ background: color + "15" }}
              >
                <i className={`fas ${icon}`} style={{ color }} />
              </div>
              <div>
                <div className="au-card__num">{statValues[key] ?? "—"}</div>
                <div className="au-card__label">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="au-toolbar">
          <div className="au-toolbar__search">
            <i className="fas fa-magnifying-glass au-toolbar__search-icon" />
            <input
              ref={searchRef}
              className="au-toolbar__search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
            />
            {search && (
              <button
                className="au-toolbar__search-clear"
                onClick={() => setSearch("")}
              >
                <i className="fas fa-xmark" />
              </button>
            )}
          </div>

          <div className="au-toolbar__filters">
            {FILTER_TABS.map(({ key, label, count }) => (
              <button
                key={key}
                className={`au-toolbar__filter-btn${filter === key ? " au-toolbar__filter-btn--active" : ""}`}
                onClick={() => setFilter(key)}
              >
                {label} <span>({count})</span>
              </button>
            ))}
          </div>

          <button
            className="au-toolbar__create-btn"
            onClick={() => setCreateOpen(true)}
          >
            <i className="fas fa-user-plus" /> Create User
          </button>
        </div>

        {/* TABLE */}
        <div className="au-table-panel">
          <div className="au-table-panel__head">
            <span className="au-table-panel__title">
              <i className="fas fa-table-list" /> All System Users
            </span>
            {!loading && (
              <span className="au-table-panel__count">
                {users.length} result{users.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="au-table-panel__scroll">
            <table className="au-table">
              <thead>
                <tr>
                  {[
                    "USER",
                    "ROLE",
                    "TYPE",
                    "GENDER",
                    "RCY ROLE",
                    "SERVICES",
                    "CONTACT",
                    "ACTIONS",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="au-table__loading">
                        <i className="fas fa-spinner fa-spin au-table__loading-icon" />
                        <p>Loading users…</p>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="au-table__empty">
                        <i className="fas fa-magnifying-glass au-table__empty-icon" />
                        <p>No users found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.user_id}>
                      {/* USER */}
                      <td>
                        <div className="au-user-cell">
                          <Avatar name={u.full_name} role={u.role} />
                          <div>
                            <div className="au-user-cell__name">
                              {u.full_name}
                              {u.is_new && (
                                <span className="au-new-badge">
                                  <i className="fas fa-sparkles" /> NEW
                                </span>
                              )}
                            </div>
                            <div className="au-user-cell__username">
                              @{u.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ROLE */}
                      <td>
                        <RoleBadge role={u.role} />
                      </td>

                      {/* TYPE */}
                      <td>
                        <span
                          className={`au-badge ${u.user_type === "rcy_member" ? "au-badge--type-rcy" : "au-badge--type-non"}`}
                        >
                          <i
                            className={`fas ${u.user_type === "rcy_member" ? "fa-heart" : "fa-user"}`}
                          />
                          {u.user_type === "rcy_member" ? " RCY" : " Non-RCY"}
                        </span>
                      </td>

                      {/* GENDER */}
                      <td>
                        {u.gender ? (
                          u.gender.charAt(0).toUpperCase() + u.gender.slice(1)
                        ) : (
                          <span className="au-muted">—</span>
                        )}
                      </td>

                      {/* RCY ROLE */}
                      <td>
                        {u.rcy_role ? (
                          <span className="au-badge au-badge--rcy-role">
                            <i className="fas fa-id-badge" />{" "}
                            {u.rcy_role.charAt(0).toUpperCase() +
                              u.rcy_role.slice(1)}
                          </span>
                        ) : (
                          <span className="au-muted">—</span>
                        )}
                      </td>

                      {/* SERVICES */}
                      <td style={{ maxWidth: 220 }}>
                        {u.services?.length > 0 ? (
                          <div>
                            {u.services.slice(0, 2).map((s) => (
                              <ServiceBadge key={s} serviceKey={s} />
                            ))}
                            {u.services.length > 2 && (
                              <span className="au-service-overflow">
                                +{u.services.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="au-muted">—</span>
                        )}
                      </td>

                      {/* CONTACT */}
                      <td style={{ maxWidth: 200 }}>
                        {u.email && (
                          <div className="au-contact__email">
                            <i className="fas fa-envelope" /> {u.email}
                          </div>
                        )}
                        {u.phone && (
                          <div className="au-contact__phone">
                            <i className="fas fa-phone" /> {u.phone}
                          </div>
                        )}
                        {!u.email && !u.phone && (
                          <span className="au-muted">—</span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div className="au-actions">
                          <button
                            title="Edit User"
                            className="au-action-btn au-action-btn--edit"
                            onClick={() => setEditUser(u)}
                          >
                            <i className="fas fa-pen" />
                          </button>
                          <button
                            title="View Documents"
                            className="au-action-btn au-action-btn--docs"
                            onClick={() => setDocsUser(u)}
                          >
                            <i className="fas fa-folder-open" />
                          </button>
                          <button
                            title="Delete User"
                            className="au-action-btn au-action-btn--delete"
                            onClick={() => handleDelete(u)}
                            disabled={u.user_id === 1}
                          >
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {(createOpen || editUser) && (
        <UserModal
          user={editUser || null}
          onClose={() => {
            setEditUser(null);
            setCreateOpen(false);
          }}
          onSaved={handleSaved}
        />
      )}
      {docsUser && (
        <DocsModal user={docsUser} onClose={() => setDocsUser(null)} />
      )}

      {/* TOAST */}
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
