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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredItem, setHoveredItem] = useState(null);
  const userRole = getUserRole();

  useEffect(() => {
    // Get user data
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      authService.logout();
      navigate("/login");
    }
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
      color: "#c41e3a",
    },
    {
      path: "/admin/users",
      icon: "fa-solid fa-users",
      label: "User Management",
      color: "#0891b2",
    },
    {
      path: "/admin/volunteers",
      icon: "fa-solid fa-hand-peace",
      label: "Volunteers",
      color: "#10b981",
    },
    {
      path: "/admin/events",
      icon: "fa-solid fa-calendar-days",
      label: "Events",
      color: "#f59e0b",
    },
    {
      path: "/admin/training",
      icon: "fa-solid fa-graduation-cap",
      label: "Training",
      color: "#7c3aed",
    },
    {
      path: "/admin/training-requests",
      icon: "fa-solid fa-pen-to-square",
      label: "Training Requests",
      color: "#8b5cf6",
    },
    {
      path: "/admin/announcements",
      icon: "fa-solid fa-bullhorn",
      label: "Announcements",
      color: "#f97316",
    },
    {
      path: "/admin/blood-bank",
      icon: "fa-solid fa-droplet",
      label: "Blood Bank",
      color: "#c41e3a",
    },
    {
      path: "/admin/inventory",
      icon: "fa-solid fa-boxes",
      label: "Inventory",
      color: "#c2410c",
    },
    {
      path: "/admin/merchandise",
      icon: "fa-solid fa-shirt",
      label: "Merchandise",
      color: "#7c3aed",
    },
    {
      path: "/admin/reports",
      icon: "fa-solid fa-chart-line",
      label: "Reports",
      color: "#059669",
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

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar__header">
            <div className="sidebar__header-logo">
              <i className="fa-solid fa-hand-holding-heart"></i>
              <h2>PRC Admin</h2>
            </div>
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
              {getInitials(user?.full_name)}
            </div>
            <div className="sidebar__profile-info">
              <p className="sidebar__profile-info-name">
                {user?.full_name || "Admin User"}
                {user?.is_new && (
                  <span className="sidebar__new-badge">NEW</span>
                )}
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
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
                style={
                  hoveredItem === item.path && !isActive(item.path)
                    ? { color: item.color }
                    : {}
                }
              >
                <i
                  className={item.icon}
                  style={
                    hoveredItem === item.path && !isActive(item.path)
                      ? { color: item.color }
                      : {}
                  }
                ></i>
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
            <div className="main-content__header-left">
              <div className="main-content__header-breadcrumb">
                <i className="fa-solid fa-house"></i>
                <span>Admin Panel</span>
                <i className="fa-solid fa-chevron-right main-content__header-breadcrumb-separator"></i>
                <span className="main-content__header-breadcrumb-current">
                  {location.pathname.split("/").pop() || "dashboard"}
                </span>
              </div>
              <div className="main-content__header-greeting">
                <i className="fa-regular fa-clock"></i>
                {getGreeting()},{" "}
                {user?.first_name || user?.full_name?.split(" ")[0] || "Admin"}!
              </div>
            </div>

            <div className="main-content__header-right">
              <div className="main-content__header-time">
                <i className="fa-regular fa-calendar"></i>
                {currentTime.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                <span className="time-separator">•</span>
                <i className="fa-regular fa-clock"></i>
                {formatTime()}
              </div>

              <div className="main-content__header-actions">
                {/* Notifications */}
                <Notifications />

                <div className="main-content__header-actions-divider"></div>

                <div className="main-content__header-actions-user">
                  <div className="user-avatar-small">
                    {getInitials(user?.full_name)}
                  </div>
                  <div className="user-info">
                    <span className="user-name">
                      {user?.full_name || "Admin"}
                    </span>
                    <span className="user-role">{getRoleLabel(userRole)}</span>
                  </div>
                  <i className="fa-solid fa-chevron-down"></i>
                </div>
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
