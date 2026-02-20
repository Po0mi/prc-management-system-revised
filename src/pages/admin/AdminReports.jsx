// src/pages/AdminReports/AdminReports.jsx
import { useState, useEffect, useCallback } from "react";
import {
  getReportSummary,
  getUsersReport,
  getEventsReport,
  getTrainingReport,
  getVolunteersReport,
  getInventoryReport,
  exportReport,
} from "../../services/reportsApi";
import "./AdminReports.scss";

// ─── TOAST COMPONENT ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`ar-toast ar-toast--${type}`} onClick={onClose}>
      <i
        className={`fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`}
      />
      <span>{message}</span>
      <button className="ar-toast__close" onClick={onClose}>
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="ar-stat-card" style={{ "--card-color": color }}>
      <div className="ar-stat-card__icon">
        <i className={icon} />
      </div>
      <div className="ar-stat-card__content">
        <div className="ar-stat-card__value">{value}</div>
        <div className="ar-stat-card__label">{label}</div>
        {sub && <div className="ar-stat-card__sub">{sub}</div>}
      </div>
    </div>
  );
}

// ─── REPORT TABLE ─────────────────────────────────────────────────────────────
function ReportTable({ data, columns, onExport, reportType }) {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }
    return sortDirection === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  return (
    <div className="ar-report-table">
      <div className="ar-report-table__toolbar">
        <h3>{reportType} Report</h3>
        <button className="ar-export-btn" onClick={onExport}>
          <i className="fa-solid fa-download" /> Export to Excel
        </button>
      </div>
      <div className="ar-table-container">
        <table className="ar-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={col.sortable !== false ? "sortable" : ""}
                >
                  {col.label}
                  {sortField === col.key && (
                    <i
                      className={`fa-solid fa-chevron-${sortDirection === "asc" ? "up" : "down"}`}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="ar-table__empty">
                  <i className="fa-regular fa-folder-open" />
                  <p>No data available</p>
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr key={index}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminReports() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({});
  const [reportData, setReportData] = useState([]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "fa-solid fa-chart-pie" },
    { id: "users", label: "Users", icon: "fa-solid fa-users" },
    { id: "events", label: "Events", icon: "fa-solid fa-calendar-days" },
    { id: "training", label: "Training", icon: "fa-solid fa-graduation-cap" },
    { id: "volunteers", label: "Volunteers", icon: "fa-solid fa-hand-peace" },
    { id: "inventory", label: "Inventory", icon: "fa-solid fa-boxes" },
  ];

  // Load summary data
  useEffect(() => {
    loadSummary();
  }, []);

  // Load report data when tab changes
  useEffect(() => {
    if (activeTab !== "dashboard") {
      loadReportData(activeTab);
    }
  }, [activeTab, filters]);

  const loadSummary = async () => {
    setLoading(true);
    const result = await getReportSummary();
    if (result.success) {
      setSummary(result.data);
    } else {
      showToast(result.error, "error");
    }
    setLoading(false);
  };

  const loadReportData = async (type) => {
    setLoading(true);
    let result;
    switch (type) {
      case "users":
        result = await getUsersReport(filters);
        break;
      case "events":
        result = await getEventsReport(filters);
        break;
      case "training":
        result = await getTrainingReport(filters);
        break;
      case "volunteers":
        result = await getVolunteersReport(filters);
        break;
      case "inventory":
        result = await getInventoryReport(filters);
        break;
      default:
        result = { data: [] };
    }
    if (result.success) {
      setReportData(result.data);
    } else {
      showToast(result.error, "error");
    }
    setLoading(false);
  };

  const handleExport = async () => {
    const result = await exportReport(activeTab, filters);
    if (result.success) {
      showToast("Report exported successfully");
    } else {
      showToast(result.error, "error");
    }
  };

  const getColumnsForTab = (tab) => {
    switch (tab) {
      case "users":
        return [
          { key: "user_id", label: "ID" },
          { key: "username", label: "Username" },
          { key: "full_name", label: "Full Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "user_type", label: "Type" },
          {
            key: "created_at",
            label: "Joined",
            render: (val) => new Date(val).toLocaleDateString(),
          },
        ];
      case "events":
        return [
          { key: "event_id", label: "ID" },
          { key: "title", label: "Title" },
          { key: "major_service", label: "Service" },
          {
            key: "event_date",
            label: "Date",
            render: (val) => new Date(val).toLocaleDateString(),
          },
          { key: "location", label: "Location" },
          { key: "capacity", label: "Capacity" },
          { key: "approved_registrations", label: "Registrations" },
        ];
      case "training":
        return [
          { key: "session_id", label: "ID" },
          { key: "title", label: "Title" },
          { key: "major_service", label: "Service" },
          {
            key: "session_date",
            label: "Date",
            render: (val) => new Date(val).toLocaleDateString(),
          },
          { key: "venue", label: "Venue" },
          { key: "instructor", label: "Instructor" },
          { key: "approved_registrations", label: "Registrations" },
        ];
      case "volunteers":
        return [
          { key: "volunteer_id", label: "ID" },
          { key: "full_name", label: "Name" },
          { key: "age", label: "Age" },
          { key: "location", label: "Location" },
          { key: "service", label: "Service" },
          { key: "status", label: "Status" },
        ];
      case "inventory":
        return [
          { key: "item_code", label: "Code" },
          { key: "item_name", label: "Name" },
          { key: "category_name", label: "Category" },
          { key: "current_stock", label: "Stock" },
          { key: "unit", label: "Unit" },
          { key: "status", label: "Status" },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="ar-root">
      {/* Header */}
      <div className="ar-header">
        <div className="ar-header__inner">
          <div>
            <div className="ar-header__eyebrow">
              <i className="fa-solid fa-chart-line" />
              Reports & Analytics
            </div>
            <h1 className="ar-header__title">Reports</h1>
            <p className="ar-header__subtitle">
              View and export comprehensive reports across all modules
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="ar-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`ar-tab ${activeTab === tab.id ? "ar-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="ar-body">
        {loading ? (
          <div className="ar-loading">
            <i className="fa-solid fa-spinner fa-spin" />
            <p>Loading reports...</p>
          </div>
        ) : activeTab === "dashboard" ? (
          // Dashboard View
          <div className="ar-dashboard">
            <div className="ar-section">
              <h2 className="ar-section__title">
                <i className="fa-solid fa-users" /> Users Overview
              </h2>
              <div className="ar-grid ar-grid--4">
                <StatCard
                  icon="fa-solid fa-users"
                  label="Total Users"
                  value={summary?.users?.total || 0}
                  color="#c41e3a"
                />
                <StatCard
                  icon="fa-solid fa-user-shield"
                  label="Admins"
                  value={summary?.users?.admins || 0}
                  color="#7c3aed"
                />
                <StatCard
                  icon="fa-solid fa-user-plus"
                  label="New This Month"
                  value={summary?.users?.new_month || 0}
                  color="#0891b2"
                />
                <StatCard
                  icon="fa-solid fa-check-circle"
                  label="Verified"
                  value={summary?.users?.verified || 0}
                  color="#10b981"
                />
              </div>
            </div>

            <div className="ar-section">
              <h2 className="ar-section__title">
                <i className="fa-solid fa-calendar-days" /> Events & Training
              </h2>
              <div className="ar-grid ar-grid--4">
                <StatCard
                  icon="fa-solid fa-calendar"
                  label="Total Events"
                  value={summary?.events?.total || 0}
                  color="#c41e3a"
                  sub={`${summary?.events?.upcoming || 0} upcoming`}
                />
                <StatCard
                  icon="fa-solid fa-user-check"
                  label="Event Regs"
                  value={summary?.events?.registrations || 0}
                  color="#f59e0b"
                />
                <StatCard
                  icon="fa-solid fa-graduation-cap"
                  label="Training Sessions"
                  value={summary?.training?.total || 0}
                  color="#7c3aed"
                  sub={`${summary?.training?.upcoming || 0} upcoming`}
                />
                <StatCard
                  icon="fa-solid fa-users"
                  label="Training Regs"
                  value={summary?.training?.registrations || 0}
                  color="#0891b2"
                />
              </div>
            </div>

            <div className="ar-section">
              <h2 className="ar-section__title">
                <i className="fa-solid fa-boxes" /> Inventory & Merchandise
              </h2>
              <div className="ar-grid ar-grid--4">
                <StatCard
                  icon="fa-solid fa-box-open"
                  label="Inventory Items"
                  value={summary?.inventory?.total_items || 0}
                  color="#0891b2"
                  sub={`₱${(summary?.inventory?.total_value || 0).toLocaleString()}`}
                />
                <StatCard
                  icon="fa-solid fa-exclamation-triangle"
                  label="Low Stock"
                  value={summary?.inventory?.low_stock || 0}
                  color="#f59e0b"
                />
                <StatCard
                  icon="fa-solid fa-store"
                  label="Merch Items"
                  value={summary?.merchandise?.total_items || 0}
                  color="#7c3aed"
                />
                <StatCard
                  icon="fa-solid fa-droplet"
                  label="Blood Units"
                  value={summary?.blood_bank?.total_units || 0}
                  color="#c41e3a"
                  sub={`${summary?.blood_bank?.critical || 0} critical`}
                />
              </div>
            </div>

            <div className="ar-section">
              <h2 className="ar-section__title">
                <i className="fa-solid fa-hand-peace" /> Volunteers
              </h2>
              <div className="ar-grid ar-grid--4">
                <StatCard
                  icon="fa-solid fa-users"
                  label="Total Volunteers"
                  value={summary?.volunteers?.total || 0}
                  color="#0891b2"
                />
                <StatCard
                  icon="fa-solid fa-user-check"
                  label="Active"
                  value={summary?.volunteers?.current || 0}
                  color="#10b981"
                />
                <StatCard
                  icon="fa-solid fa-graduation-cap"
                  label="Graduated"
                  value={summary?.volunteers?.graduated || 0}
                  color="#7c3aed"
                />
              </div>
            </div>
          </div>
        ) : (
          // Report View with Table
          <ReportTable
            data={reportData}
            columns={getColumnsForTab(activeTab)}
            onExport={handleExport}
            reportType={tabs.find((t) => t.id === activeTab)?.label}
          />
        )}
      </div>

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
