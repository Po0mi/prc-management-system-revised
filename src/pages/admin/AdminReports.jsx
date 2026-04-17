// src/pages/admin/AdminReports.jsx
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

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",   label: "Overview",   icon: "fa-solid fa-chart-pie" },
  { id: "users",      label: "Users",      icon: "fa-solid fa-users" },
  { id: "events",     label: "Events",     icon: "fa-solid fa-calendar-days" },
  { id: "training",   label: "Training",   icon: "fa-solid fa-graduation-cap" },
  { id: "volunteers", label: "Volunteers", icon: "fa-solid fa-hand-peace" },
  { id: "inventory",  label: "Inventory",  icon: "fa-solid fa-boxes-stacked" },
];

// CSV template headers per report type (used for "Download Template" button)
const TEMPLATE_HEADERS = {
  users:      ["User ID", "Username", "Full Name", "Email", "Role", "User Type", "Verified", "Created At"],
  events:     ["Event ID", "Title", "Service", "Date", "Location", "Capacity", "Fee", "Status", "Total Registrations", "Approved"],
  training:   ["Session ID", "Title", "Service", "Date", "Venue", "Instructor", "Capacity", "Fee", "Registrations", "Approved"],
  volunteers: ["ID", "Full Name", "Age", "Location", "Contact", "Service", "Status", "Created At"],
  inventory:  ["Item ID", "Code", "Name", "Category", "Current Stock", "Unit", "Location", "Status"],
};

