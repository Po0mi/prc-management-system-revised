// UserTraining.jsx
// Path: src/pages/UserTraining/UserTraining.jsx

import { useState, useEffect, useCallback } from "react";
import "./UserTraining.scss";
import { getTrainingSessions } from "../../services/trainingSessions";
import {
  registerForSession,
  getMySessionRegistrations,
} from "../../services/sessionRegistrationsApi";

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

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`ut-toast ut-toast--${type}`} onClick={onClose}>
      <i
        className={`fas ${type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`}
      />
      {message}
      <button className="ut-toast__close" onClick={onClose}>
        <i className="fas fa-xmark" />
      </button>
    </div>
  );
}

// ─── CALENDAR ────────────────────────────────────────────────────────────────
function Calendar({ sessions, selectedDate, onDateSelect }) {
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

  // Check if day has sessions
  const hasTraining = (day) => {
    if (!day) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return sessions.some(
      (e) =>
        e.session_date === dateStr ||
        (e.session_end_date &&
          dateStr >= e.session_date &&
          dateStr <= e.session_end_date),
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
    <div className="ut-calendar">
      <div className="ut-calendar__header">
        <button className="ut-calendar__nav" onClick={handlePrevMonth}>
          <i className="fas fa-chevron-left" />
        </button>
        <div className="ut-calendar__title">
          {MONTHS[month]} {year}
        </div>
        <button className="ut-calendar__nav" onClick={handleNextMonth}>
          <i className="fas fa-chevron-right" />
        </button>
      </div>

      <div className="ut-calendar__days">
        {DAYS.map((d) => (
          <div key={d} className="ut-calendar__day-label">
            {d}
          </div>
        ))}
      </div>

      <div className="ut-calendar__grid">
        {days.map((day, i) => (
          <div
            key={i}
            className={`ut-calendar__cell ${!day ? "ut-calendar__cell--empty" : ""} ${
              hasTraining(day) ? "ut-calendar__cell--session" : ""
            } ${isSelected(day) ? "ut-calendar__cell--selected" : ""}`}
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
function RegisterModal({ session, onClose, onSuccess }) {
  const [tab, setTab] = useState("individual");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    age: "",
    location: "",
    rcy_status: "Non-RCY",
    organization_name: "",
    payment_mode: session.fee > 0 ? "gcash" : "free",
  });
  const [files, setFiles] = useState({
    valid_id: null,
    requirements: null,
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
      session.fee > 0 &&
      form.payment_mode !== "free" &&
      !files.payment_receipt
    ) {
      e.payment_receipt = "Payment receipt is required for paid sessions";
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
      formData.append("session_id", session.session_id);
      formData.append("registration_type", tab);
      formData.append("full_name", form.full_name);
      formData.append("email", form.email);
      if (form.age) formData.append("age", form.age);
      formData.append("location", form.location);
      formData.append("rcy_status", form.rcy_status);
      if (tab === "organization") {
        formData.append("organization_name", form.organization_name);
      }
      formData.append("payment_mode", form.payment_mode);

      if (files.valid_id) formData.append("valid_id", files.valid_id);
      if (files.requirements)
        formData.append("requirements", files.requirements);
      if (files.payment_receipt)
        formData.append("payment_receipt", files.payment_receipt);

      const res = await registerForSession(formData);
      onSuccess(res.message);
    } catch (err) {
      setErrors({ _global: err.message || "Registration failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ut-overlay" onClick={onClose}>
      <div
        className="ut-modal ut-modal--lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ut-modal__header">
          <div>
            <div className="ut-modal__title">Register for {session.title}</div>
            <div className="ut-modal__meta">
              <i className="fas fa-calendar" />{" "}
              {new Date(session.session_date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {session.fee > 0 && (
                <>
                  {" • "}
                  <i className="fas fa-money-bill" /> ₱
                  {parseFloat(session.fee).toFixed(2)}
                </>
              )}
              {session.fee === 0 && (
                <>
                  {" • "}
                  <span className="ut-modal__free">FREE EVENT</span>
                </>
              )}
            </div>
          </div>
          <button className="ut-modal__close" onClick={onClose}>
            <i className="fas fa-xmark" />
          </button>
        </div>

        <form className="ut-modal__body" onSubmit={handleSubmit}>
          {errors._global && (
            <div className="ut-form__error-banner">
              <i className="fas fa-circle-exclamation" /> {errors._global}
            </div>
          )}

          {/* Tabs */}
          <div className="ut-tabs">
            <button
              type="button"
              className={`ut-tab ${tab === "individual" ? "ut-tab--active" : ""}`}
              onClick={() => setTab("individual")}
            >
              <i className="fas fa-user" /> Individual
            </button>
            <button
              type="button"
              className={`ut-tab ${tab === "organization" ? "ut-tab--active" : ""}`}
              onClick={() => setTab("organization")}
            >
              <i className="fas fa-building" /> Organization/Company
            </button>
          </div>

          {/* Full Name + Email */}
          <div className="ut-form__row">
            <div className="ut-form__field">
              <label className="ut-form__label">
                Full Name <span className="ut-form__required">*</span>
              </label>
              <input
                className={`ut-form__input${errors.full_name ? " ut-form__input--error" : ""}`}
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder="Enter your full name"
              />
              {errors.full_name && (
                <span className="ut-form__error-text">{errors.full_name}</span>
              )}
            </div>

            <div className="ut-form__field">
              <label className="ut-form__label">
                Email Address <span className="ut-form__required">*</span>
              </label>
              <input
                type="email"
                className={`ut-form__input${errors.email ? " ut-form__input--error" : ""}`}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <span className="ut-form__error-text">{errors.email}</span>
              )}
            </div>
          </div>

          {/* Age + Location */}
          <div className="ut-form__row">
            <div className="ut-form__field">
              <label className="ut-form__label">Age</label>
              <input
                type="number"
                className="ut-form__input"
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                placeholder="Enter your age"
              />
            </div>

            <div className="ut-form__field">
              <label className="ut-form__label">
                Location <span className="ut-form__required">*</span>
              </label>
              <input
                className={`ut-form__input${errors.location ? " ut-form__input--error" : ""}`}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Enter your location"
              />
              {errors.location && (
                <span className="ut-form__error-text">{errors.location}</span>
              )}
            </div>
          </div>

          {/* Organization Name (if organization tab) */}
          {tab === "organization" && (
            <div className="ut-form__field">
              <label className="ut-form__label">Organization Name</label>
              <input
                className="ut-form__input"
                value={form.organization_name}
                onChange={(e) => set("organization_name", e.target.value)}
                placeholder="Enter organization name"
              />
            </div>
          )}

          {/* RCY Status */}
          <div className="ut-form__field">
            <label className="ut-form__label">
              RCY Status <span className="ut-form__required">*</span>
            </label>
            <select
              className="ut-form__input"
              value={form.rcy_status}
              onChange={(e) => set("rcy_status", e.target.value)}
            >
              <option value="Non-RCY">Non-RCY</option>
              <option value="RCY Member">RCY Member</option>
              <option value="RCY Volunteer">RCY Volunteer</option>
              <option value="RCY Officer">RCY Officer</option>
            </select>
            <small className="ut-form__hint">
              Select your Red Cross Youth affiliation status
            </small>
          </div>

          {/* Valid ID */}
          <div className="ut-form__field">
            <label className="ut-form__label">
              Valid ID <span className="ut-form__required">*</span>
            </label>
            <div className="ut-file-upload">
              <input
                type="file"
                id="valid_id"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile("valid_id", e.target.files[0])}
                className="ut-file-upload__input"
              />
              <label htmlFor="valid_id" className="ut-file-upload__label">
                <i className="fas fa-id-card" />
                {files.valid_id
                  ? files.valid_id.name
                  : "Upload a clear photo of your valid ID"}
              </label>
            </div>
            <small className="ut-form__hint">
              Accepted: JPG, PNG, PDF (Max 5MB)
            </small>
            {errors.valid_id && (
              <span className="ut-form__error-text">{errors.valid_id}</span>
            )}
          </div>

          {/* Training Requirements (Optional) */}
          <div className="ut-form__field">
            <label className="ut-form__label">
              Training Requirements (Optional)
            </label>
            <div className="ut-file-upload">
              <input
                type="file"
                id="requirements"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setFile("requirements", e.target.files[0])}
                className="ut-file-upload__input"
              />
              <label htmlFor="requirements" className="ut-file-upload__label">
                <i className="fas fa-file" />
                {files.requirements
                  ? files.requirements.name
                  : "Upload training requirements (optional)"}
              </label>
            </div>
            <small className="ut-form__hint">
              Upload any required certificates, documents, or prerequisites
            </small>
          </div>

          {/* Payment Section (if session has fee) */}
          {session.fee > 0 && (
            <>
              <div className="ut-divider">
                <i className="fas fa-credit-card" /> Payment Information
              </div>

              <div className="ut-form__field">
                <label className="ut-form__label">
                  Payment Mode <span className="ut-form__required">*</span>
                </label>
                <div className="ut-payment-options">
                  {["gcash", "bank", "paymaya"].map((mode) => (
                    <label key={mode} className="ut-payment-option">
                      <input
                        type="radio"
                        name="payment_mode"
                        value={mode}
                        checked={form.payment_mode === mode}
                        onChange={(e) => set("payment_mode", e.target.value)}
                      />
                      <div className="ut-payment-option__box">
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

              <div className="ut-form__field">
                <label className="ut-form__label">
                  Payment Receipt <span className="ut-form__required">*</span>
                </label>
                <div className="ut-file-upload">
                  <input
                    type="file"
                    id="payment_receipt"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setFile("payment_receipt", e.target.files[0])
                    }
                    className="ut-file-upload__input"
                  />
                  <label
                    htmlFor="payment_receipt"
                    className="ut-file-upload__label"
                  >
                    <i className="fas fa-receipt" />
                    {files.payment_receipt
                      ? files.payment_receipt.name
                      : "Upload payment receipt"}
                  </label>
                </div>
                <small className="ut-form__hint">
                  Upload proof of payment (screenshot or receipt)
                </small>
                {errors.payment_receipt && (
                  <span className="ut-form__error-text">
                    {errors.payment_receipt}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Info Notice */}
          <div className="ut-info-notice">
            <i className="fas fa-info-circle" />
            <div>
              By registering, you agree to provide accurate information. Your
              documents will be securely stored and used only for session
              registration purposes.
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="ut-form__submit"
          >
            {submitting ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Submitting…
              </>
            ) : (
              <>
                <i className="fas fa-user-plus" /> Register for Training Session
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function UserTrainings() {
  const [sessions, setTrainings] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [registerTraining, setRegisterTraining] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── FETCH EVENTS ───────────────────────────────────────────────────────────
  const fetchTrainings = useCallback(async () => {
    setLoading(true);
    try {
      const { sessions: evts } = await getTrainingSessions({
        filter: "upcoming",
        search,
      });
      setTrainings(evts);
    } catch (err) {
      console.error("Fetch sessions error:", err);
      showToast(err.message || "Failed to load sessions", "error");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  // ── FETCH MY REGISTRATIONS ────────────────────────────────────────────────
  const fetchMyRegistrations = useCallback(async () => {
    try {
      const { registrations } = await getMySessionRegistrations();
      setMyRegistrations(registrations);
    } catch (err) {
      console.error("Fetch registrations error:", err);
    }
  }, []);

  useEffect(() => {
    fetchMyRegistrations();
  }, [fetchMyRegistrations]);

  // ── FILTER EVENTS BY DATE ──────────────────────────────────────────────────
  const filteredTrainings = selectedDate
    ? sessions.filter(
        (e) =>
          e.session_date === selectedDate ||
          (e.session_end_date &&
            selectedDate >= e.session_date &&
            selectedDate <= e.session_end_date),
      )
    : sessions;

  const upcomingCount = myRegistrations.filter((r) => r.is_upcoming).length;
  const approvedCount = myRegistrations.filter(
    (r) => r.status === "approved",
  ).length;
  const pendingCount = myRegistrations.filter(
    (r) => r.status === "pending",
  ).length;

  function handleRegisterSuccess(msg) {
    showToast(msg);
    setRegisterTraining(null);
    fetchMyRegistrations();
  }

  return (
    <div className="ut-root">
      {/* HEADER */}
      <div className="ut-header">
        <div className="ut-header__inner">
          <div>
            <div className="ut-header__eyebrow">
              <i className="fas fa-calendar-alt" /> Training Schedule
            </div>
            <h1 className="ut-header__title">
              View and register for upcoming training sessions
            </h1>
            <p className="ut-header__subtitle">
              Register for upcoming PRC sessions and manage your registrations
            </p>
          </div>
        </div>
      </div>

      <div className="ut-body">
        <div className="ut-layout">
          {/* LEFT: CALENDAR + MY REGISTRATIONS */}
          <div className="ut-sidebar">
            <div className="ut-card">
              <div className="ut-card__header">
                <i className="fas fa-calendar" /> Trainings Calendar
              </div>
              <Calendar
                sessions={sessions}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
              {selectedDate && (
                <button
                  className="ut-btn-clear-date"
                  onClick={() => setSelectedDate(null)}
                >
                  <i className="fas fa-xmark" /> Clear Date Filter
                </button>
              )}
            </div>

            {/* MY REGISTRATIONS STATS */}
            <div className="ut-card">
              <div className="ut-card__header">
                <i className="fas fa-user-check" /> My Registrations
              </div>
              <div className="ut-my-stats">
                <div className="ut-my-stat">
                  <div className="ut-my-stat__num">
                    {myRegistrations.length}
                  </div>
                  <div className="ut-my-stat__label">Total</div>
                </div>
                <div className="ut-my-stat ut-my-stat--upcoming">
                  <div className="ut-my-stat__num">{upcomingCount}</div>
                  <div className="ut-my-stat__label">Upcoming</div>
                </div>
                <div className="ut-my-stat ut-my-stat--approved">
                  <div className="ut-my-stat__num">{approvedCount}</div>
                  <div className="ut-my-stat__label">Approved</div>
                </div>
                <div className="ut-my-stat ut-my-stat--pending">
                  <div className="ut-my-stat__num">{pendingCount}</div>
                  <div className="ut-my-stat__label">Pending</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: AVAILABLE EVENTS */}
          <div className="ut-main">
            {/* SEARCH */}
            <div className="ut-search">
              <i className="fas fa-magnifying-glass ut-search__icon" />
              <input
                className="ut-search__input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sessions…"
              />
            </div>

            {/* EVENTS GRID */}
            <div className="ut-section">
              <div className="ut-section__header">
                <h2 className="ut-section__title">
                  {selectedDate
                    ? "Trainings on Selected Date"
                    : "Available Training Sessions"}
                </h2>
                <span className="ut-section__count">
                  {filteredTrainings.length} session
                  {filteredTrainings.length !== 1 ? "s" : ""}
                </span>
              </div>

              {loading ? (
                <div className="ut-loading">
                  <i className="fas fa-spinner fa-spin" />
                  <p>Loading sessions…</p>
                </div>
              ) : filteredTrainings.length === 0 ? (
                <div className="ut-empty">
                  <i className="fas fa-calendar-xmark" />
                  <p>No sessions found</p>
                </div>
              ) : (
                <div className="ut-sessions-grid">
                  {filteredTrainings.map((evt) => {
                    const isRegistered = myRegistrations.some(
                      (r) => r.session_id === evt.session_id,
                    );
                    const myReg = myRegistrations.find(
                      (r) => r.session_id === evt.session_id,
                    );

                    return (
                      <div key={evt.session_id} className="ut-session-card">
                        <div className="ut-session-card__header">
                          <span className="ut-session-card__service">
                            {evt.major_service}
                          </span>
                          {evt.fee > 0 ? (
                            <span className="ut-session-card__fee">
                              ₱{parseFloat(evt.fee).toFixed(2)}
                            </span>
                          ) : (
                            <span className="ut-session-card__free">FREE</span>
                          )}
                        </div>

                        <h3 className="ut-session-card__title">{evt.title}</h3>

                        <div className="ut-session-card__meta">
                          <div className="ut-session-card__date">
                            <i className="fas fa-calendar" />
                            {new Date(evt.session_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                            {evt.session_end_date &&
                              evt.session_end_date !== evt.session_date && (
                                <>
                                  {" "}
                                  -{" "}
                                  {new Date(
                                    evt.session_end_date,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </>
                              )}
                          </div>
                          <div className="ut-session-card__time">
                            <i className="fas fa-clock" />
                            {evt.start_time?.slice(0, 5)} -{" "}
                            {evt.end_time?.slice(0, 5)}
                          </div>
                          <div className="ut-session-card__location">
                            <i className="fas fa-map-marker-alt" />
                            {evt.location?.split("\n")[0]}
                          </div>
                        </div>

                        {evt.description && (
                          <p className="ut-session-card__desc">
                            {evt.description.length > 120
                              ? evt.description.slice(0, 120) + "..."
                              : evt.description}
                          </p>
                        )}

                        <div className="ut-session-card__footer">
                          <div className="ut-session-card__capacity">
                            <i className="fas fa-users" />
                            {evt.approved_count}/
                            {evt.capacity > 0 ? evt.capacity : "∞"}
                          </div>

                          {isRegistered ? (
                            <div className="ut-session-card__registered">
                              <i className="fas fa-check-circle" />
                              <span className={`ut-status-${myReg.status}`}>
                                {myReg.status.toUpperCase()}
                              </span>
                            </div>
                          ) : evt.is_full ? (
                            <button
                              className="ut-session-card__btn ut-session-card__btn--full"
                              disabled
                            >
                              <i className="fas fa-ban" /> Training Full
                            </button>
                          ) : (
                            <button
                              className="ut-session-card__btn"
                              onClick={() => setRegisterTraining(evt)}
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
              <div className="ut-section">
                <div className="ut-section__header">
                  <h2 className="ut-section__title">My Registrations</h2>
                  <span className="ut-section__count">
                    {myRegistrations.length} registration
                    {myRegistrations.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="ut-my-regs">
                  {myRegistrations.map((reg) => (
                    <div key={reg.registration_id} className="ut-my-reg">
                      <div className="ut-my-reg__header">
                        <div>
                          <h4 className="ut-my-reg__title">{reg.title}</h4>
                          <span className="ut-my-reg__service">
                            {reg.major_service}
                          </span>
                        </div>
                        <span
                          className={`ut-my-reg__status ut-my-reg__status--${reg.status}`}
                        >
                          {reg.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="ut-my-reg__meta">
                        <div>
                          <i className="fas fa-calendar" />
                          {new Date(reg.session_date).toLocaleDateString(
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
                      <div className="ut-my-reg__date">
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
      {registerTraining && (
        <RegisterModal
          session={registerTraining}
          onClose={() => setRegisterTraining(null)}
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
