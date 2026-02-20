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
      <div className="ue-toast__icon">
        <i
          className={`fas ${type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`}
        />
      </div>
      <div className="ue-toast__content">
        <div className="ue-toast__title">
          {type === "success" ? "Success" : "Error"}
        </div>
        <div className="ue-toast__message">{message}</div>
      </div>
      <button className="ue-toast__close" onClick={onClose}>
        <i className="fas fa-xmark" />
      </button>
    </div>
  );
}

// ─── CALENDAR ────────────────────────────────────────────────────────────────
function Calendar({ events, selectedDate, onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState(null);

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

  const getEventCount = (day) => {
    if (!day) return 0;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(
      (e) =>
        e.event_date === dateStr ||
        (e.event_end_date &&
          dateStr >= e.event_date &&
          dateStr <= e.event_end_date),
    ).length;
  };

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr === selectedDate;
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
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

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="ue-calendar">
      <div className="ue-calendar__header">
        <div className="ue-calendar__nav-group">
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
        <button className="ue-calendar__today" onClick={goToToday}>
          <i className="fas fa-calendar-day" />
          Today
        </button>
      </div>

      <div className="ue-calendar__weekdays">
        {DAYS.map((d) => (
          <div key={d} className="ue-calendar__weekday">
            {d}
          </div>
        ))}
      </div>

      <div className="ue-calendar__grid">
        {days.map((day, i) => {
          const eventCount = getEventCount(day);
          const isHovered = hoveredDay === day;

          return (
            <div
              key={i}
              className={`ue-calendar__cell 
                ${!day ? "ue-calendar__cell--empty" : ""} 
                ${hasEvent(day) ? "ue-calendar__cell--event" : ""} 
                ${isSelected(day) ? "ue-calendar__cell--selected" : ""}
                ${isToday(day) ? "ue-calendar__cell--today" : ""}
                ${isHovered ? "ue-calendar__cell--hovered" : ""}`}
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => day && setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <span className="ue-calendar__day-number">{day}</span>
              {eventCount > 0 && (
                <>
                  <span className="ue-calendar__event-indicator"></span>
                  {isHovered && (
                    <div className="ue-calendar__tooltip">
                      <strong>
                        {eventCount} event{eventCount > 1 ? "s" : ""}
                      </strong>
                      <span>Click to view</span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── REGISTRATION MODAL ──────────────────────────────────────────────────────
function RegisterModal({ event, onClose, onSuccess }) {
  const [tab, setTab] = useState("individual");
  const [step, setStep] = useState(1);
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
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Invalid email format";
    }
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

  const nextStep = () => {
    const e = {};
    if (step === 1) {
      if (!form.full_name.trim()) e.full_name = "Full name is required";
      if (!form.email.trim()) e.email = "Email is required";
      if (!form.location.trim()) e.location = "Location is required";
    }

    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
            <div className="ue-modal__title">{event.title}</div>
            <div className="ue-modal__meta">
              <span className="ue-modal__meta-item">
                <i className="fas fa-calendar" />{" "}
                {new Date(event.event_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {event.fee > 0 && (
                <span className="ue-modal__meta-item">
                  <i className="fas fa-tag" /> ₱
                  {parseFloat(event.fee).toFixed(2)}
                </span>
              )}
              {event.fee === 0 && (
                <span className="ue-modal__free-badge">
                  <i className="fas fa-gift" /> FREE EVENT
                </span>
              )}
            </div>
          </div>
          <button className="ue-modal__close" onClick={onClose}>
            <i className="fas fa-xmark" />
          </button>
        </div>

        <div className="ue-modal__progress">
          <div
            className={`ue-progress-step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}
          >
            <span className="ue-progress-step__number">1</span>
            <span className="ue-progress-step__label">Personal Info</span>
          </div>
          <div className="ue-progress-line"></div>
          <div className={`ue-progress-step ${step >= 2 ? "active" : ""}`}>
            <span className="ue-progress-step__number">2</span>
            <span className="ue-progress-step__label">Documents</span>
          </div>
          {event.fee > 0 && (
            <>
              <div className="ue-progress-line"></div>
              <div className={`ue-progress-step ${step >= 3 ? "active" : ""}`}>
                <span className="ue-progress-step__number">3</span>
                <span className="ue-progress-step__label">Payment</span>
              </div>
            </>
          )}
        </div>

        <form className="ue-modal__body" onSubmit={handleSubmit}>
          {errors._global && (
            <div className="ue-form__error-banner">
              <i className="fas fa-circle-exclamation" /> {errors._global}
            </div>
          )}

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="ue-step">
              <h3 className="ue-step__title">
                <i className="fas fa-user-circle" /> Personal Information
              </h3>

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
                    <span className="ue-form__error-text">
                      <i className="fas fa-exclamation-circle" />{" "}
                      {errors.full_name}
                    </span>
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
                    <span className="ue-form__error-text">
                      <i className="fas fa-exclamation-circle" /> {errors.email}
                    </span>
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
                    <span className="ue-form__error-text">
                      <i className="fas fa-exclamation-circle" />{" "}
                      {errors.location}
                    </span>
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

              <div className="ue-form__actions">
                <button
                  type="button"
                  className="ue-form__next"
                  onClick={nextStep}
                >
                  Next Step <i className="fas fa-arrow-right" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {step === 2 && (
            <div className="ue-step">
              <h3 className="ue-step__title">
                <i className="fas fa-file-upload" /> Required Documents
              </h3>

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
                    <span className="ue-file-upload__text">
                      {files.valid_id
                        ? files.valid_id.name
                        : "Upload a clear photo of your valid ID"}
                    </span>
                    {files.valid_id && (
                      <span className="ue-file-upload__check">
                        <i className="fas fa-check-circle" />
                      </span>
                    )}
                  </label>
                </div>
                <small className="ue-form__hint">
                  <i className="fas fa-info-circle" /> Accepted: JPG, PNG, PDF
                  (Max 5MB)
                </small>
                {errors.valid_id && (
                  <span className="ue-form__error-text">
                    <i className="fas fa-exclamation-circle" />{" "}
                    {errors.valid_id}
                  </span>
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
                    <i className="fas fa-folder-open" />
                    <span className="ue-file-upload__text">
                      {files.documents
                        ? files.documents.name
                        : "Upload supporting documents (optional)"}
                    </span>
                    {files.documents && (
                      <span className="ue-file-upload__check">
                        <i className="fas fa-check-circle" />
                      </span>
                    )}
                  </label>
                </div>
                <small className="ue-form__hint">
                  <i className="fas fa-info-circle" /> Accepted: JPG, PNG, PDF,
                  DOC, DOCX (Max 5MB)
                </small>
              </div>

              <div className="ue-form__actions">
                <button
                  type="button"
                  className="ue-form__prev"
                  onClick={prevStep}
                >
                  <i className="fas fa-arrow-left" /> Previous
                </button>
                {event.fee > 0 ? (
                  <button
                    type="button"
                    className="ue-form__next"
                    onClick={() => setStep(3)}
                  >
                    Next Step <i className="fas fa-arrow-right" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="ue-form__submit"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin" /> Submitting…
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-circle" /> Complete
                        Registration
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Payment (if event has fee) */}
          {step === 3 && event.fee > 0 && (
            <div className="ue-step">
              <h3 className="ue-step__title">
                <i className="fas fa-credit-card" /> Payment Information
              </h3>

              <div className="ue-payment-summary">
                <div className="ue-payment-summary__item">
                  <span>Event Fee:</span>
                  <strong>₱{parseFloat(event.fee).toFixed(2)}</strong>
                </div>
                <div className="ue-payment-summary__item">
                  <span>Processing Fee:</span>
                  <strong>₱0.00</strong>
                </div>
                <div className="ue-payment-summary__total">
                  <span>Total:</span>
                  <strong>₱{parseFloat(event.fee).toFixed(2)}</strong>
                </div>
              </div>

              <div className="ue-form__field">
                <label className="ue-form__label">
                  Payment Mode <span className="ue-form__required">*</span>
                </label>
                <div className="ue-payment-options">
                  {[
                    { id: "gcash", icon: "fa-mobile-alt", label: "GCash" },
                    {
                      id: "bank",
                      icon: "fa-university",
                      label: "Bank Transfer",
                    },
                    { id: "paymaya", icon: "fa-wallet", label: "PayMaya" },
                  ].map((mode) => (
                    <label key={mode.id} className="ue-payment-option">
                      <input
                        type="radio"
                        name="payment_mode"
                        value={mode.id}
                        checked={form.payment_mode === mode.id}
                        onChange={(e) => set("payment_mode", e.target.value)}
                      />
                      <div className="ue-payment-option__box">
                        <i className={`fas ${mode.icon}`} />
                        <span>{mode.label}</span>
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
                    <span className="ue-file-upload__text">
                      {files.payment_receipt
                        ? files.payment_receipt.name
                        : "Upload payment receipt"}
                    </span>
                    {files.payment_receipt && (
                      <span className="ue-file-upload__check">
                        <i className="fas fa-check-circle" />
                      </span>
                    )}
                  </label>
                </div>
                <small className="ue-form__hint">
                  <i className="fas fa-info-circle" /> Upload proof of payment
                  (screenshot or receipt)
                </small>
                {errors.payment_receipt && (
                  <span className="ue-form__error-text">
                    <i className="fas fa-exclamation-circle" />{" "}
                    {errors.payment_receipt}
                  </span>
                )}
              </div>

              <div className="ue-form__actions">
                <button
                  type="button"
                  className="ue-form__prev"
                  onClick={() => setStep(2)}
                >
                  <i className="fas fa-arrow-left" /> Previous
                </button>
                <button
                  type="submit"
                  className="ue-form__submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin" /> Processing
                      Payment…
                    </>
                  ) : (
                    <>
                      <i className="fas fa-lock" /> Complete Payment & Register
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Info Notice */}
          <div className="ue-info-notice">
            <i className="fas fa-shield-alt" />
            <div>
              <strong>Secure Registration</strong>
              <p>
                Your information and documents are encrypted and securely
                stored. We only use this data for event registration purposes.
              </p>
            </div>
          </div>
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
  const [activeTab, setActiveTab] = useState("available");

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
  const totalCount = myRegistrations.length;

  function handleRegisterSuccess(msg) {
    showToast(msg);
    setRegisterEvent(null);
    fetchMyRegistrations();
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="ue-root">
      {/* HEADER */}
      <div className="ue-header">
        <div className="ue-header__container">
          <div className="ue-header__content">
            <div className="ue-header__left">
              <div className="ue-header__badge">
                <i className="fas fa-calendar-alt" /> Event Registration
              </div>
              <h1 className="ue-header__title">Browse & Register for Events</h1>
              <p className="ue-header__subtitle">
                Discover and join upcoming PRC events, training sessions, and
                community activities
              </p>
            </div>
            <div className="ue-header__stats">
              <div className="ue-header-stat">
                <span className="ue-header-stat__value">{totalCount}</span>
                <span className="ue-header-stat__label">
                  Total Registrations
                </span>
              </div>
              <div className="ue-header-stat">
                <span className="ue-header-stat__value">{approvedCount}</span>
                <span className="ue-header-stat__label">Approved</span>
              </div>
              <div className="ue-header-stat">
                <span className="ue-header-stat__value">{pendingCount}</span>
                <span className="ue-header-stat__label">Pending</span>
              </div>
            </div>
          </div>
        </div>
        <div className="ue-header__wave">
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

      <div className="ue-body">
        <div className="ue-layout">
          {/* LEFT: CALENDAR + MY REGISTRATIONS */}
          <div className="ue-sidebar">
            <div className="ue-card ue-card--calendar">
              <div className="ue-card__header">
                <div className="ue-card__header-icon">
                  <i className="fas fa-calendar-alt" />
                </div>
                <div className="ue-card__header-title">
                  <h3>Events Calendar</h3>
                  <span>{events.length} events this month</span>
                </div>
              </div>
              <div className="ue-card__body">
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
                    <i className="fas fa-times" /> Clear Date Filter
                  </button>
                )}
              </div>
            </div>

            {/* MY REGISTRATIONS STATS */}
            <div className="ue-card ue-card--stats">
              <div className="ue-card__header">
                <div className="ue-card__header-icon">
                  <i className="fas fa-user-check" />
                </div>
                <div className="ue-card__header-title">
                  <h3>My Registrations</h3>
                  <span>Overview of your event participation</span>
                </div>
              </div>
              <div className="ue-card__body">
                <div className="ue-my-stats">
                  <div className="ue-my-stat ue-my-stat--total">
                    <div className="ue-my-stat__icon">
                      <i className="fas fa-clipboard-list" />
                    </div>
                    <div className="ue-my-stat__content">
                      <div className="ue-my-stat__num">{totalCount}</div>
                      <div className="ue-my-stat__label">Total</div>
                    </div>
                  </div>
                  <div className="ue-my-stat ue-my-stat--upcoming">
                    <div className="ue-my-stat__icon">
                      <i className="fas fa-calendar-check" />
                    </div>
                    <div className="ue-my-stat__content">
                      <div className="ue-my-stat__num">{upcomingCount}</div>
                      <div className="ue-my-stat__label">Upcoming</div>
                    </div>
                  </div>
                  <div className="ue-my-stat ue-my-stat--approved">
                    <div className="ue-my-stat__icon">
                      <i className="fas fa-check-circle" />
                    </div>
                    <div className="ue-my-stat__content">
                      <div className="ue-my-stat__num">{approvedCount}</div>
                      <div className="ue-my-stat__label">Approved</div>
                    </div>
                  </div>
                  <div className="ue-my-stat ue-my-stat--pending">
                    <div className="ue-my-stat__icon">
                      <i className="fas fa-clock" />
                    </div>
                    <div className="ue-my-stat__content">
                      <div className="ue-my-stat__num">{pendingCount}</div>
                      <div className="ue-my-stat__label">Pending</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: AVAILABLE EVENTS */}
          <div className="ue-main">
            {/* TABS */}
            <div className="ue-main-tabs">
              <button
                className={`ue-main-tab ${activeTab === "available" ? "active" : ""}`}
                onClick={() => setActiveTab("available")}
              >
                <i className="fas fa-calendar-plus" />
                Available Events
                <span className="ue-main-tab__badge">
                  {filteredEvents.length}
                </span>
              </button>
              <button
                className={`ue-main-tab ${activeTab === "my" ? "active" : ""}`}
                onClick={() => setActiveTab("my")}
              >
                <i className="fas fa-user-check" />
                My Registrations
                <span className="ue-main-tab__badge">
                  {myRegistrations.length}
                </span>
              </button>
            </div>

            {/* SEARCH */}
            {activeTab === "available" && (
              <div className="ue-search">
                <i className="fas fa-search ue-search__icon" />
                <input
                  className="ue-search__input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events by title, location, or service..."
                />
                {search && (
                  <button
                    className="ue-search__clear"
                    onClick={() => setSearch("")}
                  >
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>
            )}

            {/* AVAILABLE EVENTS */}
            {activeTab === "available" && (
              <div className="ue-section">
                <div className="ue-section__header">
                  <div className="ue-section__title-wrapper">
                    <h2 className="ue-section__title">
                      {selectedDate
                        ? `Events on ${new Date(selectedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                        : "Available Events"}
                    </h2>
                    {selectedDate && (
                      <button
                        className="ue-section__clear"
                        onClick={() => setSelectedDate(null)}
                      >
                        <i className="fas fa-times" /> Clear Filter
                      </button>
                    )}
                  </div>
                  <span className="ue-section__count">
                    {filteredEvents.length} event
                    {filteredEvents.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {loading ? (
                  <div className="ue-loading">
                    <div className="ue-loading__spinner">
                      <i className="fas fa-spinner fa-spin" />
                    </div>
                    <p>Loading events...</p>
                    <span className="ue-loading__subtitle">
                      Fetching latest events
                    </span>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="ue-empty">
                    <div className="ue-empty__icon">
                      <i className="fas fa-calendar-xmark" />
                    </div>
                    <h3 className="ue-empty__title">No events found</h3>
                    <p className="ue-empty__message">
                      {search
                        ? "Try adjusting your search or filters"
                        : "Check back later for new events"}
                    </p>
                    {search && (
                      <button
                        className="ue-empty__action"
                        onClick={() => setSearch("")}
                      >
                        <i className="fas fa-times" /> Clear Search
                      </button>
                    )}
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
                                border: `1px solid ${serviceColor}30`,
                              }}
                            >
                              <i className="fas fa-tag" /> {evt.major_service}
                            </span>
                            <div className="ue-event-card__badge">
                              {evt.fee > 0 ? (
                                <span className="ue-event-card__fee">
                                  ₱{parseFloat(evt.fee).toFixed(2)}
                                </span>
                              ) : (
                                <span className="ue-event-card__free">
                                  <i className="fas fa-gift" /> FREE
                                </span>
                              )}
                            </div>
                          </div>

                          <h3 className="ue-event-card__title">{evt.title}</h3>

                          <div className="ue-event-card__meta">
                            <div className="ue-event-card__meta-item">
                              <i
                                className="fas fa-calendar"
                                style={{ color: serviceColor }}
                              />
                              <span>
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
                              </span>
                            </div>
                            <div className="ue-event-card__meta-item">
                              <i
                                className="fas fa-clock"
                                style={{ color: serviceColor }}
                              />
                              <span>
                                {evt.start_time?.slice(0, 5)} -{" "}
                                {evt.end_time?.slice(0, 5)}
                              </span>
                            </div>
                            <div className="ue-event-card__meta-item">
                              <i
                                className="fas fa-map-marker-alt"
                                style={{ color: serviceColor }}
                              />
                              <span>{evt.location?.split("\n")[0]}</span>
                            </div>
                            {evt.duration_days > 1 && (
                              <div className="ue-event-card__meta-item">
                                <i
                                  className="fas fa-calendar-week"
                                  style={{ color: serviceColor }}
                                />
                                <span>{evt.duration_days} days</span>
                              </div>
                            )}
                          </div>

                          {evt.description && (
                            <div className="ue-event-card__desc">
                              <p>{evt.description.substring(0, 120)}...</p>
                            </div>
                          )}

                          <div className="ue-event-card__footer">
                            <div className="ue-event-card__capacity">
                              <i
                                className="fas fa-users"
                                style={{ color: serviceColor }}
                              />
                              <span>
                                {evt.approved_count || 0} /{" "}
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
                                <span
                                  style={{
                                    color: getStatusColor(myReg?.status),
                                  }}
                                >
                                  {myReg?.status.toUpperCase()}
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
            )}

            {/* MY REGISTRATIONS TABLE */}
            {activeTab === "my" && (
              <div className="ue-section">
                <div className="ue-section__header">
                  <div className="ue-section__title-wrapper">
                    <h2 className="ue-section__title">
                      <i className="fas fa-user-check" /> My Registrations
                    </h2>
                  </div>
                  <span className="ue-section__count">
                    {myRegistrations.length} registration
                    {myRegistrations.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {myRegistrations.length === 0 ? (
                  <div className="ue-empty">
                    <div className="ue-empty__icon">
                      <i className="fas fa-clipboard-list" />
                    </div>
                    <h3 className="ue-empty__title">No registrations yet</h3>
                    <p className="ue-empty__message">
                      Browse available events and register to get started
                    </p>
                    <button
                      className="ue-empty__action"
                      onClick={() => setActiveTab("available")}
                    >
                      <i className="fas fa-calendar-plus" /> Browse Events
                    </button>
                  </div>
                ) : (
                  <div className="ue-my-regs">
                    {myRegistrations.map((reg) => {
                      const serviceColor =
                        SERVICE_COLORS[reg.major_service] || "#6b7280";

                      return (
                        <div key={reg.registration_id} className="ue-my-reg">
                          <div className="ue-my-reg__header">
                            <div className="ue-my-reg__title-wrapper">
                              <h4 className="ue-my-reg__title">{reg.title}</h4>
                              <span
                                className="ue-my-reg__service"
                                style={{
                                  background: `${serviceColor}15`,
                                  color: serviceColor,
                                }}
                              >
                                {reg.major_service}
                              </span>
                            </div>
                            <span
                              className={`ue-my-reg__status ue-my-reg__status--${reg.status}`}
                            >
                              {reg.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="ue-my-reg__details">
                            <div className="ue-my-reg__meta">
                              <div className="ue-my-reg__meta-item">
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
                              <div className="ue-my-reg__meta-item">
                                <i className="fas fa-map-marker-alt" />
                                {reg.location?.split("\n")[0] || "TBA"}
                              </div>
                              {reg.fee > 0 && (
                                <div className="ue-my-reg__meta-item">
                                  <i className="fas fa-money-bill" />₱
                                  {parseFloat(reg.fee).toFixed(2)} •{" "}
                                  {reg.payment_mode?.toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className="ue-my-reg__footer">
                              <div className="ue-my-reg__date">
                                <i className="fas fa-clock" />
                                Registered{" "}
                                {new Date(
                                  reg.registration_date,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
