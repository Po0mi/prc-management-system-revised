// UserEvents.jsx
// Path: src/pages/UserEvents/UserEvents.jsx

import { useState, useEffect, useCallback } from "react";
import "./UserEvents.scss";
import { getEvents } from "../../services/eventsApi";
import {
  registerForEvent,
  getMyRegistrations,
} from "../../services/registrationsApi";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Service colors mapping
const SERVICE_COLORS = {
  "Health Service": "#c41e3a",
  "Safety Service": "#15803d",
  "Welfare Service": "#7c3aed",
  "Disaster Management Service": "#c2410c",
  "Red Cross Youth": "#003d6b",
};

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`ue-toast ue-toast--${type}`} onClick={onClose}>
      <i
        className={`fas ${type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`}
      />
      {message}
      <button className="ue-toast__close" onClick={onClose}>
        <i className="fas fa-xmark" />
      </button>
    </div>
  );
}

// ─── CALENDAR ────────────────────────────────────────────────────────────────
function Calendar({ events, selectedDate, onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Get first day of month
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build calendar grid
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null); // Empty cells
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  // Check if day has events
  const hasEvent = (day) => {
    if (!day) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.some(
      (e) =>
        e.event_date === dateStr ||
        (e.event_end_date &&
          dateStr >= e.event_date &&
          dateStr <= e.event_end_date),
    );
  };

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr === selectedDate;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onDateSelect(dateStr);
  };

  return (
    <div className="ue-calendar">
      <div className="ue-calendar__header">
        <button className="ue-calendar__nav" onClick={handlePrevMonth}>
          <i className="fas fa-chevron-left" />
        </button>
        <div className="ue-calendar__title">
          {MONTHS[month]} {year}
        </div>
        <button className="ue-calendar__nav" onClick={handleNextMonth}>
          <i className="fas fa-chevron-right" />
        </button>
      </div>

      <div className="ue-calendar__days">
        {DAYS.map((d) => (
          <div key={d} className="ue-calendar__day-label">
            {d}
          </div>
        ))}
      </div>

      <div className="ue-calendar__grid">
        {days.map((day, i) => (
          <div
            key={i}
            className={`ue-calendar__cell ${!day ? "ue-calendar__cell--empty" : ""} ${
              hasEvent(day) ? "ue-calendar__cell--event" : ""
            } ${isSelected(day) ? "ue-calendar__cell--selected" : ""}`}
            onClick={() => handleDayClick(day)}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── REGISTRATION MODAL ──────────────────────────────────────────────────────
function RegisterModal({ event, onClose, onSuccess }) {
  const [tab, setTab] = useState("individual");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    age: "",
    location: "",
    organization_name: "",
    payment_mode: event.fee > 0 ? "gcash" : "free",
  });
  const [files, setFiles] = useState({
    valid_id: null,
    documents: null,
    payment_receipt: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function setFile(k, file) {
    setFiles((f) => ({ ...f, [k]: file }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (!form.location.trim()) e.location = "Location is required";
    if (!files.valid_id) e.valid_id = "Valid ID is required";
    if (
      event.fee > 0 &&
      form.payment_mode !== "free" &&
      !files.payment_receipt
    ) {
      e.payment_receipt = "Payment receipt is required for paid events";
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

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("event_id", event.event_id);
      formData.append("registration_type", tab);
      formData.append("full_name", form.full_name);
      formData.append("email", form.email);
      if (form.age) formData.append("age", form.age);
      formData.append("location", form.location);
      if (tab === "organization") {
        formData.append("organization_name", form.organization_name);
      }
      formData.append("payment_mode", form.payment_mode);

      if (files.valid_id) formData.append("valid_id", files.valid_id);
      if (files.documents) formData.append("documents", files.documents);
      if (files.payment_receipt)
        formData.append("payment_receipt", files.payment_receipt);

      const res = await registerForEvent(formData);
      onSuccess(res.message);
    } catch (err) {
      setErrors({ _global: err.message || "Registration failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ue-overlay" onClick={onClose}>
      <div
        className="ue-modal ue-modal--lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ue-modal__header">
          <div>
            <div className="ue-modal__title">Register for {event.title}</div>
            <div className="ue-modal__meta">
              <i className="fas fa-calendar" />{" "}
              {new Date(event.event_date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {event.fee > 0 && (
                <>
                  {" • "}
                  <i className="fas fa-money-bill" /> ₱
                  {parseFloat(event.fee).toFixed(2)}
                </>
              )}
              {event.fee === 0 && (
                <>
                  {" • "}
                  <span className="ue-modal__free">FREE EVENT</span>
                </>
              )}
            </div>
          </div>
          <button className="ue-modal__close" onClick={onClose}>
            <i className="fas fa-xmark" />
          </button>
        </div>

        <form className="ue-modal__body" onSubmit={handleSubmit}>
          {errors._global && (
            <div className="ue-form__error-banner">
              <i className="fas fa-circle-exclamation" /> {errors._global}
            </div>
          )}

          {/* Tabs */}
          <div className="ue-tabs">
            <button
              type="button"
              className={`ue-tab ${tab === "individual" ? "ue-tab--active" : ""}`}
              onClick={() => setTab("individual")}
            >
              <i className="fas fa-user" /> Individual
            </button>
            <button
              type="button"
              className={`ue-tab ${tab === "organization" ? "ue-tab--active" : ""}`}
              onClick={() => setTab("organization")}
            >
              <i className="fas fa-building" /> Organization/Company
            </button>
          </div>

          {/* Full Name + Email */}
          <div className="ue-form__row">
            <div className="ue-form__field">
              <label className="ue-form__label">
                Full Name <span className="ue-form__required">*</span>
              </label>
              <input
                className={`ue-form__input${errors.full_name ? " ue-form__input--error" : ""}`}
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder="Enter your full name"
              />
              {errors.full_name && (
                <span className="ue-form__error-text">{errors.full_name}</span>
              )}
            </div>

            <div className="ue-form__field">
              <label className="ue-form__label">
                Email Address <span className="ue-form__required">*</span>
              </label>
              <input
                type="email"
                className={`ue-form__input${errors.email ? " ue-form__input--error" : ""}`}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <span className="ue-form__error-text">{errors.email}</span>
              )}
            </div>
          </div>

          {/* Age + Location */}
          <div className="ue-form__row">
            <div className="ue-form__field">
              <label className="ue-form__label">Age</label>
              <input
                type="number"
                className="ue-form__input"
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                placeholder="Enter your age"
              />
            </div>

            <div className="ue-form__field">
              <label className="ue-form__label">
                Location <span className="ue-form__required">*</span>
              </label>
              <input
                className={`ue-form__input${errors.location ? " ue-form__input--error" : ""}`}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Enter your location"
              />
              {errors.location && (
                <span className="ue-form__error-text">{errors.location}</span>
              )}
            </div>
          </div>

          {/* Organization Name (if organization tab) */}
          {tab === "organization" && (
            <div className="ue-form__field">
              <label className="ue-form__label">Organization Name</label>
              <input
                className="ue-form__input"
                value={form.organization_name}
                onChange={(e) => set("organization_name", e.target.value)}
                placeholder="Enter organization name"
              />
            </div>
          )}

          {/* Valid ID */}
          <div className="ue-form__field">
            <label className="ue-form__label">
              Valid ID <span className="ue-form__required">*</span>
            </label>
            <div className="ue-file-upload">
              <input
                type="file"
                id="valid_id"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile("valid_id", e.target.files[0])}
                className="ue-file-upload__input"
              />
              <label htmlFor="valid_id" className="ue-file-upload__label">
                <i className="fas fa-id-card" />
                {files.valid_id
                  ? files.valid_id.name
                  : "Upload a clear photo of your valid ID"}
              </label>
            </div>
            <small className="ue-form__hint">
              Accepted: JPG, PNG, PDF (Max 5MB)
            </small>
            {errors.valid_id && (
              <span className="ue-form__error-text">{errors.valid_id}</span>
            )}
          </div>

          {/* Additional Documents (Optional) */}
          <div className="ue-form__field">
            <label className="ue-form__label">
              Additional Documents (Optional)
            </label>
            <div className="ue-file-upload">
              <input
                type="file"
                id="documents"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setFile("documents", e.target.files[0])}
                className="ue-file-upload__input"
              />
              <label htmlFor="documents" className="ue-file-upload__label">
                <i className="fas fa-file" />
                {files.documents
                  ? files.documents.name
                  : "Upload supporting documents (optional)"}
              </label>
            </div>
            <small className="ue-form__hint">
              Accepted: JPG, PNG, PDF, DOC, DOCX (Max 5MB)
            </small>
          </div>

          {/* Payment Section (if event has fee) */}
          {event.fee > 0 && (
            <>
              <div className="ue-divider">
                <i className="fas fa-credit-card" /> Payment Information
              </div>

              <div className="ue-form__field">
                <label className="ue-form__label">
                  Payment Mode <span className="ue-form__required">*</span>
                </label>
                <div className="ue-payment-options">
                  {["gcash", "bank", "paymaya"].map((mode) => (
                    <label key={mode} className="ue-payment-option">
                      <input
                        type="radio"
                        name="payment_mode"
                        value={mode}
                        checked={form.payment_mode === mode}
                        onChange={(e) => set("payment_mode", e.target.value)}
                      />
                      <div className="ue-payment-option__box">
                        <i
                          className={`fas ${
                            mode === "gcash"
                              ? "fa-mobile-alt"
                              : mode === "bank"
                                ? "fa-university"
                                : "fa-wallet"
                          }`}
                        />
                        <span>{mode.toUpperCase()}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="ue-form__field">
                <label className="ue-form__label">
                  Payment Receipt <span className="ue-form__required">*</span>
                </label>
                <div className="ue-file-upload">
                  <input
                    type="file"
                    id="payment_receipt"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setFile("payment_receipt", e.target.files[0])
                    }
                    className="ue-file-upload__input"
                  />
                  <label
                    htmlFor="payment_receipt"
                    className="ue-file-upload__label"
                  >
                    <i className="fas fa-receipt" />
                    {files.payment_receipt
                      ? files.payment_receipt.name
                      : "Upload payment receipt"}
                  </label>
                </div>
                <small className="ue-form__hint">
                  Upload proof of payment (screenshot or receipt)
                </small>
                {errors.payment_receipt && (
                  <span className="ue-form__error-text">
                    {errors.payment_receipt}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Info Notice */}
          <div className="ue-info-notice">
            <i className="fas fa-info-circle" />
            <div>
              By registering, you agree to provide accurate information. Your
              documents will be securely stored and used only for event
              registration purposes.
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="ue-form__submit"
          >
            {submitting ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Submitting…
              </>
            ) : (
              <>
                <i className="fas fa-user-plus" /> Register for Event
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function UserEvents() {
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [registerEvent, setRegisterEvent] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── FETCH EVENTS ───────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { events: evts } = await getEvents({ filter: "upcoming", search });
      setEvents(evts);
    } catch (err) {
      console.error("Fetch events error:", err);
      showToast(err.message || "Failed to load events", "error");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── FETCH MY REGISTRATIONS ────────────────────────────────────────────────
  const fetchMyRegistrations = useCallback(async () => {
    try {
      const { registrations } = await getMyRegistrations();
      setMyRegistrations(registrations);
    } catch (err) {
      console.error("Fetch registrations error:", err);
    }
  }, []);

  useEffect(() => {
    fetchMyRegistrations();
  }, [fetchMyRegistrations]);

  // ── FILTER EVENTS BY DATE ──────────────────────────────────────────────────
  const filteredEvents = selectedDate
    ? events.filter(
        (e) =>
          e.event_date === selectedDate ||
          (e.event_end_date &&
            selectedDate >= e.event_date &&
            selectedDate <= e.event_end_date),
      )
    : events;

  const upcomingCount = myRegistrations.filter((r) => r.is_upcoming).length;
  const approvedCount = myRegistrations.filter(
    (r) => r.status === "approved",
  ).length;
  const pendingCount = myRegistrations.filter(
    (r) => r.status === "pending",
  ).length;

  function handleRegisterSuccess(msg) {
    showToast(msg);
    setRegisterEvent(null);
    fetchMyRegistrations();
  }

  return (
    <div className="ue-root">
      {/* HEADER */}
      <div className="ue-header">
        <div className="ue-header__inner">
          <div>
            <div className="ue-header__eyebrow">
              <i className="fas fa-calendar-alt" /> Event Registration
            </div>
            <h1 className="ue-header__title">Browse & Register for Events</h1>
            <p className="ue-header__subtitle">
              Register for upcoming PRC events and manage your registrations
            </p>
          </div>
        </div>
      </div>

      <div className="ue-body">
        <div className="ue-layout">
          {/* LEFT: CALENDAR + MY REGISTRATIONS */}
          <div className="ue-sidebar">
            <div className="ue-card">
              <div className="ue-card__header">
                <i className="fas fa-calendar" /> Events Calendar
              </div>
              <Calendar
                events={events}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
              {selectedDate && (
                <button
                  className="ue-btn-clear-date"
                  onClick={() => setSelectedDate(null)}
                >
                  <i className="fas fa-xmark" /> Clear Date Filter
                </button>
              )}
            </div>

            {/* MY REGISTRATIONS STATS */}
            <div className="ue-card">
              <div className="ue-card__header">
                <i className="fas fa-user-check" /> My Registrations
              </div>
              <div className="ue-my-stats">
                <div className="ue-my-stat">
                  <div className="ue-my-stat__num">
                    {myRegistrations.length}
                  </div>
                  <div className="ue-my-stat__label">Total</div>
                </div>
                <div className="ue-my-stat ue-my-stat--upcoming">
                  <div className="ue-my-stat__num">{upcomingCount}</div>
                  <div className="ue-my-stat__label">Upcoming</div>
                </div>
                <div className="ue-my-stat ue-my-stat--approved">
                  <div className="ue-my-stat__num">{approvedCount}</div>
                  <div className="ue-my-stat__label">Approved</div>
                </div>
                <div className="ue-my-stat ue-my-stat--pending">
                  <div className="ue-my-stat__num">{pendingCount}</div>
                  <div className="ue-my-stat__label">Pending</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: AVAILABLE EVENTS */}
          <div className="ue-main">
            {/* SEARCH */}
            <div className="ue-search">
              <i className="fas fa-magnifying-glass ue-search__icon" />
              <input
                className="ue-search__input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events…"
              />
            </div>

            {/* EVENTS GRID */}
            <div className="ue-section">
              <div className="ue-section__header">
                <h2 className="ue-section__title">
                  {selectedDate
                    ? "Events on Selected Date"
                    : "Available Events"}
                </h2>
                <span className="ue-section__count">
                  {filteredEvents.length} event
                  {filteredEvents.length !== 1 ? "s" : ""}
                </span>
              </div>

              {loading ? (
                <div className="ue-loading">
                  <i className="fas fa-spinner fa-spin" />
                  <p>Loading events…</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="ue-empty">
                  <i className="fas fa-calendar-xmark" />
                  <p>No events found</p>
                </div>
              ) : (
                <div className="ue-events-grid">
                  {filteredEvents.map((evt) => {
                    const isRegistered = myRegistrations.some(
                      (r) => r.event_id === evt.event_id,
                    );
                    const myReg = myRegistrations.find(
                      (r) => r.event_id === evt.event_id,
                    );
                    const serviceColor =
                      SERVICE_COLORS[evt.major_service] || "#6b7280";

                    return (
                      <div key={evt.event_id} className="ue-event-card">
                        <div className="ue-event-card__header">
                          <span
                            className="ue-event-card__service"
                            style={{
                              background: `${serviceColor}15`,
                              color: serviceColor,
                              border: `1px solid ${serviceColor}33`,
                            }}
                          >
                            <i className="fas fa-tag" /> {evt.major_service}
                          </span>
                          {evt.fee > 0 ? (
                            <span className="ue-event-card__fee">
                              ₱{parseFloat(evt.fee).toFixed(2)}
                            </span>
                          ) : (
                            <span
                              className="ue-event-card__free"
                              style={{
                                background: "rgba(16, 185, 129, 0.12)",
                                color: "#10b981",
                                border: "1px solid rgba(16, 185, 129, 0.15)",
                              }}
                            >
                              <i className="fas fa-gift" /> FREE
                            </span>
                          )}
                        </div>

                        <h3 className="ue-event-card__title">{evt.title}</h3>

                        <div className="ue-event-card__meta">
                          <div className="ue-event-card__date">
                            <i
                              className="fas fa-calendar"
                              style={{ color: serviceColor }}
                            />
                            {new Date(evt.event_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                            {evt.event_end_date &&
                              evt.event_end_date !== evt.event_date && (
                                <>
                                  {" - "}
                                  {new Date(
                                    evt.event_end_date,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </>
                              )}
                          </div>
                          <div className="ue-event-card__time">
                            <i
                              className="fas fa-clock"
                              style={{ color: serviceColor }}
                            />
                            {evt.start_time?.slice(0, 5)} -{" "}
                            {evt.end_time?.slice(0, 5)}
                          </div>
                          <div className="ue-event-card__location">
                            <i
                              className="fas fa-map-marker-alt"
                              style={{ color: serviceColor }}
                            />
                            {evt.location?.split("\n")[0]}
                          </div>
                          {evt.duration_days > 1 && (
                            <div className="ue-event-card__duration">
                              <i
                                className="fas fa-calendar-week"
                                style={{ color: serviceColor }}
                              />
                              {evt.duration_days} days
                            </div>
                          )}
                        </div>

                        {evt.description && (
                          <div className="ue-event-card__desc">
                            <p>{evt.description}</p>
                          </div>
                        )}

                        <div className="ue-event-card__footer">
                          <div className="ue-event-card__capacity">
                            <i
                              className="fas fa-users"
                              style={{ color: serviceColor }}
                            />
                            <span>
                              {evt.approved_count} /{" "}
                              {evt.capacity > 0 ? evt.capacity : "∞"}
                            </span>
                            {evt.pending_count > 0 && (
                              <span className="ue-event-card__pending">
                                ({evt.pending_count} pending)
                              </span>
                            )}
                          </div>

                          {isRegistered ? (
                            <div className="ue-event-card__registered">
                              <i
                                className="fas fa-check-circle"
                                style={{ color: "#10b981" }}
                              />
                              <span className={`ue-status-${myReg.status}`}>
                                {myReg.status.toUpperCase()}
                              </span>
                            </div>
                          ) : evt.is_full ? (
                            <button
                              className="ue-event-card__btn ue-event-card__btn--full"
                              disabled
                            >
                              <i className="fas fa-ban" /> Event Full
                            </button>
                          ) : (
                            <button
                              className="ue-event-card__btn"
                              onClick={() => setRegisterEvent(evt)}
                              style={{
                                background: `linear-gradient(135deg, ${serviceColor}, ${serviceColor}dd)`,
                              }}
                            >
                              <i className="fas fa-user-plus" /> Register Now
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MY REGISTRATIONS TABLE */}
            {myRegistrations.length > 0 && (
              <div className="ue-section">
                <div className="ue-section__header">
                  <h2 className="ue-section__title">My Registrations</h2>
                  <span className="ue-section__count">
                    {myRegistrations.length} registration
                    {myRegistrations.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="ue-my-regs">
                  {myRegistrations.map((reg) => (
                    <div key={reg.registration_id} className="ue-my-reg">
                      <div className="ue-my-reg__header">
                        <div>
                          <h4 className="ue-my-reg__title">{reg.title}</h4>
                          <span className="ue-my-reg__service">
                            {reg.major_service}
                          </span>
                        </div>
                        <span
                          className={`ue-my-reg__status ue-my-reg__status--${reg.status}`}
                        >
                          {reg.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="ue-my-reg__meta">
                        <div>
                          <i className="fas fa-calendar" />
                          {new Date(reg.event_date).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </div>
                        <div>
                          <i className="fas fa-map-marker-alt" />
                          {reg.location?.split("\n")[0] || "TBA"}
                        </div>
                        {reg.fee > 0 && (
                          <div>
                            <i className="fas fa-money-bill" />₱
                            {parseFloat(reg.fee).toFixed(2)} -{" "}
                            {reg.payment_mode?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ue-my-reg__date">
                        Registered on{" "}
                        {new Date(reg.registration_date).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {registerEvent && (
        <RegisterModal
          event={registerEvent}
          onClose={() => setRegisterEvent(null)}
          onSuccess={handleRegisterSuccess}
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
