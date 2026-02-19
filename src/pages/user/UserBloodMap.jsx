// UserBloodMap.jsx
// Path: src/pages/UserBloodMap/UserBloodMap.jsx

import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./UserBloodMap.scss";
import {
  getBloodInventory,
  BLOOD_TYPES,
  getBloodTypeColor,
  getStockStatus,
} from "../../services/bloodBankApi";

// Fix for default marker icons in react-leaflet for Vite
delete L.Icon.Default.prototype._getIconUrl;
// Import marker images directly
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ─── CUSTOM MARKER ICON ───────────────────────────────────────────────────────
const createCustomIcon = (color) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div class="marker-pin" style="background-color: ${color};">
             <i class="fa-solid fa-droplet"></i>
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

// ─── TOAST COMPONENT ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`ubm-toast ubm-toast--${type}`} onClick={onClose}>
      <i
        className={`fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`}
      />
      <span>{message}</span>
      <button className="ubm-toast__close" onClick={onClose}>
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}

// ─── BLOOD TYPE FILTER BUTTON ─────────────────────────────────────────────────
function BloodTypeFilter({ type, selected, onClick }) {
  const bloodTypeColor = getBloodTypeColor(type.value);

  return (
    <button
      className={`ubm-filter-btn ${selected ? "ubm-filter-btn--selected" : ""}`}
      onClick={() => onClick(type.value)}
      style={{
        backgroundColor: selected ? bloodTypeColor : `${bloodTypeColor}10`,
        color: selected ? "#fff" : bloodTypeColor,
        borderColor: bloodTypeColor,
      }}
    >
      <i className="fa-solid fa-droplet" />
      {type.value}
    </button>
  );
}

// ─── LOCATION CARD ────────────────────────────────────────────────────────────
function LocationCard({ location, bloodTypes, onViewLocation, onClick }) {
  // FIXED: Convert units_available to number before summing
  const totalUnits = bloodTypes.reduce(
    (sum, item) => sum + (Number(item.units_available) || 0),
    0,
  );
  const bloodTypesCount = bloodTypes.length;

  const getStatusColor = () => {
    const hasCritical = bloodTypes.some(
      (b) => Number(b.units_available) < 10 && Number(b.units_available) > 0,
    );
    const hasLow = bloodTypes.some(
      (b) => Number(b.units_available) < 20 && Number(b.units_available) >= 10,
    );
    const hasOut = bloodTypes.some((b) => Number(b.units_available) === 0);

    if (hasCritical) return "#ef4444";
    if (hasLow) return "#f59e0b";
    if (hasOut) return "#6b7280";
    return "#10b981";
  };

  return (
    <div
      className="ubm-location-card"
      onClick={() => {
        onViewLocation(location);
        if (onClick) onClick();
      }}
    >
      <div className="ubm-location-card__header">
        <h3>
          <i className="fa-solid fa-hospital" />
          {location}
        </h3>
        <span
          className="ubm-location-card__status"
          style={{ backgroundColor: getStatusColor() }}
        />
      </div>

      <div className="ubm-location-card__stats">
        <div className="ubm-location-card__stat">
          <span className="ubm-location-card__stat-label">Total Units</span>
          <span className="ubm-location-card__stat-value">{totalUnits}</span>
        </div>
        <div className="ubm-location-card__stat">
          <span className="ubm-location-card__stat-label">Blood Types</span>
          <span className="ubm-location-card__stat-value">
            {bloodTypesCount}
          </span>
        </div>
      </div>

      <div className="ubm-location-card__blood-types">
        {bloodTypes.slice(0, 4).map((item) => (
          <span
            key={item.id}
            className="ubm-location-card__blood-type"
            style={{
              backgroundColor: `${getBloodTypeColor(item.blood_type)}15`,
              color: getBloodTypeColor(item.blood_type),
              border: `1px solid ${getBloodTypeColor(item.blood_type)}33`,
            }}
          >
            {item.blood_type}
            <small>{Number(item.units_available)}</small>
          </span>
        ))}
        {bloodTypes.length > 4 && (
          <span className="ubm-location-card__blood-type-more">
            +{bloodTypes.length - 4} more
          </span>
        )}
      </div>

      <button className="ubm-location-card__btn">
        View Details
        <i className="fa-solid fa-arrow-right" />
      </button>
    </div>
  );
}

