// AdminMerchandise.jsx
// Path: src/pages/AdminMerchandise/AdminMerchandise.jsx

import { useState, useEffect, useCallback } from "react";
import "./AdminMerchandise.scss";
import {
  getMerchandise,
  createMerchandise,
  updateMerchandise,
  updateMerchandiseWithoutImage,
  deleteMerchandise,
  restoreMerchandise,
  deleteMerchandisePermanently,
  CATEGORY_OPTIONS,
  formatCategory,
  formatPrice,
  getCategoryColor,
  getCategoryIcon,
  getImageUrl,
} from "../../services/merchandiseApi";

// ─── TOAST COMPONENT ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`am-toast am-toast--${type}`} onClick={onClose}>
      <div className="am-toast__icon">
        <i
          className={`fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`}
        />
      </div>
      <div className="am-toast__content">
        <div className="am-toast__title">
          {type === "success" ? "Success" : "Error"}
        </div>
        <div className="am-toast__message">{message}</div>
      </div>
      <button className="am-toast__close" onClick={onClose}>
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}

// ─── MERCHANDISE MODAL ────────────────────────────────────────────────────────
function MerchandiseModal({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "other",
    price: "",
    stock_quantity: "",
    is_available: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        category: item.category || "other",
        price: item.price || "",
        stock_quantity: item.stock_quantity || "",
        is_available: item.is_available === 1 || item.is_available === true,
      });
      if (item.image_url) {
        setImagePreview(getImageUrl(item));
      }
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    document.getElementById("merchandise-image").value = "";
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Item name is required";
    }

    if (formData.price === "" || formData.price < 0) {
      newErrors.price = "Price must be a positive number";
    }

    if (formData.stock_quantity === "" || formData.stock_quantity < 0) {
      newErrors.stock_quantity = "Stock quantity must be a positive number";
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
      if (item) {
        if (imageFile) {
          const formDataObj = new FormData();
          formDataObj.append("name", formData.name);
          formDataObj.append("description", formData.description || "");
          formDataObj.append("category", formData.category);
          formDataObj.append("price", formData.price);
          formDataObj.append("stock_quantity", formData.stock_quantity);
          formDataObj.append("is_available", formData.is_available ? "1" : "0");
          formDataObj.append("image", imageFile);

          await updateMerchandise(item.merch_id, formDataObj);
        } else {
          await updateMerchandiseWithoutImage(item.merch_id, {
            name: formData.name,
            description: formData.description,
            category: formData.category,
            price: formData.price,
            stock_quantity: formData.stock_quantity,
            is_available: formData.is_available ? 1 : 0,
          });
        }
        onSuccess("Merchandise item updated successfully");
      } else {
        const formDataObj = new FormData();
        formDataObj.append("name", formData.name);
        formDataObj.append("description", formData.description || "");
        formDataObj.append("category", formData.category);
        formDataObj.append("price", formData.price);
        formDataObj.append("stock_quantity", formData.stock_quantity);
        formDataObj.append("is_available", formData.is_available ? "1" : "0");
        if (imageFile) {
          formDataObj.append("image", imageFile);
        }

        await createMerchandise(formDataObj);
        onSuccess("Merchandise item created successfully");
      }
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="am-overlay" onClick={onClose}>
      <div className="am-modal" onClick={(e) => e.stopPropagation()}>
        <div className="am-modal__header">
          <div className="am-modal__title">
            <i
              className={`fa-solid ${item ? "fa-pen-to-square" : "fa-plus-circle"}`}
            />
            {item ? "Edit Merchandise Item" : "Add New Merchandise Item"}
          </div>
          <button className="am-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form className="am-modal__body" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="am-form__error-banner">
              <i className="fa-solid fa-circle-exclamation" />
              {errors.submit}
            </div>
          )}

          <div className="am-form__field">
            <label className="am-form__label">
              <i className="fa-solid fa-tag" />
              Item Name <span className="am-form__required">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`am-form__input ${errors.name ? "am-form__input--error" : ""}`}
              placeholder="Enter item name"
            />
            {errors.name && (
              <span className="am-form__error-text">
                <i className="fa-solid fa-circle-exclamation" />
                {errors.name}
              </span>
            )}
          </div>

          <div className="am-form__field">
            <label className="am-form__label">
              <i className="fa-regular fa-file-lines" />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="am-form__textarea"
              placeholder="Enter item description..."
              rows="4"
            />
          </div>

          <div className="am-form__row">
            <div className="am-form__field">
              <label className="am-form__label">
                <i className="fa-solid fa-list" />
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="am-form__select"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="am-form__field">
              <label className="am-form__label">
                <i className="fa-solid fa-boxes" />
                Stock Quantity <span className="am-form__required">*</span>
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                min="0"
                className={`am-form__input ${errors.stock_quantity ? "am-form__input--error" : ""}`}
                placeholder="0"
              />
              {errors.stock_quantity && (
                <span className="am-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.stock_quantity}
                </span>
              )}
            </div>
          </div>

          <div className="am-form__row">
            <div className="am-form__field">
              <label className="am-form__label">
                <i className="fa-solid fa-money-bill" />
                Price (₱) <span className="am-form__required">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`am-form__input ${errors.price ? "am-form__input--error" : ""}`}
                placeholder="0.00"
              />
              {errors.price && (
                <span className="am-form__error-text">
                  <i className="fa-solid fa-circle-exclamation" />
                  {errors.price}
                </span>
              )}
            </div>

            <div className="am-form__field am-form__field--checkbox">
              <label className="am-form__checkbox-label">
                <input
                  type="checkbox"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleChange}
                  className="am-form__checkbox"
                />
                <span className="am-form__checkbox-text">
                  <i className="fa-solid fa-check-circle" />
                  Available for sale
                </span>
              </label>
            </div>
          </div>

          {/* Image Upload */}
          <div className="am-form__field">
            <label className="am-form__label">
              <i className="fa-regular fa-image" />
              {item
                ? "Image (Leave empty to keep current)"
                : "Image (Optional)"}
            </label>
            <div className="am-file-upload">
              <input
                type="file"
                id="merchandise-image"
                accept="image/*"
                onChange={handleImageChange}
                className="am-file-upload__input"
              />
              <label
                htmlFor="merchandise-image"
                className="am-file-upload__label"
              >
                <i className="fa-solid fa-cloud-upload-alt" />
                <span className="am-file-upload__text">
                  {imageFile
                    ? imageFile.name
                    : item?.image_url
                      ? "Change image"
                      : "Choose an image"}
                </span>
                {imageFile && (
                  <span className="am-file-upload__check">
                    <i className="fa-solid fa-check-circle" />
                  </span>
                )}
              </label>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="am-image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="am-image-preview__remove"
                  title="Remove image"
                >
                  <i className="fa-solid fa-times" />
                </button>
              </div>
            )}

            {/* Show current image for edit mode when no new image selected */}
            {item?.image_url && !imageFile && !imagePreview && (
              <div className="am-image-preview am-image-preview--current">
                <img src={getImageUrl(item)} alt={item.name} />
                <div className="am-image-preview__label">Current Image</div>
              </div>
            )}

            <small className="am-form__hint">
              <i className="fa-solid fa-info-circle" /> Accepted formats: JPG,
              PNG, GIF (Max 5MB)
            </small>
          </div>

          <button
            type="submit"
            className="am-form__submit"
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

  const categoryColor = getCategoryColor(item.category);
  const categoryIcon = getCategoryIcon(item.category);
  const imageUrl = getImageUrl(item);

  return (
    <div className="am-overlay" onClick={onClose}>
      <div
        className="am-modal am-modal--lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="am-modal__header">
          <div className="am-modal__title">
            <i className="fa-solid fa-eye" />
            Item Details
          </div>
          <button className="am-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="am-modal__body">
          {imageUrl && (
            <div className="am-view__image">
              <img src={imageUrl} alt={item.name} />
            </div>
          )}

          <div className="am-view__section">
            <h3 className="am-view__section-title">
              <i className="fa-solid fa-tag" style={{ color: categoryColor }} />
              {item.name}
            </h3>

            <div className="am-view__badges">
              <span
                className="am-view__badge"
                style={{
                  background: `${categoryColor}12`,
                  color: categoryColor,
                  border: `1px solid ${categoryColor}25`,
                }}
              >
                <i className={categoryIcon} />
                {formatCategory(item.category)}
              </span>

              <span
                className="am-view__badge"
                style={{
                  background: item.is_available ? "#10b98112" : "#6b728012",
                  color: item.is_available ? "#10b981" : "#6b7280",
                  border: item.is_available
                    ? "1px solid #10b98125"
                    : "1px solid #6b728025",
                }}
              >
                <i
                  className={
                    item.is_available
                      ? "fa-solid fa-check-circle"
                      : "fa-solid fa-ban"
                  }
                />
                {item.is_available ? "Available" : "Unavailable"}
              </span>
            </div>
          </div>

          {item.description && (
            <div className="am-view__section">
              <h3 className="am-view__section-title">
                <i className="fa-regular fa-file-lines" />
                Description
              </h3>
              <div className="am-view__content">{item.description}</div>
            </div>
          )}

          <div className="am-view__section">
            <h3 className="am-view__section-title">
              <i className="fa-solid fa-info-circle" />
              Details
            </h3>
            <div className="am-view__grid">
              <div className="am-view__item">
                <div className="am-view__item-label">Price</div>
                <div className="am-view__item-value am-view__item-value--price">
                  <i className="fa-solid fa-money-bill" />
                  {formatPrice(item.price)}
                </div>
              </div>
              <div className="am-view__item">
                <div className="am-view__item-label">Stock Quantity</div>
                <div className="am-view__item-value">
                  <span
                    className={`am-stock-badge ${item.stock_quantity > 0 ? "am-stock-badge--in" : "am-stock-badge--out"}`}
                  >
                    <i
                      className={`fa-solid ${item.stock_quantity > 0 ? "fa-boxes" : "fa-box-open"}`}
                    />
                    {item.stock_quantity > 0
                      ? `${item.stock_quantity} units`
                      : "Out of Stock"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="am-view__section">
            <h3 className="am-view__section-title">
              <i className="fa-regular fa-clock" />
              System Information
            </h3>
            <div className="am-view__grid">
              <div className="am-view__item">
                <div className="am-view__item-label">Created At</div>
                <div className="am-view__item-value">
                  <i className="fa-regular fa-calendar" />
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
              {item.updated_at && (
                <div className="am-view__item">
                  <div className="am-view__item-label">Updated At</div>
                  <div className="am-view__item-value">
                    <i className="fa-regular fa-pen-to-square" />
                    {new Date(item.updated_at).toLocaleString()}
                  </div>
                </div>
              )}
              {item.created_by_name && (
                <div className="am-view__item">
                  <div className="am-view__item-label">Created By</div>
                  <div className="am-view__item-value">
                    <i className="fa-regular fa-user" />
                    {item.created_by_name}
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
export default function AdminMerchandise() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    unavailable: 0,
    total_stock: 0,
    total_value: 0,
    by_category: {},
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (search) filters.search = search;
      if (categoryFilter) filters.category = categoryFilter;
      if (showUnavailable) filters.available_only = true;

      const response = await getMerchandise(filters);
      setItems(response.data);
      setStats(response.stats);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, showUnavailable]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [fetchItems]);

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
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteMerchandise(id);
      showToast("Item deleted successfully");
      fetchItems();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm("Restore this item?")) return;

    try {
      await restoreMerchandise(id);
      showToast("Item restored successfully");
      fetchItems();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleDeletePermanent = async (id) => {
    if (
      !window.confirm(
        "Permanently delete this item? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deleteMerchandisePermanently(id);
      showToast("Item deleted permanently");
      fetchItems();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleModalSuccess = (message) => {
    showToast(message);
    fetchItems();
  };

  const clearSearch = () => {
    setSearch("");
  };

  const clearFilters = () => {
    setCategoryFilter("");
    setShowUnavailable(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (categoryFilter) count++;
    if (showUnavailable) count++;
    return count;
  };

  return (
    <div className="am-root">
      {/* Header with Wave Effect */}
      <div className="am-header">
        <div className="am-header__container">
          <div className="am-header__content">
            <div className="am-header__left">
              <div className="am-header__badge">
                <i className="fa-solid fa-store" />
                Merchandise Management
              </div>
              <h1 className="am-header__title">Merchandise</h1>
              <p className="am-header__subtitle">
                Manage your merchandise inventory and products
              </p>
            </div>

            <div className="am-header__stats">
              <div className="am-header-stat">
                <span className="am-header-stat__value">{stats.total}</span>
                <span className="am-header-stat__label">Total Items</span>
              </div>
              <div className="am-header-stat">
                <span className="am-header-stat__value">{stats.available}</span>
                <span className="am-header-stat__label">Available</span>
              </div>
              <div className="am-header-stat">
                <span className="am-header-stat__value">
                  {stats.total_stock}
                </span>
                <span className="am-header-stat__label">Total Stock</span>
              </div>
              <div className="am-header-stat">
                <span className="am-header-stat__value">
                  ₱
                  {stats.total_value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="am-header-stat__label">Inventory Value</span>
              </div>
            </div>
          </div>
        </div>
        <div className="am-header__wave">
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
      <div className="am-body">
        {/* Stats Cards */}
        <div className="am-cards">
          {CATEGORY_OPTIONS.map((category) => (
            <div
              key={category.value}
              className="am-card"
              style={{ borderColor: category.color }}
            >
              <div
                className="am-card__icon"
                style={{ background: `${category.color}12` }}
              >
                <i
                  className={category.icon}
                  style={{ color: category.color }}
                />
              </div>
              <div>
                <div className="am-card__num" style={{ color: category.color }}>
                  {stats.by_category[category.value]?.count || 0}
                </div>
                <div className="am-card__label">{category.label}</div>
                <div className="am-card__sub">
                  <i className="fa-solid fa-boxes" />{" "}
                  {stats.by_category[category.value]?.stock || 0} units
                </div>
                <div className="am-card__sub">
                  <i className="fa-solid fa-money-bill" /> ₱
                  {(
                    stats.by_category[category.value]?.value || 0
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="am-toolbar">
          <div className="am-toolbar__search">
            <i className="fa-solid fa-magnifying-glass am-toolbar__search-icon" />
            <input
              type="text"
              className="am-toolbar__search-input"
              placeholder="Search merchandise by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="am-toolbar__search-clear"
                onClick={clearSearch}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          <div className="am-toolbar__filters">
            {/* Category Filter Dropdown */}
            <div className="am-toolbar__filter-dropdown">
              <button
                className={`am-toolbar__filter-dropdown-btn ${categoryFilter ? "am-toolbar__filter-dropdown-btn--active" : ""}`}
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <i className="fa-solid fa-list" />
                <span>
                  {categoryFilter
                    ? formatCategory(categoryFilter)
                    : "All Categories"}
                </span>
                <i className="fa-solid fa-chevron-down" />
              </button>
              {showCategoryDropdown && (
                <div className="am-toolbar__filter-dropdown-menu">
                  <button
                    onClick={() => {
                      setCategoryFilter("");
                      setShowCategoryDropdown(false);
                    }}
                    className={!categoryFilter ? "active" : ""}
                  >
                    <i className="fa-solid fa-list" />
                    All Categories
                  </button>
                  {CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setCategoryFilter(option.value);
                        setShowCategoryDropdown(false);
                      }}
                      className={
                        categoryFilter === option.value ? "active" : ""
                      }
                    >
                      <i
                        className={option.icon}
                        style={{ color: option.color }}
                      />
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Show Unavailable Toggle */}
            <button
              className={`am-toolbar__filter-btn ${showUnavailable ? "am-toolbar__filter-btn--active" : ""}`}
              onClick={() => setShowUnavailable(!showUnavailable)}
              style={
                showUnavailable
                  ? { background: "#6b728012", color: "#6b7280" }
                  : {}
              }
            >
              <i className="fa-solid fa-eye" />
              {showUnavailable ? "Available Only" : "Show All"}
            </button>

            {getActiveFilterCount() > 0 && (
              <button
                className="am-toolbar__filter-clear"
                onClick={clearFilters}
              >
                <i className="fa-solid fa-times" />
                Clear Filters ({getActiveFilterCount()})
              </button>
            )}
          </div>

          <button className="am-toolbar__create-btn" onClick={handleCreate}>
            <i className="fa-solid fa-plus" />
            Add New Item
          </button>
        </div>

        {/* Table */}
        <div className="am-table-panel">
          <div className="am-table-panel__head">
            <div className="am-table-panel__title">
              <i className="fa-solid fa-store" />
              Merchandise Items
            </div>
            <div className="am-table-panel__info">
              {!loading && (
                <>
                  <span className="am-table-panel__count">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                  <span className="am-table-panel__divider">•</span>
                  <span className="am-table-panel__sub">
                    Page 1 of {Math.ceil(items.length / 10) || 1}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="am-table-panel__scroll">
            <table className="am-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Total Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7">
                      <div className="am-table__loading">
                        <div className="am-table__loading-spinner">
                          <i className="fa-solid fa-spinner fa-spin" />
                        </div>
                        <p>Loading merchandise...</p>
                        <span className="am-table__loading-sub">
                          Fetching product data
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="am-table__empty">
                        <div className="am-table__empty-icon">
                          <i className="fa-regular fa-face-frown" />
                        </div>
                        <h3 className="am-table__empty-title">
                          No Items Found
                        </h3>
                        <p className="am-table__empty-message">
                          {search || categoryFilter || showUnavailable
                            ? "Try adjusting your search or filter criteria"
                            : "Get started by adding your first merchandise item"}
                        </p>
                        {(search || categoryFilter || showUnavailable) && (
                          <button
                            className="am-table__empty-action"
                            onClick={clearFilters}
                          >
                            <i className="fa-solid fa-times" /> Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const categoryColor = getCategoryColor(item.category);
                    const categoryIcon = getCategoryIcon(item.category);
                    const imageUrl = getImageUrl(item);
                    const totalValue = item.price * item.stock_quantity;

                    return (
                      <tr
                        key={item.merch_id}
                        onMouseEnter={() => setHoveredRow(item.merch_id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className={
                          hoveredRow === item.merch_id
                            ? "am-table__row--hovered"
                            : ""
                        }
                      >
                        <td>
                          <div className="am-item-cell">
                            <div className="am-item-cell__image">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.name}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div
                                  className="am-item-cell__image-placeholder"
                                  style={{
                                    background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)`,
                                  }}
                                >
                                  <i className={categoryIcon} />
                                </div>
                              )}
                            </div>
                            <div className="am-item-cell__info">
                              <div className="am-item-cell__name">
                                {item.name}
                              </div>
                              {item.description && (
                                <div
                                  className="am-item-cell__desc"
                                  title={item.description}
                                >
                                  {item.description.substring(0, 50)}
                                  {item.description.length > 50 ? "..." : ""}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className="am-badge"
                            style={{
                              background: `${categoryColor}12`,
                              color: categoryColor,
                              border: `1px solid ${categoryColor}25`,
                            }}
                          >
                            <i className={categoryIcon} />
                            {formatCategory(item.category)}
                          </span>
                        </td>
                        <td>
                          <span className="am-price">
                            <i className="fa-solid fa-money-bill" />
                            {formatPrice(item.price)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`am-stock ${item.stock_quantity > 0 ? "am-stock--in" : "am-stock--out"}`}
                          >
                            <i
                              className={`fa-solid ${item.stock_quantity > 0 ? "fa-boxes" : "fa-box-open"}`}
                            />
                            {item.stock_quantity} units
                          </span>
                        </td>
                        <td>
                          <span
                            className="am-badge"
                            style={{
                              background: item.is_available
                                ? "#10b98112"
                                : "#6b728012",
                              color: item.is_available ? "#10b981" : "#6b7280",
                              border: item.is_available
                                ? "1px solid #10b98125"
                                : "1px solid #6b728025",
                            }}
                          >
                            <i
                              className={
                                item.is_available
                                  ? "fa-solid fa-check-circle"
                                  : "fa-solid fa-ban"
                              }
                            />
                            {item.is_available ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td>
                          <span className="am-total-value">
                            <i className="fa-solid fa-calculator" />
                            {formatPrice(totalValue)}
                          </span>
                        </td>
                        <td>
                          <div className="am-actions">
                            <button
                              className="am-action-btn am-action-btn--view"
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
                              className="am-action-btn am-action-btn--edit"
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
                              className="am-action-btn am-action-btn--delete"
                              onClick={() => handleDelete(item.merch_id)}
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <MerchandiseModal
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
