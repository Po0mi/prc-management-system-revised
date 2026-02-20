/**
 * AdminDashboard.jsx
 * Path: src/pages/AdminDashboard/AdminDashboard.jsx
 */
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.scss";
import {
  getDashboardStats,
  getPendingItems,
  getRecentEvents,
  getRecentAnnouncements,
} from "../../services/dashboardApi";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  Number(n).toLocaleString("en-PH", { maximumFractionDigits: 0 });

const fmtPeso = (n) =>
  "₱" +
  Number(n).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, to, loading }) {
  const inner = (
    <div className="db-stat" style={{ "--card-color": color }}>
      <div className="db-stat__icon">
        <i className={icon} />
      </div>
      <div className="db-stat__body">
        <div className="db-stat__value">
          {loading ? <span className="db-skeleton db-skeleton--val" /> : value}
        </div>
        <div className="db-stat__label">{label}</div>
        {sub && (
          <div className="db-stat__sub">
            {loading ? <span className="db-skeleton db-skeleton--sub" /> : sub}
          </div>
        )}
      </div>
      {to && (
        <div className="db-stat__arrow">
          <i className="fa-solid fa-chevron-right" />
        </div>
      )}
    </div>
  );
  return to ? (
    <Link to={to} className="db-stat-link">
      {inner}
    </Link>
  ) : (
    inner
  );
}

// ─── ALERT BADGE ─────────────────────────────────────────────────────────────
function AlertBadge({ count }) {
  if (!count) return null;
  return <span className="db-alert-badge">{count > 99 ? "99+" : count}</span>;
}

// ─── PENDING CARD ─────────────────────────────────────────────────────────────
function PendingCard({ icon, label, count, to, color }) {
  return (
    <Link to={to} className="db-pending" style={{ "--card-color": color }}>
      <div className="db-pending__icon">
        <i className={icon} />
      </div>
      <div className="db-pending__body">
        <div className="db-pending__count">{fmt(count)}</div>
        <div className="db-pending__label">{label}</div>
      </div>
      {count > 0 && <span className="db-pending__dot" />}
      <i className="fa-solid fa-arrow-right db-pending__arrow" />
    </Link>
  );
}

