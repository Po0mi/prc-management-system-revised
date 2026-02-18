// UserTraining.jsx
// Path: src/pages/UserTraining/UserTraining.jsx

import { useState, useEffect, useCallback } from "react";
import "./UserTraining.scss";
import { getTrainingSessions } from "../../services/trainingSessions";
import { submitTrainingRequest } from "../../services/trainingRequestsApi";
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

const SERVICE_TYPES = [
  "Health Service",
  "Safety Service",
  "Welfare Service",
  "Disaster Management Service",
  "Red Cross Youth",
];

const URGENCY_LEVELS = ["low", "normal", "high", "urgent"];
const TRAINING_TYPES = ["single_day", "multi_day", "workshop", "certification"];
const NOTIFICATION_METHODS = ["email", "sms", "phone"];

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

// ─── TRAINING REQUEST MODAL ──────────────────────────────────────────────────
function TrainingRequestModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    // Basic Information
    service_type: "",
    training_program: "",
    training_type: "single_day",
    urgency: "normal",

    // Date & Time
    preferred_start_date: "",
    preferred_end_date: "",
    preferred_start_time: "09:00",
    preferred_end_time: "17:00",

    // Participant Information
    participant_count: 1,
    organization_name: "",
    location_preference: "",
    venue_requirements: "",
    equipment_needed: "",

    // Contact Information
    contact_person: "",
    contact_number: "",
    email: "",
    notification_preferences: { email: true, sms: false, phone: false },

    // Additional Information
    purpose: "",
    additional_requirements: "",
  });

  const [files, setFiles] = useState({
    valid_id: null,
    participant_list: null,
    additional_docs: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [trainingPrograms, setTrainingPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showDatePreview, setShowDatePreview] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState({
    status: "pending",
    message: "",
  });
  const [durationDays, setDurationDays] = useState(1);

  // Training programs data based on your database entries
  const programsByService = {
    "Safety Service": [
      {
        id: "EFAT",
        name: "Emergency First Aid Training (EFAT)",
        description:
          "Basic emergency first aid response training for immediate response to common emergencies",
      },
      {
        id: "OFAT",
        name: "Occupational First Aid Training (OFAT)",
        description:
          "First aid training specifically designed for workplace settings and occupational safety",
      },
      {
        id: "BLS",
        name: "Basic Life Support (BLS)",
        description:
          "Learn essential life-saving techniques including CPR and AED operation",
      },
      {
        id: "WA",
        name: "Water Safety",
        description:
          "Comprehensive water safety training including swimming and rescue techniques",
      },
      {
        id: "FA",
        name: "First Aid Training",
        description: "Standard first aid training for emergency response",
      },
    ],
    "Red Cross Youth": [
      {
        id: "YVFC",
        name: "Youth Volunteer Formation Course (YVFC)",
        description:
          "Develop leadership skills and Red Cross principles for youth volunteers",
      },
      {
        id: "PEER",
        name: "Peer Education Program",
        description:
          "Training on peer-to-peer education methodologies for youth development",
      },
      {
        id: "RCY_BASIC",
        name: "RCY Basic Course",
        description:
          "Introduction to Red Cross Youth principles, history, and programs",
      },
    ],
    "Health Service": [
      {
        id: "BLS_H",
        name: "Basic Life Support - Healthcare Provider",
        description:
          "BLS training specifically designed for healthcare providers and medical personnel",
      },
      {
        id: "FA_H",
        name: "First Aid Training - Healthcare",
        description: "Advanced first aid training for medical professionals",
      },
    ],
    "Welfare Service": [
      {
        id: "PSYCH",
        name: "Psychological First Aid",
        description: "Mental health support and crisis intervention training",
      },
      {
        id: "CHILD",
        name: "Child Protection Training",
        description:
          "Child safeguarding and protection protocols for welfare workers",
      },
    ],
    "Disaster Management Service": [
      {
        id: "DRRM",
        name: "Disaster Risk Reduction Management",
        description:
          "Comprehensive training on disaster preparedness, response, and management",
      },
      {
        id: "CBT",
        name: "Community-Based Training",
        description: "Community disaster response and preparedness training",
      },
    ],
  };

  // Helper functions
  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function setFileField(k, file) {
    setFiles((f) => ({ ...f, [k]: file }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function updateTrainingPrograms() {
    if (form.service_type) {
      console.log("Selected service type:", form.service_type);
      console.log("Available programs:", programsByService[form.service_type]);
      setTrainingPrograms(programsByService[form.service_type] || []);
      setField("training_program", "");
      setSelectedProgram(null);
    } else {
      setTrainingPrograms([]);
    }
  }

  function handleProgramChange(e) {
    const programId = e.target.value;
    console.log("Selected program ID:", programId);
    setField("training_program", programId);

    const program = trainingPrograms.find((p) => p.id === programId);
    console.log("Found program:", program);
    setSelectedProgram(program);
  }

  function updateRequestDatePreview() {
    setShowDatePreview(
      !!(form.preferred_start_date || form.preferred_end_date),
    );

    if (form.preferred_start_date && form.preferred_end_date) {
      const start = new Date(form.preferred_start_date);
      const end = new Date(form.preferred_end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDurationDays(diffDays);

      // Auto-set training type based on duration
      if (diffDays > 1) {
        setField("training_type", "multi_day");
      } else {
        setField("training_type", "single_day");
      }
    } else {
      setDurationDays(1);
    }
  }

  function validatePhoneNumber(phone) {
    // Philippine phone number validation
    // Formats: +63 XXX XXX XXXX, 0XXX XXX XXXX, 03XX XXX XXXX (landline)
    const phoneRegex = /^(\+?63|0)[0-9\s\-\(\)]{10,14}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    const isValid = phoneRegex.test(cleanPhone);

    setPhoneValidation({
      status: isValid ? "valid" : "invalid",
      message: isValid ? "" : "Please enter a valid Philippine contact number",
    });

    return isValid;
  }

  function handleNotificationPreference(method) {
    setField("notification_preferences", {
      ...form.notification_preferences,
      [method]: !form.notification_preferences[method],
    });
  }

  function handleFileUpload(e, fieldName) {
    const file = e.target.files[0];
    if (file) {
      if (fieldName === "additional_docs") {
        const files = Array.from(e.target.files);
        setFiles((f) => ({
          ...f,
          additional_docs: [...f.additional_docs, ...files],
        }));
      } else {
        setFileField(fieldName, file);
      }
    }
  }

  function removeAdditionalDoc(index) {
    setFiles((f) => ({
      ...f,
      additional_docs: f.additional_docs.filter((_, i) => i !== index),
    }));
  }

  function calculateDuration() {
    if (form.preferred_start_date && form.preferred_end_date) {
      const start = new Date(form.preferred_start_date);
      const end = new Date(form.preferred_end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
    }
    return "1 day";
  }

  function toggleOrganizationSection() {
    return parseInt(form.participant_count) >= 5;
  }

  function validateStep(stepNum) {
    const e = {};

    if (stepNum === 1) {
      if (!form.service_type) e.service_type = "Service type is required";
      if (!form.training_program)
        e.training_program = "Training program is required";
      if (!form.preferred_start_time)
        e.preferred_start_time = "Start time is required";
      if (!form.preferred_end_time)
        e.preferred_end_time = "End time is required";

      // Validate end time is after start time
      if (form.preferred_start_time && form.preferred_end_time) {
        if (form.preferred_end_time <= form.preferred_start_time) {
          e.preferred_end_time = "End time must be after start time";
        }
      }
    }

    if (stepNum === 2) {
      if (!form.participant_count)
        e.participant_count = "Number of participants is required";
      if (parseInt(form.participant_count) < 1)
        e.participant_count = "Minimum 1 participant";
      if (parseInt(form.participant_count) > 100)
        e.participant_count = "Maximum 100 participants";

      if (toggleOrganizationSection() && !form.organization_name) {
        e.organization_name =
          "Organization name is required for groups of 5 or more";
      }
    }

    if (stepNum === 3) {
      if (!form.contact_person) e.contact_person = "Contact person is required";
      if (!form.contact_number) e.contact_number = "Contact number is required";
      if (!validatePhoneNumber(form.contact_number))
        e.contact_number = "Please enter a valid Philippine contact number";
      if (!form.email) e.email = "Email address is required";
      if (!/\S+@\S+\.\S+/.test(form.email))
        e.email = "Please enter a valid email address";
    }

    if (stepNum === 4) {
      if (!files.valid_id) e.valid_id = "Valid ID is required";
      if (toggleOrganizationSection() && !files.participant_list) {
        e.participant_list =
          "Participant list is required for groups of 5 or more";
      }
    }

    return e;
  }

  function handleNext() {
    const e = validateStep(step);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setStep(step + 1);
    setErrors({});
  }

  function handlePrev() {
    setStep(step - 1);
    setErrors({});
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate final step
    const v = validateStep(4);
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();

      // Add all form fields matching database schema
      formData.append("service_type", form.service_type);
      formData.append("training_program", form.training_program);
      formData.append("training_type", form.training_type);
      formData.append("urgency", form.urgency);

      // Date fields
      if (form.preferred_start_date) {
        formData.append("preferred_start_date", form.preferred_start_date);
      }
      if (form.preferred_end_date) {
        formData.append("preferred_end_date", form.preferred_end_date);
      }
      formData.append("duration_days", durationDays.toString());

      // Time fields
      if (form.preferred_start_time) {
        formData.append("preferred_start_time", form.preferred_start_time);
      }
      if (form.preferred_end_time) {
        formData.append("preferred_end_time", form.preferred_end_time);
      }

      // Participant fields
      formData.append("participant_count", form.participant_count.toString());
      if (form.participant_demographics) {
        formData.append(
          "participant_demographics",
          JSON.stringify(form.participant_demographics),
        );
      }
      if (form.organization_name) {
        formData.append("organization_name", form.organization_name);
      }

      // Contact fields
      formData.append("contact_person", form.contact_person);
      formData.append("contact_number", form.contact_number);
      formData.append("email", form.email);

      // Notification preferences
      formData.append(
        "notification_preferences",
        JSON.stringify(form.notification_preferences),
      );

      // Location and requirements
      if (form.location_preference) {
        formData.append("location_preference", form.location_preference);
      }
      if (form.venue_requirements) {
        formData.append("venue_requirements", form.venue_requirements);
      }
      if (form.equipment_needed) {
        formData.append("equipment_needed", form.equipment_needed);
      }

      // Additional info
      if (form.purpose) {
        formData.append("purpose", form.purpose);
      }
      if (form.additional_requirements) {
        formData.append(
          "additional_requirements",
          form.additional_requirements,
        );
      }

      // File uploads - matching database column names
      if (files.valid_id) {
        formData.append("valid_id_request", files.valid_id); // Column: valid_id_request_path
      }
      if (files.participant_list) {
        formData.append("participant_list", files.participant_list); // Column: participant_list_path
      }

      // Additional documents - handle as array
      files.additional_docs.forEach((doc, index) => {
        formData.append(`additional_docs[${index}]`, doc); // Column: additional_docs_paths
      });

      // API call would go here
      // const response = await fetch('/api/training-requests', {
      //   method: 'POST',
      //   body: formData
      // });

      // Simulate success
      // ✅ REAL API CALL
      const res = await submitTrainingRequest(formData);
      onSuccess(res.message);
      onClose();
    } catch (err) {
      setErrors({
        _global: err.message || "Training request submission failed",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const minDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return (
    <div className="ut-overlay" onClick={onClose}>
      <div
        className="ut-modal ut-modal--lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ut-modal__header">
          <div>
            <div className="ut-modal__title">
              <i
                className="fas fa-graduation-cap"
                style={{ marginRight: "0.5rem" }}
              />
              Request Training Program
            </div>
            <div className="ut-modal__meta">
              <i className="fas fa-info-circle" /> Step {step} of 4
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

          {/* Progress Steps */}
          <div className="ut-tabs" style={{ marginBottom: "2rem" }}>
            {[1, 2, 3, 4].map((s) => (
              <button
                key={s}
                type="button"
                className={`ut-tab ${step === s ? "ut-tab--active" : ""} ${step > s ? "ut-tab--completed" : ""}`}
                onClick={() => s < step && setStep(s)}
                disabled={s > step}
              >
                {s === 1 && <i className="fas fa-calendar" />}
                {s === 2 && <i className="fas fa-users" />}
                {s === 3 && <i className="fas fa-address-book" />}
                {s === 4 && <i className="fas fa-file-upload" />}
                Step {s}
              </button>
            ))}
          </div>

          {/* Step 1: Program Selection */}
          {step === 1 && (
            <>
              <div className="ut-divider">
                <i className="fas fa-graduation-cap" /> Training Program Details
              </div>

              <div className="ut-form__field">
                <label className="ut-form__label">
                  Service Type <span className="ut-form__required">*</span>
                </label>
                <select
                  className={`ut-form__select ${errors.service_type ? "ut-form__input--error" : ""}`}
                  value={form.service_type}
                  onChange={(e) => {
                    setField("service_type", e.target.value);
                    updateTrainingPrograms();
                  }}
                >
                  <option value="">Select Service Type</option>
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.service_type && (
                  <span className="ut-form__error-text">
                    {errors.service_type}
                  </span>
                )}
              </div>

              <div className="ut-form__field">
                <label className="ut-form__label">
                  Training Program <span className="ut-form__required">*</span>
                </label>
                <select
                  className={`ut-form__select ${errors.training_program ? "ut-form__input--error" : ""}`}
                  value={form.training_program}
                  onChange={handleProgramChange}
                  disabled={!form.service_type}
                >
                  <option value="">
                    {form.service_type
                      ? "Select Training Program"
                      : "Select service type first"}
                  </option>
                  {trainingPrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                {errors.training_program && (
                  <span className="ut-form__error-text">
                    {errors.training_program}
                  </span>
                )}
              </div>

              {selectedProgram && (
                <div
                  className="ut-info-notice"
                  style={{ marginTop: "-0.5rem", marginBottom: "1.5rem" }}
                >
                  <i className="fas fa-info-circle" />
                  <div>{selectedProgram.description}</div>
                </div>
              )}

              <div className="ut-form__row">
                <div className="ut-form__field">
                  <label className="ut-form__label">Training Type</label>
                  <select
                    className="ut-form__select"
                    value={form.training_type}
                    onChange={(e) => setField("training_type", e.target.value)}
                  >
                    {TRAINING_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1),
                          )
                          .join(" ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ut-form__field">
                  <label className="ut-form__label">Urgency Level</label>
                  <select
                    className="ut-form__select"
                    value={form.urgency}
                    onChange={(e) => setField("urgency", e.target.value)}
                  >
                    {URGENCY_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ut-form__row">
                <div className="ut-form__field">
                  <label className="ut-form__label">Preferred Start Date</label>
                  <input
                    type="date"
                    className="ut-form__input"
                    min={minDate}
                    value={form.preferred_start_date}
                    onChange={(e) => {
                      setField("preferred_start_date", e.target.value);
                      updateRequestDatePreview();
                    }}
                  />
                  <small className="ut-form__hint">
                    Leave blank if flexible
                  </small>
                </div>

                <div className="ut-form__field">
                  <label className="ut-form__label">Preferred End Date</label>
                  <input
                    type="date"
                    className="ut-form__input"
                    min={form.preferred_start_date || minDate}
                    value={form.preferred_end_date}
                    onChange={(e) => {
                      setField("preferred_end_date", e.target.value);
                      updateRequestDatePreview();
                    }}
                  />
                  <small className="ut-form__hint">
                    Same as start date for single-day training
                  </small>
                </div>
              </div>

              {showDatePreview && (
                <div
                  className="ut-info-notice"
                  style={{ marginTop: "-0.5rem" }}
                >
                  <i className="fas fa-calendar-check" />
                  <div>
                    <strong>Requested Training Period:</strong>
                    <br />
                    {form.preferred_start_date || "Flexible start"}
                    {form.preferred_end_date &&
                    form.preferred_end_date !== form.preferred_start_date
                      ? ` to ${form.preferred_end_date}`
                      : ""}
                    <br />
                    <small>Duration: {calculateDuration()}</small>
                  </div>
                </div>
              )}

              <div className="ut-form__row">
                <div className="ut-form__field">
                  <label className="ut-form__label">
                    Preferred Start Time{" "}
                    <span className="ut-form__required">*</span>
                  </label>
                  <input
                    type="time"
                    className={`ut-form__input ${errors.preferred_start_time ? "ut-form__input--error" : ""}`}
                    value={form.preferred_start_time}
                    onChange={(e) =>
                      setField("preferred_start_time", e.target.value)
                    }
                  />
                  {errors.preferred_start_time && (
                    <span className="ut-form__error-text">
                      {errors.preferred_start_time}
                    </span>
                  )}
                </div>

                <div className="ut-form__field">
                  <label className="ut-form__label">
                    Preferred End Time{" "}
                    <span className="ut-form__required">*</span>
                  </label>
                  <input
                    type="time"
                    className={`ut-form__input ${errors.preferred_end_time ? "ut-form__input--error" : ""}`}
                    value={form.preferred_end_time}
                    onChange={(e) =>
                      setField("preferred_end_time", e.target.value)
                    }
                  />
                  {errors.preferred_end_time && (
                    <span className="ut-form__error-text">
                      {errors.preferred_end_time}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Participant Information */}
          {step === 2 && (
            <>
              <div className="ut-divider">
                <i className="fas fa-users" /> Participant Information
              </div>

              <div className="ut-form__field">
                <label className="ut-form__label">
                  Number of Participants{" "}
                  <span className="ut-form__required">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className={`ut-form__input ${errors.participant_count ? "ut-form__input--error" : ""}`}
                  value={form.participant_count}
                  onChange={(e) =>
                    setField("participant_count", e.target.value)
                  }
                  placeholder="How many participants?"
                />
                <small className="ut-form__hint">
                  Minimum 1, maximum 100 participants
                </small>
                {errors.participant_count && (
                  <span className="ut-form__error-text">
                    {errors.participant_count}
                  </span>
                )}
              </div>

              <div className="ut-form__field">
                <label className="ut-form__label">Location Preference</label>
                <input
                  type="text"
                  className="ut-form__input"
                  value={form.location_preference}
                  onChange={(e) =>
                    setField("location_preference", e.target.value)
                  }
                  placeholder="City or specific venue preference"
                />
              </div>

              <div className="ut-form__field">
                <label className="ut-form__label">Venue Requirements</label>
                <textarea
                  className="ut-form__textarea"
                  rows="2"
                  value={form.venue_requirements}
                  onChange={(e) =>
                    setField("venue_requirements", e.target.value)
                  }
                  placeholder="Specific venue requirements (projector, parking, accessibility, etc.)"
                />
              </div>

              <div className="ut-form__field">
                <label className="ut-form__label">Equipment Needed</label>
                <textarea
                  className="ut-form__textarea"
                  rows="2"
                  value={form.equipment_needed}
                  onChange={(e) => setField("equipment_needed", e.target.value)}
                  placeholder="Training equipment requirements"
                />
              </div>

              {toggleOrganizationSection() && (
                <div className="ut-form__field">
                  <label className="ut-form__label">
                    Organization/Company Name{" "}
                    {toggleOrganizationSection() && (
                      <span className="ut-form__required">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    className={`ut-form__input ${errors.organization_name ? "ut-form__input--error" : ""}`}
                    value={form.organization_name}
                    onChange={(e) =>
                      setField("organization_name", e.target.value)
                    }
                    placeholder="Organization name if applicable"
                  />
                  <small className="ut-form__hint">
                    Required for groups of 5 or more participants
                  </small>
                  {errors.organization_name && (
                    <span className="ut-form__error-text">
                      {errors.organization_name}
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* Step 3: Contact Information */}
          {step === 3 && (
            <>
              <div className="ut-divider">
                <i className="fas fa-address-book" /> Contact Information
              </div>

              <div className="ut-form__field">
                <label className="ut-form__label">
                  Contact Person <span className="ut-form__required">*</span>
                </label>
                <input
                  type="text"
                  className={`ut-form__input ${errors.contact_person ? "ut-form__input--error" : ""}`}
                  value={form.contact_person}
                  onChange={(e) => setField("contact_person", e.target.value)}
                  placeholder="Primary contact person"
                />
                {errors.contact_person && (
                  <span className="ut-form__error-text">
                    {errors.contact_person}
                  </span>
                )}
              </div>

              <div className="ut-form__field">
                <label className="ut-form__label">
                  Philippine Contact Number{" "}
                  <span className="ut-form__required">*</span>
                </label>
                <input
                  type="tel"
                  className={`ut-form__input ${errors.contact_number ? "ut-form__input--error" : ""}`}
                  value={form.contact_number}
                  onChange={(e) => setField("contact_number", e.target.value)}
                  onBlur={(e) => validatePhoneNumber(e.target.value)}
                  placeholder="09XX XXX XXXX or 032 XXX XXXX"
                />
                {phoneValidation.status === "invalid" && (
                  <span className="ut-form__error-text">
                    {phoneValidation.message}
                  </span>
                )}
                {errors.contact_number && (
                  <span className="ut-form__error-text">
                    {errors.contact_number}
                  </span>
                )}
                <small className="ut-form__hint">
                  Accepted formats: 09XX XXX XXXX (mobile), 032 XXX XXXX
                  (landline), +63 9XX XXX XXXX
                </small>
              </div>

              <div className="ut-form__field">
                <label className="ut-form__label">
                  Email Address <span className="ut-form__required">*</span>
                </label>
                <input
                  type="email"
                  className={`ut-form__input ${errors.email ? "ut-form__input--error" : ""}`}
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="contact@example.com"
                />
                {errors.email && (
                  <span className="ut-form__error-text">{errors.email}</span>
                )}
              </div>

              <div className="ut-form__field">
                <label className="ut-form__label">
                  Notification Preferences
                </label>
                <div
                  style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}
                >
                  {NOTIFICATION_METHODS.map((method) => (
                    <label
                      key={method}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.notification_preferences[method]}
                        onChange={() => handleNotificationPreference(method)}
                      />
                      <span style={{ textTransform: "capitalize" }}>
                        {method}
                      </span>
                    </label>
                  ))}
                </div>
                <small className="ut-form__hint">
                  Select preferred contact methods
                </small>
              </div>

              <div className="ut-form__field">
                <label className="ut-form__label">Purpose/Objective</label>
                <textarea
                  className="ut-form__textarea"
                  rows="3"
                  value={form.purpose}
                  onChange={(e) => setField("purpose", e.target.value)}
                  placeholder="Brief description of why you need this training..."
                />
              </div>

              <div className="ut-form__field">
                <label className="ut-form__label">
                  Additional Requirements
                </label>
                <textarea
                  className="ut-form__textarea"
                  rows="2"
                  value={form.additional_requirements}
                  onChange={(e) =>
                    setField("additional_requirements", e.target.value)
                  }
                  placeholder="Any special requirements, equipment needs, or accessibility considerations..."
                />
              </div>
            </>
          )}

          {/* Step 4: Document Upload */}
          {step === 4 && (
            <>
              <div className="ut-divider">
                <i className="fas fa-file-upload" /> Required Documents
              </div>

              <div className="ut-info-notice">
                <i className="fas fa-info-circle" />
                <div>
                  <strong>
                    Please upload the following documents to process your
                    training request:
                  </strong>
                </div>
              </div>

              <div className="ut-form__field">
                <label className="ut-form__label">
                  Valid ID <span className="ut-form__required">*</span>
                </label>
                <div className="ut-file-upload">
                  <input
                    type="file"
                    id="valid_id_request"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileUpload(e, "valid_id")}
                    className="ut-file-upload__input"
                  />
                  <label
                    htmlFor="valid_id_request"
                    className="ut-file-upload__label"
                  >
                    <i className="fas fa-id-card" />
                    {files.valid_id
                      ? files.valid_id.name
                      : "Upload a clear photo of your valid ID"}
                  </label>
                </div>
                <small className="ut-form__hint">
                  Accepted formats: JPG, PNG, PDF (Max 5MB)
                </small>
                {errors.valid_id && (
                  <span className="ut-form__error-text">{errors.valid_id}</span>
                )}
              </div>

              {toggleOrganizationSection() && (
                <div className="ut-form__field">
                  <label className="ut-form__label">
                    Participant List{" "}
                    {toggleOrganizationSection() && (
                      <span className="ut-form__required">*</span>
                    )}
                  </label>
                  <div className="ut-file-upload">
                    <input
                      type="file"
                      id="participant_list"
                      accept=".pdf,.doc,.docx,.csv,.xls,.xlsx"
                      onChange={(e) => handleFileUpload(e, "participant_list")}
                      className="ut-file-upload__input"
                    />
                    <label
                      htmlFor="participant_list"
                      className="ut-file-upload__label"
                    >
                      <i className="fas fa-users" />
                      {files.participant_list
                        ? files.participant_list.name
                        : "Upload list of participants (for groups of 5 or more)"}
                    </label>
                  </div>
                  <small className="ut-form__hint">
                    Accepted formats: PDF, DOC, DOCX, CSV, Excel (Max 10MB)
                  </small>
                  {errors.participant_list && (
                    <span className="ut-form__error-text">
                      {errors.participant_list}
                    </span>
                  )}
                </div>
              )}

              <div className="ut-form__field">
                <label className="ut-form__label">
                  Additional Documents (Optional)
                </label>
                <div className="ut-file-upload">
                  <input
                    type="file"
                    id="additional_docs"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e, "additional_docs")}
                    className="ut-file-upload__input"
                  />
                  <label
                    htmlFor="additional_docs"
                    className="ut-file-upload__label"
                  >
                    <i className="fas fa-file-alt" />
                    {files.additional_docs.length > 0
                      ? `${files.additional_docs.length} file(s) selected`
                      : "Upload supporting documents (certificates, authorization letters, etc.)"}
                  </label>
                </div>
                <small className="ut-form__hint">
                  Accepted formats: JPG, PNG, PDF, DOC, DOCX (Max 5MB each)
                </small>
              </div>

              {files.additional_docs.length > 0 && (
                <div className="ut-form__field">
                  <label className="ut-form__label">Selected Files:</label>
                  <div className="ut-file-list">
                    {files.additional_docs.map((file, index) => (
                      <div key={index} className="ut-file-list__item">
                        <span className="ut-file-list__item-name">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          className="ut-file-list__item-remove"
                          onClick={() => removeAdditionalDoc(index)}
                        >
                          <i className="fas fa-times" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="ut-info-notice" style={{ marginTop: "1rem" }}>
                <i className="fas fa-info-circle" />
                <div>
                  Your training request will be reviewed by our training
                  coordinators. We will contact you within 3-5 business days to
                  discuss scheduling and requirements. All uploaded documents
                  are securely stored and used only for training request
                  processing.
                </div>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="ut-form__submit"
                style={{ background: "#e5e7eb", color: "#374151" }}
              >
                <i className="fas fa-arrow-left" /> Previous
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="ut-form__submit"
                style={{ flex: 1 }}
              >
                Next <i className="fas fa-arrow-right" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="ut-form__submit"
                style={{ flex: 1 }}
              >
                {submitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane" /> Submit Training Request
                  </>
                )}
              </button>
            )}
          </div>
        </form>
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

  function setField(k, v) {
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
                onChange={(e) => setField("full_name", e.target.value)}
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
                onChange={(e) => setField("email", e.target.value)}
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
                onChange={(e) => setField("age", e.target.value)}
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
                onChange={(e) => setField("location", e.target.value)}
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
                onChange={(e) => setField("organization_name", e.target.value)}
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
              onChange={(e) => setField("rcy_status", e.target.value)}
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
                        onChange={(e) =>
                          setField("payment_mode", e.target.value)
                        }
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
  const [showTrainingRequest, setShowTrainingRequest] = useState(false);
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

  function handleTrainingRequestSuccess(msg) {
    showToast(msg);
    setShowTrainingRequest(false);
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
          <button
            className="ut-header__request-btn"
            onClick={() => setShowTrainingRequest(true)}
          >
            <i className="fas fa-plus-circle" />
            Request Training Program
          </button>
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

      {/* TRAINING REQUEST MODAL */}
      {showTrainingRequest && (
        <TrainingRequestModal
          onClose={() => setShowTrainingRequest(false)}
          onSuccess={handleTrainingRequestSuccess}
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
