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
  { key: "all", label: "All Requests", color: "#6b7280" },
  { key: "pending", label: "Pending", color: "#f59e0b" },
  { key: "under_review", label: "Under Review", color: "#3b82f6" },
  { key: "approved", label: "Approved", color: "#10b981" },
  { key: "scheduled", label: "Scheduled", color: "#8b5cf6" },
  { key: "completed", label: "Completed", color: "#059669" },
  { key: "rejected", label: "Rejected", color: "#ef4444" },
];

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`atr-toast atr-toast--${type}`} onClick={onClose}>
      <i
        className={`fas ${type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`}
      />
      {message}
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

  return (
    <div className="atr-overlay" onClick={onClose}>
      <div
        className="atr-modal atr-modal--xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="atr-modal__header">
          <span>
            <i className="fas fa-file-alt" /> Request Details #
            {request.request_id}
          </span>
          <button className="atr-modal__close" onClick={onClose}>
            <i className="fas fa-xmark" />
          </button>
        </div>

        <div className="atr-modal__body atr-modal__body--details">
          {/* Status Badge */}
          <div className="atr-detail-section">
            <span
              className={`atr-status-badge atr-status-badge--${request.status}`}
            >
              {request.status.toUpperCase().replace("_", " ")}
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
                <span className="atr-badge">{request.service_type}</span>
              </div>
              <div className="atr-detail-item">
                <label>Program</label>
                <span>{request.training_program}</span>
              </div>
              <div className="atr-detail-item">
                <label>Type</label>
                <span>{request.training_type?.replace("_", " ")}</span>
              </div>
              <div className="atr-detail-item">
                <label>Urgency</label>
                <span className={`atr-urgency atr-urgency--${request.urgency}`}>
                  {request.urgency?.toUpperCase()}
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
                  <span>
                    {new Date(
                      request.preferred_start_date,
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
              {request.preferred_end_date && (
                <div className="atr-detail-item">
                  <label>End Date</label>
                  <span>
                    {new Date(request.preferred_end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="atr-detail-item">
                <label>Duration</label>
                <span>{request.duration_days} day(s)</span>
              </div>
              {request.preferred_start_time && (
                <div className="atr-detail-item">
                  <label>Time</label>
                  <span>
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
                <label>Participant Count</label>
                <span>{request.participant_count}</span>
              </div>
              {request.organization_name && (
                <div className="atr-detail-item atr-detail-item--full">
                  <label>Organization</label>
                  <span>{request.organization_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="atr-detail-section">
            <h3 className="atr-detail-section__title">
              <i className="fas fa-address-book" /> Contact Information
            </h3>
            <div className="atr-detail-grid">
              <div className="atr-detail-item">
                <label>Contact Person</label>
                <span>{request.contact_person}</span>
              </div>
              <div className="atr-detail-item">
                <label>Phone</label>
                <span>{request.contact_number}</span>
              </div>
              <div className="atr-detail-item atr-detail-item--full">
                <label>Email</label>
                <span>{request.email}</span>
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
                    <span>{request.location_preference}</span>
                  </div>
                )}
                {request.venue_requirements && (
                  <div className="atr-detail-item atr-detail-item--full">
                    <label>Venue Requirements</label>
                    <span>{request.venue_requirements}</span>
                  </div>
                )}
                {request.equipment_needed && (
                  <div className="atr-detail-item atr-detail-item--full">
                    <label>Equipment Needed</label>
                    <span>{request.equipment_needed}</span>
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
                  <label>Purpose</label>
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
              <div className="atr-doc-list">
                {request.valid_id_request_path && (
                  <a
                    href={`http://localhost/prc-management-system/${request.valid_id_request_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="atr-doc-link"
                  >
                    <i className="fas fa-id-card" /> Valid ID
                  </a>
                )}
                {request.participant_list_path && (
                  <a
                    href={`http://localhost/prc-management-system/${request.participant_list_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="atr-doc-link"
                  >
                    <i className="fas fa-users" /> Participant List
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
                          className="atr-doc-link"
                        >
                          <i className="fas fa-file-alt" />{" "}
                          {filenames[idx] || `Document ${idx + 1}`}
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
          <div className="atr-detail-section">
            <h3 className="atr-detail-section__title">
              <i className="fas fa-tasks" /> Admin Actions
            </h3>

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
                placeholder="Add notes about this request..."
              />
            </div>

            <div className="atr-actions">
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

              {request.status === "approved" && !request.created_session_id && (
                <button
                  className="atr-btn atr-btn--success"
                  onClick={handleCreateSession}
                  disabled={processing}
                >
                  <i className="fas fa-plus-circle" /> Create Training Session
                </button>
              )}

              {request.created_session_id && (
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    background: "#d1fae5",
                    color: "#047857",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <i className="fas fa-check-circle" />
                  Training session created (ID: #{request.created_session_id})
                  {request.created_session_title &&
                    ` - ${request.created_session_title}`}
                </div>
              )}
            </div>
          </div>

          {/* Request Metadata */}
          <div className="atr-detail-section atr-detail-section--meta">
            <div className="atr-meta-grid">
              <div>
                <i className="fas fa-calendar-plus" /> Submitted:{" "}
                {new Date(request.created_at).toLocaleString()}
              </div>
              {request.reviewed_date && (
                <div>
                  <i className="fas fa-check-circle" /> Reviewed:{" "}
                  {new Date(request.reviewed_date).toLocaleString()}
                </div>
              )}
              {request.username && (
                <div>
                  <i className="fas fa-user" /> Submitted by: {request.username}
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

  return (
    <div className="atr-root">
      {/* HEADER */}
      <div className="atr-header">
        <div className="atr-header__inner">
          <div>
            <div className="atr-header__eyebrow">
              <i className="fas fa-inbox" /> Training Request Management
            </div>
            <h1 className="atr-header__title">Manage Training Requests</h1>
            <p className="atr-header__subtitle">
              Review and process training program requests from users
            </p>
          </div>
          <div className="atr-header__stats">
            <div>
              <div className="atr-header__stat-num">{totalRequests ?? "—"}</div>
              <div className="atr-header__stat-label">Total Requests</div>
            </div>
            {statusBreakdown
              .filter((s) => s.status === "pending")
              .map((s) => (
                <div key="pending">
                  <div className="atr-header__stat-num">{s.count}</div>
                  <div className="atr-header__stat-label">Pending</div>
                </div>
              ))}
            {statusBreakdown
              .filter((s) => s.status === "approved")
              .map((s) => (
                <div key="approved">
                  <div className="atr-header__stat-num">{s.count}</div>
                  <div className="atr-header__stat-label">Approved</div>
                </div>
              ))}
          </div>
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

            return (
              <button
                key={opt.key}
                className={`atr-filter-card${statusFilter === opt.key ? " atr-filter-card--active" : ""}`}
                style={{ borderColor: opt.color }}
                onClick={() => setStatusFilter(opt.key)}
              >
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
            <i className="fas fa-magnifying-glass atr-toolbar__search-icon" />
            <input
              className="atr-toolbar__search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requests..."
            />
            {search && (
              <button
                className="atr-toolbar__search-clear"
                onClick={() => setSearch("")}
              >
                <i className="fas fa-xmark" />
              </button>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="atr-table-panel">
          <div className="atr-table-panel__head">
            <span className="atr-table-panel__title">
              <i className="fas fa-list" /> All Training Requests
            </span>
            {!loading && (
              <span className="atr-table-panel__count">
                {requests.length} request{requests.length !== 1 ? "s" : ""}
              </span>
            )}
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
                        <i className="fas fa-spinner fa-spin" />
                        <p>Loading requests...</p>
                      </div>
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="atr-table__empty">
                        <i className="fas fa-inbox" />
                        <p>No training requests found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.request_id}>
                      <td>
                        <span className="atr-req-id">#{req.request_id}</span>
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
                        <span className="atr-badge">{req.service_type}</span>
                      </td>
                      <td>
                        <div className="atr-contact">
                          <div>{req.contact_person}</div>
                          <div className="atr-contact__email">{req.email}</div>
                        </div>
                      </td>
                      <td>{req.participant_count}</td>
                      <td>
                        {req.preferred_start_date ? (
                          <div className="atr-date">
                            {new Date(
                              req.preferred_start_date,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        ) : (
                          <span className="atr-muted">Flexible</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`atr-urgency atr-urgency--${req.urgency}`}
                        >
                          {req.urgency?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`atr-status atr-status--${req.status}`}
                        >
                          {req.status?.toUpperCase().replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <div className="atr-date">
                          {new Date(req.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          <button
                            className="atr-action-btn"
                            onClick={() => handleViewDetails(req)}
                            title="View Details"
                          >
                            <i className="fas fa-eye" />
                          </button>
                          {req.status === "approved" &&
                            !req.created_session_id && (
                              <button
                                className="atr-action-btn"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (
                                    !window.confirm(
                                      `Create training session for "${req.training_program}"?`,
                                    )
                                  )
                                    return;
                                  try {
                                    const res = await createSessionFromRequest(
                                      req.request_id,
                                    );
                                    showToast(
                                      `${res.message} (Session ID: ${res.session_id})`,
                                    );
                                    fetchRequests();
                                    refreshStats();
                                  } catch (err) {
                                    showToast(
                                      err.message || "Failed to create session",
                                      "error",
                                    );
                                  }
                                }}
                                title="Quick Create Session"
                                style={{
                                  background: "rgba(16, 185, 129, 0.08)",
                                  color: "#10b981",
                                  borderColor: "rgba(16, 185, 129, 0.15)",
                                }}
                              >
                                <i className="fas fa-plus-circle" />
                              </button>
                            )}
                          {req.created_session_id && (
                            <span
                              title={`Session created (ID: ${req.created_session_id})`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "0.25rem 0.5rem",
                                background: "rgba(16, 185, 129, 0.08)",
                                color: "#10b981",
                                borderRadius: "0.375rem",
                                fontSize: "0.625rem",
                                fontWeight: "600",
                              }}
                            >
                              <i
                                className="fas fa-check-circle"
                                style={{ fontSize: "0.625rem" }}
                              />
                            </span>
                          )}
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
