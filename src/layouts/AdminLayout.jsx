import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
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
  const [user, setUser] = useState(null);
  const userRole = getUserRole();

  useEffect(() => {
    // Get user data
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  // Navigation items with Font Awesome icons - ALL ADMINS SEE EVERYTHING
  const navItems = [
    {
      path: "/admin/dashboard",
      icon: "fa-solid fa-chart-pie",
      label: "Dashboard",
    },
    {
      path: "/admin/users",
      icon: "fa-solid fa-users",
      label: "User Management",
    },
    {
      path: "/admin/volunteers",
      icon: "fa-solid fa-hand-peace",
      label: "Volunteers",
    },
    {
      path: "/admin/events",
      icon: "fa-solid fa-calendar-days",
      label: "Events",
    },
    {
      path: "/admin/training",
      icon: "fa-solid fa-graduation-cap",
      label: "Training",
    },
    {
      path: "/admin/training-requests",
      icon: "fa-solid fa-pen-to-square",
      label: "Training Requests",
    },
    {
      path: "/admin/announcements",
      icon: "fa-solid fa-bullhorn",
      label: "Announcements",
    },
    {
      path: "/admin/blood-bank",
      icon: "fa-solid fa-droplet",
      label: "Blood Bank",
    },
    {
      path: "/admin/inventory",
      icon: "fa-solid fa-boxes",
      label: "Inventory",
    },
    {
      path: "/admin/merchandise",
      icon: "fa-solid fa-shirt",
      label: "Merchandise",
    },
    {
      path: "/admin/reports",
      icon: "fa-solid fa-chart-line",
      label: "Reports",
    },
  ];

  // Get current user ID for chat
  const getCurrentUserId = () => {
    const userData = authService.getCurrentUser();
    return userData?.user_id || null;
  };

  const getCurrentUserName = () => {
    const userData = authService.getCurrentUser();
    return userData?.full_name || userData?.username || "Admin";
  };

  return (
    <>
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar__header">
            <h2>PRC Admin</h2>
            <button
              className="sidebar__header-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <i
                className={`fa-solid fa-chevron-${sidebarOpen ? "left" : "right"}`}
              ></i>
            </button>
          </div>

          <div className="sidebar__profile">
            <div className="sidebar__profile-avatar">
              {user?.full_name?.charAt(0) || "A"}
            </div>
            <div className="sidebar__profile-info">
              <p className="sidebar__profile-info-name">
                {user?.full_name || "Admin"}
              </p>
              <p className="sidebar__profile-info-role">
                <i className="fa-solid fa-circle"></i>
                {getRoleLabel(userRole)}
              </p>
            </div>
          </div>

          <nav className="sidebar__nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar__nav-item ${isActive(item.path) ? "sidebar__nav-item--active" : ""}`}
                title={!sidebarOpen ? item.label : ""}
              >
                <i className={item.icon}></i>
                {sidebarOpen && (
                  <span className="sidebar__nav-item-label">{item.label}</span>
                )}
              </Link>
            ))}
          </nav>

          <div className="sidebar__footer">
            <button className="sidebar__footer-logout" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket"></i>
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="main-content">
          <header className="main-content__header">
            <div className="main-content__header-breadcrumb">
              <i className="fa-solid fa-house"></i>
              <span>Admin Panel</span>
              <i className="fa-solid fa-chevron-right main-content__header-breadcrumb-separator"></i>
              <span className="main-content__header-breadcrumb-current">
                {location.pathname.split("/").pop()}
              </span>
            </div>

            <div className="main-content__header-actions">
              {/* Notifications */}
              <Notifications />

              <div className="main-content__header-actions-divider"></div>

              <div className="main-content__header-actions-user">
                <i className="fa-regular fa-user"></i>
                <span>{user?.full_name || "Admin"}</span>
              </div>
            </div>
          </header>

          <main className="main-content__body">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Floating Chat Widget */}
      <FloatingChat
        userRole="admin"
        currentUserId={getCurrentUserId()}
        currentUserName={getCurrentUserName()}
      />
    </>
  );
}

export default AdminLayout;
