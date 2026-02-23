// AdminEvents.jsx
// Path: src/pages/AdminEvents/AdminEvents.jsx

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminEvents.scss";
import {
  getEvents,
  getEventStats,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../../services/eventsApi";
import {
  getRegistrations,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
} from "../../services/registrationsApi";
import api from "../../services/api";

// ─── ARCHIVE API HELPERS ──────────────────────────────────────────────────────
const BASE = "/api/events.php";

async function getArchivedEvents({
  search = "",
  service = "All Services",
} = {}) {
  const params = { archived: "1" };
  if (search.trim()) params.search = search.trim();
  if (service && service !== "All Services") params.service = service;
  const { data } = await api.get(BASE, { params });
  if (!data.success)
    throw new Error(data.message || "Failed to fetch archived events");
  return { events: data.events ?? [] };
}

async function restoreEvent(id) {
  const { data } = await api.put(
    BASE,
    {},
    { params: { action: "restore", id } },
  );
  if (!data.success) throw new Error(data.message || "Failed to restore event");
  return data;
}

async function permanentDeleteEvent(id) {
  const { data } = await api.delete(BASE, {
    params: { action: "permanent-delete", id },
  });
  if (!data.success)
    throw new Error(data.message || "Failed to permanently delete event");
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
  event_date: "",
  event_end_date: "",
  start_time: "09:00",
  end_time: "17:00",
  location: "",
  capacity: 0,
  fee: 0,
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
      className="ae-badge ae-badge--service"
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
      className="ae-badge"
      style={{ background: bg, color, border: `1px solid ${color}33` }}
    >
      <i className={`fas ${icon}`} /> {label}
    </span>
  );
}

