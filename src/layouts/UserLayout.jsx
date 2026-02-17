import { Outlet, Link, useLocation } from "react-router-dom";
import authService from "../services/auth.service";
import FloatingChat from "../components/FloatingChat";
import Notifications from "../components/Notifications";
import "./styles/UserLayout.scss";

function UserLayout() {
  const location = useLocation();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <div className="user-layout">
        <header className="user-header">
          <div className="container">
            <div className="header-content">
              <Link to="/" className="logo">
                <h1>🏥 Philippine Red Cross</h1>
              </Link>

              <nav className="main-nav">
                <Link
                  to="/user/dashboard"
                  className={isActive("/user/dashboard") ? "active" : ""}
                >
                  Dashboard
                </Link>
                <Link
                  to="/user/events"
                  className={isActive("/user/events") ? "active" : ""}
                >
                  Events
                </Link>
                <Link
                  to="/user/training"
                  className={isActive("/user/training") ? "active" : ""}
                >
                  Training
                </Link>
                <Link
                  to="/user/donations"
                  className={isActive("/user/donations") ? "active" : ""}
                >
                  Donations
                </Link>
                <Link
                  to="/user/merchandise"
                  className={isActive("/user/merchandise") ? "active" : ""}
                >
                  Merchandise
                </Link>
                <Link
                  to="/user/blood-map"
                  className={isActive("/user/blood-map") ? "active" : ""}
                >
                  Blood Map
                </Link>
                <Link
                  to="/user/announcements"
                  className={isActive("/user/announcements") ? "active" : ""}
                >
                  Announcements
                </Link>
                <Link
                  to="/user/profile"
                  className={isActive("/user/profile") ? "active" : ""}
                >
                  Profile
                </Link>
              </nav>

              <div className="user-actions">
                {/* Notifications */}
                <Notifications />

                <div className="user-info">
                  <span>Welcome, {user?.full_name}</span>
                </div>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="user-main">
          <Outlet />
        </main>

        <footer className="user-footer">
          <div className="container">
            <p>&copy; 2026 Philippine Red Cross. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Floating Chat Widget */}
      <FloatingChat userRole="user" />
    </>
  );
}

export default UserLayout;