const COLUMNS = {
  users: [
    { key: "user_id",    label: "ID",        sortable: true },
    { key: "username",   label: "Username",  sortable: true },
    { key: "full_name",  label: "Full Name", sortable: true },
    { key: "email",      label: "Email" },
    { key: "role",       label: "Role",      sortable: true,
      render: (v) => <span className={`ar-badge ar-badge--${v?.includes("admin") ? "admin" : "user"}`}>{v}</span> },
    { key: "user_type",  label: "Type",      sortable: true },
    { key: "created_at", label: "Joined",    sortable: true,
      render: (v) => v ? new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—" },
  ],
  events: [
    { key: "event_id",               label: "ID",           sortable: true },
    { key: "event_name",             label: "Title",        sortable: true },
    { key: "major_service",          label: "Service",      sortable: true },
    { key: "event_date",             label: "Date",         sortable: true,
      render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
    { key: "location",               label: "Location" },
    { key: "capacity",               label: "Capacity",     sortable: true },
    { key: "approved_registrations", label: "Approved",     sortable: true },
  ],
  training: [
    { key: "session_id",             label: "ID",           sortable: true },
    { key: "title",                  label: "Title",        sortable: true },
    { key: "major_service",          label: "Service",      sortable: true },
    { key: "session_date",           label: "Date",         sortable: true,
      render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
    { key: "venue",                  label: "Venue" },
    { key: "instructor",             label: "Instructor" },
    { key: "approved_registrations", label: "Approved",     sortable: true },
  ],
  volunteers: [
    { key: "volunteer_id",   label: "ID",      sortable: true },
    { key: "full_name",      label: "Name",    sortable: true },
    { key: "age",            label: "Age",     sortable: true },
    { key: "location",       label: "Location" },
    { key: "service",        label: "Service", sortable: true },
    { key: "status",         label: "Status",  sortable: true,
      render: (v) => <span className={`ar-badge ar-badge--${v}`}>{v}</span> },
  ],
  inventory: [
    { key: "item_code",      label: "Code",     sortable: true },
    { key: "item_name",      label: "Name",     sortable: true },
    { key: "category_name",  label: "Category", sortable: true },
    { key: "current_stock",  label: "Stock",    sortable: true },
    { key: "unit",           label: "Unit" },
    { key: "status",         label: "Status",   sortable: true,
      render: (v) => <span className={`ar-badge ar-badge--${v}`}>{v}</span> },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n) => Number(n || 0).toLocaleString("en-PH");
const fmtPeso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function downloadTemplate(type) {
  const headers = TEMPLATE_HEADERS[type];
  if (!headers) return;
  const csv = "\uFEFF" + headers.join(",") + "\n"; // UTF-8 BOM for Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}_import_template.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── TOAST ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`ar-toast ar-toast--${type}`} onClick={onClose}>
      <i className={`fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`} />
      <span>{message}</span>
      <button onClick={onClose}><i className="fa-solid fa-xmark" /></button>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="ar-stat-card" style={{ "--card-color": color }}>
      <div className="ar-stat-card__icon"><i className={icon} /></div>
      <div className="ar-stat-card__content">
        <div className="ar-stat-card__value">{value}</div>
        <div className="ar-stat-card__label">{label}</div>
        {sub && <div className="ar-stat-card__sub">{sub}</div>}
      </div>
    </div>
  );
}

// ─── REPORT TABLE ─────────────────────────────────────────────────────────────

function ReportTable({ tab, data, stats, onExport, exporting }) {
  const [sortKey, setSortKey]   = useState(null);
  const [sortDir, setSortDir]   = useState("asc");
  const columns = COLUMNS[tab] ?? [];

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey], bv = b[sortKey];
    const cmp = typeof av === "number" && typeof bv === "number"
      ? av - bv
      : String(av ?? "").localeCompare(String(bv ?? ""));
    return sortDir === "asc" ? cmp : -cmp;
  });

  // Mini stats from response.stats
  const miniStats = buildMiniStats(tab, stats);

  return (
    <div className="ar-report">
      {/* Mini stats */}
      {miniStats.length > 0 && (
        <div className="ar-mini-stats">
          {miniStats.map((s) => (
            <div key={s.label} className="ar-mini-stat">
              <span className="ar-mini-stat__value">{s.value}</span>
              <span className="ar-mini-stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Table card */}
      <div className="ar-table-card">
        <div className="ar-table-card__header">
          <span className="ar-table-card__title">
            <i className="fa-solid fa-table" />
            {data.length} record{data.length !== 1 ? "s" : ""}
          </span>
          <div className="ar-table-card__actions">
            <button className="ar-btn ar-btn--ghost" onClick={() => downloadTemplate(tab)}>
              <i className="fa-solid fa-file-arrow-down" />
              Download Template
            </button>
            <button className="ar-btn ar-btn--primary" onClick={onExport} disabled={exporting}>
              <i className={`fa-solid ${exporting ? "fa-spinner fa-spin" : "fa-download"}`} />
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>

        <div className="ar-table-wrap">
          <table className="ar-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={col.sortable ? "sortable" : ""}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    {col.label}
                    {col.sortable && (
                      <i className={`fa-solid fa-sort${sortKey === col.key ? (sortDir === "asc" ? "-up" : "-down") : ""}`} />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <div className="ar-empty">
                      <i className="fa-regular fa-folder-open" />
                      <p>No records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((row, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function buildMiniStats(tab, stats) {
  if (!stats) return [];
  switch (tab) {
    case "users":
      return [
        { label: "Total",    value: fmt(stats.total) },
        { label: "By Role",  value: Object.keys(stats.by_role ?? {}).length },
        { label: "By Type",  value: Object.keys(stats.by_type ?? {}).length },
      ];
    case "events":
      return [
        { label: "Total",           value: fmt(stats.total) },
        { label: "Registrations",   value: fmt(stats.total_registrations) },
        { label: "Approved",        value: fmt(stats.total_approved) },
        { label: "Total Capacity",  value: fmt(stats.total_capacity) },
      ];
    case "training":
      return [
        { label: "Sessions",      value: fmt(stats.total) },
        { label: "Registrations", value: fmt(stats.total_registrations) },
        { label: "Approved",      value: fmt(stats.total_approved) },
        { label: "Capacity",      value: fmt(stats.total_capacity) },
      ];
    case "volunteers":
      return [
        { label: "Total",       value: fmt(stats.total) },
        { label: "Under 25",    value: fmt(stats.by_age_group?.under_25) },
        { label: "25–40",       value: fmt(stats.by_age_group?.["25_40"]) },
        { label: "Over 40",     value: fmt(stats.by_age_group?.over_40) },
      ];
    case "inventory":
      return [
        { label: "Items",       value: fmt(stats.total_items) },
        { label: "Low Stock",   value: fmt(stats.low_stock) },
        { label: "Out of Stock",value: fmt(stats.out_of_stock) },
        { label: "Total Value", value: fmtPeso(stats.total_value) },
      ];
    default:
      return [];
  }
}

// ─── FILTERS ──────────────────────────────────────────────────────────────────

function FilterBar({ tab, filters, onChange }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });

  const dateRange = (
    <>
      <label className="ar-filter">
        <span>From</span>
        <input type="date" value={filters.date_from || ""} onChange={(e) => set("date_from", e.target.value)} />
      </label>
      <label className="ar-filter">
        <span>To</span>
        <input type="date" value={filters.date_to || ""} onChange={(e) => set("date_to", e.target.value)} />
      </label>
    </>
  );

  const clearBtn = Object.values(filters).some(Boolean) && (
    <button className="ar-btn ar-btn--ghost ar-btn--sm" onClick={() => onChange({})}>
      <i className="fa-solid fa-xmark" /> Clear
    </button>
  );

  switch (tab) {
    case "users":
      return (
        <div className="ar-filters">
          {dateRange}
          <label className="ar-filter">
            <span>Role</span>
            <select value={filters.role || ""} onChange={(e) => set("role", e.target.value)}>
              <option value="">All</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </label>
          {clearBtn}
        </div>
      );
    case "events":
    case "training":
      return (
        <div className="ar-filters">
          {dateRange}
          <label className="ar-filter">
            <span>Status</span>
            <select value={filters.status || ""} onChange={(e) => set("status", e.target.value)}>
              <option value="">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </label>
          {clearBtn}
        </div>
      );
    case "volunteers":
      return (
        <div className="ar-filters">
          <label className="ar-filter">
            <span>Status</span>
            <select value={filters.status || ""} onChange={(e) => set("status", e.target.value)}>
              <option value="">All</option>
              <option value="current">Current</option>
              <option value="graduated">Graduated</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          {clearBtn}
        </div>
      );
    case "inventory":
      return (
        <div className="ar-filters">
          <label className="ar-filter">
            <span>Stock</span>
            <select value={filters.low_stock || ""} onChange={(e) => set("low_stock", e.target.value)}>
              <option value="">All</option>
              <option value="true">Low Stock Only</option>
            </select>
          </label>
          {clearBtn}
        </div>
      );
    default:
      return null;
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function AdminReports() {
  const [activeTab,  setActiveTab]  = useState("overview");
  const [summary,    setSummary]    = useState(null);
  const [reportData, setReportData] = useState([]);
  const [reportStats,setReportStats]= useState(null);
  const [loading,    setLoading]    = useState(true);
  const [exporting,  setExporting]  = useState(false);
  const [toast,      setToast]      = useState(null);
  const [filters,    setFilters]    = useState({});

  const showToast = (message, type = "success") => setToast({ message, type });

  const loadSummary = useCallback(async () => {
    setLoading(true);
    const res = await getReportSummary();
    if (res.success) setSummary(res.data);
    else showToast(res.error || "Failed to load summary", "error");
    setLoading(false);
  }, []);

  const loadReport = useCallback(async (tab, f) => {
    setLoading(true);
    const loaders = {
      users:      () => getUsersReport(f),
      events:     () => getEventsReport(f),
      training:   () => getTrainingReport(f),
      volunteers: () => getVolunteersReport(f),
      inventory:  () => getInventoryReport(f),
    };
    const res = await (loaders[tab]?.() ?? Promise.resolve({ success: true, data: [] }));
    if (res.success) {
      setReportData(res.data ?? []);
      setReportStats(res.stats ?? null);
    } else {
      showToast(res.error || "Failed to load report", "error");
      setReportData([]);
    }
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    loadSummary(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [loadSummary]);

  // Load report when tab or filters change
  useEffect(() => {
    if (activeTab !== "overview") {
      loadReport(activeTab, filters); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [activeTab, filters, loadReport]);

  const handleTabChange = (id) => {
    setActiveTab(id);
    setFilters({});
    setReportData([]);
    setReportStats(null);
  };

  const handleExport = async () => {
    setExporting(true);
    const res = await exportReport(activeTab, filters);
    if (res.success) showToast("Report exported successfully");
    else showToast(res.error || "Export failed", "error");
    setExporting(false);
  };

  const s = summary;

  return (
    <div className="ar-root">
      {/* Header */}
      <div className="ar-header">
        <div className="ar-header__container">
          <div className="ar-header__content">
            <div className="ar-header__left">
              <div className="ar-header__badge">
                <i className="fa-solid fa-chart-line" /> Reports &amp; Analytics
              </div>
              <h1 className="ar-header__title">Reports</h1>
              <p className="ar-header__subtitle">
                View and export data across all modules
              </p>
            </div>
            <div className="ar-header__stats">
              <div className="ar-header-stat">
                <span className="ar-header-stat__value">{fmt(s?.users?.total)}</span>
                <span className="ar-header-stat__label">Users</span>
              </div>
              <div className="ar-header-stat">
                <span className="ar-header-stat__value">{fmt(s?.events?.total)}</span>
                <span className="ar-header-stat__label">Events</span>
              </div>
              <div className="ar-header-stat">
                <span className="ar-header-stat__value">{fmt(s?.training?.total)}</span>
                <span className="ar-header-stat__label">Training</span>
              </div>
            </div>
          </div>
        </div>
        <div className="ar-header__wave">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" fillOpacity="0.1" />
          </svg>
        </div>
      </div>

      {/* Tabs */}
      <div className="ar-tabs-bar">
        <div className="ar-tabs-bar__inner">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`ar-tab-btn${activeTab === tab.id ? " ar-tab-btn--active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <i className={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="ar-body">
        {loading ? (
          <div className="ar-loading">
            <i className="fa-solid fa-circle-notch fa-spin" />
            <p>Loading…</p>
          </div>
        ) : activeTab === "overview" ? (
          /* ── Overview ── */
          <div className="ar-overview">
            <div className="ar-section">
              <h3 className="ar-section__title"><i className="fa-solid fa-users" /> Users</h3>
              <div className="ar-grid ar-grid--4">
                <StatCard icon="fa-solid fa-users"        label="Total Users"    value={fmt(s?.users?.total)}      color="#cc0000" />
                <StatCard icon="fa-solid fa-user-shield"  label="Admins"         value={fmt(s?.users?.admins)}     color="#7c3aed" />
                <StatCard icon="fa-solid fa-user-plus"    label="New This Month" value={fmt(s?.users?.new_month)}  color="#0891b2" />
                <StatCard icon="fa-solid fa-check-circle" label="Verified"       value={fmt(s?.users?.verified)}   color="#10b981" />
              </div>
            </div>

            <div className="ar-section">
              <h3 className="ar-section__title"><i className="fa-solid fa-calendar-days" /> Events &amp; Training</h3>
              <div className="ar-grid ar-grid--4">
                <StatCard icon="fa-solid fa-calendar"       label="Total Events"     value={fmt(s?.events?.total)}         color="#cc0000" sub={`${fmt(s?.events?.upcoming)} upcoming`} />
                <StatCard icon="fa-solid fa-user-check"     label="Event Regs"       value={fmt(s?.events?.registrations)} color="#f59e0b" />
                <StatCard icon="fa-solid fa-graduation-cap" label="Training Sessions" value={fmt(s?.training?.total)}       color="#7c3aed" sub={`${fmt(s?.training?.upcoming)} upcoming`} />
                <StatCard icon="fa-solid fa-users"          label="Training Regs"    value={fmt(s?.training?.registrations)} color="#0891b2" />
              </div>
            </div>

            <div className="ar-section">
              <h3 className="ar-section__title"><i className="fa-solid fa-boxes-stacked" /> Inventory &amp; Merchandise</h3>
              <div className="ar-grid ar-grid--4">
                <StatCard icon="fa-solid fa-box-open"              label="Inventory Items" value={fmt(s?.inventory?.total_items)}  color="#0891b2" sub={fmtPeso(s?.inventory?.total_value)} />
                <StatCard icon="fa-solid fa-triangle-exclamation"  label="Low Stock"       value={fmt(s?.inventory?.low_stock)}   color="#f59e0b" />
                <StatCard icon="fa-solid fa-store"                 label="Merch Items"     value={fmt(s?.merchandise?.total_items)} color="#7c3aed" />
                <StatCard icon="fa-solid fa-droplet"               label="Blood Units"     value={fmt(s?.blood_bank?.total_units)} color="#cc0000" sub={`${fmt(s?.blood_bank?.critical)} critical`} />
              </div>
            </div>

            <div className="ar-section">
              <h3 className="ar-section__title"><i className="fa-solid fa-hand-peace" /> Volunteers</h3>
              <div className="ar-grid ar-grid--3">
                <StatCard icon="fa-solid fa-users"      label="Total Volunteers" value={fmt(s?.volunteers?.total)}     color="#0891b2" />
                <StatCard icon="fa-solid fa-user-check" label="Active"          value={fmt(s?.volunteers?.current)}   color="#10b981" />
                <StatCard icon="fa-solid fa-graduation-cap" label="Graduated"   value={fmt(s?.volunteers?.graduated)} color="#7c3aed" />
              </div>
            </div>
          </div>
        ) : (
          /* ── Report Tab ── */
          <>
            <FilterBar tab={activeTab} filters={filters} onChange={setFilters} />
            <ReportTable
              tab={activeTab}
              data={reportData}
              stats={reportStats}
              onExport={handleExport}
              exporting={exporting}
            />
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