function FeeBadge({ fee }) {
  if (fee > 0)
    return <span className="ae-fee">₱{parseFloat(fee).toFixed(2)}</span>;
  return (
    <span
      className="ae-badge ae-badge--free"
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
    <div className={`ae-toast ae-toast--${type}`} onClick={onClose}>
      <div className="ae-toast__icon">
        <i
          className={`fas ${type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`}
        />
      </div>
      <div className="ae-toast__content">
        <div className="ae-toast__title">
          {type === "success" ? "Success" : "Error"}
        </div>
        <div className="ae-toast__message">{message}</div>
      </div>
      <button className="ae-toast__close" onClick={onClose}>
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
    <div className="ae-overlay ae-overlay--confirm" onClick={onCancel}>
      <div className="ae-confirm" onClick={(e) => e.stopPropagation()}>
        <div
          className="ae-confirm__icon"
          style={{ color: confirmColor, background: `${confirmColor}12` }}
        >
          <i className={`fas ${icon}`} />
        </div>
        <h3 className="ae-confirm__title">{title}</h3>
        <p className="ae-confirm__message">{message}</p>
        <div className="ae-confirm__actions">
          <button className="ae-confirm__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="ae-confirm__ok"
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

// ─── EVENT FORM MODAL ─────────────────────────────────────────────────────────
function EventModal({ event, onClose, onSaved }) {
  const [form, setForm] = useState(event || { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const isEdit = !!event;

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.title?.trim()) e.title = "Title is required";
    if (!form.major_service) e.major_service = "Service is required";
    if (!form.event_date) e.event_date = "Start date is required";
    if (!form.location?.trim()) e.location = "Location is required";
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
      if (!payload.event_end_date) payload.event_end_date = payload.event_date;
      const res = isEdit
        ? await updateEvent(event.event_id, payload)
        : await createEvent(payload);
      onSaved(res.message || "Event saved successfully");
    } catch (err) {
      setErrors({ _global: err.message || "Failed to save event" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ae-overlay" onClick={onClose}>
      <div
        className="ae-modal ae-modal--lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ae-modal__header">
          <div className="ae-modal__title">
            <i
              className={`fas ${isEdit ? "fa-pen-to-square" : "fa-plus-circle"}`}
            />
            {isEdit ? " Edit Event" : " Create New Event"}
          </div>
          <button className="ae-modal__close" onClick={onClose}>
            <i className="fas fa-xmark" />
          </button>
        </div>
        <form className="ae-modal__body" onSubmit={handleSubmit}>
          {errors._global && (
            <div className="ae-form__error-banner">
              <i className="fas fa-circle-exclamation" /> {errors._global}
            </div>
          )}
          <div className="ae-form__field">
            <label className="ae-form__label">
              Event Title <span className="ae-form__required">*</span>
            </label>
            <input
              className={`ae-form__input${errors.title ? " ae-form__input--error" : ""}`}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Enter event title"
            />
            {errors.title && (
              <span className="ae-form__error-text">
                <i className="fas fa-circle-exclamation" /> {errors.title}
              </span>
            )}
          </div>
          <div className="ae-form__field">
            <label className="ae-form__label">Description</label>
            <textarea
              className="ae-form__textarea"
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Enter event description, agenda, and important details"
            />
          </div>
          <div className="ae-form__field">
            <label className="ae-form__label">
              Major Service <span className="ae-form__required">*</span>
            </label>
            <select
              className={`ae-form__select${errors.major_service ? " ae-form__select--error" : ""}`}
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
              <span className="ae-form__error-text">
                <i className="fas fa-circle-exclamation" />{" "}
                {errors.major_service}
              </span>
            )}
          </div>
          <div className="ae-form__row">
            <div className="ae-form__field">
              <label className="ae-form__label">
                Start Date <span className="ae-form__required">*</span>
              </label>
              <input
                type="date"
                className={`ae-form__input${errors.event_date ? " ae-form__input--error" : ""}`}
                value={form.event_date}
                onChange={(e) => set("event_date", e.target.value)}
              />
              {errors.event_date && (
                <span className="ae-form__error-text">
                  <i className="fas fa-circle-exclamation" />{" "}
                  {errors.event_date}
                </span>
              )}
            </div>
            <div className="ae-form__field">
              <label className="ae-form__label">End Date</label>
              <input
                type="date"
                className="ae-form__input"
                value={form.event_end_date || form.event_date}
                onChange={(e) => set("event_end_date", e.target.value)}
              />
              <small className="ae-form__hint">
                <i className="fas fa-info-circle" /> Leave blank for single day
              </small>
            </div>
          </div>
          <div className="ae-form__row">
            <div className="ae-form__field">
              <label className="ae-form__label">Start Time</label>
              <input
                type="time"
                className="ae-form__input"
                value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)}
              />
            </div>
            <div className="ae-form__field">
              <label className="ae-form__label">End Time</label>
              <input
                type="time"
                className="ae-form__input"
                value={form.end_time}
                onChange={(e) => set("end_time", e.target.value)}
              />
            </div>
          </div>
          <div className="ae-form__field">
            <label className="ae-form__label">
              Event Location & Directions{" "}
              <span className="ae-form__required">*</span>
            </label>
            <textarea
              className={`ae-form__textarea${errors.location ? " ae-form__textarea--error" : ""}`}
              rows={3}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Full address, venue name, and travel instructions"
            />
            {errors.location && (
              <span className="ae-form__error-text">
                <i className="fas fa-circle-exclamation" /> {errors.location}
              </span>
            )}
          </div>
          <div className="ae-form__row">
            <div className="ae-form__field">
              <label className="ae-form__label">Capacity</label>
              <input
                type="number"
                className="ae-form__input"
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                min="0"
                placeholder="0 for unlimited"
              />
              <small className="ae-form__hint">
                <i className="fas fa-info-circle" /> Maximum participants (0 =
                unlimited)
              </small>
            </div>
            <div className="ae-form__field">
              <label className="ae-form__label">Fee (₱)</label>
              <input
                type="number"
                step="0.01"
                className="ae-form__input"
                value={form.fee}
                onChange={(e) => set("fee", e.target.value)}
                min="0"
                placeholder="0.00 for free"
              />
            </div>
          </div>
          <button type="submit" disabled={saving} className="ae-form__submit">
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Saving Event...
              </>
            ) : (
              <>
                <i className="fas fa-save" />{" "}
                {isEdit ? "Update Event" : "Create Event"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── REGISTRATIONS MODAL ──────────────────────────────────────────────────────
function RegistrationsModal({ event, onClose, onUpdate }) {
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
      const { registrations: regs } = await getRegistrations(event.event_id);
      setRegistrations(regs);
      setStats({
        total: regs.length,
        approved: regs.filter((r) => r.status === "approved").length,
        pending: regs.filter((r) => r.status === "pending").length,
        rejected: regs.filter((r) => r.status === "rejected").length,
      });
    } catch (err) {
      console.error("Load registrations error:", err);
    } finally {
      setLoading(false);
    }
  }, [event.event_id]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  async function handleApprove(id) {
    try {
      await approveRegistration(id);
      loadRegistrations();
      onUpdate?.();
    } catch (err) {
      alert(err.message);
    }
  }
  async function handleReject(id) {
    try {
      await rejectRegistration(id);
      loadRegistrations();
      onUpdate?.();
    } catch (err) {
      alert(err.message);
    }
  }
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this registration?"))
      return;
    try {
      await deleteRegistration(id);
      loadRegistrations();
      onUpdate?.();
    } catch (err) {
      alert(err.message);
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
    <div className="ae-overlay" onClick={onClose}>
      <div
        className="ae-modal ae-modal--xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ae-modal__header">
          <div className="ae-modal__title">
            <i className="fas fa-users" /> Registrations —{" "}
            <strong>{event.title}</strong>
          </div>
          <button className="ae-modal__close" onClick={onClose}>
            <i className="fas fa-xmark" />
          </button>
        </div>
        <div className="ae-modal__body ae-modal__body--regs">
          <div className="ae-reg-stats">
            {[
              ["Total Registrations", stats.total, ""],
              ["Approved", stats.approved, "approved"],
              ["Pending", stats.pending, "pending"],
              ["Rejected", stats.rejected, "rejected"],
            ].map(([label, val, mod]) => (
              <div
                key={label}
                className={`ae-reg-stat${mod ? ` ae-reg-stat--${mod}` : ""}`}
              >
                <div className="ae-reg-stat__num">{val}</div>
                <div className="ae-reg-stat__label">{label}</div>
              </div>
            ))}
          </div>
          {loading ? (
            <div className="ae-reg-loading">
              <div className="ae-reg-loading__spinner">
                <i className="fas fa-spinner fa-spin" />
              </div>
              <p>Loading registrations...</p>
              <span className="ae-reg-loading__sub">
                Fetching participant data
              </span>
            </div>
          ) : registrations.length === 0 ? (
            <div className="ae-reg-empty">
              <div className="ae-reg-empty__icon">
                <i className="fas fa-inbox" />
              </div>
              <h3 className="ae-reg-empty__title">No Registrations Yet</h3>
              <p className="ae-reg-empty__message">
                No participants have registered for this event
              </p>
            </div>
          ) : (
            <div className="ae-reg-table-container">
              <table className="ae-reg-table">
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
                    <tr key={reg.registration_id} className="ae-reg-row">
                      <td>
                        <div className="ae-reg-user">
                          <div
                            className="ae-reg-user__avatar"
                            style={{
                              background: "#c41e3a12",
                              color: "#c41e3a",
                              border: "2px solid #c41e3a25",
                            }}
                          >
                            {getInitials(reg.full_name)}
                          </div>
                          <div className="ae-reg-user__info">
                            <div className="ae-reg-user__name">
                              {reg.full_name}
                            </div>
                            <div className="ae-reg-user__email">
                              {reg.email}
                            </div>
                            {reg.age && (
                              <div className="ae-reg-user__meta">
                                <i className="fas fa-cake-candles" /> Age:{" "}
                                {reg.age}
                              </div>
                            )}
                            {reg.location && (
                              <div className="ae-reg-user__meta">
                                <i className="fas fa-location-dot" />{" "}
                                {reg.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="ae-reg-date">
                          <div className="ae-reg-date__main">
                            {new Date(reg.registration_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                          <div className="ae-reg-date__time">
                            {new Date(reg.registration_date).toLocaleTimeString(
                              "en-US",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`ae-status ae-status--${reg.status}`}>
                          {reg.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="ae-reg-docs">
                          {reg.valid_id_path && (
                            <a
                              href={`http://localhost/prc-management-system/${reg.valid_id_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="ae-doc-link"
                            >
                              <i className="fas fa-id-card" /> Valid ID
                            </a>
                          )}
                          {reg.documents_path && (
                            <a
                              href={`http://localhost/prc-management-system/${reg.documents_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="ae-doc-link"
                            >
                              <i className="fas fa-file-alt" /> Documents
                            </a>
                          )}
                          {reg.payment_receipt_path && (
                            <a
                              href={`http://localhost/prc-management-system/${reg.payment_receipt_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="ae-doc-link"
                            >
                              <i className="fas fa-receipt" /> Receipt
                            </a>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="ae-reg-actions">
                          {reg.status === "pending" && (
                            <>
                              <button
                                className="ae-reg-btn ae-reg-btn--approve"
                                onClick={() =>
                                  handleApprove(reg.registration_id)
                                }
                                title="Approve Registration"
                              >
                                <i className="fas fa-check" />
                              </button>
                              <button
                                className="ae-reg-btn ae-reg-btn--reject"
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
                            className="ae-reg-btn ae-reg-btn--delete"
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
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminEvents() {
  const navigate = useNavigate();

  // ── Tab ────────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("active"); // "active" | "archived"

  // ── Active events ──────────────────────────────────────────────────────────
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [service, setService] = useState("All Services");

  // ── Archived events ────────────────────────────────────────────────────────
  const [archived, setArchived] = useState([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archiveService, setArchiveService] = useState("All Services");

  // ── UI ─────────────────────────────────────────────────────────────────────
  const [editEvent, setEditEvent] = useState(null);
  const [regsEvent, setRegsEvent] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const refreshStats = useCallback(async () => {
    try {
      const { stats } = await getEventStats();
      setStats(stats);
    } catch (err) {
      console.error("Stats error:", err);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // ── Active events fetch ────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { events: evts } = await getEvents({ filter, search, service });
      setEvents(evts);
    } catch (err) {
      showToast(err.message || "Failed to load events", "error");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [filter, search, service]);

  useEffect(() => {
    if (tab === "active") fetchEvents();
  }, [fetchEvents, tab]);

  // ── Archived events fetch ──────────────────────────────────────────────────
  const fetchArchived = useCallback(async () => {
    setArchiveLoading(true);
    try {
      const { events: evts } = await getArchivedEvents({
        search: archiveSearch,
        service: archiveService,
      });
      setArchived(evts);
    } catch (err) {
      showToast(err.message || "Failed to load archived events", "error");
      setArchived([]);
    } finally {
      setArchiveLoading(false);
    }
  }, [archiveSearch, archiveService]);

  useEffect(() => {
    if (tab === "archived") fetchArchived();
  }, [fetchArchived, tab]);

  // ── Confirm helpers ────────────────────────────────────────────────────────
  function handleArchiveClick(evt) {
    setConfirm({
      type: "archive",
      event: evt,
      title: "Archive Event",
      message: `Archive "${evt.title}"? It will be hidden from users and registered participants will be notified of cancellation.`,
      confirmLabel: "Archive",
      confirmColor: "#f59e0b",
      icon: "fa-box-archive",
    });
  }

  function handleRestoreClick(evt) {
    setConfirm({
      type: "restore",
      event: evt,
      title: "Restore Event",
      message: `Restore "${evt.title}"? It will reappear in the active events list and be visible to users again.`,
      confirmLabel: "Restore",
      confirmColor: "#10b981",
      icon: "fa-rotate-left",
    });
  }

  function handlePermanentDeleteClick(evt) {
    setConfirm({
      type: "permanent",
      event: evt,
      title: "Permanently Delete Event",
      message: `Permanently delete "${evt.title}"? This cannot be undone. All registration records will also be deleted.`,
      confirmLabel: "Delete Permanently",
      confirmColor: "#ef4444",
      icon: "fa-trash",
    });
  }

  async function executeConfirm() {
    if (!confirm) return;
    const { type, event: evt } = confirm;
    setConfirm(null);
    try {
      if (type === "archive") {
        await deleteEvent(evt.event_id);
        showToast(`"${evt.title}" archived successfully`);
        fetchEvents();
        refreshStats();
      } else if (type === "restore") {
        await restoreEvent(evt.event_id);
        showToast(`"${evt.title}" restored successfully`);
        fetchArchived();
        refreshStats();
      } else if (type === "permanent") {
        await permanentDeleteEvent(evt.event_id);
        showToast(`"${evt.title}" permanently deleted`);
        fetchArchived();
        refreshStats();
      }
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    }
  }

  function handleSaved(msg) {
    showToast(msg);
    setEditEvent(null);
    setCreateOpen(false);
    fetchEvents();
    refreshStats();
  }

  const totalEvents = stats?.total ?? events.length;
  const upcomingEvents = stats?.upcoming ?? 0;
  const completedEvents = stats?.completed ?? 0;
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
    <div className="ae-root">
      {/* PAGE HEADER */}
      <div className="ae-header">
        <div className="ae-header__container">
          <div className="ae-header__content">
            <div className="ae-header__left">
              <div className="ae-header__badge">
                <i className="fas fa-calendar-alt" /> Event Management
              </div>
              <h1 className="ae-header__title">Events Administration</h1>
              <p className="ae-header__subtitle">
                Create, manage, and track events and participant registrations
              </p>
            </div>
            <div className="ae-header__stats">
              <div className="ae-header-stat">
                <span className="ae-header-stat__value">{totalEvents}</span>
                <span className="ae-header-stat__label">Total Events</span>
              </div>
              <div className="ae-header-stat">
                <span className="ae-header-stat__value">{upcomingEvents}</span>
                <span className="ae-header-stat__label">Upcoming</span>
              </div>
              <div className="ae-header-stat">
                <span className="ae-header-stat__value">{completedEvents}</span>
                <span className="ae-header-stat__label">Completed</span>
              </div>
            </div>
          </div>
        </div>
        <div className="ae-header__wave">
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

      <div className="ae-body">
        {/* SERVICE CARDS */}
        <div className="ae-services">
          {SERVICE_OPTIONS.map((svc) => {
            const count =
              svc.key === "All Services"
                ? totalEvents
                : serviceBreakdown.find((s) => s.major_service === svc.key)
                    ?.count || 0;
            const isActive = service === svc.key && tab === "active";
            return (
              <button
                key={svc.key}
                className={`ae-service-card${isActive ? " ae-service-card--active" : ""}`}
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
                  className="ae-service-card__count"
                  style={{ color: svc.color }}
                >
                  {count}
                </div>
                <div className="ae-service-card__label">{svc.label}</div>
              </button>
            );
          })}
        </div>

        {/* TABS */}
        <div className="ae-tabs">
          <button
            className={`ae-tab${tab === "active" ? " ae-tab--active" : ""}`}
            onClick={() => setTab("active")}
          >
            <i className="fas fa-calendar-alt" />
            Active Events
            {!loading && <span className="ae-tab__badge">{events.length}</span>}
          </button>
          <button
            className={`ae-tab${tab === "archived" ? " ae-tab--active ae-tab--archived-active" : ""}`}
            onClick={() => setTab("archived")}
          >
            <i className="fas fa-box-archive" />
            Archived Events
            {tab === "archived" && !archiveLoading && (
              <span className="ae-tab__badge ae-tab__badge--muted">
                {archived.length}
              </span>
            )}
          </button>
        </div>

        {/* ══ ACTIVE TAB ══ */}
        {tab === "active" && (
          <>
            <div className="ae-toolbar">
              <div className="ae-toolbar__search">
                <i className="fas fa-search ae-toolbar__search-icon" />
                <input
                  className="ae-toolbar__search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events by title or location..."
                />
                {search && (
                  <button
                    className="ae-toolbar__search-clear"
                    onClick={() => setSearch("")}
                  >
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>
              <div className="ae-toolbar__filters">
                {[
                  { key: "all", label: "All Events", color: "#6b7280" },
                  { key: "upcoming", label: "Upcoming", color: "#3b82f6" },
                  { key: "past", label: "Past Events", color: "#9ca3af" },
                ].map(({ key, label, color }) => (
                  <button
                    key={key}
                    className={`ae-toolbar__filter-btn${filter === key ? " ae-toolbar__filter-btn--active" : ""}`}
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
                    className="ae-toolbar__filter-clear"
                    onClick={clearAllFilters}
                  >
                    <i className="fas fa-times" /> Clear Filters (
                    {getActiveFilterCount()})
                  </button>
                )}
              </div>
              <button
                className="ae-toolbar__create-btn"
                onClick={() => setCreateOpen(true)}
              >
                <i className="fas fa-plus" /> Create Event
              </button>
            </div>

            <div className="ae-table-panel">
              <div className="ae-table-panel__head">
                <div className="ae-table-panel__title">
                  <i className="fas fa-calendar-alt" /> Events
                </div>
                {!loading && (
                  <div className="ae-table-panel__info">
                    <span className="ae-table-panel__count">
                      {events.length} event{events.length !== 1 ? "s" : ""}
                    </span>
                    <span className="ae-table-panel__divider">•</span>
                    <span className="ae-table-panel__sub">
                      Page 1 of {Math.ceil(events.length / 10) || 1}
                    </span>
                  </div>
                )}
              </div>
              <div className="ae-table-panel__scroll">
                <table className="ae-table">
                  <thead>
                    <tr>
                      <th>EVENT DETAILS</th>
                      <th>SERVICE</th>
                      <th>DATE & TIME</th>
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
                        <td colSpan={8}>
                          <div className="ae-table__loading">
                            <div className="ae-table__loading-spinner">
                              <i className="fas fa-spinner fa-spin" />
                            </div>
                            <p>Loading events...</p>
                            <span className="ae-table__loading-sub">
                              Fetching event data
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : events.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <div className="ae-table__empty">
                            <div className="ae-table__empty-icon">
                              <i className="fas fa-calendar-xmark" />
                            </div>
                            <h3 className="ae-table__empty-title">
                              No Events Found
                            </h3>
                            <p className="ae-table__empty-message">
                              {search ||
                              filter !== "all" ||
                              service !== "All Services"
                                ? "Try adjusting your search or filter criteria"
                                : "Get started by creating your first event"}
                            </p>
                            {(search ||
                              filter !== "all" ||
                              service !== "All Services") && (
                              <button
                                className="ae-table__empty-action"
                                onClick={clearAllFilters}
                              >
                                <i className="fas fa-times" /> Clear Filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      events.map((evt) => {
                        const svcColor =
                          SERVICE_OPTIONS.find(
                            (s) => s.key === evt.major_service,
                          )?.color || "#6b7280";
                        return (
                          <tr
                            key={evt.event_id}
                            onMouseEnter={() => setHoveredRow(evt.event_id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            className={
                              hoveredRow === evt.event_id
                                ? "ae-table__row--hovered"
                                : ""
                            }
                          >
                            <td>
                              <div className="ae-event-cell">
                                <div className="ae-event-cell__title">
                                  {evt.title}
                                </div>
                                <div className="ae-event-cell__id">
                                  <i className="fas fa-hashtag" /> ID: #
                                  {evt.event_id}
                                </div>
                              </div>
                            </td>
                            <td>
                              <ServiceBadge service={evt.major_service} />
                            </td>
                            <td>
                              <div className="ae-date">
                                <div className="ae-date__main">
                                  {new Date(evt.event_date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </div>
                                {evt.event_end_date &&
                                  evt.event_end_date !== evt.event_date && (
                                    <div className="ae-date__end">
                                      <i className="fas fa-arrow-right" />
                                      {new Date(
                                        evt.event_end_date,
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </div>
                                  )}
                                <div className="ae-date__time">
                                  <i className="fas fa-clock" />
                                  {evt.start_time?.slice(0, 5)} –{" "}
                                  {evt.end_time?.slice(0, 5)}
                                </div>
                              </div>
                            </td>
                            <td style={{ maxWidth: 200 }}>
                              <div className="ae-location" title={evt.location}>
                                <i
                                  className="fas fa-map-marker-alt"
                                  style={{ color: svcColor }}
                                />
                                {evt.location?.split("\n")[0]}
                              </div>
                            </td>
                            <td>
                              <FeeBadge fee={evt.fee} />
                            </td>
                            <td>
                              <div className="ae-regs">
                                <span className="ae-regs__count">
                                  {evt.approved_count}/
                                  {evt.capacity > 0 ? evt.capacity : "∞"}
                                </span>
                                {evt.pending_count > 0 && (
                                  <span className="ae-regs__pending">
                                    <i className="fas fa-clock" />
                                    {evt.pending_count} pending
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <StatusBadge
                                isPast={evt.is_past}
                                isUpcoming={evt.is_upcoming}
                              />
                            </td>
                            <td>
                              <div className="ae-actions">
                                <button
                                  title="View Registrations"
                                  className="ae-action-btn ae-action-btn--view"
                                  onClick={() => setRegsEvent(evt)}
                                  style={{
                                    background: `${svcColor}12`,
                                    color: svcColor,
                                    borderColor: `${svcColor}25`,
                                  }}
                                >
                                  <i className="fas fa-users" />
                                </button>
                                <button
                                  title="Edit Event"
                                  className="ae-action-btn ae-action-btn--edit"
                                  onClick={() => setEditEvent(evt)}
                                  style={{
                                    background: "#3b82f612",
                                    color: "#3b82f6",
                                    borderColor: "#3b82f625",
                                  }}
                                >
                                  <i className="fas fa-pen" />
                                </button>
                                <button
                                  title="Archive Event"
                                  className="ae-action-btn ae-action-btn--archive"
                                  onClick={() => handleArchiveClick(evt)}
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
            <div className="ae-archive-banner">
              <i className="fas fa-info-circle" />
              Archived events are hidden from users. You can restore them to
              make them active again, or permanently delete them to remove all
              data.
            </div>

            <div className="ae-toolbar">
              <div className="ae-toolbar__search">
                <i className="fas fa-search ae-toolbar__search-icon" />
                <input
                  className="ae-toolbar__search-input"
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  placeholder="Search archived events..."
                />
                {archiveSearch && (
                  <button
                    className="ae-toolbar__search-clear"
                    onClick={() => setArchiveSearch("")}
                  >
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>
              <div className="ae-toolbar__filters">
                {SERVICE_OPTIONS.map((svc) => (
                  <button
                    key={svc.key}
                    className={`ae-toolbar__filter-btn${archiveService === svc.key ? " ae-toolbar__filter-btn--active" : ""}`}
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
                    className="ae-toolbar__filter-clear"
                    onClick={() => setArchiveService("All Services")}
                  >
                    <i className="fas fa-times" /> Clear
                  </button>
                )}
              </div>
            </div>

            <div className="ae-table-panel ae-table-panel--archived">
              <div className="ae-table-panel__head">
                <div className="ae-table-panel__title">
                  <i className="fas fa-box-archive" /> Archived Events
                  <span className="ae-table-panel__archived-hint">
                    Hidden from users
                  </span>
                </div>
                {!archiveLoading && (
                  <div className="ae-table-panel__info">
                    <span className="ae-table-panel__count">
                      {archived.length} archived
                    </span>
                  </div>
                )}
              </div>
              <div className="ae-table-panel__scroll">
                <table className="ae-table ae-table--archived">
                  <thead>
                    <tr>
                      <th>EVENT DETAILS</th>
                      <th>SERVICE</th>
                      <th>DATE</th>
                      <th>LOCATION</th>
                      <th>REGISTRATIONS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archiveLoading ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="ae-table__loading">
                            <div className="ae-table__loading-spinner">
                              <i className="fas fa-spinner fa-spin" />
                            </div>
                            <p>Loading archived events...</p>
                          </div>
                        </td>
                      </tr>
                    ) : archived.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="ae-table__empty">
                            <div className="ae-table__empty-icon">
                              <i className="fas fa-box-open" />
                            </div>
                            <h3 className="ae-table__empty-title">
                              No Archived Events
                            </h3>
                            <p className="ae-table__empty-message">
                              Events you archive will appear here. You can
                              restore them anytime.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      archived.map((evt) => {
                        const svcColor =
                          SERVICE_OPTIONS.find(
                            (s) => s.key === evt.major_service,
                          )?.color || "#6b7280";
                        return (
                          <tr
                            key={evt.event_id}
                            className="ae-table__row--archived"
                          >
                            <td>
                              <div className="ae-event-cell">
                                <div className="ae-event-cell__title ae-event-cell__title--muted">
                                  {evt.title}
                                </div>
                                <div className="ae-event-cell__id">
                                  <i className="fas fa-hashtag" /> ID: #
                                  {evt.event_id}
                                </div>
                              </div>
                            </td>
                            <td>
                              <ServiceBadge service={evt.major_service} />
                            </td>
                            <td>
                              <div className="ae-date">
                                <div className="ae-date__main">
                                  {new Date(evt.event_date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </div>
                                {evt.event_end_date &&
                                  evt.event_end_date !== evt.event_date && (
                                    <div className="ae-date__end">
                                      <i className="fas fa-arrow-right" />
                                      {new Date(
                                        evt.event_end_date,
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </div>
                                  )}
                              </div>
                            </td>
                            <td style={{ maxWidth: 200 }}>
                              <div className="ae-location" title={evt.location}>
                                <i
                                  className="fas fa-map-marker-alt"
                                  style={{ color: svcColor }}
                                />
                                {evt.location?.split("\n")[0]}
                              </div>
                            </td>
                            <td>
                              <div className="ae-regs">
                                <span className="ae-regs__count">
                                  {evt.total_registrations ?? 0} registered
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="ae-actions">
                                <button
                                  title="Restore Event"
                                  className="ae-action-btn ae-action-btn--restore"
                                  onClick={() => handleRestoreClick(evt)}
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
                                  className="ae-action-btn ae-action-btn--delete"
                                  onClick={() =>
                                    handlePermanentDeleteClick(evt)
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
      {/* /ae-body */}

      {/* MODALS */}
      {(createOpen || editEvent) && (
        <EventModal
          event={editEvent || null}
          onClose={() => {
            setEditEvent(null);
            setCreateOpen(false);
          }}
          onSaved={handleSaved}
        />
      )}
      {regsEvent && (
        <RegistrationsModal
          event={regsEvent}
          onClose={() => setRegsEvent(null)}
          onUpdate={() => {
            fetchEvents();
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
