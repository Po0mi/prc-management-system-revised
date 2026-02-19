// Path: src/pages/AdminVolunteers/AdminVolunteers.jsx
import { useState, useEffect, useCallback } from "react";
import {
  getVolunteers,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  SERVICE_OPTIONS,
  STATUS_OPTIONS,
  formatService,
  formatStatus,
} from "../../services/volunteersApi";
import "./AdminVolunteers.scss";

// ─── TOAST COMPONENT ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`av-toast av-toast--${type}`} onClick={onClose}>
      <i
        className={`fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`}
      />
      <span>{message}</span>
      <button className="av-toast__close" onClick={onClose}>
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}

// ─── VOLUNTEER MODAL ──────────────────────────────────────────────────────────
function VolunteerModal({ volunteer, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    location: "",
    barangay: "",
    municipality: "",
    city: "",
    contact_number: "",
    email: "",
    service: "first_aid",
    status: "current",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (volunteer) {
      setFormData({
        full_name: volunteer.full_name || "",
        age: volunteer.age || "",
        location: volunteer.location || "",
        barangay: volunteer.barangay || "",
        municipality: volunteer.municipality || "",
        city: volunteer.city || "",
        contact_number: volunteer.contact_number || "",
        email: volunteer.email || "",
        service: volunteer.service || "first_aid",
        status: volunteer.status || "current",
        notes: volunteer.notes || "",
      });
    }
  }, [volunteer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!formData.age) {
      newErrors.age = "Age is required";
    } else if (formData.age < 16 || formData.age > 100) {
      newErrors.age = "Age must be between 16 and 100";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    if (!formData.contact_number.trim()) {
      newErrors.contact_number = "Contact number is required";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.service) {
      newErrors.service = "Service is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (volunteer) {
        await updateVolunteer(volunteer.volunteer_id, formData);
        onSuccess("Volunteer updated successfully");
      } else {
        await createVolunteer(formData);
        onSuccess("Volunteer created successfully");
      }
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="av-overlay" onClick={onClose}>
      <div className="av-modal" onClick={(e) => e.stopPropagation()}>
        <div className="av-modal__header">
          <span className="av-modal__title">
            <i
              className={`fa-solid ${volunteer ? "fa-pen-to-square" : "fa-user-plus"}`}
            />
            {volunteer ? "Edit Volunteer" : "Add New Volunteer"}
          </span>
          <button className="av-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form className="av-modal__body" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="av-form__error-banner">
              <i className="fa-solid fa-circle-exclamation" />
              {errors.submit}
            </div>
          )}

          <div className="av-form__row">
            <div className="av-form__field">
              <label className="av-form__label">
                <i className="fa-solid fa-user" />
                Full Name <span className="av-form__required">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`av-form__input ${errors.full_name ? "av-form__input--error" : ""}`}
                placeholder="Enter full name"
              />
              {errors.full_name && (
                <span className="av-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.full_name}
                </span>
              )}
            </div>

            <div className="av-form__field">
              <label className="av-form__label">
                <i className="fa-solid fa-calendar" />
                Age <span className="av-form__required">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="16"
                max="100"
                className={`av-form__input ${errors.age ? "av-form__input--error" : ""}`}
                placeholder="Enter age"
              />
              {errors.age && (
                <span className="av-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.age}
                </span>
              )}
            </div>
          </div>

          <div className="av-form__field">
            <label className="av-form__label">
              <i className="fa-solid fa-location-dot" />
              Location <span className="av-form__required">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`av-form__input ${errors.location ? "av-form__input--error" : ""}`}
              placeholder="e.g., Bacolod City, Negros Occidental"
            />
            {errors.location && (
              <span className="av-form__error-text">
                <i className="fa-solid fa-circle-exclamation" />
                {errors.location}
              </span>
            )}
          </div>

          <div className="av-form__row">
            <div className="av-form__field">
              <label className="av-form__label">
                <i className="fa-solid fa-map-pin" />
                Barangay
              </label>
              <input
                type="text"
                name="barangay"
                value={formData.barangay}
                onChange={handleChange}
                className="av-form__input"
                placeholder="Enter barangay"
              />
            </div>

            <div className="av-form__field">
              <label className="av-form__label">
                <i className="fa-solid fa-city" />
                Municipality
              </label>
              <input
                type="text"
                name="municipality"
                value={formData.municipality}
                onChange={handleChange}
                className="av-form__input"
                placeholder="Enter municipality"
              />
            </div>
          </div>

          <div className="av-form__row">
            <div className="av-form__field">
              <label className="av-form__label">
                <i className="fa-solid fa-city" />
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="av-form__input"
                placeholder="Enter city"
              />
            </div>

            <div className="av-form__field">
              <label className="av-form__label">
                <i className="fa-solid fa-phone" />
                Contact Number <span className="av-form__required">*</span>
              </label>
              <input
                type="text"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                className={`av-form__input ${errors.contact_number ? "av-form__input--error" : ""}`}
                placeholder="e.g., +63-912-345-6789"
              />
              {errors.contact_number && (
                <span className="av-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.contact_number}
                </span>
              )}
            </div>
          </div>

          <div className="av-form__row">
            <div className="av-form__field">
              <label className="av-form__label">
                <i className="fa-regular fa-envelope" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`av-form__input ${errors.email ? "av-form__input--error" : ""}`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <span className="av-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.email}
                </span>
              )}
            </div>

            <div className="av-form__field">
              <label className="av-form__label">
                <i className="fa-solid fa-hand-holding-heart" />
                Service <span className="av-form__required">*</span>
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className={`av-form__select ${errors.service ? "av-form__input--error" : ""}`}
              >
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.service && (
                <span className="av-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.service}
                </span>
              )}
            </div>
          </div>

          <div className="av-form__row">
            <div className="av-form__field">
              <label className="av-form__label">
                <i className="fa-solid fa-flag" />
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="av-form__select"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="av-form__field av-form__field--full">
            <label className="av-form__label">
              <i className="fa-regular fa-note-sticky" />
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="av-form__textarea"
              placeholder="Additional notes about the volunteer..."
              rows="3"
            />
          </div>

          <button
            type="submit"
            className="av-form__submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                {volunteer ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <i
                  className={`fa-solid ${volunteer ? "fa-pen-to-square" : "fa-user-plus"}`}
                />
                {volunteer ? "Update Volunteer" : "Create Volunteer"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── VIEW MODAL ───────────────────────────────────────────────────────────────
function ViewModal({ volunteer, onClose }) {
  if (!volunteer) return null;

  const getServiceClass = (service) => {
    const classes = {
      first_aid: "av-view__service--first_aid",
      disaster_response: "av-view__service--disaster_response",
      blood_services: "av-view__service--blood_services",
      safety_services: "av-view__service--safety_services",
      youth_services: "av-view__service--youth_services",
      welfare_services: "av-view__service--welfare_services",
    };
    return classes[service] || "";
  };

  return (
    <div className="av-overlay" onClick={onClose}>
      <div className="av-modal" onClick={(e) => e.stopPropagation()}>
        <div className="av-modal__header">
          <span className="av-modal__title">
            <i className="fa-solid fa-eye" />
            Volunteer Details
          </span>
          <button className="av-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="av-modal__body">
          <div className="av-view__section">
            <h3 className="av-view__section-title">
              <i className="fa-solid fa-user" />
              Personal Information
            </h3>
            <div className="av-view__grid">
              <div className="av-view__item">
                <div className="av-view__item-label">Full Name</div>
                <div className="av-view__item-value">{volunteer.full_name}</div>
              </div>
              <div className="av-view__item">
                <div className="av-view__item-label">Age</div>
                <div className="av-view__item-value">
                  {volunteer.age} years old
                </div>
              </div>
              <div className="av-view__item av-view__full">
                <div className="av-view__item-label">Location</div>
                <div className="av-view__item-value">{volunteer.location}</div>
              </div>
              <div className="av-view__item">
                <div className="av-view__item-label">Barangay</div>
                <div className="av-view__item-value">
                  {volunteer.barangay || "—"}
                </div>
              </div>
              <div className="av-view__item">
                <div className="av-view__item-label">Municipality</div>
                <div className="av-view__item-value">
                  {volunteer.municipality || "—"}
                </div>
              </div>
              <div className="av-view__item">
                <div className="av-view__item-label">City</div>
                <div className="av-view__item-value">
                  {volunteer.city || "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="av-view__section">
            <h3 className="av-view__section-title">
              <i className="fa-solid fa-address-book" />
              Contact Information
            </h3>
            <div className="av-view__grid">
              <div className="av-view__item">
                <div className="av-view__item-label">Contact Number</div>
                <div className="av-view__item-value">
                  {volunteer.contact_number}
                </div>
              </div>
              <div className="av-view__item">
                <div className="av-view__item-label">Email</div>
                <div className="av-view__item-value">
                  {volunteer.email || "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="av-view__section">
            <h3 className="av-view__section-title">
              <i className="fa-solid fa-briefcase" />
              Volunteer Details
            </h3>
            <div className="av-view__grid">
              <div className="av-view__item">
                <div className="av-view__item-label">Service</div>
                <div className="av-view__item-value">
                  <span
                    className={`av-view__service ${getServiceClass(volunteer.service)}`}
                  >
                    <i
                      className={`fa-solid ${SERVICE_OPTIONS.find((o) => o.value === volunteer.service)?.icon || "fa-hand"}`}
                    />
                    {formatService(volunteer.service)}
                  </span>
                </div>
              </div>
              <div className="av-view__item">
                <div className="av-view__item-label">Status</div>
                <div className="av-view__item-value">
                  <span
                    className={`av-view__status av-view__status--${volunteer.status}`}
                  >
                    <i className="fa-solid fa-circle" />
                    {formatStatus(volunteer.status)}
                  </span>
                </div>
              </div>
              <div className="av-view__item av-view__full">
                <div className="av-view__item-label">Notes</div>
                <div className="av-view__notes">
                  {volunteer.notes || "No notes available"}
                </div>
              </div>
            </div>
          </div>

          <div className="av-view__section">
            <h3 className="av-view__section-title">
              <i className="fa-regular fa-clock" />
              System Information
            </h3>
            <div className="av-view__grid">
              <div className="av-view__item">
                <div className="av-view__item-label">Created At</div>
                <div className="av-view__item-value">
                  {new Date(volunteer.created_at).toLocaleString()}
                </div>
              </div>
              <div className="av-view__item">
                <div className="av-view__item-label">Updated At</div>
                <div className="av-view__item-value">
                  {new Date(volunteer.updated_at).toLocaleString()}
                </div>
              </div>
              {volunteer.created_by_name && (
                <div className="av-view__item">
                  <div className="av-view__item-label">Created By</div>
                  <div className="av-view__item-value">
                    {volunteer.created_by_name}
                  </div>
                </div>
              )}
              {volunteer.updated_by_name && (
                <div className="av-view__item">
                  <div className="av-view__item-label">Updated By</div>
                  <div className="av-view__item-value">
                    {volunteer.updated_by_name}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminVolunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    by_status: { current: 0, graduated: 0 },
    by_service: {},
    location_stats: {
      by_city: {},
      by_municipality: {},
      by_barangay: {},
    },
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState({
    city: "",
    municipality: "",
    barangay: "",
  });
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showMunicipalityDropdown, setShowMunicipalityDropdown] =
    useState(false);
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const fetchVolunteers = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (search) filters.search = search;
      if (serviceFilter) filters.service = serviceFilter;
      if (statusFilter) filters.status = statusFilter;
      if (locationFilter.city) filters.city = locationFilter.city;
      if (locationFilter.municipality)
        filters.municipality = locationFilter.municipality;
      if (locationFilter.barangay) filters.barangay = locationFilter.barangay;

      const response = await getVolunteers(filters);
      setVolunteers(response.data);
      setStats(response.stats);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [search, serviceFilter, statusFilter, locationFilter]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchVolunteers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [fetchVolunteers]);

  // Extract unique locations from volunteers data
  const [locationOptions, setLocationOptions] = useState({
    cities: [],
    municipalities: [],
    barangays: [],
  });

  useEffect(() => {
    if (volunteers.length > 0) {
      const cities = [
        ...new Set(volunteers.map((v) => v.city).filter(Boolean)),
      ].sort();
      const municipalities = [
        ...new Set(volunteers.map((v) => v.municipality).filter(Boolean)),
      ].sort();
      const barangays = [
        ...new Set(volunteers.map((v) => v.barangay).filter(Boolean)),
      ].sort();

      setLocationOptions({ cities, municipalities, barangays });
    }
  }, [volunteers]);

  const handleCreate = () => {
    setSelectedVolunteer(null);
    setShowModal(true);
  };

  const handleEdit = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setShowModal(true);
  };

  const handleView = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this volunteer?")) {
      return;
    }

    try {
      await deleteVolunteer(id);
      showToast("Volunteer deleted successfully");
      fetchVolunteers();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleModalSuccess = (message) => {
    showToast(message);
    fetchVolunteers();
  };

  const clearSearch = () => {
    setSearch("");
  };

  const clearFilters = () => {
    setServiceFilter("");
    setStatusFilter("");
    setLocationFilter({ city: "", municipality: "", barangay: "" });
  };

  const clearLocationFilter = () => {
    setLocationFilter({ city: "", municipality: "", barangay: "" });
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getServiceIcon = (service) => {
    const option = SERVICE_OPTIONS.find((opt) => opt.value === service);
    return option ? option.icon : "fa-solid fa-hand";
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (serviceFilter) count++;
    if (statusFilter) count++;
    if (locationFilter.city) count++;
    if (locationFilter.municipality) count++;
    if (locationFilter.barangay) count++;
    return count;
  };

  return (
    <div className="av-root">
      {/* Header */}
      <div className="av-header">
        <div className="av-header__inner">
          <div>
            <div className="av-header__eyebrow">
              <i className="fa-solid fa-hand-holding-heart" />
              Volunteer Management
            </div>
            <h1 className="av-header__title">Volunteers</h1>
            <p className="av-header__subtitle">
              Manage and track volunteers across all service areas
            </p>
          </div>

          <div className="av-header__stats">
            <div className="av-header__stat">
              <div className="av-header__stat-num">{stats.total}</div>
              <div className="av-header__stat-label">Total Volunteers</div>
            </div>
            <div className="av-header__stat">
              <div className="av-header__stat-num">
                {stats.by_status?.current || 0}
              </div>
              <div className="av-header__stat-label">Active</div>
            </div>
            <div className="av-header__stat">
              <div className="av-header__stat-num">
                {stats.by_status?.graduated || 0}
              </div>
              <div className="av-header__stat-label">Graduated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="av-body">
        {/* Stats Cards */}
        <div className="av-cards">
          <div className="av-card">
            <div className="av-card__icon av-card__icon--total">
              <i className="fa-solid fa-users" />
            </div>
            <div>
              <div className="av-card__num">{stats.total}</div>
              <div className="av-card__label">Total Volunteers</div>
            </div>
          </div>

          <div className="av-card">
            <div className="av-card__icon av-card__icon--current">
              <i className="fa-solid fa-user-check" />
            </div>
            <div>
              <div className="av-card__num">
                {stats.by_status?.current || 0}
              </div>
              <div className="av-card__label">Current</div>
            </div>
          </div>

          <div className="av-card">
            <div className="av-card__icon av-card__icon--graduated">
              <i className="fa-solid fa-graduation-cap" />
            </div>
            <div>
              <div className="av-card__num">
                {stats.by_status?.graduated || 0}
              </div>
              <div className="av-card__label">Graduated</div>
            </div>
          </div>

          <div className="av-card">
            <div className="av-card__icon av-card__icon--services">
              <i className="fa-solid fa-hand-holding-heart" />
            </div>
            <div>
              <div className="av-card__num">
                {Object.keys(stats.by_service || {}).length}
              </div>
              <div className="av-card__label">Service Areas</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="av-toolbar">
          <div className="av-toolbar__search">
            <i className="fa-solid fa-magnifying-glass av-toolbar__search-icon" />
            <input
              type="text"
              className="av-toolbar__search-input"
              placeholder="Search volunteers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="av-toolbar__search-clear"
                onClick={clearSearch}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          <div className="av-toolbar__filters">
            {/* City Filter Dropdown */}
            {locationOptions.cities.length > 0 && (
              <div className="av-toolbar__filter-dropdown">
                <button
                  className="av-toolbar__filter-dropdown-btn"
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                >
                  <i className="fa-solid fa-city" />
                  {locationFilter.city || "All Cities"}
                  <i className="fa-solid fa-chevron-down" />
                </button>
                {showCityDropdown && (
                  <div className="av-toolbar__filter-dropdown-menu">
                    <button
                      onClick={() => {
                        setLocationFilter({ ...locationFilter, city: "" });
                        setShowCityDropdown(false);
                      }}
                      className={!locationFilter.city ? "active" : ""}
                    >
                      All Cities
                    </button>
                    {locationOptions.cities.map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setLocationFilter({
                            ...locationFilter,
                            city,
                            municipality: "",
                            barangay: "",
                          });
                          setShowCityDropdown(false);
                        }}
                        className={locationFilter.city === city ? "active" : ""}
                      >
                        <i className="fa-solid fa-city" />
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Municipality Filter Dropdown */}
            {locationOptions.municipalities.length > 0 && (
              <div className="av-toolbar__filter-dropdown">
                <button
                  className="av-toolbar__filter-dropdown-btn"
                  onClick={() =>
                    setShowMunicipalityDropdown(!showMunicipalityDropdown)
                  }
                >
                  <i className="fa-solid fa-map-pin" />
                  {locationFilter.municipality || "All Municipalities"}
                  <i className="fa-solid fa-chevron-down" />
                </button>
                {showMunicipalityDropdown && (
                  <div className="av-toolbar__filter-dropdown-menu">
                    <button
                      onClick={() => {
                        setLocationFilter({
                          ...locationFilter,
                          municipality: "",
                          barangay: "",
                        });
                        setShowMunicipalityDropdown(false);
                      }}
                      className={!locationFilter.municipality ? "active" : ""}
                    >
                      All Municipalities
                    </button>
                    {locationOptions.municipalities.map((municipality) => (
                      <button
                        key={municipality}
                        onClick={() => {
                          setLocationFilter({
                            ...locationFilter,
                            municipality,
                            barangay: "",
                          });
                          setShowMunicipalityDropdown(false);
                        }}
                        className={
                          locationFilter.municipality === municipality
                            ? "active"
                            : ""
                        }
                      >
                        <i className="fa-solid fa-map-pin" />
                        {municipality}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Barangay Filter Dropdown */}
            {locationOptions.barangays.length > 0 && (
              <div className="av-toolbar__filter-dropdown">
                <button
                  className="av-toolbar__filter-dropdown-btn"
                  onClick={() => setShowBarangayDropdown(!showBarangayDropdown)}
                >
                  <i className="fa-solid fa-location-dot" />
                  {locationFilter.barangay || "All Barangays"}
                  <i className="fa-solid fa-chevron-down" />
                </button>
                {showBarangayDropdown && (
                  <div className="av-toolbar__filter-dropdown-menu">
                    <button
                      onClick={() => {
                        setLocationFilter({ ...locationFilter, barangay: "" });
                        setShowBarangayDropdown(false);
                      }}
                      className={!locationFilter.barangay ? "active" : ""}
                    >
                      All Barangays
                    </button>
                    {locationOptions.barangays.map((barangay) => (
                      <button
                        key={barangay}
                        onClick={() => {
                          setLocationFilter({ ...locationFilter, barangay });
                          setShowBarangayDropdown(false);
                        }}
                        className={
                          locationFilter.barangay === barangay ? "active" : ""
                        }
                      >
                        <i className="fa-solid fa-location-dot" />
                        {barangay}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Service Filter Dropdown */}
            <div className="av-toolbar__filter-dropdown">
              <button
                className="av-toolbar__filter-dropdown-btn"
                onClick={() => setShowServiceDropdown(!showServiceDropdown)}
              >
                <i className="fa-solid fa-filter" />
                {serviceFilter ? formatService(serviceFilter) : "All Services"}
                <i className="fa-solid fa-chevron-down" />
              </button>
              {showServiceDropdown && (
                <div className="av-toolbar__filter-dropdown-menu">
                  <button
                    onClick={() => {
                      setServiceFilter("");
                      setShowServiceDropdown(false);
                    }}
                    className={!serviceFilter ? "active" : ""}
                  >
                    All Services
                  </button>
                  {SERVICE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setServiceFilter(option.value);
                        setShowServiceDropdown(false);
                      }}
                      className={serviceFilter === option.value ? "active" : ""}
                    >
                      <i className={option.icon} />
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <div className="av-toolbar__filter-dropdown">
              <button
                className="av-toolbar__filter-dropdown-btn"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <i className="fa-solid fa-flag" />
                {statusFilter ? formatStatus(statusFilter) : "All Status"}
                <i className="fa-solid fa-chevron-down" />
              </button>
              {showStatusDropdown && (
                <div className="av-toolbar__filter-dropdown-menu">
                  <button
                    onClick={() => {
                      setStatusFilter("");
                      setShowStatusDropdown(false);
                    }}
                    className={!statusFilter ? "active" : ""}
                  >
                    All Status
                  </button>
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setShowStatusDropdown(false);
                      }}
                      className={statusFilter === option.value ? "active" : ""}
                    >
                      <i className={option.icon} />
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {getActiveFilterCount() > 0 && (
              <button className="av-toolbar__filter-btn" onClick={clearFilters}>
                <i className="fa-solid fa-xmark" />
                Clear Filters ({getActiveFilterCount()})
              </button>
            )}
          </div>

          <button className="av-toolbar__create-btn" onClick={handleCreate}>
            <i className="fa-solid fa-plus" />
            Add Volunteer
          </button>
        </div>

        {/* Table */}
        <div className="av-table-panel">
          <div className="av-table-panel__head">
            <div className="av-table-panel__title">
              <i className="fa-solid fa-users" />
              Volunteer List
            </div>
            <span className="av-table-panel__count">
              {volunteers.length}{" "}
              {volunteers.length === 1 ? "volunteer" : "volunteers"}
            </span>
          </div>

          <div className="av-table-panel__scroll">
            <table className="av-table">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Location</th>
                  <th>Contact</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="av-table__loading">
                      <i className="fa-solid fa-spinner fa-spin" />
                      <p>Loading volunteers...</p>
                    </td>
                  </tr>
                ) : volunteers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="av-table__empty">
                      <i className="fa-regular fa-face-frown" />
                      <p>No volunteers found</p>
                    </td>
                  </tr>
                ) : (
                  volunteers.map((volunteer) => (
                    <tr key={volunteer.volunteer_id}>
                      <td>
                        <div className="av-volunteer-cell">
                          <div className="av-volunteer-cell__avatar">
                            {getInitials(volunteer.full_name)}
                          </div>
                          <div className="av-volunteer-cell__info">
                            <div className="av-volunteer-cell__info-name">
                              {volunteer.full_name}
                            </div>
                            <div className="av-volunteer-cell__info-age">
                              {volunteer.age} years old
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="av-location">
                          <div className="av-location__main">
                            {volunteer.location}
                          </div>
                          {(volunteer.barangay || volunteer.municipality) && (
                            <div className="av-location__detail">
                              <i className="fa-solid fa-circle" />
                              {[
                                volunteer.barangay,
                                volunteer.municipality,
                                volunteer.city,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="av-contact">
                          <div className="av-contact__phone">
                            <i className="fa-solid fa-phone" />
                            {volunteer.contact_number}
                          </div>
                          {volunteer.email && (
                            <div className="av-contact__email">
                              <i className="fa-regular fa-envelope" />
                              {volunteer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`av-service-badge av-service-badge--${volunteer.service}`}
                        >
                          <i className={getServiceIcon(volunteer.service)} />
                          {formatService(volunteer.service)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`av-status av-status--${volunteer.status}`}
                        >
                          <i className="fa-solid fa-circle" />
                          {formatStatus(volunteer.status)}
                        </span>
                      </td>
                      <td>
                        <div className="av-notes" title={volunteer.notes}>
                          {volunteer.notes || "—"}
                        </div>
                      </td>
                      <td>
                        <div className="av-actions">
                          <button
                            className="av-action-btn av-action-btn--view"
                            onClick={() => handleView(volunteer)}
                            title="View Details"
                          >
                            <i className="fa-solid fa-eye" />
                          </button>
                          <button
                            className="av-action-btn av-action-btn--edit"
                            onClick={() => handleEdit(volunteer)}
                            title="Edit Volunteer"
                          >
                            <i className="fa-solid fa-pen" />
                          </button>
                          <button
                            className="av-action-btn av-action-btn--delete"
                            onClick={() => handleDelete(volunteer.volunteer_id)}
                            title="Delete Volunteer"
                          >
                            <i className="fa-solid fa-trash" />
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

      {/* Modals */}
      {showModal && (
        <VolunteerModal
          volunteer={selectedVolunteer}
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {showViewModal && (
        <ViewModal
          volunteer={selectedVolunteer}
          onClose={() => setShowViewModal(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
