// AdminBloodBank.jsx
// Path: src/pages/AdminBloodBank/AdminBloodBank.jsx

import { useState, useEffect, useCallback } from "react";
import "./AdminBloodBank.scss";
import {
  getBloodInventory,
  getInventoryItem,
  getLocations,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  BLOOD_TYPES,
  getBloodTypeColor,
  getStockStatus,
  formatUnits,
} from "../../services/bloodBankApi";

// ─── TOAST COMPONENT ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`abb-toast abb-toast--${type}`} onClick={onClose}>
      <i
        className={`fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`}
      />
      <span>{message}</span>
      <button className="abb-toast__close" onClick={onClose}>
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}

// ─── INVENTORY MODAL ──────────────────────────────────────────────────────────
function InventoryModal({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    location_name: "",
    blood_type: "A+",
    units_available: "",
    contact_number: "",
    address: "",
    latitude: "",
    longitude: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        location_name: item.location_name || "",
        blood_type: item.blood_type || "A+",
        units_available: item.units_available || "",
        contact_number: item.contact_number || "",
        address: item.address || "",
        latitude: item.latitude || "",
        longitude: item.longitude || "",
      });
    }
  }, [item]);

  const fetchLocations = async () => {
    try {
      const response = await getLocations();
      setLocations(response.data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    if (value === "new") {
      setNewLocation(true);
      setFormData((prev) => ({ ...prev, location_name: "" }));
    } else {
      setNewLocation(false);
      setFormData((prev) => ({ ...prev, location_name: value }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.location_name.trim()) {
      newErrors.location_name = "Location name is required";
    }

    if (!formData.blood_type) {
      newErrors.blood_type = "Blood type is required";
    }

    if (formData.units_available === "" || formData.units_available < 0) {
      newErrors.units_available = "Units must be a positive number";
    }

    if (!formData.contact_number.trim()) {
      newErrors.contact_number = "Contact number is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (
      !formData.latitude ||
      formData.latitude < -90 ||
      formData.latitude > 90
    ) {
      newErrors.latitude = "Valid latitude (-90 to 90) is required";
    }

    if (
      !formData.longitude ||
      formData.longitude < -180 ||
      formData.longitude > 180
    ) {
      newErrors.longitude = "Valid longitude (-180 to 180) is required";
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
      const payload = {
        ...formData,
        units_available: parseInt(formData.units_available),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };

      if (item) {
        await updateInventoryItem(item.id, payload);
        onSuccess("Blood inventory item updated successfully");
      } else {
        await createInventoryItem(payload);
        onSuccess("Blood inventory item created successfully");
      }
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="abb-overlay" onClick={onClose}>
      <div className="abb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="abb-modal__header">
          <span className="abb-modal__title">
            <i
              className={`fa-solid ${item ? "fa-pen-to-square" : "fa-plus"}`}
            />
            {item ? "Edit Blood Inventory" : "Add Blood Inventory"}
          </span>
          <button className="abb-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form className="abb-modal__body" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="abb-form__error-banner">
              <i className="fa-solid fa-circle-exclamation" />
              {errors.submit}
            </div>
          )}

          <div className="abb-form__row">
            <div className="abb-form__field abb-form__field--full">
              <label className="abb-form__label">
                <i className="fa-solid fa-hospital" />
                Location <span className="abb-form__required">*</span>
              </label>
              {!item && (
                <select
                  className="abb-form__select"
                  onChange={handleLocationChange}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select location or add new
                  </option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                  <option value="new">+ Add New Location</option>
                </select>
              )}
              <input
                type="text"
                name="location_name"
                value={formData.location_name}
                onChange={handleChange}
                className={`abb-form__input ${errors.location_name ? "abb-form__input--error" : ""}`}
                placeholder="Enter location name"
                readOnly={!newLocation && !item && locations.length > 0}
              />
              {errors.location_name && (
                <span className="abb-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.location_name}
                </span>
              )}
            </div>
          </div>

          <div className="abb-form__row">
            <div className="abb-form__field">
              <label className="abb-form__label">
                <i className="fa-solid fa-droplet" />
                Blood Type <span className="abb-form__required">*</span>
              </label>
              <select
                name="blood_type"
                value={formData.blood_type}
                onChange={handleChange}
                className={`abb-form__select ${errors.blood_type ? "abb-form__input--error" : ""}`}
              >
                {BLOOD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.value}
                  </option>
                ))}
              </select>
              {errors.blood_type && (
                <span className="abb-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.blood_type}
                </span>
              )}
            </div>

            <div className="abb-form__field">
              <label className="abb-form__label">
                <i className="fa-solid fa-boxes" />
                Units Available <span className="abb-form__required">*</span>
              </label>
              <input
                type="number"
                name="units_available"
                value={formData.units_available}
                onChange={handleChange}
                min="0"
                className={`abb-form__input ${errors.units_available ? "abb-form__input--error" : ""}`}
                placeholder="0"
              />
              {errors.units_available && (
                <span className="abb-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.units_available}
                </span>
              )}
            </div>
          </div>

          <div className="abb-form__row">
            <div className="abb-form__field">
              <label className="abb-form__label">
                <i className="fa-solid fa-phone" />
                Contact Number <span className="abb-form__required">*</span>
              </label>
              <input
                type="text"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                className={`abb-form__input ${errors.contact_number ? "abb-form__input--error" : ""}`}
                placeholder="e.g., (032) 123-4567"
              />
              {errors.contact_number && (
                <span className="abb-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.contact_number}
                </span>
              )}
            </div>
          </div>

          <div className="abb-form__field">
            <label className="abb-form__label">
              <i className="fa-solid fa-location-dot" />
              Address <span className="abb-form__required">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`abb-form__textarea ${errors.address ? "abb-form__input--error" : ""}`}
              placeholder="Enter complete address"
              rows="3"
            />
            {errors.address && (
              <span className="abb-form__error-text">
                <i className="fa-solid fa-circle-exclamation" />
                {errors.address}
              </span>
            )}
          </div>

          <div className="abb-form__row">
            <div className="abb-form__field">
              <label className="abb-form__label">
                <i className="fa-solid fa-map-pin" />
                Latitude <span className="abb-form__required">*</span>
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                step="any"
                className={`abb-form__input ${errors.latitude ? "abb-form__input--error" : ""}`}
                placeholder="e.g., 10.3157"
              />
              {errors.latitude && (
                <span className="abb-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.latitude}
                </span>
              )}
            </div>

            <div className="abb-form__field">
              <label className="abb-form__label">
                <i className="fa-solid fa-map-pin" />
                Longitude <span className="abb-form__required">*</span>
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                step="any"
                className={`abb-form__input ${errors.longitude ? "abb-form__input--error" : ""}`}
                placeholder="e.g., 123.8854"
              />
              {errors.longitude && (
                <span className="abb-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.longitude}
                </span>
              )}
            </div>
          </div>

          <div className="abb-form__field">
            <small className="abb-form__hint">
              <i className="fa-solid fa-info-circle" />
              You can get latitude and longitude from Google Maps by
              right-clicking on the location.
            </small>
          </div>

          <button
            type="submit"
            className="abb-form__submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                {item ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <i
                  className={`fa-solid ${item ? "fa-pen-to-square" : "fa-plus"}`}
                />
                {item ? "Update Item" : "Create Item"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── VIEW MODAL ───────────────────────────────────────────────────────────────
function ViewModal({ item, onClose }) {
  if (!item) return null;

  const bloodTypeColor = getBloodTypeColor(item.blood_type);
  const stockStatus = getStockStatus(item.units_available);

  const handleCall = () => {
    window.location.href = `tel:${item.contact_number.replace(/\D/g, "")}`;
  };

  const handleDirections = () => {
    const address = encodeURIComponent(item.address);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${address}`,
      "_blank",
    );
  };

  return (
    <div className="abb-overlay" onClick={onClose}>
      <div
        className="abb-modal abb-modal--lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="abb-modal__header">
          <span className="abb-modal__title">
            <i className="fa-solid fa-eye" />
            Blood Inventory Details
          </span>
          <button className="abb-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="abb-modal__body">
          <div className="abb-view__section">
            <h3 className="abb-view__section-title">
              <i className="fa-solid fa-hospital" />
              {item.location_name}
            </h3>

            <div className="abb-view__badges">
              <span
                className="abb-view__badge"
                style={{
                  background: `${bloodTypeColor}15`,
                  color: bloodTypeColor,
                  border: `1px solid ${bloodTypeColor}33`,
                }}
              >
                <i className="fa-solid fa-droplet" />
                Type {item.blood_type}
              </span>

              <span
                className="abb-view__badge"
                style={{
                  background: `${stockStatus.color}15`,
                  color: stockStatus.color,
                  border: `1px solid ${stockStatus.color}33`,
                }}
              >
                <i className="fa-solid fa-boxes" />
                {item.units_available} units
              </span>

              <span
                className="abb-view__badge"
                style={{
                  background:
                    item.units_available === 0
                      ? "#6b728015"
                      : item.units_available < 10
                        ? "#ef444415"
                        : item.units_available < 20
                          ? "#f59e0b15"
                          : "#10b98115",
                  color:
                    item.units_available === 0
                      ? "#6b7280"
                      : item.units_available < 10
                        ? "#ef4444"
                        : item.units_available < 20
                          ? "#f59e0b"
                          : "#10b981",
                }}
              >
                <i className="fa-solid fa-chart-line" />
                {item.units_available === 0
                  ? "Out of Stock"
                  : item.units_available < 10
                    ? "Critical"
                    : item.units_available < 20
                      ? "Low"
                      : "Normal"}
              </span>
            </div>
          </div>

          <div className="abb-view__grid">
            <div className="abb-view__item">
              <div className="abb-view__item-label">Contact Number</div>
              <button
                className="abb-view__item-value abb-view__item-value--clickable"
                onClick={handleCall}
              >
                <i className="fa-solid fa-phone" />
                {item.contact_number}
              </button>
            </div>

            <div className="abb-view__item">
              <div className="abb-view__item-label">Address</div>
              <div className="abb-view__item-value">
                <i className="fa-solid fa-location-dot" />
                {item.address}
              </div>
            </div>

            <div className="abb-view__item">
              <div className="abb-view__item-label">Coordinates</div>
              <div className="abb-view__item-value">
                <i className="fa-solid fa-map-pin" />
                {item.latitude}, {item.longitude}
              </div>
            </div>

            <div className="abb-view__item">
              <div className="abb-view__item-label">Last Updated</div>
              <div className="abb-view__item-value">
                <i className="fa-regular fa-clock" />
                {new Date(item.updated_at).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="abb-view__actions">
            <button
              className="abb-btn abb-btn--primary"
              onClick={handleDirections}
            >
              <i className="fa-solid fa-location-arrow" />
              Get Directions
            </button>
            <button className="abb-btn abb-btn--secondary" onClick={handleCall}>
              <i className="fa-solid fa-phone" />
              Call Now
            </button>
          </div>

          {item.created_at && (
            <div className="abb-view__footer">
              <small>
                <i className="fa-regular fa-calendar" />
                Added on {new Date(item.created_at).toLocaleDateString()}
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminBloodBank() {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({
    total_locations: 0,
    total_units: 0,
    by_blood_type: {},
    by_location: {},
    low_stock: 0,
    critical_stock: 0,
    out_of_stock: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bloodTypeFilter, setBloodTypeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [locations, setLocations] = useState([]);
  const [showBloodTypeDropdown, setShowBloodTypeDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (search) filters.location = search;
      if (bloodTypeFilter) filters.blood_type = bloodTypeFilter;
      if (locationFilter) filters.location = locationFilter;

      const response = await getBloodInventory(filters);
      setInventory(response.data);
      setStats(response.stats);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [search, bloodTypeFilter, locationFilter]);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await getLocations();
      setLocations(response.data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchLocations();
  }, [fetchInventory, fetchLocations]);

  const handleCreate = () => {
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this inventory item?")
    ) {
      return;
    }

    try {
      await deleteInventoryItem(id);
      showToast("Inventory item deleted successfully");
      fetchInventory();
      fetchLocations();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleModalSuccess = (message) => {
    showToast(message);
    fetchInventory();
    fetchLocations();
  };

  const clearSearch = () => {
    setSearch("");
  };

  const clearFilters = () => {
    setBloodTypeFilter("");
    setLocationFilter("");
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (bloodTypeFilter) count++;
    if (locationFilter) count++;
    return count;
  };

  const totalUnitsByType = (bloodType) => {
    return inventory
      .filter((item) => item.blood_type === bloodType)
      .reduce((sum, item) => sum + item.units_available, 0);
  };

  return (
    <div className="abb-root">
      {/* Header */}
      <div className="abb-header">
        <div className="abb-header__inner">
          <div>
            <div className="abb-header__eyebrow">
              <i className="fa-solid fa-droplet" />
              Blood Bank Management
            </div>
            <h1 className="abb-header__title">Blood Inventory</h1>
            <p className="abb-header__subtitle">
              Manage blood inventory across all locations
            </p>
          </div>

          <div className="abb-header__stats">
            <div className="abb-header__stat">
              <div className="abb-header__stat-num">
                {stats.total_locations}
              </div>
              <div className="abb-header__stat-label">Locations</div>
            </div>
            <div className="abb-header__stat">
              <div className="abb-header__stat-num">{stats.total_units}</div>
              <div className="abb-header__stat-label">Total Units</div>
            </div>
            <div className="abb-header__stat">
              <div className="abb-header__stat-num">{stats.low_stock}</div>
              <div className="abb-header__stat-label">Low Stock</div>
            </div>
            <div className="abb-header__stat">
              <div className="abb-header__stat-num">{stats.critical_stock}</div>
              <div className="abb-header__stat-label">Critical</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="abb-body">
        {/* Stats Cards */}
        <div className="abb-cards">
          {BLOOD_TYPES.map((type) => {
            const units = stats.by_blood_type[type.value]?.units || 0;
            const locations = stats.by_blood_type[type.value]?.locations || 0;

            return (
              <div key={type.value} className="abb-card">
                <div
                  className="abb-card__icon"
                  style={{ background: `${type.color}15` }}
                >
                  <i
                    className="fa-solid fa-droplet"
                    style={{ color: type.color }}
                  />
                </div>
                <div>
                  <div className="abb-card__num">{units}</div>
                  <div className="abb-card__label">Type {type.value}</div>
                  <div className="abb-card__sub">{locations} locations</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="abb-toolbar">
          <div className="abb-toolbar__search">
            <i className="fa-solid fa-magnifying-glass abb-toolbar__search-icon" />
            <input
              type="text"
              className="abb-toolbar__search-input"
              placeholder="Search by location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="abb-toolbar__search-clear"
                onClick={clearSearch}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          <div className="abb-toolbar__filters">
            {/* Blood Type Filter Dropdown */}
            <div className="abb-toolbar__filter-dropdown">
              <button
                className="abb-toolbar__filter-dropdown-btn"
                onClick={() => setShowBloodTypeDropdown(!showBloodTypeDropdown)}
              >
                <i className="fa-solid fa-droplet" />
                {bloodTypeFilter
                  ? `Type ${bloodTypeFilter}`
                  : "All Blood Types"}
                <i className="fa-solid fa-chevron-down" />
              </button>
              {showBloodTypeDropdown && (
                <div className="abb-toolbar__filter-dropdown-menu">
                  <button
                    onClick={() => {
                      setBloodTypeFilter("");
                      setShowBloodTypeDropdown(false);
                    }}
                    className={!bloodTypeFilter ? "active" : ""}
                  >
                    All Blood Types
                  </button>
                  {BLOOD_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setBloodTypeFilter(type.value);
                        setShowBloodTypeDropdown(false);
                      }}
                      className={bloodTypeFilter === type.value ? "active" : ""}
                    >
                      <i
                        className="fa-solid fa-droplet"
                        style={{ color: type.color }}
                      />
                      Type {type.value}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Location Filter Dropdown */}
            {locations.length > 0 && (
              <div className="abb-toolbar__filter-dropdown">
                <button
                  className="abb-toolbar__filter-dropdown-btn"
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                >
                  <i className="fa-solid fa-hospital" />
                  {locationFilter || "All Locations"}
                  <i className="fa-solid fa-chevron-down" />
                </button>
                {showLocationDropdown && (
                  <div className="abb-toolbar__filter-dropdown-menu">
                    <button
                      onClick={() => {
                        setLocationFilter("");
                        setShowLocationDropdown(false);
                      }}
                      className={!locationFilter ? "active" : ""}
                    >
                      All Locations
                    </button>
                    {locations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => {
                          setLocationFilter(loc);
                          setShowLocationDropdown(false);
                        }}
                        className={locationFilter === loc ? "active" : ""}
                      >
                        <i className="fa-solid fa-hospital" />
                        {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {getActiveFilterCount() > 0 && (
              <button
                className="abb-toolbar__filter-btn"
                onClick={clearFilters}
              >
                <i className="fa-solid fa-xmark" />
                Clear Filters ({getActiveFilterCount()})
              </button>
            )}
          </div>

          <button className="abb-toolbar__create-btn" onClick={handleCreate}>
            <i className="fa-solid fa-plus" />
            Add Inventory
          </button>
        </div>

        {/* Table */}
        <div className="abb-table-panel">
          <div className="abb-table-panel__head">
            <div className="abb-table-panel__title">
              <i className="fa-solid fa-droplet" />
              Blood Inventory List
            </div>
            <span className="abb-table-panel__count">
              {inventory.length} {inventory.length === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="abb-table-panel__scroll">
            <table className="abb-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Blood Type</th>
                  <th>Units</th>
                  <th>Status</th>
                  <th>Contact</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="abb-table__loading">
                      <i className="fa-solid fa-spinner fa-spin" />
                      <p>Loading inventory...</p>
                    </td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="abb-table__empty">
                      <i className="fa-regular fa-face-frown" />
                      <p>No inventory items found</p>
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => {
                    const bloodTypeColor = getBloodTypeColor(item.blood_type);
                    const stockStatus = getStockStatus(item.units_available);

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="abb-location-cell">
                            <div className="abb-location-cell__name">
                              {item.location_name}
                            </div>
                            <div className="abb-location-cell__address">
                              {item.address.substring(0, 50)}
                              {item.address.length > 50 ? "..." : ""}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className="abb-badge"
                            style={{
                              background: `${bloodTypeColor}15`,
                              color: bloodTypeColor,
                              border: `1px solid ${bloodTypeColor}33`,
                            }}
                          >
                            <i className="fa-solid fa-droplet" />
                            {item.blood_type}
                          </span>
                        </td>
                        <td>
                          <span className="abb-units">
                            {item.units_available}
                          </span>
                        </td>
                        <td>
                          <span
                            className="abb-badge"
                            style={{
                              background: `${stockStatus.color}15`,
                              color: stockStatus.color,
                              border: `1px solid ${stockStatus.color}33`,
                            }}
                          >
                            <i className="fa-solid fa-chart-line" />
                            {item.units_available === 0
                              ? "Out"
                              : stockStatus.label}
                          </span>
                        </td>
                        <td>
                          <div className="abb-contact">
                            <div className="abb-contact__phone">
                              <i className="fa-solid fa-phone" />
                              {item.contact_number}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="abb-date">
                            {new Date(item.updated_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div className="abb-actions">
                            <button
                              className="abb-action-btn abb-action-btn--view"
                              onClick={() => handleView(item)}
                              title="View Details"
                            >
                              <i className="fa-solid fa-eye" />
                            </button>
                            <button
                              className="abb-action-btn abb-action-btn--edit"
                              onClick={() => handleEdit(item)}
                              title="Edit Item"
                            >
                              <i className="fa-solid fa-pen" />
                            </button>
                            <button
                              className="abb-action-btn abb-action-btn--delete"
                              onClick={() => handleDelete(item.id)}
                              title="Delete Item"
                            >
                              <i className="fa-solid fa-trash" />
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
      </div>

      {/* Modals */}
      {showModal && (
        <InventoryModal
          item={selectedItem}
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {showViewModal && (
        <ViewModal
          item={selectedItem}
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
