// UserAnnouncement.jsx
// Path: src/pages/UserAnnouncement/UserAnnouncement.jsx

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "./UserAnnouncement.scss";

// ─── TOAST COMPONENT ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`ua-toast ua-toast--${type}`} onClick={onClose}>
      <i
        className={`fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`}
      />
      <span>{message}</span>
      <button className="ua-toast__close" onClick={onClose}>
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}

// ─── ANNOUNCEMENT CARD ────────────────────────────────────────────────────────
function AnnouncementCard({ announcement, onClick }) {
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

  const getImageUrl = (announcement) => {
    const imagePath = announcement.image_path || announcement.image_url;
    if (!imagePath) return null;
    return `http://localhost/prc-management-system/${imagePath}`;
  };

  const imageUrl = getImageUrl(announcement);
  const categoryColor = getCategoryColor(announcement.category);
  const categoryIcon = getCategoryIcon(announcement.category);

  return (
    <div className="ua-card" onClick={() => onClick(announcement)}>
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
          <div className="ua-card__image-placeholder">
            <i className={categoryIcon} />
            <span>No Image</span>
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
              border: `1px solid ${categoryColor}33`,
            }}
          >
            <i className={categoryIcon} />
            {announcement.category.charAt(0).toUpperCase() +
              announcement.category.slice(1)}
          </span>
          <span className="ua-card__date">
            <i className="fa-regular fa-calendar" />
            {new Date(announcement.posted_at).toLocaleDateString("en-US", {
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
            Read More <i className="fa-solid fa-arrow-right" />
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
    return `http://localhost/prc-management-system/${imagePath}`;
  };

  const categoryColor = getCategoryColor(announcement.category);
  const categoryIcon = getCategoryIcon(announcement.category);
  const imageUrl = getImageUrl(announcement);

  return (
    <div className="ua-overlay" onClick={onClose}>
      <div className="ua-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ua-modal__header">
          <h2 className="ua-modal__title">Announcement Details</h2>
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
                border: `1px solid ${categoryColor}33`,
              }}
            >
              <i className={categoryIcon} />
              {announcement.category.charAt(0).toUpperCase() +
                announcement.category.slice(1)}
            </span>

            <span className="ua-modal__badge ua-modal__badge--target">
              <i className="fa-solid fa-users" />
              {getTargetRoleDisplay(announcement.target_role)}
            </span>

            <span className="ua-modal__badge ua-modal__badge--date">
              <i className="fa-regular fa-calendar" />
              {new Date(announcement.posted_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <h1 className="ua-modal__title-text">{announcement.title}</h1>

          <div className="ua-modal__content">
            {announcement.content.split("\n").map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {announcement.created_by_name && (
            <div className="ua-modal__footer">
              <i className="fa-regular fa-user" />
              Posted by {announcement.created_by_name}
              {announcement.updated_at && (
                <span className="ua-modal__updated">
                  • Updated{" "}
                  {new Date(announcement.updated_at).toLocaleDateString()}
                </span>
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
      const response = await fetch(
        "http://localhost/prc-management-system/backend/api/announcements.php",
      );
      const data = await response.json();
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
      showToast("Failed to load announcements", "error");
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
    { value: "all", label: "All Categories", icon: "fa-solid fa-newspaper" },
    { value: "general", label: "General", icon: "fa-solid fa-megaphone" },
    {
      value: "urgent",
      label: "Urgent",
      icon: "fa-solid fa-exclamation-triangle",
    },
    { value: "events", label: "Events", icon: "fa-solid fa-calendar-alt" },
    {
      value: "training",
      label: "Training",
      icon: "fa-solid fa-graduation-cap",
    },
  ];

  return (
    <div className="ua-root">
      {/* Header */}
      <div className="ua-header">
        <div className="ua-header__content">
          <div>
            <div className="ua-header__eyebrow">
              <i className="fa-regular fa-newspaper" />
              Announcements
            </div>
            <h1 className="ua-header__title">Latest News & Updates</h1>
            <p className="ua-header__subtitle">
              Stay informed with the latest announcements from Philippine Red
              Cross
            </p>
          </div>
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
              placeholder="Search announcements..."
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
              >
                <i className={option.icon} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements Grid */}
        {loading ? (
          <div className="ua-loading">
            <i className="fa-solid fa-spinner fa-spin" />
            <p>Loading announcements...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="ua-empty">
            <i className="fa-regular fa-newspaper" />
            <h3>No Announcements Found</h3>
            <p>
              {search || categoryFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "There are no announcements available at the moment."}
            </p>
            {(search || categoryFilter !== "all") && (
              <button
                className="ua-empty__clear"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                }}
              >
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
              />
            ))}
          </div>
        )}

        {/* Announcement Count */}
        {!loading && filteredAnnouncements.length > 0 && (
          <div className="ua-count">
            Showing {filteredAnnouncements.length} of {announcements.length}{" "}
            announcements
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
