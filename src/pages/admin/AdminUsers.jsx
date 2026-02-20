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
  super_admin: {
    label: "SUPER ADMIN",
    color: "#c41e3a",
    bg: "#fee2e2",
    icon: "fa-crown",
    canSee: "all",
  },
  safety_admin: {
    label: "SAFETY ADMIN",
    color: "#15803d",
    bg: "#dcfce7",
    icon: "fa-shield",
    canSee: ["safety"],
  },
  welfare_admin: {
    label: "WELFARE ADMIN",
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: "fa-hand-holding-heart",
    canSee: ["welfare"],
  },
  health_admin: {
    label: "HEALTH ADMIN",
    color: "#c41e3a",
    bg: "#ffe4e6",
    icon: "fa-heart-pulse",
    canSee: ["health"],
  },
  disaster_admin: {
    label: "DISASTER ADMIN",
    color: "#c2410c",
    bg: "#ffedd5",
    icon: "fa-triangle-exclamation",
    canSee: ["disaster_management"],
  },
  youth_admin: {
    label: "YOUTH ADMIN",
    color: "#003d6b",
    bg: "#e0f2fe",
    icon: "fa-people-group",
    canSee: ["red_cross_youth"],
  },
  user: {
    label: "USER",
    color: "#4a5568",
    bg: "#f1f5f9",
    icon: "fa-user",
    canSee: "none",
  },
};

const SERVICE_OPTIONS = [
  {
    key: "health",
    label: "Health Services",
    icon: "fa-heart-pulse",
    color: "#c41e3a",
  },
  {
    key: "safety",
    label: "Safety Services",
    icon: "fa-shield",
    color: "#15803d",
  },
  {
    key: "welfare",
    label: "Welfare Services",
    icon: "fa-hand-holding-heart",
    color: "#7c3aed",
  },
  {
    key: "disaster_management",
    label: "Disaster Management",
    icon: "fa-triangle-exclamation",
    color: "#c2410c",
  },
  {
    key: "red_cross_youth",
    label: "Red Cross Youth",
    icon: "fa-people-group",
    color: "#003d6b",
  },
];

