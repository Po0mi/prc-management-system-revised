// UserAnnouncement.jsx
// Path: src/pages/UserAnnouncement/UserAnnouncement.jsx

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api"; // ✅ Import centralized API
import "./UserAnnouncement.scss";

// ─── TOAST COMPONENT ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`ua-toast ua-toast--${type}`} onClick={onClose}>
      <div className="ua-toast__icon">
        <i
          className={`fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`}
        />
      </div>
      <div className="ua-toast__content">
        <div className="ua-toast__title">
          {type === "success" ? "Success" : "Error"}
        </div>
        <div className="ua-toast__message">{message}</div>
      </div>
      <button className="ua-toast__close" onClick={onClose}>
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}

// ─── ANNOUNCEMENT CARD ────────────────────────────────────────────────────────
function AnnouncementCard({ announcement, onClick, isNew }) {
  const getCategoryIcon = (category) => {
    const icons = {
      general: "fa-solid fa-megaphone",
      urgent: "fa-solid fa-exclamation-triangle",
      events: "fa-solid fa-calendar-alt",
      training: "fa-solid fa-graduation-cap",
    };
    return icons[category] || "fa-solid fa-bullhorn";
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: "#6b7280",
      urgent: "#ef4444",
      events: "#3b82f6",
      training: "#10b981",
    };
    return colors[category] || "#6b7280";
  };

  const getCategoryLabel = (category) => {
    const labels = {
      general: "General",
      urgent: "Urgent",
      events: "Event",
      training: "Training",
    };
    return labels[category] || category;
  };

  const getImageUrl = (announcement) => {
    const imagePath = announcement.image_path || announcement.image_url;
    if (!imagePath) return null;
    // ✅ Use relative path - api.defaults.baseURL handles the domain
    return `/${imagePath}`;
  };

  const imageUrl = getImageUrl(announcement);
  const categoryColor = getCategoryColor(announcement.category);
  const categoryIcon = getCategoryIcon(announcement.category);
  const postedDate = new Date(announcement.posted_at);
  const isUrgent = announcement.category === "urgent";

  return (
    <div
      className={`ua-card ${isUrgent ? "ua-card--urgent" : ""}`}
      onClick={() => onClick(announcement)}
    >
      {isNew && <span className="ua-card__new-badge">NEW</span>}

      <div className="ua-card__image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={announcement.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = "none";
              e.target.parentElement.classList.add("ua-card__image--fallback");
            }}
          />
        ) : (
          <div
            className="ua-card__image-placeholder"
            style={{
              background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)`,
            }}
          >
            <i className={categoryIcon} />
          </div>
        )}
      </div>

      <div className="ua-card__content">
        <div className="ua-card__header">
          <span
            className="ua-card__category"
            style={{
              background: `${categoryColor}15`,
              color: categoryColor,
              border: `1px solid ${categoryColor}30`,
            }}
          >
            <i className={categoryIcon} />
            {getCategoryLabel(announcement.category)}
          </span>
          <span className="ua-card__date" title={postedDate.toLocaleString()}>
            <i className="fa-regular fa-calendar" />
            {postedDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        <h3 className="ua-card__title">{announcement.title}</h3>

        <p className="ua-card__excerpt">
          {announcement.content.length > 150
            ? announcement.content.substring(0, 150) + "..."
            : announcement.content}
        </p>

        <div className="ua-card__footer">
          <span className="ua-card__target">
            <i className="fa-solid fa-users" />
            {announcement.target_role === "all"
              ? "All Users"
              : announcement.target_role
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
          </span>
          <button className="ua-card__read-more">
            <span>Read More</span>
            <i className="fa-solid fa-arrow-right" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ANNOUNCEMENT DETAILS MODAL ───────────────────────────────────────────────
function AnnouncementDetails({ announcement, onClose }) {
  if (!announcement) return null;

  const getCategoryIcon = (category) => {
    const icons = {
      general: "fa-solid fa-megaphone",
      urgent: "fa-solid fa-exclamation-triangle",
      events: "fa-solid fa-calendar-alt",
      training: "fa-solid fa-graduation-cap",
    };
    return icons[category] || "fa-solid fa-bullhorn";
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: "#6b7280",
      urgent: "#ef4444",
      events: "#3b82f6",
      training: "#10b981",
    };
    return colors[category] || "#6b7280";
  };

  const getCategoryLabel = (category) => {
    const labels = {
      general: "General",
      urgent: "Urgent",
      events: "Event",
      training: "Training",
    };
    return labels[category] || category;
  };

  const getTargetRoleDisplay = (targetRole) => {
    if (targetRole === "all") return "All Users";
    return targetRole
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getImageUrl = (announcement) => {
    const imagePath = announcement.image_path || announcement.image_url;
    if (!imagePath) return null;
    // ✅ Use relative path
    return `/${imagePath}`;
  };

  const categoryColor = getCategoryColor(announcement.category);
  const categoryIcon = getCategoryIcon(announcement.category);
  const imageUrl = getImageUrl(announcement);
  const postedDate = new Date(announcement.posted_at);
  const updatedDate = announcement.updated_at
    ? new Date(announcement.updated_at)
    : null;
  const isUrgent = announcement.category === "urgent";

  return (
    <div className="ua-overlay" onClick={onClose}>
      <div className="ua-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ua-modal__header">
          <h2 className="ua-modal__title">
            <i className="fa-regular fa-newspaper" />
            Announcement Details
          </h2>
          <button className="ua-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="ua-modal__body">
          {imageUrl && (
            <div className="ua-modal__image">
              <img
                src={imageUrl}
                alt={announcement.title}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                }}
              />
            </div>
          )}

          <div className="ua-modal__meta">
            <span
              className="ua-modal__badge"
              style={{
                background: `${categoryColor}15`,
                color: categoryColor,
                border: `1px solid ${categoryColor}30`,
              }}
            >
              <i className={categoryIcon} />
              {getCategoryLabel(announcement.category)}
            </span>

            <span className="ua-modal__badge ua-modal__badge--target">
              <i className="fa-solid fa-users" />
              {getTargetRoleDisplay(announcement.target_role)}
            </span>

            <span className="ua-modal__badge ua-modal__badge--date">
              <i className="fa-regular fa-calendar" />
              {postedDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>

            {isUrgent && (
              <span className="ua-modal__badge ua-modal__badge--urgent">
                <i className="fa-solid fa-exclamation-triangle" />
                URGENT
              </span>
            )}
          </div>

          <h1 className="ua-modal__title-text">{announcement.title}</h1>

          <div className="ua-modal__content">
            {announcement.content.split("\n").map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {announcement.created_by_name && (
            <div className="ua-modal__footer">
              <div className="ua-modal__footer-left">
                <i className="fa-regular fa-circle-user" />
                <span>
                  Posted by <strong>{announcement.created_by_name}</strong>
                </span>
              </div>
              {updatedDate && updatedDate > postedDate && (
                <div className="ua-modal__footer-right">
                  <i className="fa-regular fa-pen-to-square" />
                  <span>Updated {updatedDate.toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function UserAnnouncement() {
  const { id } = useParams();
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [toast, setToast] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [search, categoryFilter, announcements]);

  const fetchAnnouncements = async () => {
    try {
      // ✅ Using centralized API - no hardcoded URLs!
      const { data } = await api.get("/api/announcements.php");

      if (data.success) {
        // Filter only published announcements
        const publishedAnnouncements = data.data.filter(
          (a) => a.status === "published",
        );
        setAnnouncements(publishedAnnouncements);

        // If there's an ID in the URL, find and select that announcement
        if (id) {
          const selected = publishedAnnouncements.find(
            (a) => a.announcement_id === parseInt(id),
          );
          if (selected) {
            setSelectedAnnouncement(selected);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      showToast(
        error.response?.data?.message || "Failed to load announcements",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = [...announcements];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchLower) ||
          a.content.toLowerCase().includes(searchLower),
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((a) => a.category === categoryFilter);
    }

    // Sort by posted date (newest first)
    filtered.sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at));

    setFilteredAnnouncements(filtered);
  };

  const handleCardClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    // Update URL without page reload
    window.history.pushState(
      {},
      "",
      `/announcements/${announcement.announcement_id}`,
    );
  };

  const handleModalClose = () => {
    setSelectedAnnouncement(null);
    // Remove ID from URL
    window.history.pushState({}, "", "/announcements");
  };

  const clearSearch = () => {
    setSearch("");
  };

  const categoryOptions = [
    {
      value: "all",
      label: "All Categories",
      icon: "fa-solid fa-newspaper",
      color: "#6b7280",
    },
    {
      value: "general",
      label: "General",
      icon: "fa-solid fa-megaphone",
      color: "#6b7280",
    },
    {
      value: "urgent",
      label: "Urgent",
      icon: "fa-solid fa-exclamation-triangle",
      color: "#ef4444",
    },
    {
      value: "events",
      label: "Events",
      icon: "fa-solid fa-calendar-alt",
      color: "#3b82f6",
    },
    {
      value: "training",
      label: "Training",
      icon: "fa-solid fa-graduation-cap",
      color: "#10b981",
    },
  ];

  const getCategoryCount = (category) => {
    if (category === "all") return announcements.length;
    return announcements.filter((a) => a.category === category).length;
  };

  const isNewAnnouncement = (date) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(date) > sevenDaysAgo;
  };

  return (
    <div className="ua-root">
      {/* Header with Wave Effect */}
      <div className="ua-header">
        <div className="ua-header__container">
          <div className="ua-header__content">
            <div className="ua-header__left">
              <div className="ua-header__badge">
                <i className="fa-regular fa-newspaper" />
                Announcements
              </div>
              <h1 className="ua-header__title">Latest News & Updates</h1>
              <p className="ua-header__subtitle">
                Stay informed with the latest announcements from Philippine Red
                Cross
              </p>
            </div>
            <div className="ua-header__stats">
              <div className="ua-header-stat">
                <span className="ua-header-stat__value">
                  {announcements.length}
                </span>
                <span className="ua-header-stat__label">
                  Total Announcements
                </span>
              </div>
              <div className="ua-header-stat">
                <span className="ua-header-stat__value">
                  {announcements.filter((a) => a.category === "urgent").length}
                </span>
                <span className="ua-header-stat__label">Urgent</span>
              </div>
            </div>
          </div>
        </div>
        <div className="ua-header__wave">
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
      <div className="ua-body">
        {/* Filters */}
        <div className="ua-filters">
          <div className="ua-filters__search">
            <i className="fa-solid fa-magnifying-glass ua-filters__search-icon" />
            <input
              type="text"
              className="ua-filters__search-input"
              placeholder="Search announcements by title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="ua-filters__search-clear"
                onClick={clearSearch}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          <div className="ua-filters__categories">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                className={`ua-filters__category-btn ${
                  categoryFilter === option.value
                    ? "ua-filters__category-btn--active"
                    : ""
                }`}
                onClick={() => setCategoryFilter(option.value)}
                onMouseEnter={() => setHoveredCategory(option.value)}
                onMouseLeave={() => setHoveredCategory(null)}
                style={{
                  borderColor:
                    categoryFilter === option.value ||
                    hoveredCategory === option.value
                      ? option.color
                      : undefined,
                  background:
                    categoryFilter === option.value
                      ? `${option.color}15`
                      : hoveredCategory === option.value
                        ? `${option.color}08`
                        : undefined,
                  color:
                    categoryFilter === option.value ||
                    hoveredCategory === option.value
                      ? option.color
                      : undefined,
                }}
              >
                <i className={option.icon} />
                {option.label}
                <span
                  className="ua-filters__category-count"
                  style={{
                    backgroundColor:
                      categoryFilter === option.value
                        ? `${option.color}30`
                        : undefined,
                  }}
                >
                  {getCategoryCount(option.value)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Announcements Grid */}
        {loading ? (
          <div className="ua-loading">
            <div className="ua-loading__spinner">
              <i className="fa-solid fa-spinner fa-spin" />
            </div>
            <p>Loading announcements...</p>
            <span className="ua-loading__subtitle">
              Fetching latest updates
            </span>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="ua-empty">
            <div className="ua-empty__icon">
              <i className="fa-regular fa-newspaper" />
            </div>
            <h3 className="ua-empty__title">No Announcements Found</h3>
            <p className="ua-empty__message">
              {search || categoryFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "There are no announcements available at the moment."}
            </p>
            {(search || categoryFilter !== "all") && (
              <button
                className="ua-empty__action"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                }}
              >
                <i className="fa-solid fa-times" />
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="ua-grid">
            {filteredAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.announcement_id}
                announcement={announcement}
                onClick={handleCardClick}
                isNew={isNewAnnouncement(announcement.posted_at)}
              />
            ))}
          </div>
        )}

        {/* Announcement Count */}
        {!loading && filteredAnnouncements.length > 0 && (
          <div className="ua-count">
            <i className="fa-regular fa-eye" />
            Showing <strong>{filteredAnnouncements.length}</strong> of{" "}
            <strong>{announcements.length}</strong> announcements
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedAnnouncement && (
        <AnnouncementDetails
          announcement={selectedAnnouncement}
          onClose={handleModalClose}
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
