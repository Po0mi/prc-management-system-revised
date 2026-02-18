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
  event_date: "",
  event_end_date: "",
  start_time: "09:00",
  end_time: "17:00",
  location: "",
  capacity: 0,
  fee: 0,
};

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`ae-toast ae-toast--${type}`} onClick={onClose}>
      <i
        className={`fas ${type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`}
      />
      {message}
      <button className="ae-toast__close" onClick={onClose}>
        <i className="fas fa-xmark" />
      </button>
    </div>
  );
}

// ─── EVENT FORM MODAL ────────────────────────────────────────────────────────
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
      // Ensure end_date is set
      if (!payload.event_end_date) {
        payload.event_end_date = payload.event_date;
      }

      const res = isEdit
        ? await updateEvent(event.event_id, payload)
        : await createEvent(payload);
      onSaved(res.message || "Saved successfully");
    } catch (err) {
      setErrors({ _global: err.message || "Save failed" });
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
          <span>
            <i className={`fas ${isEdit ? "fa-pen" : "fa-plus"}`} />
            {isEdit ? " Edit Event" : " Create New Event"}
          </span>
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

          {/* Event Title */}
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

          {/* Description */}
          <div className="ae-form__field">
            <label className="ae-form__label">Description</label>
            <textarea
              className="ae-form__textarea"
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Enter event description and details"
            />
          </div>

          {/* Major Service */}
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

          {/* Start Date + End Date */}
          <div className="ae-form__row">
            <div className="ae-form__field ae-form__field--no-mb">
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
            <div className="ae-form__field ae-form__field--no-mb">
              <label className="ae-form__label">End Date</label>
              <input
                type="date"
                className="ae-form__input"
                value={form.event_end_date || form.event_date}
                onChange={(e) => set("event_end_date", e.target.value)}
              />
              <small className="ae-form__hint">
                Leave blank if single day event
              </small>
            </div>
          </div>

          {/* Start Time + End Time */}
          <div className="ae-form__row">
            <div className="ae-form__field ae-form__field--no-mb">
              <label className="ae-form__label">Start Time</label>
              <input
                type="time"
                className="ae-form__input"
                value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)}
              />
            </div>
            <div className="ae-form__field ae-form__field--no-mb">
              <label className="ae-form__label">End Time</label>
              <input
                type="time"
                className="ae-form__input"
                value={form.end_time}
                onChange={(e) => set("end_time", e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
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
              placeholder="Full address and travel instructions"
            />
            {errors.location && (
              <span className="ae-form__error-text">
                <i className="fas fa-circle-exclamation" /> {errors.location}
              </span>
            )}
          </div>

          {/* Capacity + Fee */}
          <div className="ae-form__row">
            <div className="ae-form__field ae-form__field--no-mb">
              <label className="ae-form__label">Capacity</label>
              <input
                type="number"
                className="ae-form__input"
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                min="0"
                placeholder="0 for unlimited"
              />
            </div>
            <div className="ae-form__field ae-form__field--no-mb">
              <label className="ae-form__label">Fee (₱)</label>
              <input
                type="number"
                step="0.01"
                className="ae-form__input"
                value={form.fee}
                onChange={(e) => set("fee", e.target.value)}
                min="0"
                placeholder="0.00 for free event"
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="ae-form__submit">
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Saving…
              </>
            ) : (
              <>
                <i className="fas fa-floppy-disk" /> Save Event
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── REGISTRATIONS MODAL ─────────────────────────────────────────────────────
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

      // Calculate stats
      const total = regs.length;
      const approved = regs.filter((r) => r.status === "approved").length;
      const pending = regs.filter((r) => r.status === "pending").length;
      const rejected = regs.filter((r) => r.status === "rejected").length;
      setStats({ total, approved, pending, rejected });
    } catch (err) {
      console.error("Load registrations error:", err);
    } finally {
      setLoading(false);
    }
  }, [event.event_id]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  async function handleApprove(regId) {
    try {
      await approveRegistration(regId);
      loadRegistrations();
      onUpdate?.();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleReject(regId) {
    try {
      await rejectRegistration(regId);
      loadRegistrations();
      onUpdate?.();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(regId) {
    if (!window.confirm("Delete this registration?")) return;
    try {
      await deleteRegistration(regId);
      loadRegistrations();
      onUpdate?.();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="ae-overlay" onClick={onClose}>
      <div
        className="ae-modal ae-modal--xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ae-modal__header">
          <span>
            <i className="fas fa-users" /> Registrations —{" "}
            <strong>{event.title}</strong>
          </span>
          <button className="ae-modal__close" onClick={onClose}>
            <i className="fas fa-xmark" />
          </button>
        </div>

        <div className="ae-modal__body ae-modal__body--regs">
          {/* Stats Cards */}
          <div className="ae-reg-stats">
            <div className="ae-reg-stat">
              <div className="ae-reg-stat__num">{stats.total}</div>
              <div className="ae-reg-stat__label">Total Registrations</div>
            </div>
            <div className="ae-reg-stat ae-reg-stat--approved">
              <div className="ae-reg-stat__num">{stats.approved}</div>
              <div className="ae-reg-stat__label">Approved</div>
            </div>
            <div className="ae-reg-stat ae-reg-stat--pending">
              <div className="ae-reg-stat__num">{stats.pending}</div>
              <div className="ae-reg-stat__label">Pending</div>
            </div>
            <div className="ae-reg-stat ae-reg-stat--rejected">
              <div className="ae-reg-stat__num">{stats.rejected}</div>
              <div className="ae-reg-stat__label">Rejected</div>
            </div>
          </div>

          {/* Registrations Table */}
          {loading ? (
            <div className="ae-reg-loading">
              <i className="fas fa-spinner fa-spin" />
              <p>Loading registrations…</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="ae-reg-empty">
              <i className="fas fa-inbox" />
              <p>No registrations yet</p>
            </div>
          ) : (
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
                  <tr key={reg.registration_id}>
                    <td>
                      <div className="ae-reg-user">
                        <div className="ae-reg-user__avatar">
                          {reg.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="ae-reg-user__name">
                            {reg.full_name}
                          </div>
                          <div className="ae-reg-user__email">{reg.email}</div>
                          {reg.age && (
                            <div className="ae-reg-user__meta">
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
                            <i className="fas fa-file" /> Documents
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
                              onClick={() => handleApprove(reg.registration_id)}
                              title="Approve"
                            >
                              <i className="fas fa-check" />
                            </button>
                            <button
                              className="ae-reg-btn ae-reg-btn--reject"
                              onClick={() => handleReject(reg.registration_id)}
                              title="Reject"
                            >
                              <i className="fas fa-xmark" />
                            </button>
                          </>
                        )}
                        <button
                          className="ae-reg-btn ae-reg-btn--delete"
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
export default function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [service, setService] = useState("All Services");
  const [editEvent, setEditEvent] = useState(null);
  const [regsEvent, setRegsEvent] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── STATS ──────────────────────────────────────────────────────────────────
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

  // ── EVENTS ─────────────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { events: evts } = await getEvents({ filter, search, service });
      setEvents(evts);
    } catch (err) {
      console.error("Fetch events error:", err);
      showToast(err.message || "Failed to load events", "error");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [filter, search, service]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── DELETE ─────────────────────────────────────────────────────────────────
  async function handleDelete(event) {
    if (!window.confirm(`Archive event "${event.title}"?`)) return;
    try {
      const res = await deleteEvent(event.event_id);
      showToast(res.message || "Event archived");
      fetchEvents();
      refreshStats();
    } catch (err) {
      showToast(err.message || "Failed to delete event", "error");
    }
  }

  // ── SAVED ──────────────────────────────────────────────────────────────────
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

  return (
    <div className="ae-root">
      {/* PAGE HEADER */}
      <div className="ae-header">
        <div className="ae-header__inner">
          <div>
            <div className="ae-header__eyebrow">
              <i className="fas fa-calendar-alt" /> Event Management
            </div>
            <h1 className="ae-header__title">Events Administration</h1>
            <p className="ae-header__subtitle">
              Create, update, and manage events and participant registrations
            </p>
          </div>
          <div className="ae-header__stats">
            {[
              { n: totalEvents, label: "Total Events" },
              { n: upcomingEvents, label: "Upcoming" },
              { n: completedEvents, label: "Completed" },
            ].map(({ n, label }) => (
              <div key={label}>
                <div className="ae-header__stat-num">{n ?? "—"}</div>
                <div className="ae-header__stat-label">{label}</div>
              </div>
            ))}
          </div>
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

            return (
              <button
                key={svc.key}
                className={`ae-service-card${service === svc.key ? " ae-service-card--active" : ""}`}
                style={{ borderColor: svc.color }}
                onClick={() => setService(svc.key)}
              >
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

        {/* TOOLBAR */}
        <div className="ae-toolbar">
          <div className="ae-toolbar__search">
            <i className="fas fa-magnifying-glass ae-toolbar__search-icon" />
            <input
              className="ae-toolbar__search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events…"
            />
            {search && (
              <button
                className="ae-toolbar__search-clear"
                onClick={() => setSearch("")}
              >
                <i className="fas fa-xmark" />
              </button>
            )}
          </div>

          <div className="ae-toolbar__filters">
            {[
              { key: "all", label: "All" },
              { key: "upcoming", label: "Upcoming" },
              { key: "past", label: "Past" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`ae-toolbar__filter-btn${filter === key ? " ae-toolbar__filter-btn--active" : ""}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            className="ae-toolbar__create-btn"
            onClick={() => setCreateOpen(true)}
          >
            <i className="fas fa-plus" /> Create New Event
          </button>
        </div>

        {/* TABLE */}
        <div className="ae-table-panel">
          <div className="ae-table-panel__head">
            <span className="ae-table-panel__title">
              <i className="fas fa-table-list" /> All Events
            </span>
            {!loading && (
              <span className="ae-table-panel__count">
                {events.length} result{events.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="ae-table-panel__scroll">
            <table className="ae-table">
              <thead>
                <tr>
                  <th>EVENT DETAILS</th>
                  <th>SERVICE</th>
                  <th>DATE RANGE</th>
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
                        <i className="fas fa-spinner fa-spin ae-table__loading-icon" />
                        <p>Loading events…</p>
                      </div>
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="ae-table__empty">
                        <i className="fas fa-calendar-xmark ae-table__empty-icon" />
                        <p>No events found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  events.map((evt) => (
                    <tr key={evt.event_id}>
                      <td>
                        <div className="ae-event-cell">
                          <div className="ae-event-cell__title">
                            {evt.title}
                          </div>
                          <div className="ae-event-cell__id">
                            ID: #{evt.event_id}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="ae-badge ae-badge--service">
                          {evt.major_service}
                        </span>
                      </td>
                      <td>
                        <div className="ae-date">
                          <div>
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
                                to{" "}
                                {new Date(
                                  evt.event_end_date,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                            )}
                          <div className="ae-date__time">
                            {evt.start_time?.slice(0, 5)} -{" "}
                            {evt.end_time?.slice(0, 5)}
                          </div>
                        </div>
                      </td>
                      <td style={{ maxWidth: 200 }}>
                        <div className="ae-location">
                          {evt.location?.split("\n")[0]}
                        </div>
                      </td>
                      <td>
                        {evt.fee > 0 ? (
                          <span className="ae-fee">
                            ₱{parseFloat(evt.fee).toFixed(2)}
                          </span>
                        ) : (
                          <span className="ae-badge ae-badge--free">FREE</span>
                        )}
                      </td>
                      <td>
                        <div className="ae-regs">
                          <span className="ae-regs__count">
                            {evt.approved_count}/
                            {evt.capacity > 0 ? evt.capacity : "∞"}
                          </span>
                          {evt.pending_count > 0 && (
                            <span className="ae-regs__pending">
                              {evt.pending_count} pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {evt.is_past ? (
                          <span className="ae-badge ae-badge--completed">
                            COMPLETED
                          </span>
                        ) : evt.is_upcoming ? (
                          <span className="ae-badge ae-badge--upcoming">
                            UPCOMING
                          </span>
                        ) : (
                          <span className="ae-badge">ONGOING</span>
                        )}
                      </td>
                      <td>
                        <div className="ae-actions">
                          <button
                            title="View Registrations"
                            className="ae-action-btn ae-action-btn--view"
                            onClick={() => setRegsEvent(evt)}
                          >
                            <i className="fas fa-users" />
                          </button>
                          <button
                            title="Edit Event"
                            className="ae-action-btn ae-action-btn--edit"
                            onClick={() => setEditEvent(evt)}
                          >
                            <i className="fas fa-pen" />
                          </button>
                          <button
                            title="Archive Event"
                            className="ae-action-btn ae-action-btn--delete"
                            onClick={() => handleDelete(evt)}
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