const EMPTY_FORM = {
  username: "",
  password: "",
  full_name: "",
  first_name: "",
  last_name: "",
  role: "user",
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
  {
    key: "total",
    icon: "fa-users",
    label: "Total Users",
    color: "#c41e3a",
    gradient: true,
  },
  {
    key: "admins",
    icon: "fa-shield-halved",
    label: "Administrators",
    color: "#1d4ed8",
    gradient: false,
  },
  {
    key: "users",
    icon: "fa-user",
    label: "Regular Users",
    color: "#7c3aed",
    gradient: false,
  },
  {
    key: "rcy_members",
    icon: "fa-heart",
    label: "RCY Members",
    color: "#c41e3a",
    gradient: true,
  },
];

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({ name, role, size = "md" }) {
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
      className={`au-avatar au-avatar--${size}`}
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `2px solid ${cfg.color}30`,
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
      className="au-badge au-badge--role"
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}30`,
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
    <span
      className="au-service-badge"
      style={{
        background: `${svc.color}12`,
        color: svc.color,
        border: `1px solid ${svc.color}25`,
      }}
    >
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
      <div className="au-toast__icon">
        <i
          className={`fas ${type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`}
        />
      </div>
      <div className="au-toast__content">
        <div className="au-toast__title">
          {type === "success" ? "Success" : "Error"}
        </div>
        <div className="au-toast__message">{message}</div>
      </div>
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
      maab_id: "au-docs__item--maab",
      supporting_document: "au-docs__item--supporting",
      other: "au-docs__item--other",
    };
    return `au-docs__item ${map[type] || "au-docs__item--other"}`;
  };

  return (
    <div className="au-overlay" onClick={onClose}>
      <div
        className="au-modal au-modal--sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="au-modal__header">
          <div className="au-modal__title">
            <i className="fas fa-folder-open" /> Documents —{" "}
            <strong>{user.username}</strong>
          </div>
          <button className="au-modal__close" onClick={onClose}>
            <i className="fas fa-xmark" />
          </button>
        </div>
        <div className="au-modal__body au-modal__body--docs">
          {loading ? (
            <div className="au-docs__loading">
              <div className="au-docs__spinner">
                <i className="fas fa-spinner fa-spin" />
              </div>
              <p>Loading documents…</p>
            </div>
          ) : docs.length === 0 ? (
            <div className="au-docs__empty">
              <div className="au-docs__empty-icon">
                <i className="fas fa-folder-open" />
              </div>
              <h3 className="au-docs__empty-title">No Documents Found</h3>
              <p className="au-docs__empty-message">
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
                    <i className="fas fa-external-link-alt" /> View
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
    if (!form.username.trim()) e.username = "Username is required";
    if (!isEdit && !form.password.trim())
      e.password = "Password is required for new users";
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.role) e.role = "Role is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Invalid email format";
    }
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
      onSaved(res.message || "User saved successfully");
    } catch (err) {
      setErrors({ _global: err.message || "Failed to save user" });
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
          <div className="au-modal__title">
            <i className={`fas ${isEdit ? "fa-user-pen" : "fa-user-plus"}`} />
            {isEdit ? " Edit User" : " Create New User"}
          </div>
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
            <div className="au-form__field">
              <label className="au-form__label">
                Username <span className="au-form__required">*</span>
              </label>
              <input
                className={`au-form__input${errors.username ? " au-form__input--error" : ""}`}
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                placeholder="Enter username"
              />
              {errors.username && (
                <span className="au-form__error-text">
                  <i className="fas fa-circle-exclamation" /> {errors.username}
                </span>
              )}
            </div>
            <div className="au-form__field">
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
              placeholder="Enter full name"
            />
            {errors.full_name && (
              <span className="au-form__error-text">
                <i className="fas fa-circle-exclamation" /> {errors.full_name}
              </span>
            )}
          </div>

          {/* First + Last */}
          <div className="au-form__row">
            <div className="au-form__field">
              <label className="au-form__label">First Name</label>
              <input
                className="au-form__input"
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                placeholder="First name (optional)"
              />
            </div>
            <div className="au-form__field">
              <label className="au-form__label">Last Name</label>
              <input
                className="au-form__input"
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                placeholder="Last name (optional)"
              />
            </div>
          </div>

          {/* Role + User Type */}
          <div className="au-form__row">
            <div className="au-form__field">
              <label className="au-form__label">
                Role <span className="au-form__required">*</span>
              </label>
              <select
                className={`au-form__select${errors.role ? " au-form__select--error" : ""}`}
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
              >
                <option value="user">Regular User</option>
                <optgroup label="Administrators">
                  <option value="super_admin">Super Administrator</option>
                  <option value="safety_admin">Safety Admin</option>
                  <option value="welfare_admin">Welfare Admin</option>
                  <option value="health_admin">Health Admin</option>
                  <option value="disaster_admin">Disaster Admin</option>
                  <option value="youth_admin">Youth Admin</option>
                </optgroup>
              </select>
              {errors.role && (
                <span className="au-form__error-text">
                  <i className="fas fa-circle-exclamation" /> {errors.role}
                </span>
              )}
            </div>
            <div className="au-form__field">
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
            <div className="au-form__field">
              <label className="au-form__label">Email Address</label>
              <input
                className={`au-form__input${errors.email ? " au-form__input--error" : ""}`}
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@example.com"
              />
              {errors.email && (
                <span className="au-form__error-text">
                  <i className="fas fa-circle-exclamation" /> {errors.email}
                </span>
              )}
            </div>
            <div className="au-form__field">
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
            <div className="au-form__field">
              <label className="au-form__label">Gender</label>
              <select
                className="au-form__select"
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
              >
                <option value="">— Select Gender —</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            {isRCY && (
              <div className="au-form__field">
                <label className="au-form__label">RCY Role</label>
                <select
                  className="au-form__select"
                  value={form.rcy_role}
                  onChange={(e) => set("rcy_role", e.target.value)}
                >
                  <option value="">— Select RCY Role —</option>
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
                      style={{
                        borderColor: checked ? svc.color : undefined,
                        background: checked ? `${svc.color}08` : undefined,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(svc.key)}
                      />
                      <i
                        className={`fas ${svc.icon}`}
                        style={{ color: checked ? svc.color : undefined }}
                      />
                      {svc.label}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} className="au-form__submit">
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Saving User...
              </>
            ) : (
              <>
                <i className="fas fa-save" /> Save User
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
  const [hoveredRow, setHoveredRow] = useState(null);
  const searchRef = useRef();

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── STATS ──────────────────────────────────────────────────────────────────
  const refreshStats = useCallback(async () => {
    try {
      const { stats } = await getUserStats();
      setStats(stats);
    } catch (err) {
      console.error("Stats error:", err);
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
      !window.confirm(
        `Are you sure you want to delete "${user.username}"? This action cannot be undone.`,
      )
    )
      return;
    try {
      const res = await apiDeleteUser(user.user_id);
      showToast(res.message || "User deleted successfully");
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
    stats?.admins ?? users.filter((u) => u.role.includes("admin")).length;
  const regularUsers =
    stats?.users ?? users.filter((u) => u.role === "user").length;
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
    { key: "all", label: "All Users", count: totalUsers, icon: "fa-users" },
    {
      key: "new",
      label: "New This Week",
      count: stats?.new_this_week ?? 0,
      icon: "fa-star",
    },
    {
      key: "admin",
      label: "Administrators",
      count: admins,
      icon: "fa-shield-halved",
    },
    {
      key: "user",
      label: "Regular Users",
      count: regularUsers,
      icon: "fa-user",
    },
  ];

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="au-root">
      {/* PAGE HEADER with Wave Effect */}
      <div className="au-header">
        <div className="au-header__container">
          <div className="au-header__content">
            <div className="au-header__left">
              <div className="au-header__badge">
                <i className="fas fa-users-cog" /> User Management
              </div>
              <h1 className="au-header__title">User Administration</h1>
              <p className="au-header__subtitle">
                Create, manage, and organize system users and their permissions
              </p>
            </div>
            <div className="au-header__stats">
              {[
                { value: totalUsers, label: "Total Users" },
                { value: admins, label: "Admins" },
                { value: rcyMembers, label: "RCY Members" },
              ].map(({ value, label }) => (
                <div key={label} className="au-header-stat">
                  <span className="au-header-stat__value">{value ?? "—"}</span>
                  <span className="au-header-stat__label">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="au-header__wave">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
              fillOpacity="0.1"
            />
          </svg>
        </div>
      </div>

      <div className="au-body">
        {/* STAT CARDS */}
        <div className="au-cards">
          {STAT_CARD_META.map(({ key, icon, label, color, gradient }) => (
            <div
              className={`au-card ${gradient ? "au-card--gradient" : ""}`}
              key={key}
              style={
                gradient
                  ? {
                      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                    }
                  : {}
              }
            >
              <div
                className="au-card__icon"
                style={{
                  background: gradient ? "rgba(255,255,255,0.2)" : `${color}15`,
                }}
              >
                <i
                  className={`fas ${icon}`}
                  style={{ color: gradient ? "#fff" : color }}
                />
              </div>
              <div>
                <div
                  className="au-card__num"
                  style={{ color: gradient ? "#fff" : undefined }}
                >
                  {statValues[key] ?? "—"}
                </div>
                <div
                  className="au-card__label"
                  style={{
                    color: gradient ? "rgba(255,255,255,0.8)" : undefined,
                  }}
                >
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="au-toolbar">
          <div className="au-toolbar__search">
            <i className="fas fa-search au-toolbar__search-icon" />
            <input
              ref={searchRef}
              className="au-toolbar__search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username, or email..."
            />
            {search && (
              <button
                className="au-toolbar__search-clear"
                onClick={() => setSearch("")}
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>

          <div className="au-toolbar__filters">
            {FILTER_TABS.map(({ key, label, count, icon }) => (
              <button
                key={key}
                className={`au-toolbar__filter-btn${filter === key ? " au-toolbar__filter-btn--active" : ""}`}
                onClick={() => setFilter(key)}
              >
                <i className={`fas ${icon}`} />
                {label}
                <span className="au-toolbar__filter-count">{count}</span>
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
            <div className="au-table-panel__title">
              <i className="fas fa-users" /> System Users
            </div>
            <div className="au-table-panel__info">
              {!loading && (
                <>
                  <span className="au-table-panel__count">
                    {users.length} user{users.length !== 1 ? "s" : ""}
                  </span>
                  <span className="au-table-panel__divider">•</span>
                  <span className="au-table-panel__sub">
                    Page 1 of {Math.ceil(users.length / 10) || 1}
                  </span>
                </>
              )}
            </div>
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
                        <div className="au-table__loading-spinner">
                          <i className="fas fa-spinner fa-spin" />
                        </div>
                        <p>Loading users...</p>
                        <span className="au-table__loading-sub">
                          Fetching user data
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="au-table__empty">
                        <div className="au-table__empty-icon">
                          <i className="fas fa-users-slash" />
                        </div>
                        <h3 className="au-table__empty-title">
                          No Users Found
                        </h3>
                        <p className="au-table__empty-message">
                          {search || filter !== "all"
                            ? "Try adjusting your search or filter criteria"
                            : "Get started by creating your first user"}
                        </p>
                        {(search || filter !== "all") && (
                          <button
                            className="au-table__empty-action"
                            onClick={() => {
                              setSearch("");
                              setFilter("all");
                            }}
                          >
                            <i className="fas fa-times" /> Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.user_id}
                      onMouseEnter={() => setHoveredRow(u.user_id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={
                        hoveredRow === u.user_id ? "au-table__row--hovered" : ""
                      }
                    >
                      {/* USER */}
                      <td>
                        <div className="au-user-cell">
                          <Avatar name={u.full_name} role={u.role} />
                          <div>
                            <div className="au-user-cell__name">
                              {u.full_name}
                              {u.is_new && (
                                <span className="au-new-badge">
                                  <i className="fas fa-star" /> NEW
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
                          className={`au-badge au-badge--type ${u.user_type === "rcy_member" ? "au-badge--type-rcy" : "au-badge--type-non"}`}
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
                          <span className="au-gender">
                            <i
                              className={`fas fa-${u.gender === "male" ? "mars" : u.gender === "female" ? "venus" : "genderless"}`}
                            />
                            {u.gender.charAt(0).toUpperCase() +
                              u.gender.slice(1)}
                          </span>
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
                          <div className="au-services">
                            {u.services.slice(0, 2).map((s) => (
                              <ServiceBadge key={s} serviceKey={s} />
                            ))}
                            {u.services.length > 2 && (
                              <span
                                className="au-service-overflow"
                                title={`${u.services.length - 2} more services`}
                              >
                                +{u.services.length - 2}
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
                          <div className="au-contact__email" title={u.email}>
                            <i className="fas fa-envelope" />
                            <span>{u.email}</span>
                          </div>
                        )}
                        {u.phone && (
                          <div className="au-contact__phone" title={u.phone}>
                            <i className="fas fa-phone" />
                            <span>{u.phone}</span>
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
                            disabled={
                              u.user_id === 1 || u.role === "super_admin"
                            }
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
