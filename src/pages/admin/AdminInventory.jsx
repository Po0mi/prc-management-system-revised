// AdminInventory.jsx
// Path: src/pages/AdminInventory/AdminInventory.jsx

import { useState, useEffect, useCallback } from "react";
import "./AdminInventory.scss";
import {
  getCategories,
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleMaintenance,
  addMaintenanceRecord,
  deleteMaintenanceRecord,
  SERVICE_AREAS,
  VEHICLE_STATUS,
  VEHICLE_FUEL_TYPES,
  MAINTENANCE_TYPES,
  INVENTORY_UNITS,
  getServiceAreaColor,
  getVehicleStatusColor,
  getMaintenanceTypeColor,
  getStockStatus,
  formatCurrency,
} from "../../services/inventoryApi";

// ─── TOAST COMPONENT ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`ai-toast ai-toast--${type}`} onClick={onClose}>
      <div className="ai-toast__icon">
        <i
          className={`fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`}
        />
      </div>
      <div className="ai-toast__content">
        <div className="ai-toast__title">
          {type === "success" ? "Success" : "Error"}
        </div>
        <div className="ai-toast__message">{message}</div>
      </div>
      <button className="ai-toast__close" onClick={onClose}>
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}

// ─── INVENTORY ITEM MODAL ─────────────────────────────────────────────────────
function InventoryItemModal({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    item_code: "",
    item_name: "",
    description: "",
    category_id: "",
    current_stock: "",
    minimum_stock: "",
    unit: "pcs",
    location: "Central Storage",
    service_area: "health",
    unit_cost: "",
    expiry_date: "",
    batch_number: "",
  });
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        item_code: item.item_code || "",
        item_name: item.item_name || "",
        description: item.description || "",
        category_id: item.category_id || "",
        current_stock: item.current_stock || "",
        minimum_stock: item.minimum_stock || "",
        unit: item.unit || "pcs",
        location: item.location || "Central Storage",
        service_area: item.service_area || "health",
        unit_cost: item.unit_cost || "",
        expiry_date: item.expiry_date || "",
        batch_number: item.batch_number || "",
      });
    }
  }, [item]);

  const fetchCategories = async () => {
    try {
      const response = await getCategories("inventory");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.item_code.trim()) {
      newErrors.item_code = "Item code is required";
    }

    if (!formData.item_name.trim()) {
      newErrors.item_name = "Item name is required";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Category is required";
    }

    if (formData.current_stock === "" || formData.current_stock < 0) {
      newErrors.current_stock = "Current stock must be a positive number";
    }

    if (formData.minimum_stock && formData.minimum_stock < 0) {
      newErrors.minimum_stock = "Minimum stock must be a positive number";
    }

    if (!formData.unit) {
      newErrors.unit = "Unit is required";
    }

    if (!formData.service_area) {
      newErrors.service_area = "Service area is required";
    }

    if (formData.unit_cost && formData.unit_cost < 0) {
      newErrors.unit_cost = "Unit cost must be a positive number";
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
        current_stock: parseInt(formData.current_stock) || 0,
        minimum_stock: parseInt(formData.minimum_stock) || 0,
        unit_cost: parseFloat(formData.unit_cost) || 0,
      };

      if (item) {
        await updateInventoryItem(item.item_id, payload);
        onSuccess("Inventory item updated successfully");
      } else {
        await createInventoryItem(payload);
        onSuccess("Inventory item created successfully");
      }
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ai-overlay" onClick={onClose}>
      <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal__header">
          <div className="ai-modal__title">
            <i
              className={`fa-solid ${item ? "fa-pen-to-square" : "fa-plus-circle"}`}
            />
            {item ? "Edit Inventory Item" : "Add Inventory Item"}
          </div>
          <button className="ai-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form className="ai-modal__body" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="ai-form__error-banner">
              <i className="fa-solid fa-circle-exclamation" />
              {errors.submit}
            </div>
          )}

          <div className="ai-form__row">
            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-barcode" />
                Item Code <span className="ai-form__required">*</span>
              </label>
              <input
                type="text"
                name="item_code"
                value={formData.item_code}
                onChange={handleChange}
                disabled={!!item}
                className={`ai-form__input ${errors.item_code ? "ai-form__input--error" : ""}`}
                placeholder="e.g., HEA0001"
              />
              {errors.item_code && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.item_code}
                </span>
              )}
            </div>

            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-tag" />
                Item Name <span className="ai-form__required">*</span>
              </label>
              <input
                type="text"
                name="item_name"
                value={formData.item_name}
                onChange={handleChange}
                className={`ai-form__input ${errors.item_name ? "ai-form__input--error" : ""}`}
                placeholder="Enter item name"
              />
              {errors.item_name && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.item_name}
                </span>
              )}
            </div>
          </div>

          <div className="ai-form__field">
            <label className="ai-form__label">
              <i className="fa-regular fa-file-lines" />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="ai-form__textarea"
              placeholder="Enter item description..."
              rows="3"
            />
          </div>

          <div className="ai-form__row">
            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-layer-group" />
                Category <span className="ai-form__required">*</span>
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className={`ai-form__select ${errors.category_id ? "ai-form__input--error" : ""}`}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.category_id}
                </span>
              )}
            </div>

            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-scale-balanced" />
                Unit <span className="ai-form__required">*</span>
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className={`ai-form__select ${errors.unit ? "ai-form__input--error" : ""}`}
              >
                {INVENTORY_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
              {errors.unit && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.unit}
                </span>
              )}
            </div>
          </div>

          <div className="ai-form__row">
            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-boxes" />
                Current Stock <span className="ai-form__required">*</span>
              </label>
              <input
                type="number"
                name="current_stock"
                value={formData.current_stock}
                onChange={handleChange}
                min="0"
                className={`ai-form__input ${errors.current_stock ? "ai-form__input--error" : ""}`}
                placeholder="0"
              />
              {errors.current_stock && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.current_stock}
                </span>
              )}
            </div>

            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-triangle-exclamation" />
                Minimum Stock
              </label>
              <input
                type="number"
                name="minimum_stock"
                value={formData.minimum_stock}
                onChange={handleChange}
                min="0"
                className={`ai-form__input ${errors.minimum_stock ? "ai-form__input--error" : ""}`}
                placeholder="0"
              />
              {errors.minimum_stock && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.minimum_stock}
                </span>
              )}
            </div>
          </div>

          <div className="ai-form__row">
            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-money-bill" />
                Unit Cost
              </label>
              <input
                type="number"
                name="unit_cost"
                value={formData.unit_cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`ai-form__input ${errors.unit_cost ? "ai-form__input--error" : ""}`}
                placeholder="0.00"
              />
              {errors.unit_cost && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.unit_cost}
                </span>
              )}
            </div>

            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-calendar" />
                Expiry Date
              </label>
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                className="ai-form__input"
              />
            </div>
          </div>

          <div className="ai-form__row">
            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-hashtag" />
                Batch Number
              </label>
              <input
                type="text"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleChange}
                className="ai-form__input"
                placeholder="Enter batch number"
              />
            </div>

            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-location-dot" />
                Storage Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="ai-form__input"
                placeholder="e.g., Warehouse A"
              />
            </div>
          </div>

          <div className="ai-form__field">
            <label className="ai-form__label">
              <i className="fa-solid fa-bullseye" />
              Service Area <span className="ai-form__required">*</span>
            </label>
            <select
              name="service_area"
              value={formData.service_area}
              onChange={handleChange}
              className={`ai-form__select ${errors.service_area ? "ai-form__input--error" : ""}`}
            >
              {SERVICE_AREAS.map((area) => (
                <option key={area.value} value={area.value}>
                  {area.label}
                </option>
              ))}
            </select>
            {errors.service_area && (
              <span className="ai-form__error-text">
                <i className="fa-solid fa-circle-exclamation" />
                {errors.service_area}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="ai-form__submit"
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

// ─── VEHICLE MODAL ────────────────────────────────────────────────────────────
function VehicleModal({ vehicle, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    vehicle_code: "",
    vehicle_name: "",
    category_id: "",
    vehicle_type: "",
    plate_number: "",
    model: "",
    year: new Date().getFullYear(),
    fuel_type: "diesel",
    service_area: "health",
    branch_name: "",
    location: "",
    current_mileage: "",
    maintenance_interval: 5000,
  });
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicle_code: vehicle.vehicle_code || "",
        vehicle_name: vehicle.vehicle_name || "",
        category_id: vehicle.category_id || "",
        vehicle_type: vehicle.vehicle_type || "",
        plate_number: vehicle.plate_number || "",
        model: vehicle.model || "",
        year: vehicle.year || new Date().getFullYear(),
        fuel_type: vehicle.fuel_type || "diesel",
        service_area: vehicle.service_area || "health",
        branch_name: vehicle.branch_name || "",
        location: vehicle.location || "",
        current_mileage: vehicle.current_mileage || "",
        maintenance_interval: vehicle.maintenance_interval || 5000,
      });
    }
  }, [vehicle]);

  const fetchCategories = async () => {
    try {
      const response = await getCategories("vehicle");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.vehicle_code.trim()) {
      newErrors.vehicle_code = "Vehicle code is required";
    }

    if (!formData.vehicle_name.trim()) {
      newErrors.vehicle_name = "Vehicle name is required";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Category is required";
    }

    if (!formData.plate_number.trim()) {
      newErrors.plate_number = "Plate number is required";
    }

    if (!formData.model.trim()) {
      newErrors.model = "Model is required";
    }

    if (!formData.year) {
      newErrors.year = "Year is required";
    } else if (
      formData.year < 1900 ||
      formData.year > new Date().getFullYear() + 1
    ) {
      newErrors.year = "Invalid year";
    }

    if (!formData.fuel_type) {
      newErrors.fuel_type = "Fuel type is required";
    }

    if (!formData.service_area) {
      newErrors.service_area = "Service area is required";
    }

    if (formData.current_mileage && formData.current_mileage < 0) {
      newErrors.current_mileage = "Mileage must be a positive number";
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
        year: parseInt(formData.year),
        current_mileage: parseInt(formData.current_mileage) || 0,
        maintenance_interval: parseInt(formData.maintenance_interval) || 5000,
      };

      if (vehicle) {
        await updateVehicle(vehicle.vehicle_id, payload);
        onSuccess("Vehicle updated successfully");
      } else {
        await createVehicle(payload);
        onSuccess("Vehicle created successfully");
      }
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ai-overlay" onClick={onClose}>
      <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal__header">
          <div className="ai-modal__title">
            <i
              className={`fa-solid ${vehicle ? "fa-pen-to-square" : "fa-plus-circle"}`}
            />
            {vehicle ? "Edit Vehicle" : "Add Vehicle"}
          </div>
          <button className="ai-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form className="ai-modal__body" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="ai-form__error-banner">
              <i className="fa-solid fa-circle-exclamation" />
              {errors.submit}
            </div>
          )}

          <div className="ai-form__row">
            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-barcode" />
                Vehicle Code <span className="ai-form__required">*</span>
              </label>
              <input
                type="text"
                name="vehicle_code"
                value={formData.vehicle_code}
                onChange={handleChange}
                disabled={!!vehicle}
                className={`ai-form__input ${errors.vehicle_code ? "ai-form__input--error" : ""}`}
                placeholder="e.g., AMB001"
              />
              {errors.vehicle_code && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.vehicle_code}
                </span>
              )}
            </div>

            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-tag" />
                Vehicle Name <span className="ai-form__required">*</span>
              </label>
              <input
                type="text"
                name="vehicle_name"
                value={formData.vehicle_name}
                onChange={handleChange}
                className={`ai-form__input ${errors.vehicle_name ? "ai-form__input--error" : ""}`}
                placeholder="e.g., Ambulance Unit 1"
              />
              {errors.vehicle_name && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.vehicle_name}
                </span>
              )}
            </div>
          </div>

          <div className="ai-form__row">
            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-layer-group" />
                Category <span className="ai-form__required">*</span>
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className={`ai-form__select ${errors.category_id ? "ai-form__input--error" : ""}`}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.category_id}
                </span>
              )}
            </div>

            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-truck" />
                Vehicle Type
              </label>
              <input
                type="text"
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleChange}
                className="ai-form__input"
                placeholder="e.g., Ambulance, Fire Truck"
              />
            </div>
          </div>

          <div className="ai-form__row">
            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-id-card" />
                Plate Number <span className="ai-form__required">*</span>
              </label>
              <input
                type="text"
                name="plate_number"
                value={formData.plate_number}
                onChange={handleChange}
                className={`ai-form__input ${errors.plate_number ? "ai-form__input--error" : ""}`}
                placeholder="e.g., PRC-001"
              />
              {errors.plate_number && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.plate_number}
                </span>
              )}
            </div>

            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-car" />
                Model <span className="ai-form__required">*</span>
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className={`ai-form__input ${errors.model ? "ai-form__input--error" : ""}`}
                placeholder="e.g., Toyota Hiace"
              />
              {errors.model && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.model}
                </span>
              )}
            </div>
          </div>

          <div className="ai-form__row">
            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-calendar" />
                Year <span className="ai-form__required">*</span>
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className={`ai-form__input ${errors.year ? "ai-form__input--error" : ""}`}
                placeholder="2024"
              />
              {errors.year && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.year}
                </span>
              )}
            </div>

            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-gas-pump" />
                Fuel Type <span className="ai-form__required">*</span>
              </label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleChange}
                className={`ai-form__select ${errors.fuel_type ? "ai-form__input--error" : ""}`}
              >
                {VEHICLE_FUEL_TYPES.map((fuel) => (
                  <option key={fuel.value} value={fuel.value}>
                    {fuel.label}
                  </option>
                ))}
              </select>
              {errors.fuel_type && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.fuel_type}
                </span>
              )}
            </div>
          </div>

          <div className="ai-form__row">
            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-gauge" />
                Current Mileage (km)
              </label>
              <input
                type="number"
                name="current_mileage"
                value={formData.current_mileage}
                onChange={handleChange}
                min="0"
                className={`ai-form__input ${errors.current_mileage ? "ai-form__input--error" : ""}`}
                placeholder="0"
              />
              {errors.current_mileage && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.current_mileage}
                </span>
              )}
            </div>

            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-calendar-check" />
                Maintenance Interval (km)
              </label>
              <input
                type="number"
                name="maintenance_interval"
                value={formData.maintenance_interval}
                onChange={handleChange}
                min="0"
                className="ai-form__input"
                placeholder="5000"
              />
            </div>
          </div>

          <div className="ai-form__row">
            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-building" />
                Branch Name
              </label>
              <input
                type="text"
                name="branch_name"
                value={formData.branch_name}
                onChange={handleChange}
                className="ai-form__input"
                placeholder="e.g., Central Branch"
              />
            </div>

            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-location-dot" />
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="ai-form__input"
                placeholder="e.g., Garage A"
              />
            </div>
          </div>

          <div className="ai-form__field">
            <label className="ai-form__label">
              <i className="fa-solid fa-bullseye" />
              Service Area <span className="ai-form__required">*</span>
            </label>
            <select
              name="service_area"
              value={formData.service_area}
              onChange={handleChange}
              className={`ai-form__select ${errors.service_area ? "ai-form__input--error" : ""}`}
            >
              {SERVICE_AREAS.map((area) => (
                <option key={area.value} value={area.value}>
                  {area.label}
                </option>
              ))}
            </select>
            {errors.service_area && (
              <span className="ai-form__error-text">
                <i className="fa-solid fa-circle-exclamation" />
                {errors.service_area}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="ai-form__submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                {vehicle ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <i
                  className={`fa-solid ${vehicle ? "fa-pen-to-square" : "fa-plus"}`}
                />
                {vehicle ? "Update Vehicle" : "Create Vehicle"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── MAINTENANCE MODAL ────────────────────────────────────────────────────────
function MaintenanceModal({ vehicle, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    vehicle_id: vehicle?.vehicle_id || "",
    maintenance_type: "routine",
    description: "",
    cost: "",
    maintenance_date: new Date().toISOString().split("T")[0],
    next_maintenance_date: "",
    service_provider: "",
    mileage_at_service: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.maintenance_type) {
      newErrors.maintenance_type = "Maintenance type is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.maintenance_date) {
      newErrors.maintenance_date = "Maintenance date is required";
    }

    if (formData.cost && formData.cost < 0) {
      newErrors.cost = "Cost must be a positive number";
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
        cost: parseFloat(formData.cost) || 0,
        mileage_at_service: parseInt(formData.mileage_at_service) || null,
      };

      await addMaintenanceRecord(payload);
      onSuccess("Maintenance record added successfully");
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ai-overlay" onClick={onClose}>
      <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal__header">
          <div className="ai-modal__title">
            <i className="fa-solid fa-wrench" />
            Add Maintenance - {vehicle?.vehicle_name}
          </div>
          <button className="ai-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form className="ai-modal__body" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="ai-form__error-banner">
              <i className="fa-solid fa-circle-exclamation" />
              {errors.submit}
            </div>
          )}

          <div className="ai-form__row">
            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-tools" />
                Maintenance Type <span className="ai-form__required">*</span>
              </label>
              <select
                name="maintenance_type"
                value={formData.maintenance_type}
                onChange={handleChange}
                className={`ai-form__select ${errors.maintenance_type ? "ai-form__input--error" : ""}`}
              >
                {MAINTENANCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.maintenance_type && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.maintenance_type}
                </span>
              )}
            </div>

            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-money-bill" />
                Cost
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`ai-form__input ${errors.cost ? "ai-form__input--error" : ""}`}
                placeholder="0.00"
              />
              {errors.cost && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.cost}
                </span>
              )}
            </div>
          </div>

          <div className="ai-form__field">
            <label className="ai-form__label">
              <i className="fa-regular fa-file-lines" />
              Description <span className="ai-form__required">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`ai-form__textarea ${errors.description ? "ai-form__input--error" : ""}`}
              placeholder="Describe the maintenance work..."
              rows="3"
            />
            {errors.description && (
              <span className="ai-form__error-text">
                <i className="fa-solid fa-circle-exclamation" />
                {errors.description}
              </span>
            )}
          </div>

          <div className="ai-form__row">
            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-regular fa-calendar" />
                Maintenance Date <span className="ai-form__required">*</span>
              </label>
              <input
                type="date"
                name="maintenance_date"
                value={formData.maintenance_date}
                onChange={handleChange}
                className={`ai-form__input ${errors.maintenance_date ? "ai-form__input--error" : ""}`}
              />
              {errors.maintenance_date && (
                <span className="ai-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.maintenance_date}
                </span>
              )}
            </div>

            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-regular fa-calendar-check" />
                Next Maintenance Date
              </label>
              <input
                type="date"
                name="next_maintenance_date"
                value={formData.next_maintenance_date}
                onChange={handleChange}
                className="ai-form__input"
              />
            </div>
          </div>

          <div className="ai-form__row">
            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-gauge" />
                Mileage at Service
              </label>
              <input
                type="number"
                name="mileage_at_service"
                value={formData.mileage_at_service}
                onChange={handleChange}
                min="0"
                className="ai-form__input"
                placeholder="0 km"
              />
            </div>

            <div className="ai-form__field">
              <label className="ai-form__label">
                <i className="fa-solid fa-building" />
                Service Provider
              </label>
              <input
                type="text"
                name="service_provider"
                value={formData.service_provider}
                onChange={handleChange}
                className="ai-form__input"
                placeholder="e.g., Auto Shop"
              />
            </div>
          </div>

          <div className="ai-form__field">
            <label className="ai-form__label">
              <i className="fa-regular fa-note-sticky" />
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="ai-form__textarea"
              placeholder="Additional notes..."
              rows="2"
            />
          </div>

          <button
            type="submit"
            className="ai-form__submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                Adding...
              </>
            ) : (
              <>
                <i className="fa-solid fa-plus" />
                Add Maintenance Record
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── VIEW MODAL ───────────────────────────────────────────────────────────────
function ViewModal({ type, data, onClose, onAddMaintenance, onEdit }) {
  if (!data) return null;

  const getServiceAreaColor = (area) => {
    const option = SERVICE_AREAS.find((a) => a.value === area);
    return option ? option.color : "#6b7280";
  };

  const renderInventoryDetails = () => {
    const stockStatus = getStockStatus(data.current_stock, data.minimum_stock);
    const serviceAreaColor = getServiceAreaColor(data.service_area);

    return (
      <>
        <div className="ai-view__section">
          <h3 className="ai-view__section-title">
            <i
              className="fa-solid fa-box"
              style={{ color: serviceAreaColor }}
            />
            {data.item_name}
          </h3>
          <div className="ai-view__badges">
            <span
              className="ai-view__badge"
              style={{
                background: `${serviceAreaColor}12`,
                color: serviceAreaColor,
                border: `1px solid ${serviceAreaColor}25`,
              }}
            >
              <i className="fa-solid fa-bullseye" />
              {SERVICE_AREAS.find((a) => a.value === data.service_area)?.label}
            </span>
            <span
              className="ai-view__badge"
              style={{
                background: `${stockStatus.color}12`,
                color: stockStatus.color,
                border: `1px solid ${stockStatus.color}25`,
              }}
            >
              <i className="fa-solid fa-chart-line" />
              {stockStatus.label}
            </span>
          </div>
        </div>

        <div className="ai-view__grid">
          <div className="ai-view__item">
            <div className="ai-view__item-label">Item Code</div>
            <div className="ai-view__item-value">
              <i className="fa-solid fa-barcode" />
              {data.item_code}
            </div>
          </div>
          <div className="ai-view__item">
            <div className="ai-view__item-label">Category</div>
            <div className="ai-view__item-value">{data.category_name}</div>
          </div>
          <div className="ai-view__item">
            <div className="ai-view__item-label">Current Stock</div>
            <div className="ai-view__item-value ai-view__item-value--stock">
              <i className="fa-solid fa-boxes" />
              {data.current_stock} {data.unit}
            </div>
          </div>
          <div className="ai-view__item">
            <div className="ai-view__item-label">Minimum Stock</div>
            <div className="ai-view__item-value">
              <i className="fa-solid fa-triangle-exclamation" />
              {data.minimum_stock} {data.unit}
            </div>
          </div>
          <div className="ai-view__item">
            <div className="ai-view__item-label">Unit Cost</div>
            <div className="ai-view__item-value ai-view__item-value--price">
              <i className="fa-solid fa-money-bill" />
              {formatCurrency(data.unit_cost)}
            </div>
          </div>
          <div className="ai-view__item">
            <div className="ai-view__item-label">Total Value</div>
            <div className="ai-view__item-value ai-view__item-value--price">
              <i className="fa-solid fa-calculator" />
              {formatCurrency(data.total_value)}
            </div>
          </div>
          <div className="ai-view__item">
            <div className="ai-view__item-label">Location</div>
            <div className="ai-view__item-value">
              <i className="fa-solid fa-location-dot" />
              {data.location}
            </div>
          </div>
          {data.expiry_date && (
            <div className="ai-view__item">
              <div className="ai-view__item-label">Expiry Date</div>
              <div className="ai-view__item-value">
                <i className="fa-regular fa-calendar" />
                {new Date(data.expiry_date).toLocaleDateString()}
              </div>
            </div>
          )}
          {data.batch_number && (
            <div className="ai-view__item">
              <div className="ai-view__item-label">Batch Number</div>
              <div className="ai-view__item-value">
                <i className="fa-solid fa-hashtag" />
                {data.batch_number}
              </div>
            </div>
          )}
        </div>

        {data.description && (
          <div className="ai-view__section">
            <h3 className="ai-view__section-title">
              <i className="fa-regular fa-file-lines" />
              Description
            </h3>
            <div className="ai-view__content">{data.description}</div>
          </div>
        )}
      </>
    );
  };

  const renderVehicleDetails = () => {
    const statusColor = getVehicleStatusColor(data.status);
    const serviceAreaColor = getServiceAreaColor(data.service_area);
    const maintenanceDue =
      data.next_maintenance_date &&
      new Date(data.next_maintenance_date) <=
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return (
      <>
        <div className="ai-view__section">
          <h3 className="ai-view__section-title">
            <i
              className="fa-solid fa-truck"
              style={{ color: serviceAreaColor }}
            />
            {data.vehicle_name}
          </h3>
          <div className="ai-view__badges">
            <span
              className="ai-view__badge"
              style={{
                background: `${serviceAreaColor}12`,
                color: serviceAreaColor,
                border: `1px solid ${serviceAreaColor}25`,
              }}
            >
              <i className="fa-solid fa-bullseye" />
              {SERVICE_AREAS.find((a) => a.value === data.service_area)?.label}
            </span>
            <span
              className="ai-view__badge"
              style={{
                background: `${statusColor}12`,
                color: statusColor,
                border: `1px solid ${statusColor}25`,
              }}
            >
              <i className="fa-solid fa-flag" />
              {VEHICLE_STATUS.find((s) => s.value === data.status)?.label}
            </span>
            {maintenanceDue && (
              <span
                className="ai-view__badge"
                style={{
                  background: "#f59e0b12",
                  color: "#f59e0b",
                  border: "1px solid #f59e0b25",
                }}
              >
                <i className="fa-solid fa-calendar-check" />
                Maintenance Due
              </span>
            )}
          </div>
        </div>

        <div className="ai-view__grid">
          <div className="ai-view__item">
            <div className="ai-view__item-label">Vehicle Code</div>
            <div className="ai-view__item-value">
              <i className="fa-solid fa-barcode" />
              {data.vehicle_code}
            </div>
          </div>
          <div className="ai-view__item">
            <div className="ai-view__item-label">Category</div>
            <div className="ai-view__item-value">{data.category_name}</div>
          </div>
          <div className="ai-view__item">
            <div className="ai-view__item-label">Plate Number</div>
            <div className="ai-view__item-value">
              <i className="fa-solid fa-id-card" />
              {data.plate_number}
            </div>
          </div>
          <div className="ai-view__item">
            <div className="ai-view__item-label">Model</div>
            <div className="ai-view__item-value">
              <i className="fa-solid fa-car" />
              {data.model}
            </div>
          </div>
          <div className="ai-view__item">
            <div className="ai-view__item-label">Year</div>
            <div className="ai-view__item-value">
              <i className="fa-solid fa-calendar" />
              {data.year}
            </div>
          </div>
          <div className="ai-view__item">
            <div className="ai-view__item-label">Fuel Type</div>
            <div className="ai-view__item-value">
              <i className="fa-solid fa-gas-pump" />
              {
                VEHICLE_FUEL_TYPES.find((f) => f.value === data.fuel_type)
                  ?.label
              }
            </div>
          </div>
          <div className="ai-view__item">
            <div className="ai-view__item-label">Current Mileage</div>
            <div className="ai-view__item-value">
              <i className="fa-solid fa-gauge" />
              {data.current_mileage} km
            </div>
          </div>
          <div className="ai-view__item">
            <div className="ai-view__item-label">Maintenance Interval</div>
            <div className="ai-view__item-value">
              <i className="fa-solid fa-calendar-check" />
              {data.maintenance_interval} km
            </div>
          </div>
          <div className="ai-view__item">
            <div className="ai-view__item-label">Last Maintenance</div>
            <div className="ai-view__item-value">
              <i className="fa-solid fa-wrench" />
              {data.last_maintenance_date
                ? new Date(data.last_maintenance_date).toLocaleDateString()
                : "None"}
            </div>
          </div>
          <div className="ai-view__item">
            <div className="ai-view__item-label">Next Maintenance</div>
            <div className="ai-view__item-value">
              <i className="fa-regular fa-calendar" />
              {data.next_maintenance_date
                ? new Date(data.next_maintenance_date).toLocaleDateString()
                : "Not scheduled"}
            </div>
          </div>
          {data.branch_name && (
            <div className="ai-view__item">
              <div className="ai-view__item-label">Branch</div>
              <div className="ai-view__item-value">
                <i className="fa-solid fa-building" />
                {data.branch_name}
              </div>
            </div>
          )}
          {data.location && (
            <div className="ai-view__item">
              <div className="ai-view__item-label">Location</div>
              <div className="ai-view__item-value">
                <i className="fa-solid fa-location-dot" />
                {data.location}
              </div>
            </div>
          )}
        </div>

        {/* Maintenance History */}
        {data.maintenance_history && data.maintenance_history.length > 0 && (
          <div className="ai-view__section">
            <h3 className="ai-view__section-title">
              <i className="fa-solid fa-history" />
              Maintenance History
            </h3>
            <div className="ai-maintenance-list">
              {data.maintenance_history.map((record) => {
                const typeColor = getMaintenanceTypeColor(
                  record.maintenance_type,
                );
                return (
                  <div
                    key={record.maintenance_id}
                    className="ai-maintenance-item"
                  >
                    <div className="ai-maintenance-item__header">
                      <span
                        className="ai-maintenance-item__type"
                        style={{
                          backgroundColor: `${typeColor}12`,
                          color: typeColor,
                          border: `1px solid ${typeColor}25`,
                        }}
                      >
                        <i className="fa-solid fa-tools" />
                        {
                          MAINTENANCE_TYPES.find(
                            (t) => t.value === record.maintenance_type,
                          )?.label
                        }
                      </span>
                      <span className="ai-maintenance-item__date">
                        <i className="fa-regular fa-calendar" />
                        {new Date(record.maintenance_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="ai-maintenance-item__description">
                      {record.description}
                    </p>
                    {record.cost > 0 && (
                      <div className="ai-maintenance-item__cost">
                        <i className="fa-solid fa-money-bill" />
                        Cost: {formatCurrency(record.cost)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="ai-view__actions">
          {type === "vehicle" && (
            <button
              className="ai-btn ai-btn--primary"
              onClick={() => onAddMaintenance(data)}
            >
              <i className="fa-solid fa-wrench" />
              Add Maintenance
            </button>
          )}
          <button
            className="ai-btn ai-btn--secondary"
            onClick={() => onEdit(data)}
          >
            <i className="fa-solid fa-pen" />
            Edit
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="ai-overlay" onClick={onClose}>
      <div
        className="ai-modal ai-modal--lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ai-modal__header">
          <div className="ai-modal__title">
            <i className="fa-solid fa-eye" />
            {type === "inventory"
              ? "Inventory Item Details"
              : "Vehicle Details"}
          </div>
          <button className="ai-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="ai-modal__body">
          {type === "inventory"
            ? renderInventoryDetails()
            : renderVehicleDetails()}

          {/* Created/Updated Info */}
          <div className="ai-view__footer">
            {data.created_by_name && (
              <small>
                <i className="fa-regular fa-user" />
                Created by {data.created_by_name} on{" "}
                {new Date(data.created_at).toLocaleString()}
              </small>
            )}
            {data.updated_at && data.updated_at !== data.created_at && (
              <small>
                <i className="fa-regular fa-clock" />
                Updated on {new Date(data.updated_at).toLocaleString()}
              </small>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminInventory() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [serviceAreaFilter, setServiceAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showServiceAreaDropdown, setShowServiceAreaDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [toast, setToast] = useState(null);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [maintenanceDueFilter, setMaintenanceDueFilter] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchCategories();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "inventory") {
      fetchInventoryItems();
    } else {
      fetchVehicles();
    }
  }, [
    activeTab,
    search,
    categoryFilter,
    serviceAreaFilter,
    statusFilter,
    lowStockFilter,
    maintenanceDueFilter,
  ]);

  const fetchCategories = async () => {
    try {
      const response = await getCategories(
        activeTab === "inventory" ? "inventory" : "vehicle",
      );
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchInventoryItems = async () => {
    setLoading(true);
    try {
      const filters = {
        search: search || undefined,
        category: categoryFilter || undefined,
        service_area: serviceAreaFilter || undefined,
        status: statusFilter || undefined,
        low_stock: lowStockFilter || undefined,
      };
      const response = await getInventoryItems(filters);
      setInventoryItems(response.data);
      setStats(response.stats);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const filters = {
        search: search || undefined,
        category: categoryFilter || undefined,
        service_area: serviceAreaFilter || undefined,
        status: statusFilter || undefined,
        maintenance_due: maintenanceDueFilter || undefined,
      };
      const response = await getVehicles(filters);
      setVehicles(response.data);
      setStats(response.stats);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddMaintenance = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowMaintenanceModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      if (activeTab === "inventory") {
        await deleteInventoryItem(id);
        showToast("Inventory item deleted successfully");
        fetchInventoryItems();
      } else {
        await deleteVehicle(id);
        showToast("Vehicle deleted successfully");
        fetchVehicles();
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleModalSuccess = (message) => {
    showToast(message);
    if (activeTab === "inventory") {
      fetchInventoryItems();
    } else {
      fetchVehicles();
    }
    fetchCategories();
  };

  const handleMaintenanceSuccess = (message) => {
    showToast(message);
    if (selectedVehicle) {
      getVehicle(selectedVehicle.vehicle_id).then((response) => {
        setSelectedItem(response.data);
      });
    }
    fetchVehicles();
  };

  const clearSearch = () => {
    setSearch("");
  };

  const clearFilters = () => {
    setCategoryFilter("");
    setServiceAreaFilter("");
    setStatusFilter("");
    setLowStockFilter(false);
    setMaintenanceDueFilter(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (categoryFilter) count++;
    if (serviceAreaFilter) count++;
    if (statusFilter) count++;
    if (lowStockFilter) count++;
    if (maintenanceDueFilter) count++;
    return count;
  };

  const getStockStatusBadge = (current, minimum) => {
    const status = getStockStatus(current, minimum);
    return (
      <span
        className="ai-badge"
        style={{
          backgroundColor: `${status.color}12`,
          color: status.color,
          border: `1px solid ${status.color}25`,
        }}
      >
        <i className="fa-solid fa-chart-line" />
        {status.label}
      </span>
    );
  };

  const getVehicleStatusBadge = (status) => {
    const option = VEHICLE_STATUS.find((s) => s.value === status);
    return (
      <span
        className="ai-badge"
        style={{
          backgroundColor: `${option?.color}12`,
          color: option?.color,
          border: `1px solid ${option?.color}25`,
        }}
      >
        <i className="fa-solid fa-flag" />
        {option?.label}
      </span>
    );
  };

  return (
    <div className="ai-root">
      {/* Header with Wave Effect */}
      <div className="ai-header">
        <div className="ai-header__container">
          <div className="ai-header__content">
            <div className="ai-header__left">
              <div className="ai-header__badge">
                <i className="fa-solid fa-warehouse" />
                Inventory Management
              </div>
              <h1 className="ai-header__title">Inventory & Vehicles</h1>
              <p className="ai-header__subtitle">
                Manage your inventory items and vehicle fleet
              </p>
            </div>

            <div className="ai-header__stats">
              {activeTab === "inventory" ? (
                <>
                  <div className="ai-header-stat">
                    <span className="ai-header-stat__value">
                      {stats.total_items || 0}
                    </span>
                    <span className="ai-header-stat__label">Total Items</span>
                  </div>
                  <div className="ai-header-stat">
                    <span className="ai-header-stat__value">
                      {stats.low_stock || 0}
                    </span>
                    <span className="ai-header-stat__label">Low Stock</span>
                  </div>
                  <div className="ai-header-stat">
                    <span className="ai-header-stat__value">
                      {stats.out_of_stock || 0}
                    </span>
                    <span className="ai-header-stat__label">Out of Stock</span>
                  </div>
                  <div className="ai-header-stat">
                    <span className="ai-header-stat__value">
                      {formatCurrency(stats.total_value || 0)}
                    </span>
                    <span className="ai-header-stat__label">Total Value</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="ai-header-stat">
                    <span className="ai-header-stat__value">
                      {stats.total_vehicles || 0}
                    </span>
                    <span className="ai-header-stat__label">
                      Total Vehicles
                    </span>
                  </div>
                  <div className="ai-header-stat">
                    <span className="ai-header-stat__value">
                      {stats.operational || 0}
                    </span>
                    <span className="ai-header-stat__label">Operational</span>
                  </div>
                  <div className="ai-header-stat">
                    <span className="ai-header-stat__value">
                      {stats.maintenance || 0}
                    </span>
                    <span className="ai-header-stat__label">
                      In Maintenance
                    </span>
                  </div>
                  <div className="ai-header-stat">
                    <span className="ai-header-stat__value">
                      {stats.maintenance_due || 0}
                    </span>
                    <span className="ai-header-stat__label">
                      Maintenance Due
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="ai-header__wave">
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

      {/* Body */}
      <div className="ai-body">
        {/* Tabs */}
        <div className="ai-tabs">
          <button
            className={`ai-tab ${activeTab === "inventory" ? "ai-tab--active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            <i className="fa-solid fa-boxes" />
            Inventory Items
          </button>
          <button
            className={`ai-tab ${activeTab === "vehicles" ? "ai-tab--active" : ""}`}
            onClick={() => setActiveTab("vehicles")}
          >
            <i className="fa-solid fa-truck" />
            Vehicles
          </button>
        </div>

        {/* Toolbar */}
        <div className="ai-toolbar">
          <div className="ai-toolbar__search">
            <i className="fa-solid fa-magnifying-glass ai-toolbar__search-icon" />
            <input
              type="text"
              className="ai-toolbar__search-input"
              placeholder={
                activeTab === "inventory"
                  ? "Search items..."
                  : "Search vehicles..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="ai-toolbar__search-clear"
                onClick={clearSearch}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          <div className="ai-toolbar__filters">
            {/* Category Filter Dropdown */}
            {categories.length > 0 && (
              <div className="ai-toolbar__filter-dropdown">
                <button
                  className={`ai-toolbar__filter-dropdown-btn ${categoryFilter ? "ai-toolbar__filter-dropdown-btn--active" : ""}`}
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <i className="fa-solid fa-layer-group" />
                  <span>
                    {categoryFilter
                      ? categories.find(
                          (c) => c.category_id.toString() === categoryFilter,
                        )?.category_name
                      : "All Categories"}
                  </span>
                  <i className="fa-solid fa-chevron-down" />
                </button>
                {showCategoryDropdown && (
                  <div className="ai-toolbar__filter-dropdown-menu">
                    <button
                      onClick={() => {
                        setCategoryFilter("");
                        setShowCategoryDropdown(false);
                      }}
                      className={!categoryFilter ? "active" : ""}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.category_id}
                        onClick={() => {
                          setCategoryFilter(cat.category_id.toString());
                          setShowCategoryDropdown(false);
                        }}
                        className={
                          categoryFilter === cat.category_id.toString()
                            ? "active"
                            : ""
                        }
                      >
                        {cat.category_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Service Area Filter Dropdown */}
            <div className="ai-toolbar__filter-dropdown">
              <button
                className={`ai-toolbar__filter-dropdown-btn ${serviceAreaFilter ? "ai-toolbar__filter-dropdown-btn--active" : ""}`}
                onClick={() =>
                  setShowServiceAreaDropdown(!showServiceAreaDropdown)
                }
              >
                <i className="fa-solid fa-bullseye" />
                <span>
                  {serviceAreaFilter
                    ? SERVICE_AREAS.find((a) => a.value === serviceAreaFilter)
                        ?.label
                    : "All Service Areas"}
                </span>
                <i className="fa-solid fa-chevron-down" />
              </button>
              {showServiceAreaDropdown && (
                <div className="ai-toolbar__filter-dropdown-menu">
                  <button
                    onClick={() => {
                      setServiceAreaFilter("");
                      setShowServiceAreaDropdown(false);
                    }}
                    className={!serviceAreaFilter ? "active" : ""}
                  >
                    All Service Areas
                  </button>
                  {SERVICE_AREAS.map((area) => (
                    <button
                      key={area.value}
                      onClick={() => {
                        setServiceAreaFilter(area.value);
                        setShowServiceAreaDropdown(false);
                      }}
                      className={
                        serviceAreaFilter === area.value ? "active" : ""
                      }
                    >
                      <i
                        className="fa-solid fa-circle"
                        style={{ color: area.color }}
                      />
                      {area.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter Dropdown */}
            {activeTab === "inventory" ? (
              <div className="ai-toolbar__filter-dropdown">
                <button
                  className={`ai-toolbar__filter-dropdown-btn ${statusFilter ? "ai-toolbar__filter-dropdown-btn--active" : ""}`}
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                >
                  <i className="fa-solid fa-flag" />
                  <span>{statusFilter || "All Status"}</span>
                  <i className="fa-solid fa-chevron-down" />
                </button>
                {showStatusDropdown && (
                  <div className="ai-toolbar__filter-dropdown-menu">
                    <button
                      onClick={() => {
                        setStatusFilter("");
                        setShowStatusDropdown(false);
                      }}
                      className={!statusFilter ? "active" : ""}
                    >
                      All Status
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter("active");
                        setShowStatusDropdown(false);
                      }}
                      className={statusFilter === "active" ? "active" : ""}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter("inactive");
                        setShowStatusDropdown(false);
                      }}
                      className={statusFilter === "inactive" ? "active" : ""}
                    >
                      Inactive
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter("discontinued");
                        setShowStatusDropdown(false);
                      }}
                      className={
                        statusFilter === "discontinued" ? "active" : ""
                      }
                    >
                      Discontinued
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="ai-toolbar__filter-dropdown">
                <button
                  className={`ai-toolbar__filter-dropdown-btn ${statusFilter ? "ai-toolbar__filter-dropdown-btn--active" : ""}`}
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                >
                  <i className="fa-solid fa-flag" />
                  <span>
                    {statusFilter
                      ? VEHICLE_STATUS.find((s) => s.value === statusFilter)
                          ?.label
                      : "All Status"}
                  </span>
                  <i className="fa-solid fa-chevron-down" />
                </button>
                {showStatusDropdown && (
                  <div className="ai-toolbar__filter-dropdown-menu">
                    <button
                      onClick={() => {
                        setStatusFilter("");
                        setShowStatusDropdown(false);
                      }}
                      className={!statusFilter ? "active" : ""}
                    >
                      All Status
                    </button>
                    {VEHICLE_STATUS.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => {
                          setStatusFilter(status.value);
                          setShowStatusDropdown(false);
                        }}
                        className={
                          statusFilter === status.value ? "active" : ""
                        }
                      >
                        <i
                          className="fa-solid fa-circle"
                          style={{ color: status.color }}
                        />
                        {status.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Special Filters */}
            {activeTab === "inventory" && (
              <button
                className={`ai-toolbar__filter-btn ${lowStockFilter ? "ai-toolbar__filter-btn--active" : ""}`}
                onClick={() => setLowStockFilter(!lowStockFilter)}
              >
                <i className="fa-solid fa-exclamation-triangle" />
                Low Stock Only
              </button>
            )}

            {activeTab === "vehicles" && (
              <button
                className={`ai-toolbar__filter-btn ${maintenanceDueFilter ? "ai-toolbar__filter-btn--active" : ""}`}
                onClick={() => setMaintenanceDueFilter(!maintenanceDueFilter)}
              >
                <i className="fa-solid fa-calendar-check" />
                Maintenance Due
              </button>
            )}

            {getActiveFilterCount() > 0 && (
              <button
                className="ai-toolbar__filter-clear"
                onClick={clearFilters}
              >
                <i className="fa-solid fa-times" />
                Clear Filters ({getActiveFilterCount()})
              </button>
            )}
          </div>

          <button className="ai-toolbar__create-btn" onClick={handleCreate}>
            <i className="fa-solid fa-plus" />
            {activeTab === "inventory" ? "Add Item" : "Add Vehicle"}
          </button>
        </div>

        {/* Table */}
        <div className="ai-table-panel">
          <div className="ai-table-panel__head">
            <div className="ai-table-panel__title">
              <i
                className={`fa-solid ${activeTab === "inventory" ? "fa-boxes" : "fa-truck"}`}
              />
              {activeTab === "inventory"
                ? "Inventory Items List"
                : "Vehicles List"}
            </div>
            <div className="ai-table-panel__info">
              {!loading && (
                <>
                  <span className="ai-table-panel__count">
                    {activeTab === "inventory"
                      ? inventoryItems.length
                      : vehicles.length}{" "}
                    items
                  </span>
                  <span className="ai-table-panel__divider">•</span>
                  <span className="ai-table-panel__sub">
                    Page 1 of{" "}
                    {Math.ceil(
                      (activeTab === "inventory"
                        ? inventoryItems.length
                        : vehicles.length) / 10,
                    ) || 1}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="ai-table-panel__scroll">
            <table className="ai-table">
              <thead>
                <tr>
                  {activeTab === "inventory" ? (
                    <>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Service Area</th>
                      <th>Location</th>
                      <th>Actions</th>
                    </>
                  ) : (
                    <>
                      <th>Vehicle Code</th>
                      <th>Vehicle Name</th>
                      <th>Category</th>
                      <th>Plate Number</th>
                      <th>Status</th>
                      <th>Service Area</th>
                      <th>Next Maintenance</th>
                      <th>Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8">
                      <div className="ai-table__loading">
                        <div className="ai-table__loading-spinner">
                          <i className="fa-solid fa-spinner fa-spin" />
                        </div>
                        <p>Loading...</p>
                        <span className="ai-table__loading-sub">
                          Fetching data
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (activeTab === "inventory" ? inventoryItems : vehicles)
                    .length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="ai-table__empty">
                        <div className="ai-table__empty-icon">
                          <i className="fa-regular fa-face-frown" />
                        </div>
                        <h3 className="ai-table__empty-title">
                          No Items Found
                        </h3>
                        <p className="ai-table__empty-message">
                          {search ||
                          categoryFilter ||
                          serviceAreaFilter ||
                          statusFilter ||
                          lowStockFilter ||
                          maintenanceDueFilter
                            ? "Try adjusting your search or filter criteria"
                            : `Get started by adding your first ${activeTab === "inventory" ? "inventory item" : "vehicle"}`}
                        </p>
                        {(search ||
                          categoryFilter ||
                          serviceAreaFilter ||
                          statusFilter ||
                          lowStockFilter ||
                          maintenanceDueFilter) && (
                          <button
                            className="ai-table__empty-action"
                            onClick={clearFilters}
                          >
                            <i className="fa-solid fa-times" /> Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  (activeTab === "inventory" ? inventoryItems : vehicles).map(
                    (item) => {
                      if (activeTab === "inventory") {
                        const stockStatus = getStockStatus(
                          item.current_stock,
                          item.minimum_stock,
                        );
                        const serviceAreaColor = getServiceAreaColor(
                          item.service_area,
                        );

                        return (
                          <tr
                            key={item.item_id}
                            onMouseEnter={() => setHoveredRow(item.item_id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            className={
                              hoveredRow === item.item_id
                                ? "ai-table__row--hovered"
                                : ""
                            }
                          >
                            <td>
                              <span className="ai-item-code">
                                <i className="fa-solid fa-barcode" />
                                {item.item_code}
                              </span>
                            </td>
                            <td>
                              <div className="ai-item-name">
                                <div className="ai-item-name__main">
                                  {item.item_name}
                                </div>
                                {item.description && (
                                  <div
                                    className="ai-item-name__desc"
                                    title={item.description}
                                  >
                                    {item.description.substring(0, 30)}...
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>{item.category_name}</td>
                            <td>
                              <div className="ai-stock">
                                <span className="ai-stock__quantity">
                                  {item.current_stock}
                                </span>
                                <span className="ai-stock__unit">
                                  {item.unit}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span
                                className="ai-badge"
                                style={{
                                  backgroundColor: `${stockStatus.color}12`,
                                  color: stockStatus.color,
                                  border: `1px solid ${stockStatus.color}25`,
                                }}
                              >
                                <i className="fa-solid fa-chart-line" />
                                {stockStatus.label}
                              </span>
                            </td>
                            <td>
                              <span
                                className="ai-badge"
                                style={{
                                  backgroundColor: `${serviceAreaColor}12`,
                                  color: serviceAreaColor,
                                  border: `1px solid ${serviceAreaColor}25`,
                                }}
                              >
                                <i className="fa-solid fa-bullseye" />
                                {
                                  SERVICE_AREAS.find(
                                    (a) => a.value === item.service_area,
                                  )?.label
                                }
                              </span>
                            </td>
                            <td>
                              <div className="ai-location">
                                <i className="fa-solid fa-location-dot" />
                                {item.location}
                              </div>
                            </td>
                            <td>
                              <div className="ai-actions">
                                <button
                                  className="ai-action-btn ai-action-btn--view"
                                  onClick={() => handleView(item)}
                                  title="View Details"
                                  style={{
                                    background: "#10b98112",
                                    color: "#10b981",
                                    border: "1px solid #10b98125",
                                  }}
                                >
                                  <i className="fa-solid fa-eye" />
                                </button>
                                <button
                                  className="ai-action-btn ai-action-btn--edit"
                                  onClick={() => handleEdit(item)}
                                  title="Edit Item"
                                  style={{
                                    background: "#3b82f612",
                                    color: "#3b82f6",
                                    border: "1px solid #3b82f625",
                                  }}
                                >
                                  <i className="fa-solid fa-pen" />
                                </button>
                                <button
                                  className="ai-action-btn ai-action-btn--delete"
                                  onClick={() => handleDelete(item.item_id)}
                                  title="Delete Item"
                                  style={{
                                    background: "#ef444412",
                                    color: "#ef4444",
                                    border: "1px solid #ef444425",
                                  }}
                                >
                                  <i className="fa-solid fa-trash" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      } else {
                        const serviceAreaColor = getServiceAreaColor(
                          item.service_area,
                        );
                        const statusColor = getVehicleStatusColor(item.status);
                        const maintenanceDue =
                          item.next_maintenance_date &&
                          new Date(item.next_maintenance_date) <=
                            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                        return (
                          <tr
                            key={item.vehicle_id}
                            onMouseEnter={() => setHoveredRow(item.vehicle_id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            className={
                              hoveredRow === item.vehicle_id
                                ? "ai-table__row--hovered"
                                : ""
                            }
                          >
                            <td>
                              <span className="ai-item-code">
                                <i className="fa-solid fa-barcode" />
                                {item.vehicle_code}
                              </span>
                            </td>
                            <td>
                              <div className="ai-item-name">
                                <div className="ai-item-name__main">
                                  {item.vehicle_name}
                                </div>
                                <div className="ai-item-name__desc">
                                  {item.model} {item.year}
                                </div>
                              </div>
                            </td>
                            <td>{item.category_name}</td>
                            <td>
                              <span className="ai-plate">
                                <i className="fa-solid fa-id-card" />
                                {item.plate_number}
                              </span>
                            </td>
                            <td>
                              <span
                                className="ai-badge"
                                style={{
                                  backgroundColor: `${statusColor}12`,
                                  color: statusColor,
                                  border: `1px solid ${statusColor}25`,
                                }}
                              >
                                <i className="fa-solid fa-flag" />
                                {
                                  VEHICLE_STATUS.find(
                                    (s) => s.value === item.status,
                                  )?.label
                                }
                              </span>
                            </td>
                            <td>
                              <span
                                className="ai-badge"
                                style={{
                                  backgroundColor: `${serviceAreaColor}12`,
                                  color: serviceAreaColor,
                                  border: `1px solid ${serviceAreaColor}25`,
                                }}
                              >
                                <i className="fa-solid fa-bullseye" />
                                {
                                  SERVICE_AREAS.find(
                                    (a) => a.value === item.service_area,
                                  )?.label
                                }
                              </span>
                            </td>
                            <td>
                              {item.next_maintenance_date ? (
                                <div
                                  className={`ai-maintenance-date ${maintenanceDue ? "ai-maintenance-date--due" : ""}`}
                                >
                                  <i className="fa-regular fa-calendar" />
                                  <span>
                                    {new Date(
                                      item.next_maintenance_date,
                                    ).toLocaleDateString()}
                                  </span>
                                  {maintenanceDue && (
                                    <i
                                      className="fa-solid fa-exclamation-circle"
                                      title="Maintenance Due"
                                    />
                                  )}
                                </div>
                              ) : (
                                <span className="ai-muted">
                                  <i className="fa-regular fa-calendar" /> Not
                                  set
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="ai-actions">
                                <button
                                  className="ai-action-btn ai-action-btn--view"
                                  onClick={() => handleView(item)}
                                  title="View Details"
                                  style={{
                                    background: "#10b98112",
                                    color: "#10b981",
                                    border: "1px solid #10b98125",
                                  }}
                                >
                                  <i className="fa-solid fa-eye" />
                                </button>
                                <button
                                  className="ai-action-btn ai-action-btn--wrench"
                                  onClick={() => handleAddMaintenance(item)}
                                  title="Add Maintenance"
                                  style={{
                                    background: "#f59e0b12",
                                    color: "#f59e0b",
                                    border: "1px solid #f59e0b25",
                                  }}
                                >
                                  <i className="fa-solid fa-wrench" />
                                </button>
                                <button
                                  className="ai-action-btn ai-action-btn--edit"
                                  onClick={() => handleEdit(item)}
                                  title="Edit Vehicle"
                                  style={{
                                    background: "#3b82f612",
                                    color: "#3b82f6",
                                    border: "1px solid #3b82f625",
                                  }}
                                >
                                  <i className="fa-solid fa-pen" />
                                </button>
                                <button
                                  className="ai-action-btn ai-action-btn--delete"
                                  onClick={() => handleDelete(item.vehicle_id)}
                                  title="Delete Vehicle"
                                  style={{
                                    background: "#ef444412",
                                    color: "#ef4444",
                                    border: "1px solid #ef444425",
                                  }}
                                >
                                  <i className="fa-solid fa-trash" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    },
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal &&
        (activeTab === "inventory" ? (
          <InventoryItemModal
            item={selectedItem}
            onClose={() => setShowModal(false)}
            onSuccess={handleModalSuccess}
          />
        ) : (
          <VehicleModal
            vehicle={selectedItem}
            onClose={() => setShowModal(false)}
            onSuccess={handleModalSuccess}
          />
        ))}

      {showViewModal && (
        <ViewModal
          type={activeTab === "inventory" ? "inventory" : "vehicle"}
          data={selectedItem}
          onClose={() => setShowViewModal(false)}
          onAddMaintenance={handleAddMaintenance}
          onEdit={handleEdit}
        />
      )}

      {showMaintenanceModal && selectedVehicle && (
        <MaintenanceModal
          vehicle={selectedVehicle}
          onClose={() => {
            setShowMaintenanceModal(false);
            setSelectedVehicle(null);
          }}
          onSuccess={handleMaintenanceSuccess}
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