// ─── BLOOD TYPE CHART ─────────────────────────────────────────────────────────
function BloodTypeBar({ type, units, max }) {
  const pct = max > 0 ? Math.round((units / max) * 100) : 0;
  const color = units === 0 ? "#ef4444" : units < 5 ? "#f59e0b" : "#10b981";
  return (
    <div className="db-blood-row">
      <span className="db-blood-row__type">{type}</span>
      <div className="db-blood-row__track">
        <div
          className="db-blood-row__fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="db-blood-row__units" style={{ color }}>
        {units}u
      </span>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState(null);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState("week");

  const load = useCallback(async () => {
    setLoading(true);
    const [s, p, e, a] = await Promise.all([
      getDashboardStats(),
      getPendingItems(),
      getRecentEvents(5),
      getRecentAnnouncements(3),
    ]);
    setStats(s);
    setPending(p);
    setEvents(e);
    setAnnouncements(a);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const id = setInterval(load, 120_000);
    return () => clearInterval(id);
  }, [load]);

  const totalPending = pending
    ? pending.event_registrations +
      pending.training_registrations +
      pending.training_requests
    : 0;

  // Blood type map
  const btMap = stats?.blood_bank?.by_blood_type ?? {};
  const btTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const btMax = Math.max(
    ...Object.values(btMap).map((v) =>
      typeof v === "object" ? (v.total ?? v.units ?? 0) : Number(v),
    ),
    1,
  );

  // Get critical blood types
  const criticalBloodTypes = btTypes.filter((type) => {
    const v = btMap[type];
    const units =
      typeof v === "object" ? (v.total ?? v.units ?? 0) : Number(v ?? 0);
    return units > 0 && units < 5;
  });

  return (
    <div className="db-root">
      {/* ── Header with Wave Effect ── */}
      <div className="db-header">
        <div className="db-header__container">
          <div className="db-header__content">
            <div className="db-header__left">
              <div className="db-header__badge">
                <i className="fa-solid fa-gauge-high" />
                Admin Dashboard
              </div>
              <h1 className="db-header__title">Welcome back, Admin</h1>
              <p className="db-header__subtitle">
                Here's what's happening across your system today
              </p>
            </div>
            <div className="db-header__right">
              <div className="db-header__stats">
                <div className="db-header-stat">
                  <span className="db-header-stat__value">
                    {fmt(stats?.users?.total ?? 0)}
                  </span>
                  <span className="db-header-stat__label">Total Users</span>
                </div>
                <div className="db-header-stat">
                  <span className="db-header-stat__value">
                    {fmt(stats?.events?.total ?? 0)}
                  </span>
                  <span className="db-header-stat__label">Total Events</span>
                </div>
                <div className="db-header-stat">
                  <span className="db-header-stat__value">
                    {fmt(stats?.inventory?.total_items ?? 0)}
                  </span>
                  <span className="db-header-stat__label">Inventory Items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Header Meta */}
          <div className="db-header__meta">
            <div className="db-header__refresh-info">
              <i className="fa-regular fa-clock" />
              Last updated {timeAgo(lastRefresh)}
            </div>
            <div className="db-header__actions">
              <select
                className="db-header__time-range"
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <button
                className="db-header__refresh-btn"
                onClick={load}
                disabled={loading}
              >
                <i
                  className={`fa-solid fa-rotate-right ${loading ? "fa-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Pending attention banner */}
          {!loading && totalPending > 0 && (
            <div className="db-header__alert">
              <div className="db-header__alert-icon">
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <div className="db-header__alert-content">
                <strong>
                  {totalPending} item{totalPending !== 1 ? "s" : ""} need your
                  attention
                </strong>
                <div className="db-header__alert-links">
                  {pending.event_registrations > 0 && (
                    <Link to="/admin/registrations">
                      {pending.event_registrations} event registration
                      {pending.event_registrations !== 1 ? "s" : ""}
                    </Link>
                  )}
                  {pending.training_registrations > 0 && (
                    <Link to="/admin/session-registrations">
                      {pending.training_registrations} training registration
                      {pending.training_registrations !== 1 ? "s" : ""}
                    </Link>
                  )}
                  {pending.training_requests > 0 && (
                    <Link to="/admin/training-requests">
                      {pending.training_requests} training request
                      {pending.training_requests !== 1 ? "s" : ""}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Critical Stock Alert */}
          {!loading && criticalBloodTypes.length > 0 && (
            <div className="db-header__alert db-header__alert--critical">
              <div className="db-header__alert-icon">
                <i className="fa-solid fa-droplet" />
              </div>
              <div className="db-header__alert-content">
                <strong>Critical Blood Supply</strong>
                <div className="db-header__alert-links">
                  Low stock for {criticalBloodTypes.join(", ")}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="db-header__wave">
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

      <div className="db-body">
        {/* ── Row 1: People ── */}
        <section className="db-section">
          <div className="db-section__head">
            <div className="db-section__head-icon">
              <i className="fa-solid fa-users" />
            </div>
            <span>People</span>
          </div>
          <div className="db-grid db-grid--4">
            <StatCard
              icon="fa-solid fa-users"
              label="Total Users"
              value={fmt(stats?.users?.total ?? 0)}
              color="#cc0000"
              to="/admin/users"
              loading={loading}
            />
            <StatCard
              icon="fa-solid fa-user-shield"
              label="Admins"
              value={fmt(stats?.users?.admins ?? 0)}
              color="#7c3aed"
              to="/admin/users"
              loading={loading}
            />
            <StatCard
              icon="fa-solid fa-hand-holding-heart"
              label="Volunteers"
              value={fmt(stats?.volunteers?.total ?? 0)}
              color="#0891b2"
              to="/admin/volunteers"
              loading={loading}
              sub={
                stats?.volunteers?.by_status?.active
                  ? `${stats.volunteers.by_status.active} active`
                  : null
              }
            />
            <StatCard
              icon="fa-solid fa-user-plus"
              label="New This Week"
              value={fmt(stats?.users?.new_this_week ?? 0)}
              color="#059669"
              loading={loading}
            />
          </div>
        </section>

        {/* ── Row 2: Events & Training ── */}
        <section className="db-section">
          <div className="db-section__head">
            <div className="db-section__head-icon">
              <i className="fa-solid fa-calendar-days" />
            </div>
            <span>Events & Training</span>
          </div>
          <div className="db-grid db-grid--4">
            <StatCard
              icon="fa-solid fa-calendar-days"
              label="Total Events"
              value={fmt(stats?.events?.total ?? 0)}
              color="#cc0000"
              to="/admin/events"
              loading={loading}
              sub={
                stats?.events?.upcoming
                  ? `${stats.events.upcoming} upcoming`
                  : null
              }
            />
            <StatCard
              icon="fa-solid fa-clipboard-list"
              label="Event Registrations"
              value={fmt(stats?.events?.total_registrations ?? 0)}
              color="#b45309"
              to="/admin/registrations"
              loading={loading}
            />
            <StatCard
              icon="fa-solid fa-graduation-cap"
              label="Training Sessions"
              value={fmt(stats?.training?.total ?? 0)}
              color="#7c3aed"
              to="/admin/training"
              loading={loading}
              sub={
                stats?.training?.upcoming
                  ? `${stats.training.upcoming} upcoming`
                  : null
              }
            />
            <StatCard
              icon="fa-solid fa-file-pen"
              label="Training Requests"
              value={fmt(stats?.requests?.total ?? 0)}
              color="#0891b2"
              to="/admin/training-requests"
              loading={loading}
              sub={(() => {
                const pend =
                  stats?.requests?.by_status?.find?.(
                    (s) => s.status === "pending",
                  )?.count ?? 0;
                return pend > 0 ? `${pend} pending` : null;
              })()}
            />
          </div>
        </section>

        {/* ── Row 3: Inventory & Commerce ── */}
        <section className="db-section">
          <div className="db-section__head">
            <div className="db-section__head-icon">
              <i className="fa-solid fa-boxes-stacked" />
            </div>
            <span>Inventory & Commerce</span>
          </div>
          <div className="db-grid db-grid--4">
            <StatCard
              icon="fa-solid fa-box-open"
              label="Inventory Items"
              value={fmt(stats?.inventory?.total_items ?? 0)}
              color="#0891b2"
              to="/admin/inventory"
              loading={loading}
              sub={
                stats?.inventory?.low_stock
                  ? `${stats.inventory.low_stock} low stock`
                  : "All stocked"
              }
            />
            <StatCard
              icon="fa-solid fa-sack-dollar"
              label="Inventory Value"
              value={fmtPeso(stats?.inventory?.total_value ?? 0)}
              color="#059669"
              to="/admin/inventory"
              loading={loading}
            />
            <StatCard
              icon="fa-solid fa-store"
              label="Merchandise Items"
              value={fmt(stats?.merchandise?.total ?? 0)}
              color="#c2410c"
              to="/admin/merchandise"
              loading={loading}
              sub={
                stats?.merchandise?.total_stock
                  ? `${stats.merchandise.total_stock} units`
                  : null
              }
            />
            <StatCard
              icon="fa-solid fa-tags"
              label="Merch Value"
              value={fmtPeso(stats?.merchandise?.total_value ?? 0)}
              color="#7c3aed"
              to="/admin/merchandise"
              loading={loading}
            />
          </div>
        </section>

        {/* ── Row 4: Lower panels ── */}
        <div className="db-lower">
          {/* Left col: Blood Bank + Pending */}
          <div className="db-lower__left">
            {/* Blood Bank */}
            <div className="db-panel db-panel--blood">
              <div className="db-panel__head">
                <div className="db-panel__title">
                  <div className="db-panel__title-icon">
                    <i className="fa-solid fa-droplet" />
                  </div>
                  Blood Bank Inventory
                </div>
                <Link to="/admin/blood-bank" className="db-panel__link">
                  <span>View all</span>
                  <i className="fa-solid fa-arrow-right" />
                </Link>
              </div>
              <div className="db-panel__body">
                <div className="db-blood-summary">
                  <div className="db-blood-summary__item">
                    <span className="db-blood-summary__num">
                      {fmt(stats?.blood_bank?.total_units ?? 0)}
                    </span>
                    <span className="db-blood-summary__label">Total Units</span>
                  </div>
                  <div className="db-blood-summary__item">
                    <span className="db-blood-summary__num">
                      {fmt(stats?.blood_bank?.total_locations ?? 0)}
                    </span>
                    <span className="db-blood-summary__label">Locations</span>
                  </div>
                  <div
                    className="db-blood-summary__item db-blood-summary__item--critical"
                    style={{
                      background:
                        stats?.blood_bank?.critical_stock > 0
                          ? "rgba(239, 68, 68, 0.1)"
                          : undefined,
                      borderColor:
                        stats?.blood_bank?.critical_stock > 0
                          ? "rgba(239, 68, 68, 0.2)"
                          : undefined,
                    }}
                  >
                    <span
                      className="db-blood-summary__num"
                      style={{
                        color:
                          stats?.blood_bank?.critical_stock > 0
                            ? "#ef4444"
                            : "#10b981",
                      }}
                    >
                      {fmt(stats?.blood_bank?.critical_stock ?? 0)}
                    </span>
                    <span className="db-blood-summary__label">Critical</span>
                  </div>
                </div>
                <div className="db-blood-bars">
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="db-blood-row">
                          <span className="db-skeleton db-skeleton--type" />
                          <div className="db-blood-row__track">
                            <div
                              className="db-skeleton"
                              style={{
                                height: "100%",
                                width: `${30 + Math.random() * 60}%`,
                              }}
                            />
                          </div>
                          <span className="db-skeleton db-skeleton--sub" />
                        </div>
                      ))
                    : btTypes.map((type) => {
                        const v = btMap[type];
                        const units =
                          typeof v === "object"
                            ? (v.total ?? v.units ?? 0)
                            : Number(v ?? 0);
                        return (
                          <BloodTypeBar
                            key={type}
                            type={type}
                            units={units}
                            max={btMax}
                          />
                        );
                      })}
                </div>
              </div>
            </div>

            {/* Pending Attention */}
            <div className="db-panel db-panel--pending">
              <div className="db-panel__head">
                <div className="db-panel__title">
                  <div className="db-panel__title-icon">
                    <i className="fa-solid fa-clock" />
                  </div>
                  Needs Attention
                  {totalPending > 0 && <AlertBadge count={totalPending} />}
                </div>
              </div>
              <div className="db-panel__body db-panel__body--pending">
                <PendingCard
                  icon="fa-solid fa-clipboard-list"
                  label="Pending Event Registrations"
                  count={pending?.event_registrations ?? 0}
                  to="/admin/registrations"
                  color="#cc0000"
                />
                <PendingCard
                  icon="fa-solid fa-graduation-cap"
                  label="Pending Training Registrations"
                  count={pending?.training_registrations ?? 0}
                  to="/admin/session-registrations"
                  color="#7c3aed"
                />
                <PendingCard
                  icon="fa-solid fa-file-pen"
                  label="Pending Training Requests"
                  count={pending?.training_requests ?? 0}
                  to="/admin/training-requests"
                  color="#0891b2"
                />
              </div>
            </div>
          </div>

          {/* Right col: Recent Events + Announcements */}
          <div className="db-lower__right">
            {/* Recent Events */}
            <div className="db-panel db-panel--events">
              <div className="db-panel__head">
                <div className="db-panel__title">
                  <div className="db-panel__title-icon">
                    <i className="fa-solid fa-calendar-days" />
                  </div>
                  Recent Events
                </div>
                <Link to="/admin/events" className="db-panel__link">
                  <span>View all</span>
                  <i className="fa-solid fa-arrow-right" />
                </Link>
              </div>
              <div className="db-panel__body">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="db-event-row">
                      <span className="db-skeleton db-skeleton--dot" />
                      <div>
                        <span className="db-skeleton db-skeleton--line" />
                        <span
                          className="db-skeleton db-skeleton--sub"
                          style={{ marginTop: 4 }}
                        />
                      </div>
                    </div>
                  ))
                ) : events.length === 0 ? (
                  <div className="db-empty">
                    <i className="fa-regular fa-calendar-xmark" />
                    <p>No events yet</p>
                  </div>
                ) : (
                  events.map((ev) => {
                    const isPast =
                      new Date(ev.event_end_date ?? ev.event_date) < new Date();
                    const isUpcoming = new Date(ev.event_date) >= new Date();
                    return (
                      <div key={ev.event_id} className="db-event-row">
                        <div
                          className="db-event-row__dot"
                          style={{
                            background: isPast
                              ? "#6b7280"
                              : isUpcoming
                                ? "#10b981"
                                : "#f59e0b",
                          }}
                        />
                        <div className="db-event-row__info">
                          <div className="db-event-row__title">
                            {ev.event_name}
                          </div>
                          <div className="db-event-row__meta">
                            <span>
                              <i className="fa-regular fa-calendar" />
                              {new Date(ev.event_date).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            {ev.total_registrations > 0 && (
                              <span>
                                <i className="fa-solid fa-user-check" />
                                {ev.approved_count}/{ev.total_registrations}{" "}
                                registered
                              </span>
                            )}
                            <span
                              className="db-event-row__status"
                              style={{
                                color: isPast
                                  ? "#6b7280"
                                  : isUpcoming
                                    ? "#10b981"
                                    : "#f59e0b",
                              }}
                            >
                              {isPast
                                ? "Completed"
                                : isUpcoming
                                  ? "Upcoming"
                                  : "Ongoing"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent Announcements */}
            <div className="db-panel db-panel--announcements">
              <div className="db-panel__head">
                <div className="db-panel__title">
                  <div className="db-panel__title-icon">
                    <i className="fa-solid fa-bullhorn" />
                  </div>
                  Recent Announcements
                </div>
                <Link to="/admin/announcements" className="db-panel__link">
                  <span>View all</span>
                  <i className="fa-solid fa-arrow-right" />
                </Link>
              </div>
              <div className="db-panel__body">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="db-ann-row">
                      <span className="db-skeleton db-skeleton--icon" />
                      <div>
                        <span className="db-skeleton db-skeleton--line" />
                        <span
                          className="db-skeleton db-skeleton--sub"
                          style={{ marginTop: 4 }}
                        />
                      </div>
                    </div>
                  ))
                ) : announcements.length === 0 ? (
                  <div className="db-empty">
                    <i className="fa-regular fa-bell-slash" />
                    <p>No announcements yet</p>
                  </div>
                ) : (
                  announcements.map((a) => (
                    <div key={a.announcement_id} className="db-ann-row">
                      <div className="db-ann-row__icon">
                        <i className="fa-solid fa-bullhorn" />
                      </div>
                      <div className="db-ann-row__info">
                        <div className="db-ann-row__title">{a.title}</div>
                        <div className="db-ann-row__meta">
                          <span>
                            <i className="fa-regular fa-clock" />
                            {timeAgo(a.posted_at)}
                          </span>
                          <span
                            className="db-ann-row__target"
                            style={{
                              color:
                                a.target_role === "all" ? "#cc0000" : "#7c3aed",
                            }}
                          >
                            {a.target_role === "all"
                              ? "All users"
                              : a.target_role === "rcy_member"
                                ? "RCY Members"
                                : a.target_role}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="db-panel db-panel--quick">
              <div className="db-panel__head">
                <div className="db-panel__title">
                  <div className="db-panel__title-icon">
                    <i className="fa-solid fa-bolt" />
                  </div>
                  Quick Actions
                </div>
              </div>
              <div className="db-panel__body db-quicklinks">
                {[
                  {
                    to: "/admin/events/new",
                    icon: "fa-solid fa-calendar-plus",
                    label: "New Event",
                    color: "#cc0000",
                  },
                  {
                    to: "/admin/training/new",
                    icon: "fa-solid fa-chalkboard-user",
                    label: "New Training",
                    color: "#7c3aed",
                  },
                  {
                    to: "/admin/announcements/new",
                    icon: "fa-solid fa-bullhorn",
                    label: "New Announcement",
                    color: "#f59e0b",
                  },
                  {
                    to: "/admin/users",
                    icon: "fa-solid fa-user-plus",
                    label: "Manage Users",
                    color: "#0891b2",
                  },
                  {
                    to: "/admin/inventory",
                    icon: "fa-solid fa-box-open",
                    label: "View Inventory",
                    color: "#059669",
                  },
                  {
                    to: "/admin/blood-bank",
                    icon: "fa-solid fa-droplet",
                    label: "Blood Bank",
                    color: "#dc2626",
                  },
                ].map(({ to, icon, label, color }) => (
                  <Link
                    key={to}
                    to={to}
                    className="db-quicklink"
                    style={{ "--ql-color": color }}
                  >
                    <i className={icon} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
