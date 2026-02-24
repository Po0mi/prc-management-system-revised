// AdminTraining.jsx
// Path: src/pages/AdminTraining/AdminTraining.jsx

import { useState, useEffect, useCallback } from "react";
import "./AdminTraining.scss";
import {
  getTrainingSessions,
  getSessionStats,
  createTrainingSession,
  updateTrainingSession,
  deleteTrainingSession,
} from "../../services/trainingSessions";
import {
  getSessionRegistrations,
  approveSessionRegistration,
  rejectSessionRegistration,
  deleteSessionRegistration,
} from "../../services/sessionRegistrationsApi";
import api from "../../services/api";

// ─── ARCHIVE API HELPERS ──────────────────────────────────────────────────────
const BASE = "/api/training_sessions.php";

async function getArchivedSessions({
  search = "",
  service = "All Services",
} = {}) {
  const params = { action: "list", archived: "true" };
  if (search.trim()) params.search = search.trim();
  if (service && service !== "All Services") params.service = service;
  const { data } = await api.get(BASE, { params });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch archived sessions");
  return { sessions: data.sessions ?? [] };
}

async function restoreSession(id) {
  const { data } = await api.put(
    BASE,
    {},
    { params: { action: "restore", id } },
  );
  if (!data.success)
    throw new Error(data.message || "Failed to restore session");
  return data;
}