// ─── LOCATION DETAILS MODAL ───────────────────────────────────────────────────
function LocationDetailsModal({ location, bloodTypes, onClose }) {
  const [selectedBloodType, setSelectedBloodType] = useState(null);

  const handleCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber.replace(/\D/g, "")}`;
  };

  const handleDirections = (address) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      "_blank",
    );
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const locationBloodTypes = bloodTypes.filter(
    (b) => b.location_name === location,
  );
  const firstItem = locationBloodTypes[0];

  if (!firstItem) return null;

  // FIXED: Calculate total units for this location
  const locationTotalUnits = locationBloodTypes.reduce(
    (sum, item) => sum + (Number(item.units_available) || 0),
    0,
  );

  return (
    <div className="ubm-overlay" onClick={onClose}>
      <div className="ubm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ubm-modal__header">
          <h2 className="ubm-modal__title">
            <i className="fa-solid fa-hospital" />
            {location}
          </h2>
          <button className="ubm-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="ubm-modal__body">
          {/* Blood Types Grid */}
          <div className="ubm-modal__section">
            <h3>
              <i className="fa-solid fa-droplet" />
              Blood Inventory
            </h3>
            <div className="ubm-blood-grid">
              {locationBloodTypes.map((item) => {
                const color = getBloodTypeColor(item.blood_type);
                const status = getStockStatus(Number(item.units_available));

                return (
                  <div
                    key={item.id}
                    className={`ubm-blood-card ${selectedBloodType === item.blood_type ? "ubm-blood-card--selected" : ""}`}
                    onClick={() => setSelectedBloodType(item.blood_type)}
                    style={{
                      borderColor: color,
                      backgroundColor:
                        selectedBloodType === item.blood_type
                          ? `${color}10`
                          : "#fff",
                    }}
                  >
                    <div className="ubm-blood-card__type" style={{ color }}>
                      {item.blood_type}
                    </div>
                    <div className="ubm-blood-card__units">
                      {Number(item.units_available)}
                    </div>
                    <div
                      className="ubm-blood-card__status"
                      style={{
                        backgroundColor: `${status.color}15`,
                        color: status.color,
                      }}
                    >
                      {Number(item.units_available) === 0
                        ? "Out"
                        : status.label}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="ubm-location-total">
              <strong>Total Units:</strong> {locationTotalUnits}
            </div>
          </div>

          {/* Contact Information */}
          <div className="ubm-modal__section">
            <h3>
              <i className="fa-solid fa-address-book" />
              Contact Information
            </h3>
            <div className="ubm-contact-info">
              <div className="ubm-contact-item">
                <i className="fa-solid fa-phone" />
                <div className="ubm-contact-item__content">
                  <span className="ubm-contact-item__label">Phone:</span>
                  <button
                    className="ubm-contact-item__value ubm-contact-item__value--clickable"
                    onClick={() => handleCall(firstItem.contact_number)}
                  >
                    {firstItem.contact_number}
                  </button>
                  <button
                    className="ubm-contact-item__copy"
                    onClick={() => handleCopy(firstItem.contact_number)}
                    title="Copy phone number"
                  >
                    <i className="fa-regular fa-copy" />
                  </button>
                </div>
              </div>

              <div className="ubm-contact-item">
                <i className="fa-solid fa-location-dot" />
                <div className="ubm-contact-item__content">
                  <span className="ubm-contact-item__label">Address:</span>
                  <span className="ubm-contact-item__value">
                    {firstItem.address}
                  </span>
                  <button
                    className="ubm-contact-item__copy"
                    onClick={() => handleCopy(firstItem.address)}
                    title="Copy address"
                  >
                    <i className="fa-regular fa-copy" />
                  </button>
                </div>
              </div>

              <div className="ubm-contact-item">
                <i className="fa-solid fa-map-pin" />
                <div className="ubm-contact-item__content">
                  <span className="ubm-contact-item__label">Coordinates:</span>
                  <span className="ubm-contact-item__value">
                    {firstItem.latitude}, {firstItem.longitude}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="ubm-modal__actions">
            <button
              className="ubm-btn ubm-btn--primary"
              onClick={() => handleDirections(firstItem.address)}
            >
              <i className="fa-solid fa-location-arrow" />
              Get Directions
            </button>
            <button
              className="ubm-btn ubm-btn--secondary"
              onClick={() => handleCall(firstItem.contact_number)}
            >
              <i className="fa-solid fa-phone" />
              Call Now
            </button>
          </div>

          {/* Last Updated */}
          <div className="ubm-modal__footer">
            <i className="fa-regular fa-clock" />
            Last updated: {new Date(firstItem.updated_at).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function UserBloodMap() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [bloodTypeFilter, setBloodTypeFilter] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [map, setMap] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocationDetails, setSelectedLocationDetails] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await getBloodInventory();
      setInventory(response.data);
    } catch (error) {
      console.error("Error fetching blood inventory:", error);
      showToast("Failed to load blood inventory", "error");
    } finally {
      setLoading(false);
    }
  };

  // Group inventory by location - FIXED: Convert units_available to number
  const locations = inventory.reduce((acc, item) => {
    if (!acc[item.location_name]) {
      acc[item.location_name] = {
        location_name: item.location_name,
        address: item.address,
        contact_number: item.contact_number,
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        bloodTypes: [],
        totalUnits: 0,
      };
    }

    // Add blood type with units as number
    acc[item.location_name].bloodTypes.push({
      ...item,
      units_available: Number(item.units_available) || 0,
    });

    // FIXED: Use Number() for addition
    acc[item.location_name].totalUnits += Number(item.units_available) || 0;

    return acc;
  }, {});

  // Filter locations based on selected blood types and search
  const filteredLocations = Object.values(locations).filter((location) => {
    // Blood type filter
    if (bloodTypeFilter.length > 0) {
      const hasBloodType = location.bloodTypes.some((b) =>
        bloodTypeFilter.includes(b.blood_type),
      );
      if (!hasBloodType) return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        location.location_name.toLowerCase().includes(query) ||
        location.address.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleBloodTypeToggle = (type) => {
    setBloodTypeFilter((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const clearFilters = () => {
    setBloodTypeFilter([]);
    setSearchQuery("");
  };

  const handleViewLocation = (locationName) => {
    const location = locations[locationName];
    setSelectedLocationDetails(location);
    setShowLocationModal(true);
  };

  const getMarkerColor = (location) => {
    const hasCritical = location.bloodTypes.some(
      (b) => b.units_available < 10 && b.units_available > 0,
    );
    const hasLow = location.bloodTypes.some(
      (b) => b.units_available < 20 && b.units_available >= 10,
    );
    const hasOut = location.bloodTypes.some((b) => b.units_available === 0);

    if (hasCritical) return "#ef4444";
    if (hasLow) return "#f59e0b";
    if (hasOut) return "#6b7280";
    return "#10b981";
  };

  // Center map on filtered locations or default
  const getMapCenter = () => {
    if (filteredLocations.length > 0) {
      return {
        lat: filteredLocations[0].latitude,
        lng: filteredLocations[0].longitude,
      };
    }
    return { lat: 10.3157, lng: 123.8854 }; // Default to Cebu City
  };

  const flyToLocation = (lat, lng) => {
    if (map) {
      map.flyTo([lat, lng], 15, {
        duration: 1.5,
      });
    }
  };

  // FIXED: Calculate total units correctly for header stats
  const totalUnits = Object.values(locations).reduce(
    (sum, location) => sum + location.totalUnits,
    0,
  );

  return (
    <div className="ubm-root">
      {/* Header */}
      <div className="ubm-header">
        <div className="ubm-header__content">
          <div>
            <div className="ubm-header__eyebrow">
              <i className="fa-solid fa-map-location-dot" />
              Blood Map
            </div>
            <h1 className="ubm-header__title">Find Blood Near You</h1>
            <p className="ubm-header__subtitle">
              Locate blood banks and hospitals with available blood supplies
            </p>
          </div>
          <div className="ubm-header__stats">
            <div className="ubm-header__stat">
              <div className="ubm-header__stat-num">
                {Object.keys(locations).length}
              </div>
              <div className="ubm-header__stat-label">Locations</div>
            </div>
            <div className="ubm-header__stat">
              <div className="ubm-header__stat-num">{totalUnits}</div>
              <div className="ubm-header__stat-label">Total Units</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ubm-main">
        {/* Filters */}
        <div className="ubm-filters">
          <div className="ubm-filters__search">
            <i className="fa-solid fa-magnifying-glass ubm-filters__search-icon" />
            <input
              type="text"
              className="ubm-filters__search-input"
              placeholder="Search by location or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="ubm-filters__search-clear"
                onClick={() => setSearchQuery("")}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          <div className="ubm-filters__blood-types">
            <span className="ubm-filters__label">
              <i className="fa-solid fa-droplet" />
              Filter by Blood Type:
            </span>
            <div className="ubm-filters__buttons">
              {BLOOD_TYPES.map((type) => (
                <BloodTypeFilter
                  key={type.value}
                  type={type}
                  selected={bloodTypeFilter.includes(type.value)}
                  onClick={handleBloodTypeToggle}
                />
              ))}
            </div>
          </div>

          {(bloodTypeFilter.length > 0 || searchQuery) && (
            <button className="ubm-filters__clear" onClick={clearFilters}>
              <i className="fa-solid fa-xmark" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Map and Sidebar */}
        <div className="ubm-content">
          {/* Sidebar with location cards */}
          <div className="ubm-sidebar">
            <div className="ubm-sidebar__header">
              <h2>
                <i className="fa-solid fa-location-dot" />
                Available Locations
              </h2>
              <span className="ubm-sidebar__count">
                {filteredLocations.length} location
                {filteredLocations.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="ubm-sidebar__list">
              {loading ? (
                <div className="ubm-loading">
                  <i className="fa-solid fa-spinner fa-spin" />
                  <p>Loading locations...</p>
                </div>
              ) : filteredLocations.length === 0 ? (
                <div className="ubm-empty">
                  <i className="fa-regular fa-map" />
                  <h3>No Locations Found</h3>
                  <p>
                    {bloodTypeFilter.length > 0 || searchQuery
                      ? "Try adjusting your filters"
                      : "No blood inventory locations available"}
                  </p>
                </div>
              ) : (
                filteredLocations.map((location) => (
                  <LocationCard
                    key={location.location_name}
                    location={location.location_name}
                    bloodTypes={location.bloodTypes}
                    onViewLocation={handleViewLocation}
                    onClick={() =>
                      flyToLocation(location.latitude, location.longitude)
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* Map */}
          <div className="ubm-map-container">
            <MapContainer
              center={getMapCenter()}
              zoom={12}
              scrollWheelZoom={true}
              className="ubm-leaflet-map"
              whenCreated={setMap}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {filteredLocations.map((location) => {
                const markerColor = getMarkerColor(location);
                const customIcon = createCustomIcon(markerColor);

                return (
                  <Marker
                    key={location.location_name}
                    position={[location.latitude, location.longitude]}
                    icon={customIcon}
                    eventHandlers={{
                      click: () => {
                        flyToLocation(location.latitude, location.longitude);
                      },
                    }}
                  >
                    <Popup>
                      <div className="ubm-popup">
                        <h4>{location.location_name}</h4>
                        <p className="ubm-popup__address">{location.address}</p>
                        <div className="ubm-popup__stats">
                          <div className="ubm-popup__stat">
                            <i className="fa-solid fa-droplet" />
                            <span>{location.bloodTypes.length} types</span>
                          </div>
                          <div className="ubm-popup__stat">
                            <i className="fa-solid fa-boxes" />
                            <span>{location.totalUnits} units</span>
                          </div>
                        </div>
                        <div className="ubm-popup__blood-types">
                          {location.bloodTypes.slice(0, 3).map((item) => (
                            <span
                              key={item.id}
                              className="ubm-popup__blood-type"
                              style={{
                                backgroundColor: `${getBloodTypeColor(item.blood_type)}15`,
                                color: getBloodTypeColor(item.blood_type),
                              }}
                            >
                              {item.blood_type}: {item.units_available}
                            </span>
                          ))}
                        </div>
                        <button
                          className="ubm-popup__btn"
                          onClick={() =>
                            handleViewLocation(location.location_name)
                          }
                        >
                          View Details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Legend */}
        <div className="ubm-legend">
          <div className="ubm-legend__title">
            <i className="fa-solid fa-info-circle" />
            Status Indicators
          </div>
          <div className="ubm-legend__items">
            <div className="ubm-legend__item">
              <span
                className="ubm-legend__dot"
                style={{ backgroundColor: "#10b981" }}
              />
              <span>Normal Stock (&ge;20 units)</span>
            </div>
            <div className="ubm-legend__item">
              <span
                className="ubm-legend__dot"
                style={{ backgroundColor: "#f59e0b" }}
              />
              <span>Low Stock (10-19 units)</span>
            </div>
            <div className="ubm-legend__item">
              <span
                className="ubm-legend__dot"
                style={{ backgroundColor: "#ef4444" }}
              />
              <span>Critical Stock (1-9 units)</span>
            </div>
            <div className="ubm-legend__item">
              <span
                className="ubm-legend__dot"
                style={{ backgroundColor: "#6b7280" }}
              />
              <span>Out of Stock</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Details Modal */}
      {showLocationModal && selectedLocationDetails && (
        <LocationDetailsModal
          location={selectedLocationDetails.location_name}
          bloodTypes={selectedLocationDetails.bloodTypes}
          onClose={() => setShowLocationModal(false)}
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
