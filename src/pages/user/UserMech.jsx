// UserMerch.jsx
// Path: src/pages/UserMerch/UserMerch.jsx

import { useState, useEffect, useCallback } from "react";
import "./UserMerch.scss";
import {
  getMerchandise,
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
    <div className={`um-toast um-toast--${type}`} onClick={onClose}>
      <i
        className={`fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`}
      />
      <span>{message}</span>
      <button className="um-toast__close" onClick={onClose}>
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}

// ─── MERCHANDISE CARD ─────────────────────────────────────────────────────────
function MerchandiseCard({ item, onViewDetails }) {
  const categoryColor = getCategoryColor(item.category);
  const categoryIcon = getCategoryIcon(item.category);
  const imageUrl = getImageUrl(item);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="um-card">
      <div className="um-card__image">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={item.name}
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className="um-card__image-placeholder"
            style={{
              background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)`,
            }}
          >
            <i className={categoryIcon} />
          </div>
        )}
        {item.stock_quantity === 0 && (
          <div className="um-card__out-of-stock">
            <span>Out of Stock</span>
          </div>
        )}
      </div>

      <div className="um-card__content">
        <div className="um-card__header">
          <span
            className="um-card__category"
            style={{
              background: `${categoryColor}15`,
              color: categoryColor,
              border: `1px solid ${categoryColor}33`,
            }}
          >
            <i className={categoryIcon} />
            {formatCategory(item.category)}
          </span>
          <span className="um-card__stock">
            <i className="fa-solid fa-boxes" />
            {item.stock_quantity} left
          </span>
        </div>

        <h3 className="um-card__title">{item.name}</h3>

        {item.description && (
          <p className="um-card__description">
            {item.description.length > 100
              ? item.description.substring(0, 100) + "..."
              : item.description}
          </p>
        )}

        <div className="um-card__footer">
          <span className="um-card__price">{formatPrice(item.price)}</span>
          <button className="um-card__btn" onClick={() => onViewDetails(item)}>
            View Details <i className="fa-solid fa-arrow-right" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DETAILS MODAL ────────────────────────────────────────────────────────────
function DetailsModal({ item, onClose }) {
  if (!item) return null;

  const categoryColor = getCategoryColor(item.category);
  const categoryIcon = getCategoryIcon(item.category);
  const imageUrl = getImageUrl(item);
  const [imageError, setImageError] = useState(false);

  const handleCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber.replace(/\s/g, "")}`;
  };

  const handleEmail = (email) => {
    window.location.href = `mailto:${email}`;
  };

  const handleDirections = () => {
    const address = encodeURIComponent(
      "Brgy. Danao, Bonifacio Drive, Iloilo City, 5000",
    );
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${address}`,
      "_blank",
    );
  };

  return (
    <div className="um-overlay" onClick={onClose}>
      <div className="um-modal" onClick={(e) => e.stopPropagation()}>
        <div className="um-modal__header">
          <h2 className="um-modal__title">Item Details</h2>
          <button className="um-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="um-modal__body">
          <div className="um-modal__image">
            {imageUrl && !imageError ? (
              <img
                src={imageUrl}
                alt={item.name}
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                className="um-modal__image-placeholder"
                style={{
                  background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)`,
                }}
              >
                <i className={categoryIcon} />
              </div>
            )}
          </div>

          <div className="um-modal__info">
            <div className="um-modal__badges">
              <span
                className="um-modal__badge"
                style={{
                  background: `${categoryColor}15`,
                  color: categoryColor,
                  border: `1px solid ${categoryColor}33`,
                }}
              >
                <i className={categoryIcon} />
                {formatCategory(item.category)}
              </span>
              <span
                className="um-modal__badge"
                style={{
                  background:
                    item.stock_quantity > 0 ? "#10b98115" : "#ef444415",
                  color: item.stock_quantity > 0 ? "#10b981" : "#ef4444",
                  border:
                    item.stock_quantity > 0
                      ? "1px solid #10b98133"
                      : "1px solid #ef444433",
                }}
              >
                <i
                  className={
                    item.stock_quantity > 0
                      ? "fa-solid fa-check-circle"
                      : "fa-solid fa-exclamation-circle"
                  }
                />
                {item.stock_quantity > 0
                  ? `${item.stock_quantity} in stock`
                  : "Out of Stock"}
              </span>
            </div>

            <h1 className="um-modal__title-text">{item.name}</h1>

            <div className="um-modal__price">{formatPrice(item.price)}</div>

            {item.description && (
              <div className="um-modal__description">
                <h3>Description</h3>
                <p>{item.description}</p>
              </div>
            )}

            {/* Important Notice */}
            <div className="um-modal__notice">
              <h4>
                <i className="fa-solid fa-info-circle" />
                Important Purchase Information
              </h4>
              <p>
                <strong>Please Note:</strong> The Philippine Red Cross
                merchandise store currently operates as a display-only catalog.
                We do not offer online purchasing or delivery services at this
                time.
              </p>
            </div>

            {/* Chapter Information */}
            <div className="um-modal__chapter">
              <h4>
                <i className="fa-solid fa-location-dot" />
                Visit Your Nearest Chapter
              </h4>

              <div className="um-modal__contact">
                <button
                  className="um-modal__contact-item um-modal__contact-item--clickable"
                  onClick={() => handleCall("(033) 503-3393")}
                >
                  <i className="fa-solid fa-phone" />
                  <span>(033) 503-3393</span>
                </button>

                <button
                  className="um-modal__contact-item um-modal__contact-item--clickable"
                  onClick={() => handleCall("09171170066")}
                >
                  <i className="fa-solid fa-mobile" />
                  <span>0917 117 0066</span>
                </button>

                <button
                  className="um-modal__contact-item um-modal__contact-item--clickable"
                  onClick={() => handleEmail("iloilo@redcross.org.ph")}
                >
                  <i className="fa-regular fa-envelope" />
                  <span>iloilo@redcross.org.ph</span>
                </button>

                <div className="um-modal__contact-item">
                  <i className="fa-solid fa-location-dot" />
                  <span>Brgy. Danao, Bonifacio Drive, Iloilo City, 5000</span>
                </div>
              </div>

              <button
                className="um-modal__directions-btn"
                onClick={handleDirections}
              >
                <i className="fa-solid fa-location-arrow" />
                Get Directions
              </button>
            </div>

            {/* Stock Disclaimer */}
            <div className="um-modal__disclaimer">
              <i className="fa-solid fa-clock" />
              <p>
                Stock levels shown are for reference only and may not reflect
                real-time availability. Please confirm product availability when
                visiting in person.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function UserMerch() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [search, categoryFilter, items]);

  const fetchItems = async () => {
    try {
      const response = await getMerchandise();
      // Only show available items on user side
      const availableItems = response.data.filter((item) => item.is_available);
      setItems(availableItems);
    } catch (error) {
      console.error("Error fetching merchandise:", error);
      showToast("Failed to load merchandise", "error");
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          (item.description &&
            item.description.toLowerCase().includes(searchLower)),
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    setFilteredItems(filtered);
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const clearSearch = () => {
    setSearch("");
  };

  return (
    <div className="um-root">
      {/* Header */}
      <div className="um-header">
        <div className="um-header__content">
          <div>
            <div className="um-header__eyebrow">
              <i className="fa-solid fa-store" />
              PRC Merchandise
            </div>
            <h1 className="um-header__title">Support the Cause</h1>
            <p className="um-header__subtitle">
              Browse our collection of official Philippine Red Cross merchandise
            </p>
          </div>
          <div className="um-header__stats">
            <div className="um-header__stat">
              <div className="um-header__stat-num">{items.length}</div>
              <div className="um-header__stat-label">Available Items</div>
            </div>
            <div className="um-header__stat">
              <div className="um-header__stat-num">
                {items.reduce((sum, item) => sum + item.stock_quantity, 0)}
              </div>
              <div className="um-header__stat-label">Total Stock</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="um-body">
        {/* Important Notice Banner */}
        <div className="um-notice-banner">
          <i className="fa-solid fa-info-circle" />
          <div>
            <strong>Display-Only Catalog:</strong> The Philippine Red Cross
            merchandise store currently operates as a display-only catalog. We
            do not offer online purchasing or delivery services at this time.
            Please visit our chapter to purchase items.
          </div>
        </div>

        {/* Filters */}
        <div className="um-filters">
          <div className="um-filters__search">
            <i className="fa-solid fa-magnifying-glass um-filters__search-icon" />
            <input
              type="text"
              className="um-filters__search-input"
              placeholder="Search merchandise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="um-filters__search-clear"
                onClick={clearSearch}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          <div className="um-filters__categories">
            <button
              className={`um-filters__category-btn ${
                categoryFilter === "all"
                  ? "um-filters__category-btn--active"
                  : ""
              }`}
              onClick={() => setCategoryFilter("all")}
            >
              <i className="fa-solid fa-grid-2" />
              All Items
            </button>
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`um-filters__category-btn ${
                  categoryFilter === option.value
                    ? "um-filters__category-btn--active"
                    : ""
                }`}
                onClick={() => setCategoryFilter(option.value)}
                style={{
                  borderColor:
                    categoryFilter === option.value ? option.color : undefined,
                  background:
                    categoryFilter === option.value
                      ? `${option.color}10`
                      : undefined,
                }}
              >
                <i className={option.icon} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Merchandise Grid */}
        {loading ? (
          <div className="um-loading">
            <i className="fa-solid fa-spinner fa-spin" />
            <p>Loading merchandise...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="um-empty">
            <i className="fa-solid fa-store" />
            <h3>No Items Found</h3>
            <p>
              {search || categoryFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "There are no merchandise items available at the moment."}
            </p>
            {(search || categoryFilter !== "all") && (
              <button
                className="um-empty__clear"
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
          <div className="um-grid">
            {filteredItems.map((item) => (
              <MerchandiseCard
                key={item.merch_id}
                item={item}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {/* Chapter Information Card */}
        <div className="um-chapter-card">
          <h3>
            <i className="fa-solid fa-building" />
            Iloilo Chapter
          </h3>
          <div className="um-chapter-card__contact">
            <div className="um-chapter-card__item">
              <i className="fa-solid fa-phone" />
              <div>
                <span className="um-chapter-card__label">Landline:</span>
                <button
                  className="um-chapter-card__value um-chapter-card__value--clickable"
                  onClick={() => (window.location.href = "tel:0335033393")}
                >
                  (033) 503-3393
                </button>
              </div>
            </div>
            <div className="um-chapter-card__item">
              <i className="fa-solid fa-mobile" />
              <div>
                <span className="um-chapter-card__label">Mobile:</span>
                <button
                  className="um-chapter-card__value um-chapter-card__value--clickable"
                  onClick={() => (window.location.href = "tel:09171170066")}
                >
                  0917 117 0066
                </button>
              </div>
            </div>
            <div className="um-chapter-card__item">
              <i className="fa-regular fa-envelope" />
              <div>
                <span className="um-chapter-card__label">Email:</span>
                <button
                  className="um-chapter-card__value um-chapter-card__value--clickable"
                  onClick={() =>
                    (window.location.href = "mailto:iloilo@redcross.org.ph")
                  }
                >
                  iloilo@redcross.org.ph
                </button>
              </div>
            </div>
            <div className="um-chapter-card__item">
              <i className="fa-solid fa-location-dot" />
              <div>
                <span className="um-chapter-card__label">Address:</span>
                <span className="um-chapter-card__value">
                  Brgy. Danao, Bonifacio Drive, Iloilo City, 5000
                </span>
              </div>
            </div>
          </div>
          <button
            className="um-chapter-card__directions"
            onClick={() => {
              const address = encodeURIComponent(
                "Brgy. Danao, Bonifacio Drive, Iloilo City, 5000",
              );
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${address}`,
                "_blank",
              );
            }}
          >
            <i className="fa-solid fa-location-arrow" />
            Get Directions
          </button>
          <p className="um-chapter-card__disclaimer">
            <i className="fa-solid fa-clock" />
            Stock levels shown are for reference only and may not reflect
            real-time availability. Please confirm product availability when
            visiting in person.
          </p>
        </div>
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <DetailsModal item={selectedItem} onClose={handleCloseModal} />
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