async function permanentDeleteSession(id) {
  const { data } = await api.delete(BASE, {
    params: { action: "permanent-delete", id },
  });
  if (!data.success)
    throw new Error(data.message || "Failed to permanently delete session");
  return data;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SERVICE_OPTIONS = [
  {
    key: "All Services",
    label: "All Services",
    color: "#8b1e1e",
    icon: "fa-calendar",
  },
  {
    key: "Health Service",
    label: "Health Service",
    color: "#c41e3a",
    icon: "fa-heart-pulse",
  },
  {
    key: "Safety Service",
    label: "Safety Service",
    color: "#15803d",
    icon: "fa-shield",
  },
  {
    key: "Welfare Service",
    label: "Welfare Service",
    color: "#7c3aed",
    icon: "fa-hand-holding-heart",
  },
  {
    key: "Disaster Management Service",
    label: "Disaster Management",
    color: "#c2410c",
    icon: "fa-triangle-exclamation",
  },
  {
    key: "Red Cross Youth",
    label: "Red Cross Youth",
    color: "#003d6b",
    icon: "fa-people-group",
  },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  major_service: "",
  session_date: "",
  session_end_date: "",
  start_time: "09:00",
  end_time: "17:00",
  venue: "",
  capacity: 0,
  fee: 0,
  requirements: "",
  instructor: "",
  instructor_bio: "",
  instructor_credentials: "",
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function ServiceBadge({ service }) {
  const cfg = SERVICE_OPTIONS.find((s) => s.key === service) || {
    label: service,
    color: "#6b7280",
    icon: "fa-tag",
  };
  return (
    <span
      className="at-badge at-badge--service"
      style={{
        background: `${cfg.color}12`,
        color: cfg.color,
        border: `1px solid ${cfg.color}25`,
      }}
    >
      <i className={`fas ${cfg.icon}`} /> {cfg.label}
    </span>
  );
}

function StatusBadge({ isPast, isUpcoming }) {
  let label = "Ongoing",
    color = "#f59e0b",
    bg = "#fef3c7",
    icon = "fa-clock";
  if (isPast) {
    label = "Completed";
    color = "#10b981";
    bg = "#d1fae5";
    icon = "fa-check-circle";
  }
  if (isUpcoming) {
    label = "Upcoming";
    color = "#3b82f6";
    bg = "#dbeafe";
    icon = "fa-calendar";
  }
  return (
    <span
      className="at-badge"
      style={{ background: bg, color, border: `1px solid ${color}33` }}
    >
      <i className={`fas ${icon}`} /> {label}
    </span>
  );
}

function FeeBadge({ fee }) {
  if (fee > 0)
    return <span className="at-fee">₱{parseFloat(fee).toFixed(2)}</span>;
  return (
    <span
      className="at-badge at-badge--free"
      style={{
        background: "#10b98112",
        color: "#10b981",
        border: "1px solid #10b98125",
      }}
    >
      <i className="fas fa-gift" /> FREE
    </span>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`at-toast at-toast--${type}`} onClick={onClose}>
      <div className="at-toast__icon">
        <i
          className={`fas ${type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`}
        />
      </div>
      <div className="at-toast__content">
        <div className="at-toast__title">
          {type === "success" ? "Success" : "Error"}
        </div>
        <div className="at-toast__message">{message}</div>
      </div>
      <button className="at-toast__close" onClick={onClose}>
        <i className="fas fa-xmark" />
      </button>
    </div>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmColor = "#ef4444",
  icon = "fa-triangle-exclamation",
  onConfirm,
  onCancel,
}) {
  return (
    <div className="at-overlay at-overlay--confirm" onClick={onCancel}>
      <div className="at-confirm" onClick={(e) => e.stopPropagation()}>
        <div
          className="at-confirm__icon"
          style={{ color: confirmColor, background: `${confirmColor}12` }}
        >
          <i className={`fas ${icon}`} />
        </div>
        <h3 className="at-confirm__title">{title}</h3>
        <p className="at-confirm__message">{message}</p>
        <div className="at-confirm__actions">
          <button className="at-confirm__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="at-confirm__ok"
            style={{ background: confirmColor }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SESSION FORM MODAL ───────────────────────────────────────────────────────
function SessionModal({ session, onClose, onSaved }) {
  const [form, setForm] = useState(session || { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const isEdit = !!session;

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.title?.trim()) e.title = "Title is required";
    if (!form.major_service) e.major_service = "Service is required";
    if (!form.session_date) e.session_date = "Start date is required";
    if (!form.venue?.trim()) e.venue = "Venue is required";
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
      if (!payload.session_end_date)
        payload.session_end_date = payload.session_date;
      const res = isEdit
        ? await updateTrainingSession(session.session_id, payload)
        : await createTrainingSession(payload);
      onSaved(res.message || "Training session saved successfully");
    } catch (err) {
      setErrors({ _global: err.message || "Failed to save training session" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="at-overlay" onClick={onClose}>
      <div
        className="at-modal at-modal--lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="at-modal__header">
          <div className="at-modal__title">
            <i
              className={`fas ${isEdit ? "fa-pen-to-square" : "fa-plus-circle"}`}
            />
            {isEdit ? " Edit Training Session" : " Create New Training Session"}
          </div>
          <button className="at-modal__close" onClick={onClose}>
            <i className="fas fa-xmark" />
          </button>
        </div>
        <form className="at-modal__body" onSubmit={handleSubmit}>
          {errors._global && (
            <div className="at-form__error-banner">
              <i className="fas fa-circle-exclamation" /> {errors._global}
            </div>
          )}
          <div className="at-form__field">
            <label className="at-form__label">
              Session Title <span className="at-form__required">*</span>
            </label>
            <input
              className={`at-form__input${errors.title ? " at-form__input--error" : ""}`}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g., Emergency First Aid Training"
            />
            {errors.title && (
              <span className="at-form__error-text">
                <i className="fas fa-circle-exclamation" /> {errors.title}
              </span>
            )}
          </div>
          <div className="at-form__field">
            <label className="at-form__label">Description</label>
            <textarea
              className="at-form__textarea"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Training session description, objectives, and learning outcomes"
            />
          </div>
          <div className="at-form__field">
            <label className="at-form__label">
              Major Service <span className="at-form__required">*</span>
            </label>
            <select
              className={`at-form__select${errors.major_service ? " at-form__select--error" : ""}`}
              value={form.major_service}
              onChange={(e) => set("major_service", e.target.value)}
            >
              <option value="">Select a service</option>
              {SERVICE_OPTIONS.filter((s) => s.key !== "All Services").map(
                (svc) => (
                  <option key={svc.key} value={svc.key}>
                    {svc.label}
                  </option>
                ),
              )}
            </select>
            {errors.major_service && (
              <span className="at-form__error-text">
                <i className="fas fa-circle-exclamation" />{" "}
                {errors.major_service}
              </span>
            )}
          </div>
          <div className="at-form__row">
            <div className="at-form__field">
              <label className="at-form__label">
                Start Date <span className="at-form__required">*</span>
              </label>
              <input
                type="date"
                className={`at-form__input${errors.session_date ? " at-form__input--error" : ""}`}
                value={form.session_date}
                onChange={(e) => set("session_date", e.target.value)}
              />
              {errors.session_date && (
                <span className="at-form__error-text">
                  <i className="fas fa-circle-exclamation" />{" "}
                  {errors.session_date}
                </span>
              )}
            </div>
            <div className="at-form__field">
              <label className="at-form__label">End Date</label>
              <input
                type="date"
                className="at-form__input"
                value={form.session_end_date || form.session_date}
                onChange={(e) => set("session_end_date", e.target.value)}
              />
              <small className="at-form__hint">
                <i className="fas fa-info-circle" /> Leave blank for single day
              </small>
            </div>
          </div>
          <div className="at-form__row">
            <div className="at-form__field">
              <label className="at-form__label">Start Time</label>
              <input
                type="time"
                className="at-form__input"
                value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)}
              />
            </div>
            <div className="at-form__field">
              <label className="at-form__label">End Time</label>
              <input
                type="time"
                className="at-form__input"
                value={form.end_time}
                onChange={(e) => set("end_time", e.target.value)}
              />
            </div>
          </div>
          <div className="at-form__field">
            <label className="at-form__label">
              Training Venue <span className="at-form__required">*</span>
            </label>
            <textarea
              className={`at-form__textarea${errors.venue ? " at-form__textarea--error" : ""}`}
              rows={3}
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
              placeholder="Full address, building name, room number, and directions"
            />
            <small className="at-form__hint">
              <i className="fas fa-info-circle" /> Include room numbers, parking
              info, and accessibility notes
            </small>
            {errors.venue && (
              <span className="at-form__error-text">
                <i className="fas fa-circle-exclamation" /> {errors.venue}
              </span>
            )}
          </div>
          <div className="at-form__row">
            <div className="at-form__field">
              <label className="at-form__label">Capacity</label>
              <input
                type="number"
                className="at-form__input"
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                min="0"
                placeholder="0 for unlimited"
              />
              <small className="at-form__hint">
                <i className="fas fa-info-circle" /> Maximum participants
              </small>
            </div>
            <div className="at-form__field">
              <label className="at-form__label">Fee (₱)</label>
              <input
                type="number"
                step="0.01"
                className="at-form__input"
                value={form.fee}
                onChange={(e) => set("fee", e.target.value)}
                min="0"
                placeholder="0.00 for free"
              />
            </div>
          </div>
          <div className="at-form__field">
            <label className="at-form__label">Instructor/Facilitator</label>
            <input
              className="at-form__input"
              value={form.instructor}
              onChange={(e) => set("instructor", e.target.value)}
              placeholder="e.g., Dr. Maria Santos, RN"
            />
            <small className="at-form__hint">
              <i className="fas fa-info-circle" /> Optional - leave blank if not
              assigned
            </small>
          </div>
          <div className="at-form__field">
            <label className="at-form__label">Instructor Credentials</label>
            <input
              className="at-form__input"
              value={form.instructor_credentials}
              onChange={(e) => set("instructor_credentials", e.target.value)}
              placeholder="e.g., MD, BLS Instructor, ACLS Provider"
            />
          </div>
          <div className="at-form__field">
            <label className="at-form__label">Instructor Bio</label>
            <textarea
              className="at-form__textarea"
              rows={3}
              value={form.instructor_bio}
              onChange={(e) => set("instructor_bio", e.target.value)}
              placeholder="Brief professional background and experience"
            />
          </div>
          <div className="at-form__field">
            <label className="at-form__label">Training Requirements</label>
            <textarea
              className="at-form__textarea"
              rows={2}
              value={form.requirements}
              onChange={(e) => set("requirements", e.target.value)}
              placeholder="Prerequisites, materials to bring, documents needed, etc."
            />
          </div>
          <button type="submit" disabled={saving} className="at-form__submit">
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Saving Session...
              </>
            ) : (
              <>
                <i className="fas fa-save" />{" "}
                {isEdit ? "Update Session" : "Create Session"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── REGISTRATIONS MODAL ──────────────────────────────────────────────────────
function RegistrationsModal({ session, onClose, onUpdate }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const loadRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const { registrations: regs } = await getSessionRegistrations(
        session.session_id,
      );
      setRegistrations(regs);
      setStats({
        total: regs.length,
        approved: regs.filter((r) => r.status === "approved").length,
        pending: regs.filter((r) => r.status === "pending").length,
        rejected: regs.filter((r) => r.status === "rejected").length,
      });
    } catch (err) {
      console.error("Load registrations error:", err);
      showToast(err.message || "Failed to load registrations", "error");
    } finally {
      setLoading(false);
    }
  }, [session.session_id]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  async function handleApprove(regId) {
    try {
      await approveSessionRegistration(regId);
      showToast("Registration approved successfully");
      loadRegistrations();
      onUpdate?.();
    } catch (err) {
      showToast(err.message || "Failed to approve registration", "error");
    }
  }

  async function handleReject(regId) {
    try {
      await rejectSessionRegistration(regId);
      showToast("Registration rejected");
      loadRegistrations();
      onUpdate?.();
    } catch (err) {
      showToast(err.message || "Failed to reject registration", "error");
    }
  }

  async function handleDelete(regId) {
    if (!window.confirm("Are you sure you want to delete this registration?"))
      return;
    try {
      await deleteSessionRegistration(regId);
      showToast("Registration deleted");
      loadRegistrations();
      onUpdate?.();
    } catch (err) {
      showToast(err.message || "Failed to delete registration", "error");
    }
  }

  function getInitials(name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="at-overlay" onClick={onClose}>
      <div
        className="at-modal at-modal--xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="at-modal__header">
          <div className="at-modal__title">
            <i className="fas fa-users" /> Registrations —{" "}
            <strong>{session.title}</strong>
          </div>
          <button className="at-modal__close" onClick={onClose}>
            <i className="fas fa-xmark" />
          </button>
        </div>
        <div className="at-modal__body at-modal__body--regs">
          <div className="at-reg-stats">
            {[
              ["Total Registrations", stats.total, ""],
              ["Approved", stats.approved, "approved"],
              ["Pending", stats.pending, "pending"],
              ["Rejected", stats.rejected, "rejected"],
            ].map(([label, val, mod]) => (
              <div
                key={label}
                className={`at-reg-stat${mod ? ` at-reg-stat--${mod}` : ""}`}
              >
                <div className="at-reg-stat__num">{val}</div>
                <div className="at-reg-stat__label">{label}</div>
              </div>
            ))}
          </div>
          {loading ? (
            <div className="at-reg-loading">
              <div className="at-reg-loading__spinner">
                <i className="fas fa-spinner fa-spin" />
              </div>
              <p>Loading registrations...</p>
              <span className="at-reg-loading__sub">
                Fetching participant data
              </span>
            </div>
          ) : registrations.length === 0 ? (
            <div className="at-reg-empty">
              <div className="at-reg-empty__icon">
                <i className="fas fa-inbox" />
              </div>
              <h3 className="at-reg-empty__title">No Registrations Yet</h3>
              <p className="at-reg-empty__message">
                No participants have registered for this training session
              </p>
            </div>
          ) : (
            <div className="at-reg-table-container">
              <table className="at-reg-table">
                <thead>
                  <tr>
                    <th>PARTICIPANT</th>
                    <th>REGISTRATION DATE</th>
                    <th>STATUS</th>
                    <th>DOCUMENTS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr key={reg.registration_id} className="at-reg-row">
                      <td>
                        <div className="at-reg-user">
                          <div
                            className="at-reg-user__avatar"
                            style={{
                              background: "#c41e3a12",
                              color: "#c41e3a",
                              border: "2px solid #c41e3a25",
                            }}
                          >
                            {getInitials(reg.full_name)}
                          </div>
                          <div className="at-reg-user__info">
                            <div className="at-reg-user__name">
                              {reg.full_name}
                            </div>
                            <div className="at-reg-user__email">
                              {reg.email}
                            </div>
                            {reg.age && (
                              <div className="at-reg-user__meta">
                                <i className="fas fa-cake-candles" /> Age:{" "}
                                {reg.age}
                              </div>
                            )}
                            {reg.location && (
                              <div className="at-reg-user__meta">
                                <i className="fas fa-location-dot" />{" "}
                                {reg.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="at-reg-date">
                          <div className="at-reg-date__main">
                            {new Date(reg.registration_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                          <div className="at-reg-date__time">
                            {new Date(reg.registration_date).toLocaleTimeString(
                              "en-US",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`at-status at-status--${reg.status}`}>
                          {reg.status?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="at-reg-docs">
                          {reg.valid_id_path && (
                            <a
                              href={`http://localhost/prc-management-system/${reg.valid_id_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="at-doc-link"
                            >
                              <i className="fas fa-id-card" /> Valid ID
                            </a>
                          )}
                          {reg.requirements_path && (
                            <a
                              href={`http://localhost/prc-management-system/${reg.requirements_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="at-doc-link"
                            >
                              <i className="fas fa-file-alt" /> Requirements
                            </a>
                          )}
                          {reg.payment_receipt_path && (
                            <a
                              href={`http://localhost/prc-management-system/${reg.payment_receipt_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="at-doc-link"
                            >
                              <i className="fas fa-receipt" /> Receipt
                            </a>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="at-reg-actions">
                          {reg.status === "pending" && (
                            <>
                              <button
                                className="at-reg-btn at-reg-btn--approve"
                                onClick={() =>
                                  handleApprove(reg.registration_id)
                                }
                                title="Approve Registration"
                              >
                                <i className="fas fa-check" />
                              </button>
                              <button
                                className="at-reg-btn at-reg-btn--reject"
                                onClick={() =>
                                  handleReject(reg.registration_id)
                                }
                                title="Reject Registration"
                              >
                                <i className="fas fa-times" />
                              </button>
                            </>
                          )}
                          <button
                            className="at-reg-btn at-reg-btn--delete"
                            onClick={() => handleDelete(reg.registration_id)}
                            title="Delete Registration"
                          >
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {toast && (
          <Toast
            message={toast.msg}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminTraining() {
  // ── Tab ────────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("active"); // "active" | "archived"

  // ── Active sessions ────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [service, setService] = useState("All Services");

  // ── Archived sessions ──────────────────────────────────────────────────────
  const [archived, setArchived] = useState([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archiveService, setArchiveService] = useState("All Services");

  // ── UI ─────────────────────────────────────────────────────────────────────
  const [editSession, setEditSession] = useState(null);
  const [regsSession, setRegsSession] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const refreshStats = useCallback(async () => {
    try {
      const { stats } = await getSessionStats();
      setStats(stats);
    } catch (err) {
      console.error("Stats error:", err);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // ── Active sessions fetch ──────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { sessions: sess } = await getTrainingSessions({
        filter,
        search,
        service,
      });
      setSessions(sess);
    } catch (err) {
      showToast(err.message || "Failed to load training sessions", "error");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [filter, search, service]);

  useEffect(() => {
    if (tab === "active") fetchSessions();
  }, [fetchSessions, tab]);

  // ── Archived sessions fetch ────────────────────────────────────────────────
  const fetchArchived = useCallback(async () => {
    setArchiveLoading(true);
    try {
      const { sessions: sess } = await getArchivedSessions({
        search: archiveSearch,
        service: archiveService,
      });
      setArchived(sess);
    } catch (err) {
      showToast(err.message || "Failed to load archived sessions", "error");
      setArchived([]);
    } finally {
      setArchiveLoading(false);
    }
  }, [archiveSearch, archiveService]);

  useEffect(() => {
    if (tab === "archived") fetchArchived();
  }, [fetchArchived, tab]);

  // ── Confirm helpers ────────────────────────────────────────────────────────
  function handleArchiveClick(sess) {
    setConfirm({
      type: "archive",
      session: sess,
      title: "Archive Session",
      message: `Archive "${sess.title}"? It will be hidden from users and registered participants will be notified of cancellation.`,
      confirmLabel: "Archive",
      confirmColor: "#f59e0b",
      icon: "fa-box-archive",
    });
  }

  function handleRestoreClick(sess) {
    setConfirm({
      type: "restore",
      session: sess,
      title: "Restore Session",
      message: `Restore "${sess.title}"? It will reappear in the active sessions list and be visible to users again.`,
      confirmLabel: "Restore",
      confirmColor: "#10b981",
      icon: "fa-rotate-left",
    });
  }

  function handlePermanentDeleteClick(sess) {
    setConfirm({
      type: "permanent",
      session: sess,
      title: "Permanently Delete Session",
      message: `Permanently delete "${sess.title}"? This cannot be undone. All registration records will also be deleted.`,
      confirmLabel: "Delete Permanently",
      confirmColor: "#ef4444",
      icon: "fa-trash",
    });
  }

  async function executeConfirm() {
    if (!confirm) return;
    const { type, session: sess } = confirm;
    setConfirm(null);
    try {
      if (type === "archive") {
        await deleteTrainingSession(sess.session_id);
        showToast(`"${sess.title}" archived successfully`);
        fetchSessions();
        refreshStats();
      } else if (type === "restore") {
        await restoreSession(sess.session_id);
        showToast(`"${sess.title}" restored successfully`);
        fetchArchived();
        refreshStats();
      } else if (type === "permanent") {
        await permanentDeleteSession(sess.session_id);
        showToast(`"${sess.title}" permanently deleted`);
        fetchArchived();
        refreshStats();
      }
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    }
  }

  function handleSaved(msg) {
    showToast(msg);
    setEditSession(null);
    setCreateOpen(false);
    fetchSessions();
    refreshStats();
  }

  const totalSessions = stats?.total ?? sessions.length;
  const upcomingSessions = stats?.upcoming ?? 0;
  const completedSessions = stats?.completed ?? 0;
  const serviceBreakdown = stats?.services || [];

  const getActiveFilterCount = () => {
    let c = 0;
    if (filter !== "all") c++;
    if (search) c++;
    if (service !== "All Services") c++;
    return c;
  };

  const clearAllFilters = () => {
    setFilter("all");
    setSearch("");
    setService("All Services");
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="at-root">
      {/* PAGE HEADER */}
      <div className="at-header">
        <div className="at-header__container">
          <div className="at-header__content">
            <div className="at-header__left">
              <div className="at-header__badge">
                <i className="fas fa-graduation-cap" /> Training Management
              </div>
              <h1 className="at-header__title">Training Administration</h1>
              <p className="at-header__subtitle">
                Schedule and manage training sessions and participant
                registrations
              </p>
            </div>
            <div className="at-header__stats">
              <div className="at-header-stat">
                <span className="at-header-stat__value">{totalSessions}</span>
                <span className="at-header-stat__label">Total Sessions</span>
              </div>
              <div className="at-header-stat">
                <span className="at-header-stat__value">
                  {upcomingSessions}
                </span>
                <span className="at-header-stat__label">Upcoming</span>
              </div>
              <div className="at-header-stat">
                <span className="at-header-stat__value">
                  {completedSessions}
                </span>
                <span className="at-header-stat__label">Completed</span>
              </div>
            </div>
          </div>
        </div>
        <div className="at-header__wave">
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

      <div className="at-body">
        {/* SERVICE CARDS */}
        <div className="at-services">
          {SERVICE_OPTIONS.map((svc) => {
            const count =
              svc.key === "All Services"
                ? totalSessions
                : serviceBreakdown.find((s) => s.major_service === svc.key)
                    ?.count || 0;
            const isActive = service === svc.key && tab === "active";
            return (
              <button
                key={svc.key}
                className={`at-service-card${isActive ? " at-service-card--active" : ""}`}
                style={{
                  borderColor: svc.color,
                  background: isActive ? `${svc.color}08` : "white",
                }}
                onClick={() => {
                  setService(svc.key);
                  if (tab !== "active") setTab("active");
                }}
              >
                <i
                  className={`fas ${svc.icon}`}
                  style={{
                    color: svc.color,
                    fontSize: "1.5rem",
                    marginBottom: "0.5rem",
                  }}
                />
                <div
                  className="at-service-card__count"
                  style={{ color: svc.color }}
                >
                  {count}
                </div>
                <div className="at-service-card__label">{svc.label}</div>
              </button>
            );
          })}
        </div>

        {/* TABS */}
        <div className="at-tabs">
          <button
            className={`at-tab${tab === "active" ? " at-tab--active" : ""}`}
            onClick={() => setTab("active")}
          >
            <i className="fas fa-graduation-cap" />
            Active Sessions
            {!loading && (
              <span className="at-tab__badge">{sessions.length}</span>
            )}
          </button>
          <button
            className={`at-tab${tab === "archived" ? " at-tab--active at-tab--archived-active" : ""}`}
            onClick={() => setTab("archived")}
          >
            <i className="fas fa-box-archive" />
            Archived Sessions
            {tab === "archived" && !archiveLoading && (
              <span className="at-tab__badge at-tab__badge--muted">
                {archived.length}
              </span>
            )}
          </button>
        </div>

        {/* ══ ACTIVE TAB ══ */}
        {tab === "active" && (
          <>
            <div className="at-toolbar">
              <div className="at-toolbar__search">
                <i className="fas fa-search at-toolbar__search-icon" />
                <input
                  className="at-toolbar__search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search sessions by title, instructor, or venue..."
                />
                {search && (
                  <button
                    className="at-toolbar__search-clear"
                    onClick={() => setSearch("")}
                  >
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>
              <div className="at-toolbar__filters">
                {[
                  { key: "all", label: "All Sessions", color: "#6b7280" },
                  { key: "upcoming", label: "Upcoming", color: "#3b82f6" },
                  { key: "past", label: "Past Sessions", color: "#9ca3af" },
                ].map(({ key, label, color }) => (
                  <button
                    key={key}
                    className={`at-toolbar__filter-btn${filter === key ? " at-toolbar__filter-btn--active" : ""}`}
                    onClick={() => setFilter(key)}
                    style={
                      filter === key
                        ? {
                            background: `${color}12`,
                            color,
                            borderColor: color,
                          }
                        : {}
                    }
                  >
                    {label}
                  </button>
                ))}
                {getActiveFilterCount() > 0 && (
                  <button
                    className="at-toolbar__filter-clear"
                    onClick={clearAllFilters}
                  >
                    <i className="fas fa-times" /> Clear Filters (
                    {getActiveFilterCount()})
                  </button>
                )}
              </div>
              <button
                className="at-toolbar__create-btn"
                onClick={() => setCreateOpen(true)}
              >
                <i className="fas fa-plus" /> Create Session
              </button>
            </div>

            <div className="at-table-panel">
              <div className="at-table-panel__head">
                <div className="at-table-panel__title">
                  <i className="fas fa-graduation-cap" /> Training Sessions
                </div>
                {!loading && (
                  <div className="at-table-panel__info">
                    <span className="at-table-panel__count">
                      {sessions.length} session
                      {sessions.length !== 1 ? "s" : ""}
                    </span>
                    <span className="at-table-panel__divider">•</span>
                    <span className="at-table-panel__sub">
                      Page 1 of {Math.ceil(sessions.length / 10) || 1}
                    </span>
                  </div>
                )}
              </div>
              <div className="at-table-panel__scroll">
                <table className="at-table">
                  <thead>
                    <tr>
                      <th>SESSION DETAILS</th>
                      <th>SERVICE</th>
                      <th>DATE & TIME</th>
                      <th>INSTRUCTOR</th>
                      <th>LOCATION</th>
                      <th>FEE</th>
                      <th>REGISTRATIONS</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9}>
                          <div className="at-table__loading">
                            <div className="at-table__loading-spinner">
                              <i className="fas fa-spinner fa-spin" />
                            </div>
                            <p>Loading training sessions...</p>
                            <span className="at-table__loading-sub">
                              Fetching session data
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : sessions.length === 0 ? (
                      <tr>
                        <td colSpan={9}>
                          <div className="at-table__empty">
                            <div className="at-table__empty-icon">
                              <i className="fas fa-calendar-xmark" />
                            </div>
                            <h3 className="at-table__empty-title">
                              No Sessions Found
                            </h3>
                            <p className="at-table__empty-message">
                              {search ||
                              filter !== "all" ||
                              service !== "All Services"
                                ? "Try adjusting your search or filter criteria"
                                : "Get started by creating your first training session"}
                            </p>
                            {(search ||
                              filter !== "all" ||
                              service !== "All Services") && (
                              <button
                                className="at-table__empty-action"
                                onClick={clearAllFilters}
                              >
                                <i className="fas fa-times" /> Clear Filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sessions.map((sess) => {
                        const svcColor =
                          SERVICE_OPTIONS.find(
                            (s) => s.key === sess.major_service,
                          )?.color || "#6b7280";
                        return (
                          <tr
                            key={sess.session_id}
                            onMouseEnter={() => setHoveredRow(sess.session_id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            className={
                              hoveredRow === sess.session_id
                                ? "at-table__row--hovered"
                                : ""
                            }
                          >
                            <td>
                              <div className="at-event-cell">
                                <div className="at-event-cell__title">
                                  {sess.title}
                                </div>
                                <div className="at-event-cell__id">
                                  <i className="fas fa-hashtag" /> ID: #
                                  {sess.session_id}
                                </div>
                                {sess.duration_days > 1 && (
                                  <div className="at-event-cell__duration">
                                    <i className="fas fa-calendar-week" />
                                    {sess.duration_days} days
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <ServiceBadge service={sess.major_service} />
                            </td>
                            <td>
                              <div className="at-date">
                                <div className="at-date__main">
                                  {new Date(
                                    sess.session_date,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </div>
                                {sess.session_end_date &&
                                  sess.session_end_date !==
                                    sess.session_date && (
                                    <div className="at-date__end">
                                      <i className="fas fa-arrow-right" />
                                      {new Date(
                                        sess.session_end_date,
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </div>
                                  )}
                                <div className="at-date__time">
                                  <i className="fas fa-clock" />
                                  {sess.start_time?.slice(0, 5)} –{" "}
                                  {sess.end_time?.slice(0, 5)}
                                </div>
                              </div>
                            </td>
                            <td>
                              {sess.instructor ? (
                                <div className="at-instructor">
                                  <div className="at-instructor__name">
                                    {sess.instructor}
                                  </div>
                                  {sess.instructor_credentials && (
                                    <div className="at-instructor__credentials">
                                      {sess.instructor_credentials}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="at-muted">
                                  <i className="fas fa-user-slash" /> Not
                                  assigned
                                </span>
                              )}
                            </td>
                            <td style={{ maxWidth: 200 }}>
                              <div className="at-location" title={sess.venue}>
                                <i
                                  className="fas fa-map-marker-alt"
                                  style={{ color: svcColor }}
                                />
                                {sess.venue?.split("\n")[0]}
                              </div>
                            </td>
                            <td>
                              <FeeBadge fee={sess.fee} />
                            </td>
                            <td>
                              <div className="at-regs">
                                <span className="at-regs__count">
                                  {sess.approved_count}/
                                  {sess.capacity > 0 ? sess.capacity : "∞"}
                                </span>
                                {sess.pending_count > 0 && (
                                  <span className="at-regs__pending">
                                    <i className="fas fa-clock" />
                                    {sess.pending_count} pending
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <StatusBadge
                                isPast={sess.is_past}
                                isUpcoming={sess.is_upcoming}
                              />
                            </td>
                            <td>
                              <div className="at-actions">
                                <button
                                  title="View Registrations"
                                  className="at-action-btn at-action-btn--view"
                                  onClick={() => setRegsSession(sess)}
                                  style={{
                                    background: `${svcColor}12`,
                                    color: svcColor,
                                    borderColor: `${svcColor}25`,
                                  }}
                                >
                                  <i className="fas fa-users" />
                                </button>
                                <button
                                  title="Edit Session"
                                  className="at-action-btn at-action-btn--edit"
                                  onClick={() => setEditSession(sess)}
                                  style={{
                                    background: "#3b82f612",
                                    color: "#3b82f6",
                                    borderColor: "#3b82f625",
                                  }}
                                >
                                  <i className="fas fa-pen" />
                                </button>
                                <button
                                  title="Archive Session"
                                  className="at-action-btn at-action-btn--archive"
                                  onClick={() => handleArchiveClick(sess)}
                                  style={{
                                    background: "#f59e0b12",
                                    color: "#f59e0b",
                                    borderColor: "#f59e0b25",
                                  }}
                                >
                                  <i className="fas fa-box-archive" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ ARCHIVED TAB ══ */}
        {tab === "archived" && (
          <>
            <div className="at-archive-banner">
              <i className="fas fa-info-circle" />
              Archived sessions are hidden from users. You can restore them to
              make them active again, or permanently delete them to remove all
              data.
            </div>

            <div className="at-toolbar">
              <div className="at-toolbar__search">
                <i className="fas fa-search at-toolbar__search-icon" />
                <input
                  className="at-toolbar__search-input"
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  placeholder="Search archived sessions..."
                />
                {archiveSearch && (
                  <button
                    className="at-toolbar__search-clear"
                    onClick={() => setArchiveSearch("")}
                  >
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>
              <div className="at-toolbar__filters">
                {SERVICE_OPTIONS.map((svc) => (
                  <button
                    key={svc.key}
                    className={`at-toolbar__filter-btn${archiveService === svc.key ? " at-toolbar__filter-btn--active" : ""}`}
                    onClick={() => setArchiveService(svc.key)}
                    style={
                      archiveService === svc.key
                        ? {
                            background: `${svc.color}12`,
                            color: svc.color,
                            borderColor: svc.color,
                          }
                        : {}
                    }
                  >
                    {svc.label}
                  </button>
                ))}
                {archiveService !== "All Services" && (
                  <button
                    className="at-toolbar__filter-clear"
                    onClick={() => setArchiveService("All Services")}
                  >
                    <i className="fas fa-times" /> Clear
                  </button>
                )}
              </div>
            </div>

            <div className="at-table-panel at-table-panel--archived">
              <div className="at-table-panel__head">
                <div className="at-table-panel__title">
                  <i className="fas fa-box-archive" /> Archived Sessions
                  <span className="at-table-panel__archived-hint">
                    Hidden from users
                  </span>
                </div>
                {!archiveLoading && (
                  <div className="at-table-panel__info">
                    <span className="at-table-panel__count">
                      {archived.length} archived
                    </span>
                  </div>
                )}
              </div>
              <div className="at-table-panel__scroll">
                <table className="at-table at-table--archived">
                  <thead>
                    <tr>
                      <th>SESSION DETAILS</th>
                      <th>SERVICE</th>
                      <th>DATE</th>
                      <th>INSTRUCTOR</th>
                      <th>LOCATION</th>
                      <th>REGISTRATIONS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archiveLoading ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="at-table__loading">
                            <div className="at-table__loading-spinner">
                              <i className="fas fa-spinner fa-spin" />
                            </div>
                            <p>Loading archived sessions...</p>
                          </div>
                        </td>
                      </tr>
                    ) : archived.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="at-table__empty">
                            <div className="at-table__empty-icon">
                              <i className="fas fa-box-open" />
                            </div>
                            <h3 className="at-table__empty-title">
                              No Archived Sessions
                            </h3>
                            <p className="at-table__empty-message">
                              Sessions you archive will appear here. You can
                              restore them anytime.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      archived.map((sess) => {
                        const svcColor =
                          SERVICE_OPTIONS.find(
                            (s) => s.key === sess.major_service,
                          )?.color || "#6b7280";
                        return (
                          <tr
                            key={sess.session_id}
                            className="at-table__row--archived"
                          >
                            <td>
                              <div className="at-event-cell">
                                <div className="at-event-cell__title at-event-cell__title--muted">
                                  {sess.title}
                                </div>
                                <div className="at-event-cell__id">
                                  <i className="fas fa-hashtag" /> ID: #
                                  {sess.session_id}
                                </div>
                                {sess.duration_days > 1 && (
                                  <div className="at-event-cell__duration">
                                    <i className="fas fa-calendar-week" />
                                    {sess.duration_days} days
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <ServiceBadge service={sess.major_service} />
                            </td>
                            <td>
                              <div className="at-date">
                                <div className="at-date__main">
                                  {new Date(
                                    sess.session_date,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </div>
                                {sess.session_end_date &&
                                  sess.session_end_date !==
                                    sess.session_date && (
                                    <div className="at-date__end">
                                      <i className="fas fa-arrow-right" />
                                      {new Date(
                                        sess.session_end_date,
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </div>
                                  )}
                              </div>
                            </td>
                            <td>
                              {sess.instructor ? (
                                <div className="at-instructor">
                                  <div className="at-instructor__name">
                                    {sess.instructor}
                                  </div>
                                  {sess.instructor_credentials && (
                                    <div className="at-instructor__credentials">
                                      {sess.instructor_credentials}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="at-muted">
                                  <i className="fas fa-user-slash" /> Not
                                  assigned
                                </span>
                              )}
                            </td>
                            <td style={{ maxWidth: 200 }}>
                              <div className="at-location" title={sess.venue}>
                                <i
                                  className="fas fa-map-marker-alt"
                                  style={{ color: svcColor }}
                                />
                                {sess.venue?.split("\n")[0]}
                              </div>
                            </td>
                            <td>
                              <div className="at-regs">
                                <span className="at-regs__count">
                                  {sess.total_registrations ?? 0} registered
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="at-actions">
                                <button
                                  title="Restore Session"
                                  className="at-action-btn at-action-btn--restore"
                                  onClick={() => handleRestoreClick(sess)}
                                  style={{
                                    background: "#10b98112",
                                    color: "#10b981",
                                    borderColor: "#10b98125",
                                  }}
                                >
                                  <i className="fas fa-rotate-left" />
                                </button>
                                <button
                                  title="Permanently Delete"
                                  className="at-action-btn at-action-btn--delete"
                                  onClick={() =>
                                    handlePermanentDeleteClick(sess)
                                  }
                                  style={{
                                    background: "#ef444412",
                                    color: "#ef4444",
                                    borderColor: "#ef444425",
                                  }}
                                >
                                  <i className="fas fa-trash" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
      {/* /at-body */}

      {/* MODALS */}
      {(createOpen || editSession) && (
        <SessionModal
          session={editSession || null}
          onClose={() => {
            setEditSession(null);
            setCreateOpen(false);
          }}
          onSaved={handleSaved}
        />
      )}
      {regsSession && (
        <RegistrationsModal
          session={regsSession}
          onClose={() => setRegsSession(null)}
          onUpdate={() => {
            fetchSessions();
            refreshStats();
          }}
        />
      )}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          confirmColor={confirm.confirmColor}
          icon={confirm.icon}
          onConfirm={executeConfirm}
          onCancel={() => setConfirm(null)}
        />
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
