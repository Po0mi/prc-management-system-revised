// AdminTrainingRequest.jsx
// Path: src/pages/AdminTrainingRequest/AdminTrainingRequest.jsx

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminTrainingRequest.scss";
import {
  getTrainingRequests,
  getRequestDetails,
  updateRequestStatus,
  createSessionFromRequest,
  getRequestStats,
} from "../../services/trainingRequestsApi";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { key: "all", label: "All Requests", color: "#6b7280", icon: "fa-inbox" },
  { key: "pending", label: "Pending", color: "#f59e0b", icon: "fa-clock" },
  {
    key: "under_review",
    label: "Under Review",
    color: "#3b82f6",
    icon: "fa-magnifying-glass",
  },
  {
    key: "approved",
    label: "Approved",
    color: "#10b981",
    icon: "fa-check-circle",
  },
  {
    key: "scheduled",
    label: "Scheduled",
    color: "#8b5cf6",
    icon: "fa-calendar-check",
  },
  {
    key: "completed",
    label: "Completed",
    color: "#059669",
    icon: "fa-graduation-cap",
  },
  {
    key: "rejected",
    label: "Rejected",
    color: "#ef4444",
    icon: "fa-times-circle",
  },
];

const URGENCY_OPTIONS = [
  { key: "low", label: "Low", color: "#3b82f6", icon: "fa-arrow-down" },
  { key: "normal", label: "Normal", color: "#8b5cf6", icon: "fa-equals" },
  { key: "high", label: "High", color: "#f59e0b", icon: "fa-arrow-up" },
  {
    key: "urgent",
    label: "Urgent",
    color: "#ef4444",
    icon: "fa-exclamation-triangle",
  },
];

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`atr-toast atr-toast--${type}`} onClick={onClose}>
      <div className="atr-toast__icon">
        <i
          className={`fas ${type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`}
        />
      </div>
      <div className="atr-toast__content">
        <div className="atr-toast__title">
          {type === "success" ? "Success" : "Error"}
        </div>
        <div className="atr-toast__message">{message}</div>
      </div>
      <button className="atr-toast__close" onClick={onClose}>
        <i className="fas fa-xmark" />
      </button>
    </div>
  );
}

