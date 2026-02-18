import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import FloatingChat from "../components/FloatingChat";
import Notifications from "../components/Notifications";
import authService from "../services/auth.service";
import {
  hasPermission,
  isSuperAdmin,
  getRoleLabel,
  getUserRole,
} from "../utils/permissions";
import "./styles/AdminLayout.scss";

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = authService.getCurrentUser();
  const userRole = getUserRole();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  // Navigation items with permission checks
  const navItems = [
    {
      path: "/admin/dashboard",
      icon: "🏠",
      label: "Dashboard",
      permission: true,
    },
    {
      path: "/admin/users",
      icon: "👥",
      label: "User Management",
      permission: isSuperAdmin(),
    },
    {
      path: "/admin/volunteers",
      icon: "👷",
      label: "Volunteers",
      permission: hasPermission("volunteers"),
    },
    {
      path: "/admin/events",
      icon: "📅",
      label: "Events",
      permission: hasPermission("events"),
    },
    {
      path: "/admin/training",
      icon: "🎓",
      label: "Training",
      permission: hasPermission("training"),
    },
    {
      path: "/admin/training-requests",
      icon: "📝",
      label: "Training Requests",
      permission: hasPermission("training-requests"),
    },
    {
      path: "/admin/announcements",
      icon: "📢",
      label: "Announcements",
      permission: hasPermission("announcements"),
    },
    {
      path: "/admin/blood-bank",
      icon: "🩸",
      label: "Blood Bank",
      permission: hasPermission("blood-bank"),
    },
    {
      path: "/admin/donations",
      icon: "💰",
      label: "Donations",
      permission: hasPermission("donations"),
    },
    {
      path: "/admin/inventory",
      icon: "📦",
      label: "Inventory",
      permission: hasPermission("inventory"),
    },
    {
      path: "/admin/merchandise",
      icon: "🛍️",
      label: "Merchandise",
      permission: isSuperAdmin(),
    },
    {
      path: "/admin/reports",
      icon: "📊",
      label: "Reports",
      permission: true,
    },
  ];

  const allowedNavItems = navItems.filter((item) => item.permission);

  return (
    <>
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar-header">
            <h2>🏥 PRC Admin</h2>
            <button
              className="toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? "◄" : "►"}
            </button>
          </div>

          <div className="admin-info">
            <div className="admin-avatar">
              {user?.full_name?.charAt(0) || "A"}
            </div>
            <div className="admin-details">
              <p className="admin-name">{user?.full_name}</p>
              <p className="admin-role">{getRoleLabel(userRole)}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {allowedNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="main-content">
          <header className="top-bar">
            <div className="breadcrumbs">
              <span>Admin Panel</span>
              <span className="separator">/</span>
              <span>{location.pathname.split("/").pop()}</span>
            </div>

            <div className="top-bar-actions">
              {/* Notifications */}
              <Notifications />

              <div className="user-menu">
                <span>{user?.full_name}</span>
              </div>
            </div>
          </header>

          <main className="content-area">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Floating Chat Widget */}
      <FloatingChat userRole="admin" />
    </>
  );
}

export default AdminLayout;
