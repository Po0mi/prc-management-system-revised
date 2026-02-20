// AdminAnnouncements.jsx
// Path: src/pages/AdminAnnouncements/AdminAnnouncements.jsx

import { useState, useEffect, useCallback } from "react";
import "./AdminAnnouncements.scss";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  updateAnnouncementWithImage,
  archiveAnnouncement,
  restoreAnnouncement,
  deleteAnnouncementPermanently,
  CATEGORY_OPTIONS,
  TARGET_ROLE_OPTIONS,
  STATUS_OPTIONS,
  formatCategory,
  formatTargetRole,
  formatStatus,
  getCategoryColor,
  getTargetRoleColor,
} from "../../services/announcementsApi";

// ─── TOAST COMPONENT ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`aa-toast aa-toast--${type}`} onClick={onClose}>
      <div className="aa-toast__icon">
        <i
          className={`fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`}
        />
      </div>
      <div className="aa-toast__content">
        <div className="aa-toast__title">
          {type === "success" ? "Success" : "Error"}
        </div>
        <div className="aa-toast__message">{message}</div>
      </div>
      <button className="aa-toast__close" onClick={onClose}>
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}

// ─── ANNOUNCEMENT MODAL ───────────────────────────────────────────────────────
function AnnouncementModal({ announcement, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
    target_role: "all",
    status: "published",
    posted_at: new Date().toISOString().slice(0, 16),
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [keepCurrentImage, setKeepCurrentImage] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || "",
        content: announcement.content || "",
        category: announcement.category || "general",
        target_role: announcement.target_role || "all",
        status: announcement.status || "published",
        posted_at: announcement.posted_at
          ? new Date(announcement.posted_at).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
      });
      if (announcement.image_path) {
        setImagePreview(
          `http://localhost/prc-management-system/${announcement.image_path}`,
        );
      }
    }
  }, [announcement]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setKeepCurrentImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setKeepCurrentImage(false);
    document.getElementById("announcement-image").value = "";
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
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
      if (announcement) {
        if (imageFile) {
          const formDataObj = new FormData();
          formDataObj.append("title", formData.title);
          formDataObj.append("content", formData.content);
          formDataObj.append("category", formData.category);
          formDataObj.append("target_role", formData.target_role);
          formDataObj.append("status", formData.status);
          formDataObj.append("posted_at", formData.posted_at);
          formDataObj.append("image", imageFile);

          await updateAnnouncementWithImage(
            announcement.announcement_id,
            formDataObj,
          );
        } else {
          await updateAnnouncement(announcement.announcement_id, formData);
        }
        onSuccess("Announcement updated successfully");
      } else {
        const formDataObj = new FormData();
        formDataObj.append("title", formData.title);
        formDataObj.append("content", formData.content);
        formDataObj.append("category", formData.category);
        formDataObj.append("target_role", formData.target_role);
        formDataObj.append("status", formData.status);
        formDataObj.append("posted_at", formData.posted_at);
        if (imageFile) {
          formDataObj.append("image", imageFile);
        }

        await createAnnouncement(formDataObj);
        onSuccess("Announcement created successfully");
      }
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="aa-overlay" onClick={onClose}>
      <div className="aa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="aa-modal__header">
          <div className="aa-modal__title">
            <i
              className={`fa-solid ${announcement ? "fa-pen-to-square" : "fa-plus-circle"}`}
            />
            {announcement ? "Edit Announcement" : "Create New Announcement"}
          </div>
          <button className="aa-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form className="aa-modal__body" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="aa-form__error-banner">
              <i className="fa-solid fa-circle-exclamation" />
              {errors.submit}
            </div>
          )}

          <div className="aa-form__field">
            <label className="aa-form__label">
              <i className="fa-solid fa-heading" />
              Title <span className="aa-form__required">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`aa-form__input ${errors.title ? "aa-form__input--error" : ""}`}
              placeholder="Enter announcement title"
            />
            {errors.title && (
              <span className="aa-form__error-text">
                <i className="fa-solid fa-circle-exclamation" />
                {errors.title}
              </span>
            )}
          </div>

          <div className="aa-form__field">
            <label className="aa-form__label">
              <i className="fa-regular fa-file-lines" />
              Content <span className="aa-form__required">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              className={`aa-form__textarea ${errors.content ? "aa-form__input--error" : ""}`}
              placeholder="Enter announcement content..."
              rows="6"
            />
            {errors.content && (
              <span className="aa-form__error-text">
                <i className="fa-solid fa-circle-exclamation" />
                {errors.content}
              </span>
            )}
          </div>

          <div className="aa-form__row">
            <div className="aa-form__field">
              <label className="aa-form__label">
                <i className="fa-solid fa-tag" />
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="aa-form__select"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="aa-form__field">
              <label className="aa-form__label">
                <i className="fa-solid fa-bullseye" />
                Target Audience
              </label>
              <select
                name="target_role"
                value={formData.target_role}
                onChange={handleChange}
                className="aa-form__select"
              >
                {TARGET_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="aa-form__row">
            <div className="aa-form__field">
              <label className="aa-form__label">
                <i className="fa-solid fa-flag" />
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="aa-form__select"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="aa-form__field">
              <label className="aa-form__label">
                <i className="fa-regular fa-calendar" />
                Posted Date
              </label>
              <input
                type="datetime-local"
                name="posted_at"
                value={formData.posted_at}
                onChange={handleChange}
                className="aa-form__input"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="aa-form__field">
            <label className="aa-form__label">
              <i className="fa-regular fa-image" />
              {announcement
                ? "Image (Leave empty to keep current)"
                : "Image (Optional)"}
            </label>
            <div className="aa-file-upload">
              <input
                type="file"
                id="announcement-image"
                accept="image/*"
                onChange={handleImageChange}
                className="aa-file-upload__input"
              />
              <label
                htmlFor="announcement-image"
                className="aa-file-upload__label"
              >
                <i className="fa-solid fa-cloud-upload-alt" />
                <span className="aa-file-upload__text">
                  {imageFile
                    ? imageFile.name
                    : announcement?.image_path
                      ? "Change image"
                      : "Choose an image"}
                </span>
                {imageFile && (
                  <span className="aa-file-upload__check">
                    <i className="fa-solid fa-check-circle" />
                  </span>
                )}
              </label>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="aa-image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="aa-image-preview__remove"
                  title="Remove image"
                >
                  <i className="fa-solid fa-times" />
                </button>
              </div>
            )}

            {/* Show current image for edit mode when no new image selected */}
            {announcement?.image_path && !imageFile && !imagePreview && (
              <div className="aa-image-preview aa-image-preview--current">
                <img
                  src={`http://localhost/prc-management-system/${announcement.image_path}`}
                  alt={announcement.title}
                />
                <div className="aa-image-preview__label">Current Image</div>
              </div>
            )}

            <small className="aa-form__hint">
              <i className="fa-solid fa-info-circle" /> Accepted formats: JPG,
              PNG, GIF (Max 5MB)
            </small>
          </div>

          <button
            type="submit"
            className="aa-form__submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                {announcement ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <i
                  className={`fa-solid ${announcement ? "fa-pen-to-square" : "fa-plus"}`}
                />
                {announcement ? "Update Announcement" : "Create Announcement"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── VIEW MODAL ───────────────────────────────────────────────────────────────
function ViewModal({ announcement, onClose }) {
  if (!announcement) return null;

  const categoryColor = getCategoryColor(announcement.category);
  const targetRoleColor = getTargetRoleColor(announcement.target_role);
  const categoryIcon =
    CATEGORY_OPTIONS.find((o) => o.value === announcement.category)?.icon ||
    "fa-solid fa-megaphone";
  const targetIcon =
    TARGET_ROLE_OPTIONS.find((o) => o.value === announcement.target_role)
      ?.icon || "fa-solid fa-users";

  return (
    <div className="aa-overlay" onClick={onClose}>
      <div
        className="aa-modal aa-modal--lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aa-modal__header">
          <div className="aa-modal__title">
            <i className="fa-solid fa-eye" />
            Announcement Details
          </div>
          <button className="aa-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="aa-modal__body">
          {announcement.image_path && (
            <div className="aa-view__image">
              <img
                src={`http://localhost/prc-management-system/${announcement.image_path}`}
                alt={announcement.title}
              />
            </div>
          )}

          <div className="aa-view__section">
            <div className="aa-view__badges">
              <span
                className="aa-view__badge"
                style={{
                  background: `${categoryColor}12`,
                  color: categoryColor,
                  border: `1px solid ${categoryColor}25`,
                }}
              >
                <i className={categoryIcon} />
                {formatCategory(announcement.category)}
              </span>

              <span
                className="aa-view__badge"
                style={{
                  background: `${targetRoleColor}12`,
                  color: targetRoleColor,
                  border: `1px solid ${targetRoleColor}25`,
                }}
              >
                <i className={targetIcon} />
                {formatTargetRole(announcement.target_role)}
              </span>

              <span
                className="aa-view__badge"
                style={{
                  background:
                    announcement.status === "published"
                      ? "#10b98112"
                      : "#6b728012",
                  color:
                    announcement.status === "published" ? "#10b981" : "#6b7280",
                  border:
                    announcement.status === "published"
                      ? "1px solid #10b98125"
                      : "1px solid #6b728025",
                }}
              >
                <i
                  className={
                    announcement.status === "published"
                      ? "fa-solid fa-globe"
                      : "fa-solid fa-pen"
                  }
                />
                {formatStatus(announcement.status)}
              </span>
            </div>
          </div>

          <div className="aa-view__section">
            <h3 className="aa-view__section-title">
              <i
                className="fa-solid fa-heading"
                style={{ color: categoryColor }}
              />
              {announcement.title}
            </h3>
          </div>

          <div className="aa-view__section">
            <h3 className="aa-view__section-title">
              <i className="fa-regular fa-file-lines" />
              Content
            </h3>
            <div className="aa-view__content">
              {announcement.content.split("\n").map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="aa-view__section">
            <h3 className="aa-view__section-title">
              <i className="fa-regular fa-clock" />
              Timeline
            </h3>
            <div className="aa-view__grid">
              <div className="aa-view__item">
                <div className="aa-view__item-label">Posted Date</div>
                <div className="aa-view__item-value">
                  {new Date(announcement.posted_at).toLocaleString()}
                </div>
              </div>
              <div className="aa-view__item">
                <div className="aa-view__item-label">Created At</div>
                <div className="aa-view__item-value">
                  {new Date(announcement.created_at).toLocaleString()}
                </div>
              </div>
              {announcement.updated_at && (
                <div className="aa-view__item">
                  <div className="aa-view__item-label">Updated At</div>
                  <div className="aa-view__item-value">
                    {new Date(announcement.updated_at).toLocaleString()}
                  </div>
                </div>
              )}
              {announcement.archived_at && (
                <div className="aa-view__item">
                  <div className="aa-view__item-label">Archived At</div>
                  <div className="aa-view__item-value">
                    {new Date(announcement.archived_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(announcement.created_by_name ||
            announcement.archived_by_name ||
            announcement.updated_by_name) && (
            <div className="aa-view__section">
              <h3 className="aa-view__section-title">
                <i className="fa-solid fa-user" />
                Audit Information
              </h3>
              <div className="aa-view__grid">
                {announcement.created_by_name && (
                  <div className="aa-view__item">
                    <div className="aa-view__item-label">Created By</div>
                    <div className="aa-view__item-value">
                      {announcement.created_by_name}
                    </div>
                  </div>
                )}
                {announcement.updated_by_name && (
                  <div className="aa-view__item">
                    <div className="aa-view__item-label">Updated By</div>
                    <div className="aa-view__item-value">
                      {announcement.updated_by_name}
                    </div>
                  </div>
                )}
                {announcement.archived_by_name && (
                  <div className="aa-view__item">
                    <div className="aa-view__item-label">Archived By</div>
                    <div className="aa-view__item-value">
                      {announcement.archived_by_name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    by_category: {},
    by_target_role: {},
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [targetRoleFilter, setTargetRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("published");
  const [showArchived, setShowArchived] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTargetRoleDropdown, setShowTargetRoleDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [toast, setToast] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (search) filters.search = search;
      if (categoryFilter) filters.category = categoryFilter;
      if (targetRoleFilter) filters.target_role = targetRoleFilter;
      if (statusFilter && statusFilter !== "all") filters.status = statusFilter;
      if (showArchived) filters.archived = true;

      const response = await getAnnouncements(filters);
      setAnnouncements(response.data);
      setStats(response.stats);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, targetRoleFilter, statusFilter, showArchived]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAnnouncements();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [fetchAnnouncements]);

  const handleCreate = () => {
    setSelectedAnnouncement(null);
    setShowModal(true);
  };

  const handleEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };

  const handleView = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowViewModal(true);
  };

  const handleArchive = async (id) => {
    if (
      !window.confirm("Are you sure you want to archive this announcement?")
    ) {
      return;
    }

    try {
      await archiveAnnouncement(id);
      showToast("Announcement archived successfully");
      fetchAnnouncements();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm("Restore this announcement?")) return;

    try {
      await restoreAnnouncement(id);
      showToast("Announcement restored successfully");
      fetchAnnouncements();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleDeletePermanent = async (id) => {
    if (
      !window.confirm(
        "Permanently delete this announcement? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deleteAnnouncementPermanently(id);
      showToast("Announcement deleted permanently");
      fetchAnnouncements();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleModalSuccess = (message) => {
    showToast(message);
    fetchAnnouncements();
  };

  const clearSearch = () => {
    setSearch("");
  };

  const clearFilters = () => {
    setCategoryFilter("");
    setTargetRoleFilter("");
    setStatusFilter("published");
    setShowArchived(false);
  };

  const toggleArchived = () => {
    setShowArchived(!showArchived);
    setStatusFilter("all");
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (categoryFilter) count++;
    if (targetRoleFilter) count++;
    if (statusFilter && statusFilter !== "published") count++;
    if (showArchived) count++;
    return count;
  };

  const truncateContent = (content, length = 100) => {
    if (content.length <= length) return content;
    return content.substring(0, length) + "...";
  };

  return (
    <div className="aa-root">
      {/* Header with Wave Effect */}
      <div className="aa-header">
        <div className="aa-header__container">
          <div className="aa-header__content">
            <div className="aa-header__left">
              <div className="aa-header__badge">
                <i className="fa-solid fa-bullhorn" />
                Announcements Management
              </div>
              <h1 className="aa-header__title">Announcements</h1>
              <p className="aa-header__subtitle">
                Create and manage announcements for users and volunteers
              </p>
            </div>

            <div className="aa-header__stats">
              <div className="aa-header-stat">
                <span className="aa-header-stat__value">{stats.total}</span>
                <span className="aa-header-stat__label">Total</span>
              </div>
              <div className="aa-header-stat">
                <span className="aa-header-stat__value">{stats.published}</span>
                <span className="aa-header-stat__label">Published</span>
              </div>
              <div className="aa-header-stat">
                <span className="aa-header-stat__value">{stats.draft}</span>
                <span className="aa-header-stat__label">Drafts</span>
              </div>
              <div className="aa-header-stat">
                <span className="aa-header-stat__value">{stats.archived}</span>
                <span className="aa-header-stat__label">Archived</span>
              </div>
            </div>
          </div>
        </div>
        <div className="aa-header__wave">
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
      <div className="aa-body">
        {/* Stats Cards */}
        <div className="aa-cards">
          {CATEGORY_OPTIONS.map((category) => (
            <div
              key={category.value}
              className="aa-card"
              style={{ borderColor: category.color }}
            >
              <div
                className="aa-card__icon"
                style={{ background: `${category.color}12` }}
              >
                <i
                  className={category.icon}
                  style={{ color: category.color }}
                />
              </div>
              <div>
                <div className="aa-card__num" style={{ color: category.color }}>
                  {stats.by_category[category.value] || 0}
                </div>
                <div className="aa-card__label">{category.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="aa-toolbar">
          <div className="aa-toolbar__search">
            <i className="fa-solid fa-magnifying-glass aa-toolbar__search-icon" />
            <input
              type="text"
              className="aa-toolbar__search-input"
              placeholder="Search announcements by title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="aa-toolbar__search-clear"
                onClick={clearSearch}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          <div className="aa-toolbar__filters">
            {/* Category Filter Dropdown */}
            <div className="aa-toolbar__filter-dropdown">
              <button
                className={`aa-toolbar__filter-dropdown-btn ${categoryFilter ? "aa-toolbar__filter-dropdown-btn--active" : ""}`}
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <i className="fa-solid fa-tag" />
                <span>
                  {categoryFilter
                    ? formatCategory(categoryFilter)
                    : "All Categories"}
                </span>
                <i className="fa-solid fa-chevron-down" />
              </button>
              {showCategoryDropdown && (
                <div className="aa-toolbar__filter-dropdown-menu">
                  <button
                    onClick={() => {
                      setCategoryFilter("");
                      setShowCategoryDropdown(false);
                    }}
                    className={!categoryFilter ? "active" : ""}
                  >
                    <i className="fa-solid fa-tag" />
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

            {/* Target Role Filter Dropdown */}
            <div className="aa-toolbar__filter-dropdown">
              <button
                className={`aa-toolbar__filter-dropdown-btn ${targetRoleFilter ? "aa-toolbar__filter-dropdown-btn--active" : ""}`}
                onClick={() =>
                  setShowTargetRoleDropdown(!showTargetRoleDropdown)
                }
              >
                <i className="fa-solid fa-bullseye" />
                <span>
                  {targetRoleFilter
                    ? formatTargetRole(targetRoleFilter)
                    : "All Audiences"}
                </span>
                <i className="fa-solid fa-chevron-down" />
              </button>
              {showTargetRoleDropdown && (
                <div className="aa-toolbar__filter-dropdown-menu">
                  <button
                    onClick={() => {
                      setTargetRoleFilter("");
                      setShowTargetRoleDropdown(false);
                    }}
                    className={!targetRoleFilter ? "active" : ""}
                  >
                    <i className="fa-solid fa-bullseye" />
                    All Audiences
                  </button>
                  {TARGET_ROLE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTargetRoleFilter(option.value);
                        setShowTargetRoleDropdown(false);
                      }}
                      className={
                        targetRoleFilter === option.value ? "active" : ""
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

            {/* Status Filter Dropdown */}
            <div className="aa-toolbar__filter-dropdown">
              <button
                className={`aa-toolbar__filter-dropdown-btn ${statusFilter !== "published" ? "aa-toolbar__filter-dropdown-btn--active" : ""}`}
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <i className="fa-solid fa-flag" />
                <span>
                  {statusFilter === "all"
                    ? "All Status"
                    : formatStatus(statusFilter)}
                </span>
                <i className="fa-solid fa-chevron-down" />
              </button>
              {showStatusDropdown && (
                <div className="aa-toolbar__filter-dropdown-menu">
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setShowStatusDropdown(false);
                    }}
                    className={statusFilter === "all" ? "active" : ""}
                  >
                    <i className="fa-solid fa-flag" />
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

            {/* Archived Toggle */}
            <button
              className={`aa-toolbar__filter-btn ${showArchived ? "aa-toolbar__filter-btn--active" : ""}`}
              onClick={toggleArchived}
              style={
                showArchived ? { background: "#6b7280", color: "white" } : {}
              }
            >
              <i className="fa-solid fa-archive" />
              {showArchived ? "Showing Archived" : "Show Archived"}
            </button>

            {getActiveFilterCount() > 0 && (
              <button
                className="aa-toolbar__filter-clear"
                onClick={clearFilters}
              >
                <i className="fa-solid fa-times" />
                Clear Filters ({getActiveFilterCount()})
              </button>
            )}
          </div>

          <button className="aa-toolbar__create-btn" onClick={handleCreate}>
            <i className="fa-solid fa-plus" />
            Create Announcement
          </button>
        </div>

        {/* Table */}
        <div className="aa-table-panel">
          <div className="aa-table-panel__head">
            <div className="aa-table-panel__title">
              <i className="fa-solid fa-bullhorn" />
              {showArchived ? "Archived Announcements" : "Announcements"}
            </div>
            <div className="aa-table-panel__info">
              {!loading && (
                <>
                  <span className="aa-table-panel__count">
                    {announcements.length}{" "}
                    {announcements.length === 1
                      ? "announcement"
                      : "announcements"}
                  </span>
                  <span className="aa-table-panel__divider">•</span>
                  <span className="aa-table-panel__sub">
                    Page 1 of {Math.ceil(announcements.length / 10) || 1}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="aa-table-panel__scroll">
            <table className="aa-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Target Audience</th>
                  <th>Status</th>
                  <th>Posted Date</th>
                  <th>Preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7">
                      <div className="aa-table__loading">
                        <div className="aa-table__loading-spinner">
                          <i className="fa-solid fa-spinner fa-spin" />
                        </div>
                        <p>Loading announcements...</p>
                        <span className="aa-table__loading-sub">
                          Fetching announcement data
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : announcements.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="aa-table__empty">
                        <div className="aa-table__empty-icon">
                          <i className="fa-regular fa-face-frown" />
                        </div>
                        <h3 className="aa-table__empty-title">
                          No Announcements Found
                        </h3>
                        <p className="aa-table__empty-message">
                          {search ||
                          categoryFilter ||
                          targetRoleFilter ||
                          statusFilter !== "published" ||
                          showArchived
                            ? "Try adjusting your search or filter criteria"
                            : "Get started by creating your first announcement"}
                        </p>
                        {(search ||
                          categoryFilter ||
                          targetRoleFilter ||
                          statusFilter !== "published" ||
                          showArchived) && (
                          <button
                            className="aa-table__empty-action"
                            onClick={clearFilters}
                          >
                            <i className="fa-solid fa-times" /> Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  announcements.map((announcement) => {
                    const categoryColor = getCategoryColor(
                      announcement.category,
                    );
                    const targetRoleColor = getTargetRoleColor(
                      announcement.target_role,
                    );
                    const categoryIcon =
                      CATEGORY_OPTIONS.find(
                        (o) => o.value === announcement.category,
                      )?.icon || "fa-solid fa-megaphone";
                    const targetIcon =
                      TARGET_ROLE_OPTIONS.find(
                        (o) => o.value === announcement.target_role,
                      )?.icon || "fa-solid fa-users";

                    return (
                      <tr
                        key={announcement.announcement_id}
                        onMouseEnter={() =>
                          setHoveredRow(announcement.announcement_id)
                        }
                        onMouseLeave={() => setHoveredRow(null)}
                        className={
                          hoveredRow === announcement.announcement_id
                            ? "aa-table__row--hovered"
                            : ""
                        }
                      >
                        <td>
                          <div className="aa-title-cell">
                            <div className="aa-title-cell__title">
                              {announcement.title}
                            </div>
                            <div className="aa-title-cell__id">
                              <i className="fa-solid fa-hashtag" /> ID: #
                              {announcement.announcement_id}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className="aa-badge"
                            style={{
                              background: `${categoryColor}12`,
                              color: categoryColor,
                              border: `1px solid ${categoryColor}25`,
                            }}
                          >
                            <i className={categoryIcon} />
                            {formatCategory(announcement.category)}
                          </span>
                        </td>
                        <td>
                          <span
                            className="aa-badge"
                            style={{
                              background: `${targetRoleColor}12`,
                              color: targetRoleColor,
                              border: `1px solid ${targetRoleColor}25`,
                            }}
                          >
                            <i className={targetIcon} />
                            {formatTargetRole(announcement.target_role)}
                          </span>
                        </td>
                        <td>
                          <span
                            className="aa-badge"
                            style={{
                              background:
                                announcement.status === "published"
                                  ? "#10b98112"
                                  : "#6b728012",
                              color:
                                announcement.status === "published"
                                  ? "#10b981"
                                  : "#6b7280",
                              border:
                                announcement.status === "published"
                                  ? "1px solid #10b98125"
                                  : "1px solid #6b728025",
                            }}
                          >
                            <i
                              className={
                                announcement.status === "published"
                                  ? "fa-solid fa-globe"
                                  : "fa-solid fa-pen"
                              }
                            />
                            {formatStatus(announcement.status)}
                          </span>
                        </td>
                        <td>
                          <div className="aa-date">
                            <i className="fa-regular fa-calendar" />
                            {new Date(
                              announcement.posted_at,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </td>
                        <td>
                          <div
                            className="aa-preview"
                            title={announcement.content}
                          >
                            <i className="fa-regular fa-file-lines" />
                            {truncateContent(announcement.content)}
                          </div>
                        </td>
                        <td>
                          <div className="aa-actions">
                            <button
                              className="aa-action-btn aa-action-btn--view"
                              onClick={() => handleView(announcement)}
                              title="View Details"
                              style={{
                                background: "#10b98112",
                                color: "#10b981",
                                border: "1px solid #10b98125",
                              }}
                            >
                              <i className="fa-solid fa-eye" />
                            </button>

                            {!showArchived && (
                              <>
                                <button
                                  className="aa-action-btn aa-action-btn--edit"
                                  onClick={() => handleEdit(announcement)}
                                  title="Edit Announcement"
                                  style={{
                                    background: "#3b82f612",
                                    color: "#3b82f6",
                                    border: "1px solid #3b82f625",
                                  }}
                                >
                                  <i className="fa-solid fa-pen" />
                                </button>
                                <button
                                  className="aa-action-btn aa-action-btn--archive"
                                  onClick={() =>
                                    handleArchive(announcement.announcement_id)
                                  }
                                  title="Archive Announcement"
                                  style={{
                                    background: "#f59e0b12",
                                    color: "#f59e0b",
                                    border: "1px solid #f59e0b25",
                                  }}
                                >
                                  <i className="fa-solid fa-box-archive" />
                                </button>
                              </>
                            )}

                            {showArchived && (
                              <>
                                <button
                                  className="aa-action-btn aa-action-btn--restore"
                                  onClick={() =>
                                    handleRestore(announcement.announcement_id)
                                  }
                                  title="Restore Announcement"
                                  style={{
                                    background: "#10b98112",
                                    color: "#10b981",
                                    border: "1px solid #10b98125",
                                  }}
                                >
                                  <i className="fa-solid fa-trash-arrow-up" />
                                </button>
                                <button
                                  className="aa-action-btn aa-action-btn--delete"
                                  onClick={() =>
                                    handleDeletePermanent(
                                      announcement.announcement_id,
                                    )
                                  }
                                  title="Delete Permanently"
                                  style={{
                                    background: "#ef444412",
                                    color: "#ef4444",
                                    border: "1px solid #ef444425",
                                  }}
                                >
                                  <i className="fa-solid fa-trash" />
                                </button>
                              </>
                            )}
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
        <AnnouncementModal
          announcement={selectedAnnouncement}
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {showViewModal && (
        <ViewModal
          announcement={selectedAnnouncement}
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