// ─── REQUEST DETAILS MODAL ───────────────────────────────────────────────────
function RequestDetailsModal({ request, onClose, onUpdate }) {
  const [statusAction, setStatusAction] = useState("");
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || "");
  const [processing, setProcessing] = useState(false);

  async function handleStatusUpdate() {
    if (!statusAction) return;

    setProcessing(true);
    try {
      await updateRequestStatus(request.request_id, statusAction, adminNotes);
      onUpdate?.();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleCreateSession() {
    if (!window.confirm("Create a training session from this request?")) return;

    setProcessing(true);
    try {
      const res = await createSessionFromRequest(request.request_id);
      alert(
        `${res.message}\n\nSession ID: ${res.session_id}\n\nYou can now view it in Admin Training Sessions.`,
      );
      onUpdate?.();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  }

  const urgencyConfig =
    URGENCY_OPTIONS.find((u) => u.key === request.urgency) ||
    URGENCY_OPTIONS[1];
  const statusConfig =
    STATUS_OPTIONS.find((s) => s.key === request.status) || STATUS_OPTIONS[0];

  return (
    <div className="atr-overlay" onClick={onClose}>
      <div
        className="atr-modal atr-modal--xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="atr-modal__header">
          <div className="atr-modal__title">
            <i className="fas fa-file-alt" /> Request Details #
            {request.request_id}
          </div>
          <button className="atr-modal__close" onClick={onClose}>
            <i className="fas fa-xmark" />
          </button>
        </div>

        <div className="atr-modal__body atr-modal__body--details">
          {/* Header with Status and Urgency */}
          <div className="atr-detail-header">
            <span
              className={`atr-status-badge atr-status-badge--${request.status}`}
            >
              <i className={`fas ${statusConfig.icon}`} />
              {statusConfig.label}
            </span>
            <span
              className={`atr-urgency-badge atr-urgency-badge--${request.urgency}`}
            >
              <i className={`fas ${urgencyConfig.icon}`} />
              {urgencyConfig.label} Priority
            </span>
          </div>

          {/* Training Program Info */}
          <div className="atr-detail-section">
            <h3 className="atr-detail-section__title">
              <i className="fas fa-graduation-cap" /> Training Program
            </h3>
            <div className="atr-detail-grid">
              <div className="atr-detail-item">
                <label>Service Type</label>
                <span className="atr-service-badge">
                  {request.service_type}
                </span>
              </div>
              <div className="atr-detail-item">
                <label>Program</label>
                <span className="atr-program-name">
                  {request.training_program}
                </span>
              </div>
              <div className="atr-detail-item">
                <label>Type</label>
                <span className="atr-training-type">
                  {request.training_type?.replace("_", " ")}
                </span>
              </div>
              <div className="atr-detail-item">
                <label>Duration</label>
                <span className="atr-duration">
                  {request.duration_days} day(s)
                </span>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="atr-detail-section">
            <h3 className="atr-detail-section__title">
              <i className="fas fa-calendar" /> Preferred Schedule
            </h3>
            <div className="atr-detail-grid">
              {request.preferred_start_date && (
                <div className="atr-detail-item">
                  <label>Start Date</label>
                  <span className="atr-date">
                    <i className="fas fa-calendar-alt" />
                    {new Date(request.preferred_start_date).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
              )}
              {request.preferred_end_date && (
                <div className="atr-detail-item">
                  <label>End Date</label>
                  <span className="atr-date">
                    <i className="fas fa-calendar-check" />
                    {new Date(request.preferred_end_date).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
              )}
              {request.preferred_start_time && (
                <div className="atr-detail-item">
                  <label>Time</label>
                  <span className="atr-time">
                    <i className="fas fa-clock" />
                    {request.preferred_start_time} -{" "}
                    {request.preferred_end_time}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Participant Info */}
          <div className="atr-detail-section">
            <h3 className="atr-detail-section__title">
              <i className="fas fa-users" /> Participant Information
            </h3>
            <div className="atr-detail-grid">
              <div className="atr-detail-item">
                <label>Number of Participants</label>
                <span className="atr-participant-count">
                  <i className="fas fa-user-group" />
                  {request.participant_count}
                </span>
              </div>
              {request.organization_name && (
                <div className="atr-detail-item atr-detail-item--full">
                  <label>Organization</label>
                  <span className="atr-organization">
                    <i className="fas fa-building" />
                    {request.organization_name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="atr-detail-section">
            <h3 className="atr-detail-section__title">
              <i className="fas fa-address-book" /> Contact Information
            </h3>
            <div className="atr-contact-grid">
              <div className="atr-contact-card">
                <i className="fas fa-user-circle" />
                <div>
                  <label>Contact Person</label>
                  <span>{request.contact_person}</span>
                </div>
              </div>
              <div className="atr-contact-card">
                <i className="fas fa-phone" />
                <div>
                  <label>Phone</label>
                  <span>{request.contact_number}</span>
                </div>
              </div>
              <div className="atr-contact-card atr-contact-card--full">
                <i className="fas fa-envelope" />
                <div>
                  <label>Email</label>
                  <span>{request.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Requirements */}
          {(request.location_preference ||
            request.venue_requirements ||
            request.equipment_needed) && (
            <div className="atr-detail-section">
              <h3 className="atr-detail-section__title">
                <i className="fas fa-map-marker-alt" /> Location & Requirements
              </h3>
              <div className="atr-detail-grid">
                {request.location_preference && (
                  <div className="atr-detail-item atr-detail-item--full">
                    <label>Location Preference</label>
                    <span className="atr-location">
                      <i className="fas fa-map-pin" />
                      {request.location_preference}
                    </span>
                  </div>
                )}
                {request.venue_requirements && (
                  <div className="atr-detail-item atr-detail-item--full">
                    <label>Venue Requirements</label>
                    <p className="atr-detail-text">
                      {request.venue_requirements}
                    </p>
                  </div>
                )}
                {request.equipment_needed && (
                  <div className="atr-detail-item atr-detail-item--full">
                    <label>Equipment Needed</label>
                    <p className="atr-detail-text">
                      {request.equipment_needed}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Purpose & Additional Requirements */}
          {(request.purpose || request.additional_requirements) && (
            <div className="atr-detail-section">
              <h3 className="atr-detail-section__title">
                <i className="fas fa-clipboard-list" /> Additional Information
              </h3>
              {request.purpose && (
                <div className="atr-detail-item atr-detail-item--full">
                  <label>Purpose / Objective</label>
                  <p className="atr-detail-text">{request.purpose}</p>
                </div>
              )}
              {request.additional_requirements && (
                <div className="atr-detail-item atr-detail-item--full">
                  <label>Additional Requirements</label>
                  <p className="atr-detail-text">
                    {request.additional_requirements}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Documents */}
          {(request.valid_id_request_path ||
            request.participant_list_path ||
            request.additional_docs_paths) && (
            <div className="atr-detail-section">
              <h3 className="atr-detail-section__title">
                <i className="fas fa-file-upload" /> Uploaded Documents
              </h3>
              <div className="atr-doc-grid">
                {request.valid_id_request_path && (
                  <a
                    href={`http://localhost/prc-management-system/${request.valid_id_request_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="atr-doc-card"
                  >
                    <i className="fas fa-id-card" />
                    <span>Valid ID</span>
                    <small>View Document</small>
                  </a>
                )}
                {request.participant_list_path && (
                  <a
                    href={`http://localhost/prc-management-system/${request.participant_list_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="atr-doc-card"
                  >
                    <i className="fas fa-users" />
                    <span>Participant List</span>
                    <small>View Document</small>
                  </a>
                )}
                {request.additional_docs_paths &&
                  (() => {
                    try {
                      const docs = JSON.parse(request.additional_docs_paths);
                      const filenames = request.additional_docs_filenames
                        ? JSON.parse(request.additional_docs_filenames)
                        : [];
                      return docs.map((doc, idx) => (
                        <a
                          key={idx}
                          href={`http://localhost/prc-management-system/${doc}`}
                          target="_blank"
                          rel="noreferrer"
                          className="atr-doc-card"
                        >
                          <i className="fas fa-file-alt" />
                          <span>{filenames[idx] || `Document ${idx + 1}`}</span>
                          <small>View Document</small>
                        </a>
                      ));
                    } catch (e) {
                      return null;
                    }
                  })()}
              </div>
            </div>
          )}

          {/* Admin Actions */}
          <div className="atr-detail-section atr-detail-section--actions">
            <h3 className="atr-detail-section__title">
              <i className="fas fa-tasks" /> Admin Actions
            </h3>

            <div className="atr-admin-panel">
              <div className="atr-form__field">
                <label className="atr-form__label">Update Status</label>
                <select
                  className="atr-form__select"
                  value={statusAction}
                  onChange={(e) => setStatusAction(e.target.value)}
                >
                  <option value="">Select new status...</option>
                  {STATUS_OPTIONS.filter((s) => s.key !== "all").map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="atr-form__field">
                <label className="atr-form__label">Admin Notes</label>
                <textarea
                  className="atr-form__textarea"
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this request..."
                />
              </div>

              <div className="atr-action-buttons">
                <button
                  className="atr-btn atr-btn--primary"
                  onClick={handleStatusUpdate}
                  disabled={!statusAction || processing}
                >
                  {processing ? (
                    <i className="fas fa-spinner fa-spin" />
                  ) : (
                    <i className="fas fa-save" />
                  )}
                  Update Status
                </button>

                {request.status === "approved" &&
                  !request.created_session_id && (
                    <button
                      className="atr-btn atr-btn--success"
                      onClick={handleCreateSession}
                      disabled={processing}
                    >
                      <i className="fas fa-plus-circle" /> Create Training
                      Session
                    </button>
                  )}
              </div>

              {request.created_session_id && (
                <div className="atr-session-created">
                  <i className="fas fa-check-circle" />
                  <div>
                    <strong>Training session created</strong>
                    <span>ID: #{request.created_session_id}</span>
                    {request.created_session_title && (
                      <span>{request.created_session_title}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Request Metadata */}
          <div className="atr-detail-section atr-detail-section--meta">
            <div className="atr-meta-grid">
              <div className="atr-meta-item">
                <i className="fas fa-calendar-plus" />
                <div>
                  <span className="atr-meta-label">Submitted</span>
                  <span className="atr-meta-value">
                    {new Date(request.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              {request.reviewed_date && (
                <div className="atr-meta-item">
                  <i className="fas fa-check-circle" />
                  <div>
                    <span className="atr-meta-label">Reviewed</span>
                    <span className="atr-meta-value">
                      {new Date(request.reviewed_date).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              {request.username && (
                <div className="atr-meta-item">
                  <i className="fas fa-user" />
                  <div>
                    <span className="atr-meta-label">Submitted by</span>
                    <span className="atr-meta-value">{request.username}</span>
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

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function AdminTrainingRequest() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [detailsRequest, setDetailsRequest] = useState(null);
  const [toast, setToast] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── STATS ──────────────────────────────────────────────────────────────────
  const refreshStats = useCallback(async () => {
    try {
      const { stats } = await getRequestStats();
      setStats(stats);
    } catch (err) {
      console.error("Stats error:", err);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // ── REQUESTS ───────────────────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { requests: reqs } = await getTrainingRequests({
        status: statusFilter,
        search,
      });
      setRequests(reqs);
    } catch (err) {
      console.error("Fetch requests error:", err);
      showToast(err.message || "Failed to load requests", "error");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleViewDetails(request) {
    try {
      const { request: details } = await getRequestDetails(request.request_id);
      setDetailsRequest(details);
    } catch (err) {
      showToast(err.message || "Failed to load details", "error");
    }
  }

  function handleRequestUpdate() {
    fetchRequests();
    refreshStats();
    setDetailsRequest(null);
    showToast("Request updated successfully");
  }

  const totalRequests = stats?.total ?? requests.length;
  const statusBreakdown = stats?.by_status || [];

  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (search) count++;
    return count;
  };

  const clearAllFilters = () => {
    setStatusFilter("all");
    setSearch("");
  };

  const pendingCount =
    statusBreakdown.find((s) => s.status === "pending")?.count || 0;
  const approvedCount =
    statusBreakdown.find((s) => s.status === "approved")?.count || 0;

  return (
    <div className="atr-root">
      {/* HEADER with Wave Effect */}
      <div className="atr-header">
        <div className="atr-header__container">
          <div className="atr-header__content">
            <div className="atr-header__left">
              <div className="atr-header__badge">
                <i className="fas fa-inbox" /> Training Request Management
              </div>
              <h1 className="atr-header__title">Manage Training Requests</h1>
              <p className="atr-header__subtitle">
                Review and process training program requests from users
              </p>
            </div>
            <div className="atr-header__stats">
              <div className="atr-header-stat">
                <span className="atr-header-stat__value">{totalRequests}</span>
                <span className="atr-header-stat__label">Total Requests</span>
              </div>
              <div className="atr-header-stat">
                <span className="atr-header-stat__value">{pendingCount}</span>
                <span className="atr-header-stat__label">Pending</span>
              </div>
              <div className="atr-header-stat">
                <span className="atr-header-stat__value">{approvedCount}</span>
                <span className="atr-header-stat__label">Approved</span>
              </div>
            </div>
          </div>
        </div>
        <div className="atr-header__wave">
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

      <div className="atr-body">
        {/* STATUS FILTERS */}
        <div className="atr-filters">
          {STATUS_OPTIONS.map((opt) => {
            const count =
              opt.key === "all"
                ? totalRequests
                : statusBreakdown.find((s) => s.status === opt.key)?.count || 0;
            const isActive = statusFilter === opt.key;

            return (
              <button
                key={opt.key}
                className={`atr-filter-card ${isActive ? "atr-filter-card--active" : ""}`}
                style={{
                  borderColor: opt.color,
                  background: isActive ? `${opt.color}08` : "white",
                }}
                onClick={() => setStatusFilter(opt.key)}
              >
                <i
                  className={`fas ${opt.icon}`}
                  style={{
                    color: opt.color,
                    fontSize: "1.25rem",
                    marginBottom: "0.5rem",
                  }}
                />
                <div
                  className="atr-filter-card__count"
                  style={{ color: opt.color }}
                >
                  {count}
                </div>
                <div className="atr-filter-card__label">{opt.label}</div>
              </button>
            );
          })}
        </div>

        {/* TOOLBAR */}
        <div className="atr-toolbar">
          <div className="atr-toolbar__search">
            <i className="fas fa-search atr-toolbar__search-icon" />
            <input
              className="atr-toolbar__search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by program, contact person, or email..."
            />
            {search && (
              <button
                className="atr-toolbar__search-clear"
                onClick={() => setSearch("")}
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>

          <div className="atr-toolbar__actions">
            {getActiveFilterCount() > 0 && (
              <button
                className="atr-toolbar__filter-clear"
                onClick={clearAllFilters}
              >
                <i className="fas fa-times" />
                Clear Filters ({getActiveFilterCount()})
              </button>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="atr-table-panel">
          <div className="atr-table-panel__head">
            <div className="atr-table-panel__title">
              <i className="fas fa-list" /> Training Requests
            </div>
            <div className="atr-table-panel__info">
              {!loading && (
                <>
                  <span className="atr-table-panel__count">
                    {requests.length} request{requests.length !== 1 ? "s" : ""}
                  </span>
                  <span className="atr-table-panel__divider">•</span>
                  <span className="atr-table-panel__sub">
                    Page 1 of {Math.ceil(requests.length / 10) || 1}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="atr-table-panel__scroll">
            <table className="atr-table">
              <thead>
                <tr>
                  <th>REQUEST ID</th>
                  <th>PROGRAM</th>
                  <th>SERVICE</th>
                  <th>CONTACT</th>
                  <th>PARTICIPANTS</th>
                  <th>PREFERRED DATE</th>
                  <th>URGENCY</th>
                  <th>STATUS</th>
                  <th>SUBMITTED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="atr-table__loading">
                        <div className="atr-table__loading-spinner">
                          <i className="fas fa-spinner fa-spin" />
                        </div>
                        <p>Loading requests...</p>
                        <span className="atr-table__loading-sub">
                          Fetching training requests
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="atr-table__empty">
                        <div className="atr-table__empty-icon">
                          <i className="fas fa-inbox" />
                        </div>
                        <h3 className="atr-table__empty-title">
                          No Requests Found
                        </h3>
                        <p className="atr-table__empty-message">
                          {search || statusFilter !== "all"
                            ? "Try adjusting your search or filter criteria"
                            : "No training requests have been submitted yet"}
                        </p>
                        {(search || statusFilter !== "all") && (
                          <button
                            className="atr-table__empty-action"
                            onClick={clearAllFilters}
                          >
                            <i className="fas fa-times" /> Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => {
                    const statusConfig =
                      STATUS_OPTIONS.find((s) => s.key === req.status) ||
                      STATUS_OPTIONS[0];
                    const urgencyConfig =
                      URGENCY_OPTIONS.find((u) => u.key === req.urgency) ||
                      URGENCY_OPTIONS[1];

                    return (
                      <tr
                        key={req.request_id}
                        onMouseEnter={() => setHoveredRow(req.request_id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className={
                          hoveredRow === req.request_id
                            ? "atr-table__row--hovered"
                            : ""
                        }
                      >
                        <td>
                          <span className="atr-req-id">
                            <i className="fas fa-hashtag" /> #{req.request_id}
                          </span>
                        </td>
                        <td>
                          <div className="atr-program">
                            <div className="atr-program__name">
                              {req.training_program}
                            </div>
                            <div className="atr-program__type">
                              {req.training_type?.replace("_", " ")}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="atr-service-badge">
                            {req.service_type}
                          </span>
                        </td>
                        <td>
                          <div className="atr-contact">
                            <div className="atr-contact__name">
                              {req.contact_person}
                            </div>
                            <div
                              className="atr-contact__email"
                              title={req.email}
                            >
                              <i className="fas fa-envelope" />
                              {req.email}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="atr-participant-count">
                            <i className="fas fa-user" />
                            {req.participant_count}
                          </span>
                        </td>
                        <td>
                          {req.preferred_start_date ? (
                            <div className="atr-date">
                              <i className="fas fa-calendar" />
                              {new Date(
                                req.preferred_start_date,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          ) : (
                            <span className="atr-flexible">
                              <i className="fas fa-calendar-alt" /> Flexible
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`atr-urgency atr-urgency--${req.urgency}`}
                            style={{
                              background: `${urgencyConfig.color}12`,
                              color: urgencyConfig.color,
                              border: `1px solid ${urgencyConfig.color}25`,
                            }}
                          >
                            <i className={`fas ${urgencyConfig.icon}`} />
                            {urgencyConfig.label}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`atr-status atr-status--${req.status}`}
                            style={{
                              background: `${statusConfig.color}12`,
                              color: statusConfig.color,
                              border: `1px solid ${statusConfig.color}25`,
                            }}
                          >
                            <i className={`fas ${statusConfig.icon}`} />
                            {req.status?.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <div className="atr-date">
                            <i className="fas fa-calendar-plus" />
                            {new Date(req.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="atr-actions">
                            <button
                              className="atr-action-btn atr-action-btn--view"
                              onClick={() => handleViewDetails(req)}
                              title="View Details"
                              style={{
                                background: "#3b82f612",
                                color: "#3b82f6",
                                border: "1px solid #3b82f625",
                              }}
                            >
                              <i className="fas fa-eye" />
                            </button>
                            {req.status === "approved" &&
                              !req.created_session_id && (
                                <button
                                  className="atr-action-btn atr-action-btn--create"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (
                                      !window.confirm(
                                        `Create training session for "${req.training_program}"?`,
                                      )
                                    )
                                      return;
                                    try {
                                      const res =
                                        await createSessionFromRequest(
                                          req.request_id,
                                        );
                                      showToast(
                                        `${res.message} (Session ID: ${res.session_id})`,
                                      );
                                      fetchRequests();
                                      refreshStats();
                                    } catch (err) {
                                      showToast(
                                        err.message ||
                                          "Failed to create session",
                                        "error",
                                      );
                                    }
                                  }}
                                  title="Quick Create Session"
                                  style={{
                                    background: "#10b98112",
                                    color: "#10b981",
                                    border: "1px solid #10b98125",
                                  }}
                                >
                                  <i className="fas fa-plus-circle" />
                                </button>
                              )}
                            {req.created_session_id && (
                              <span
                                className="atr-session-badge"
                                title={`Session created (ID: ${req.created_session_id})`}
                              >
                                <i className="fas fa-check-circle" />
                              </span>
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

      {/* DETAILS MODAL */}
      {detailsRequest && (
        <RequestDetailsModal
          request={detailsRequest}
          onClose={() => setDetailsRequest(null)}
          onUpdate={handleRequestUpdate}
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
