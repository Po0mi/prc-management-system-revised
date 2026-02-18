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

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const SERVICE_OPTIONS = [
  { key: "All Services", label: "All Services", color: "#8b1e1e" },
  { key: "Health Service", label: "Health Service", color: "#c41e3a" },
  { key: "Safety Service", label: "Safety Service", color: "#15803d" },
  { key: "Welfare Service", label: "Welfare Service", color: "#7c3aed" },
  {
    key: "Disaster Management Service",
    label: "Disaster Management",
    color: "#c2410c",
  },
  { key: "Red Cross Youth", label: "Red Cross Youth", color: "#003d6b" },
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

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`at-toast at-toast--${type}`} onClick={onClose}>
      <i
        className={`fas ${type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`}
      />
      {message}
      <button className="at-toast__close" onClick={onClose}>
        <i className="fas fa-xmark" />
      </button>
    </div>
  );
}

// ─── SESSION FORM MODAL ──────────────────────────────────────────────────────
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
      // Ensure end_date is set
      if (!payload.session_end_date) {
        payload.session_end_date = payload.session_date;
      }

      const res = isEdit
        ? await updateTrainingSession(session.session_id, payload)
        : await createTrainingSession(payload);
      onSaved(res.message || "Saved successfully");
    } catch (err) {
      setErrors({ _global: err.message || "Save failed" });
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
          <span>
            <i className={`fas ${isEdit ? "fa-pen" : "fa-plus"}`} />
            {isEdit ? " Edit Training Session" : " Create New Session"}
          </span>
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

          {/* Session Title */}
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

          {/* Description */}
          <div className="at-form__field">
            <label className="at-form__label">Description</label>
            <textarea
              className="at-form__textarea"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Training session description and objectives"
            />
          </div>

          {/* Major Service */}
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

          {/* Start Date + End Date */}
          <div className="at-form__row">
            <div className="at-form__field at-form__field--no-mb">
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
            <div className="at-form__field at-form__field--no-mb">
              <label className="at-form__label">End Date</label>
              <input
                type="date"
                className="at-form__input"
                value={form.session_end_date || form.session_date}
                onChange={(e) => set("session_end_date", e.target.value)}
              />
              <small className="at-form__hint">
                Same as start date if single day
              </small>
            </div>
          </div>

          {/* Start Time + End Time */}
          <div className="at-form__row">
            <div className="at-form__field at-form__field--no-mb">
              <label className="at-form__label">Start Time</label>
              <input
                type="time"
                className="at-form__input"
                value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)}
              />
            </div>
            <div className="at-form__field at-form__field--no-mb">
              <label className="at-form__label">End Time</label>
              <input
                type="time"
                className="at-form__input"
                value={form.end_time}
                onChange={(e) => set("end_time", e.target.value)}
              />
            </div>
          </div>

          {/* Venue */}
          <div className="at-form__field">
            <label className="at-form__label">
              Training Venue & Directions{" "}
              <span className="at-form__required">*</span>
            </label>
            <textarea
              className={`at-form__textarea${errors.venue ? " at-form__textarea--error" : ""}`}
              rows={3}
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
              placeholder="Include full address and travel instructions"
            />
            <small className="at-form__hint">
              Tip: Include room numbers, floor levels, parking info, and
              accessibility notes
            </small>
            {errors.venue && (
              <span className="at-form__error-text">
                <i className="fas fa-circle-exclamation" /> {errors.venue}
              </span>
            )}
          </div>

          {/* Capacity + Fee */}
          <div className="at-form__row">
            <div className="at-form__field at-form__field--no-mb">
              <label className="at-form__label">Capacity</label>
              <input
                type="number"
                className="at-form__input"
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                min="0"
                placeholder="0 for unlimited"
              />
            </div>
            <div className="at-form__field at-form__field--no-mb">
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

          {/* Instructor */}
          <div className="at-form__field">
            <label className="at-form__label">Instructor/Facilitator</label>
            <input
              className="at-form__input"
              value={form.instructor}
              onChange={(e) => set("instructor", e.target.value)}
              placeholder="e.g., Dr. Maria Santos, RN"
            />
            <small className="at-form__hint">
              Optional - Leave blank if not assigned yet
            </small>
          </div>

          {/* Instructor Credentials */}
          <div className="at-form__field">
            <label className="at-form__label">Instructor Credentials</label>
            <input
              className="at-form__input"
              value={form.instructor_credentials}
              onChange={(e) => set("instructor_credentials", e.target.value)}
              placeholder="e.g., MD, BLS Instructor, ACLS Provider, 10+ years emergency medicine"
            />
            <small className="at-form__hint">
              Professional qualifications and certifications
            </small>
          </div>

          {/* Instructor Bio */}
          <div className="at-form__field">
            <label className="at-form__label">Instructor Bio/Background</label>
            <textarea
              className="at-form__textarea"
              rows={3}
              value={form.instructor_bio}
              onChange={(e) => set("instructor_bio", e.target.value)}
              placeholder="Brief professional background, specializations, and relevant experience"
            />
          </div>

          {/* Requirements */}
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
                <i className="fas fa-spinner fa-spin" /> Saving…
              </>
            ) : (
              <>
                <i className="fas fa-floppy-disk" /> Save Training Session
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── REGISTRATIONS MODAL ─────────────────────────────────────────────────────
function RegistrationsModal({ session, onClose, onUpdate }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  const loadRegistrations = useCallback(async () => {
    try {
      // TODO: Replace with actual session registrations API call
      // const { registrations: regs } = await getSessionRegistrations(session.session_id);

      // Placeholder - will be replaced with actual API
      setRegistrations([]);
      setStats({ total: 0, approved: 0, pending: 0, rejected: 0 });
    } catch (err) {
      console.error("Load registrations error:", err);
    } finally {
      setLoading(false);
    }
  }, [session.session_id]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  async function handleApprove(regId) {
    try {
      // TODO: Replace with actual API call
      // await approveSessionRegistration(regId);
      alert("Approve functionality coming soon");
      loadRegistrations();
      onUpdate?.();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleReject(regId) {
    try {
      // TODO: Replace with actual API call
      // await rejectSessionRegistration(regId);
      alert("Reject functionality coming soon");
      loadRegistrations();
      onUpdate?.();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(regId) {
    if (!window.confirm("Delete this registration?")) return;
    try {
      // TODO: Replace with actual API call
      // await deleteSessionRegistration(regId);
      alert("Delete functionality coming soon");
      loadRegistrations();
      onUpdate?.();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="at-overlay" onClick={onClose}>
      <div
        className="at-modal at-modal--xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="at-modal__header">
          <span>
            <i className="fas fa-users" /> Registrations —{" "}
            <strong>{session.title}</strong>
          </span>
          <button className="at-modal__close" onClick={onClose}>
            <i className="fas fa-xmark" />
          </button>
        </div>

        <div className="at-modal__body at-modal__body--regs">
          {/* Stats Cards */}
          <div className="at-reg-stats">
            <div className="at-reg-stat">
              <div className="at-reg-stat__num">{stats.total}</div>
              <div className="at-reg-stat__label">Total Registrations</div>
            </div>
            <div className="at-reg-stat at-reg-stat--approved">
              <div className="at-reg-stat__num">{stats.approved}</div>
              <div className="at-reg-stat__label">Approved</div>
            </div>
            <div className="at-reg-stat at-reg-stat--pending">
              <div className="at-reg-stat__num">{stats.pending}</div>
              <div className="at-reg-stat__label">Pending</div>
            </div>
            <div className="at-reg-stat at-reg-stat--rejected">
              <div className="at-reg-stat__num">{stats.rejected}</div>
              <div className="at-reg-stat__label">Rejected</div>
            </div>
          </div>

          {/* Registrations Table */}
          {loading ? (
            <div className="at-reg-loading">
              <i className="fas fa-spinner fa-spin" />
              <p>Loading registrations…</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="at-reg-empty">
              <i className="fas fa-inbox" />
              <p>No registrations yet</p>
            </div>
          ) : (
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
                  <tr key={reg.registration_id}>
                    <td>
                      <div className="at-reg-user">
                        <div className="at-reg-user__avatar">
                          {reg.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="at-reg-user__name">
                            {reg.full_name}
                          </div>
                          <div className="at-reg-user__email">{reg.email}</div>
                          {reg.age && (
                            <div className="at-reg-user__meta">
                              Age: {reg.age}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {new Date(reg.registration_date).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </td>
                    <td>
                      <span className={`at-status at-status--${reg.status}`}>
                        {reg.status.toUpperCase()}
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
                            <i className="fas fa-file" /> Requirements
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
                              onClick={() => handleApprove(reg.registration_id)}
                              title="Approve"
                            >
                              <i className="fas fa-check" />
                            </button>
                            <button
                              className="at-reg-btn at-reg-btn--reject"
                              onClick={() => handleReject(reg.registration_id)}
                              title="Reject"
                            >
                              <i className="fas fa-xmark" />
                            </button>
                          </>
                        )}
                        <button
                          className="at-reg-btn at-reg-btn--delete"
                          onClick={() => handleDelete(reg.registration_id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function AdminTraining() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [service, setService] = useState("All Services");
  const [editSession, setEditSession] = useState(null);
  const [regsSession, setRegsSession] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── STATS ──────────────────────────────────────────────────────────────────
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

  // ── SESSIONS ───────────────────────────────────────────────────────────────
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
      console.error("Fetch sessions error:", err);
      showToast(err.message || "Failed to load training sessions", "error");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [filter, search, service]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // ── DELETE ─────────────────────────────────────────────────────────────────
  async function handleDelete(session) {
    if (!window.confirm(`Archive training session "${session.title}"?`)) return;
    try {
      const res = await deleteTrainingSession(session.session_id);
      showToast(res.message || "Session archived");
      fetchSessions();
      refreshStats();
    } catch (err) {
      showToast(err.message || "Failed to delete session", "error");
    }
  }

  // ── SAVED ──────────────────────────────────────────────────────────────────
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

  return (
    <div className="at-root">
      {/* PAGE HEADER */}
      <div className="at-header">
        <div className="at-header__inner">
          <div>
            <div className="at-header__eyebrow">
              <i className="fas fa-graduation-cap" /> Training Sessions
              Management
            </div>
            <h1 className="at-header__title">Training Administration</h1>
            <p className="at-header__subtitle">
              Schedule and manage training sessions and participant
              registrations
            </p>
          </div>
          <div className="at-header__stats">
            {[
              { n: totalSessions, label: "Total Sessions" },
              { n: upcomingSessions, label: "Upcoming" },
              { n: completedSessions, label: "Completed" },
            ].map(({ n, label }) => (
              <div key={label}>
                <div className="at-header__stat-num">{n ?? "—"}</div>
                <div className="at-header__stat-label">{label}</div>
              </div>
            ))}
          </div>
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

            return (
              <button
                key={svc.key}
                className={`at-service-card${service === svc.key ? " at-service-card--active" : ""}`}
                style={{ borderColor: svc.color }}
                onClick={() => setService(svc.key)}
              >
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

        {/* TOOLBAR */}
        <div className="at-toolbar">
          <div className="at-toolbar__search">
            <i className="fas fa-magnifying-glass at-toolbar__search-icon" />
            <input
              className="at-toolbar__search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sessions…"
            />
            {search && (
              <button
                className="at-toolbar__search-clear"
                onClick={() => setSearch("")}
              >
                <i className="fas fa-xmark" />
              </button>
            )}
          </div>

          <div className="at-toolbar__filters">
            {[
              { key: "all", label: "All" },
              { key: "upcoming", label: "Upcoming" },
              { key: "past", label: "Past" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`at-toolbar__filter-btn${filter === key ? " at-toolbar__filter-btn--active" : ""}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            className="at-toolbar__create-btn"
            onClick={() => setCreateOpen(true)}
          >
            <i className="fas fa-plus" /> Create New Session
          </button>
        </div>

        {/* TABLE */}
        <div className="at-table-panel">
          <div className="at-table-panel__head">
            <span className="at-table-panel__title">
              <i className="fas fa-table-list" /> All Training Sessions
            </span>
            {!loading && (
              <span className="at-table-panel__count">
                {sessions.length} result{sessions.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="at-table-panel__scroll">
            <table className="at-table">
              <thead>
                <tr>
                  <th>SESSION DETAILS</th>
                  <th>SERVICE</th>
                  <th>DATE RANGE & TIME</th>
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
                        <i className="fas fa-spinner fa-spin at-table__loading-icon" />
                        <p>Loading training sessions…</p>
                      </div>
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="at-table__empty">
                        <i className="fas fa-calendar-xmark at-table__empty-icon" />
                        <p>No training sessions found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sessions.map((sess) => (
                    <tr key={sess.session_id}>
                      <td>
                        <div className="at-event-cell">
                          <div className="at-event-cell__title">
                            {sess.title}
                          </div>
                          <div className="at-event-cell__id">
                            ID: #{sess.session_id}
                          </div>
                          {sess.duration_days > 1 && (
                            <div className="at-event-cell__duration">
                              {sess.duration_days} days
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="at-badge at-badge--service">
                          {sess.major_service}
                        </span>
                      </td>
                      <td>
                        <div className="at-date">
                          <div>
                            {new Date(sess.session_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                          {sess.session_end_date &&
                            sess.session_end_date !== sess.session_date && (
                              <div className="at-date__end">
                                to{" "}
                                {new Date(
                                  sess.session_end_date,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                            )}
                          <div className="at-date__time">
                            {sess.start_time?.slice(0, 5)} -{" "}
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
                          <span className="at-muted">Not assigned</span>
                        )}
                      </td>
                      <td style={{ maxWidth: 200 }}>
                        <div className="at-location">
                          {sess.venue?.split("\n")[0]}
                        </div>
                      </td>
                      <td>
                        {sess.fee > 0 ? (
                          <span className="at-fee">
                            ₱{parseFloat(sess.fee).toFixed(2)}
                          </span>
                        ) : (
                          <span className="at-badge at-badge--free">FREE</span>
                        )}
                      </td>
                      <td>
                        <div className="at-regs">
                          <span className="at-regs__count">
                            {sess.approved_count}/
                            {sess.capacity > 0 ? sess.capacity : "∞"}
                          </span>
                          {sess.pending_count > 0 && (
                            <span className="at-regs__pending">
                              {sess.pending_count} pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {sess.is_past ? (
                          <span className="at-badge at-badge--completed">
                            COMPLETED
                          </span>
                        ) : sess.is_upcoming ? (
                          <span className="at-badge at-badge--upcoming">
                            UPCOMING
                          </span>
                        ) : (
                          <span className="at-badge">ONGOING</span>
                        )}
                      </td>
                      <td>
                        <div className="at-actions">
                          <button
                            title="View Registrations"
                            className="at-action-btn at-action-btn--view"
                            onClick={() => setRegsSession(sess)}
                          >
                            <i className="fas fa-users" />
                          </button>
                          <button
                            title="Edit Session"
                            className="at-action-btn at-action-btn--edit"
                            onClick={() => setEditSession(sess)}
                          >
                            <i className="fas fa-pen" />
                          </button>
                          <button
                            title="Archive Session"
                            className="at-action-btn at-action-btn--delete"
                            onClick={() => handleDelete(sess)}
                          >
                            <i className="fas fa-archive" />
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
