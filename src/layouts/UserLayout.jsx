import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import authService from "../services/auth.service";
import FloatingChat from "../components/FloatingChat";
import Notifications from "../components/Notifications";
import prcLogo from "./../assets/prc-logo.png";
import "./styles/UserLayout.scss";

function UserLayout() {
  const location = useLocation();
  const user = authService.getCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 992) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    authService.logout();
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      path: "/user/dashboard",
      icon: "fa-solid fa-chart-pie",
      label: "Dashboard",
    },
    {
      path: "/user/events",
      icon: "fa-solid fa-calendar-days",
      label: "Events",
    },
    {
      path: "/user/training",
      icon: "fa-solid fa-graduation-cap",
      label: "Training",
    },
    {
      path: "/user/donations",
      icon: "fa-solid fa-hand-holding-heart",
      label: "Donations",
    },
    {
      path: "/user/merchandise",
      icon: "fa-solid fa-shirt",
      label: "Merchandise",
    },
    {
      path: "/user/blood-map",
      icon: "fa-solid fa-map-location-dot",
      label: "Blood Map",
    },
    {
      path: "/user/announcements",
      icon: "fa-solid fa-bullhorn",
      label: "Announcements",
    },
    { path: "/user/profile", icon: "fa-regular fa-user", label: "Profile" },
  ];

  // Get first name only
  const firstName = user?.full_name?.split(" ")[0] || "User";

  return (
    <>
      <div className="user-layout">
        <header className="user-header">
          <div className="user-header__container">
            <div className="user-header__content">
              {/* Logo with Image */}
              <Link
                to="/"
                className="user-header__logo"
                onClick={() => setMobileMenuOpen(false)}
              >
                <img
                  src={prcLogo}
                  alt="PRC Logo"
                  className="user-header__logo-img"
                />
                <div className="user-header__logo-text">
                  <h1>Philippine Red Cross</h1>
                  <span>Iloilo Chapter</span>
                </div>
              </Link>

              {/* Desktop Navigation - Hide on mobile/tablet */}
              {windowWidth > 992 && (
                <nav className="user-header__nav">
                  <ul className="user-header__nav-list">
                    {navItems.map((item) => (
                      <li key={item.path} className="user-header__nav-item">
                        <Link
                          to={item.path}
                          className={`user-header__nav-link ${
                            isActive(item.path)
                              ? "user-header__nav-link--active"
                              : ""
                          }`}
                        >
                          <i className={item.icon}></i>
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              {/* Mobile Menu Button - Show on tablet/mobile */}
              {windowWidth <= 992 && (
                <button
                  className="user-header__mobile-btn"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  <i
                    className={`fa-solid fa-${mobileMenuOpen ? "xmark" : "bars"}`}
                  ></i>
                </button>
              )}

              {/* User Actions */}
              <div className="user-header__actions">
                <Notifications />

                {windowWidth > 768 && (
                  <div className="user-header__actions-divider"></div>
                )}

                {windowWidth > 992 && (
                  <div className="user-header__actions-user">
                    <i className="fa-regular fa-circle-user"></i>
                    <span>{firstName}</span>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="user-header__actions-logout"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu - Show when menu is open and screen is tablet/mobile */}
        {mobileMenuOpen && windowWidth <= 992 && (
          <div className="user-mobile-menu">
            <nav className="user-mobile-menu__nav">
              <ul className="user-mobile-menu__nav-list">
                {navItems.map((item) => (
                  <li key={item.path} className="user-mobile-menu__nav-item">
                    <Link
                      to={item.path}
                      className={`user-mobile-menu__nav-link ${
                        isActive(item.path)
                          ? "user-mobile-menu__nav-link--active"
                          : ""
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <i className={item.icon}></i>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main className="user-main">
          <div className="user-main__container">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="user-footer">
          <div className="user-footer__container">
            <div className="user-footer__content">
              <div className="user-footer__section">
                <h4 className="user-footer__section-title">
                  <img
                    src={prcLogo}
                    alt="PRC Logo"
                    className="user-footer__logo-img"
                  />
                  PRC Iloilo
                </h4>
                <ul className="user-footer__section-links">
                  <li>
                    <Link to="/about">
                      <i className="fa-solid fa-chevron-right"></i> About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact">
                      <i className="fa-solid fa-chevron-right"></i> Contact
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq">
                      <i className="fa-solid fa-chevron-right"></i> FAQ
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy">
                      <i className="fa-solid fa-chevron-right"></i> Privacy
                      Policy
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="user-footer__section">
                <h4 className="user-footer__section-title">
                  <i className="fa-regular fa-clock"></i>
                  Quick Links
                </h4>
                <ul className="user-footer__section-links">
                  <li>
                    <Link to="/user/events">
                      <i className="fa-solid fa-chevron-right"></i> Upcoming
                      Events
                    </Link>
                  </li>
                  <li>
                    <Link to="/user/training">
                      <i className="fa-solid fa-chevron-right"></i> Training
                      Programs
                    </Link>
                  </li>
                  <li>
                    <Link to="/user/blood-map">
                      <i className="fa-solid fa-chevron-right"></i> Blood
                      Donation Map
                    </Link>
                  </li>
                  <li>
                    <Link to="/user/donations">
                      <i className="fa-solid fa-chevron-right"></i> Make a
                      Donation
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="user-footer__section">
                <h4 className="user-footer__section-title">
                  <i className="fa-regular fa-address-book"></i>
                  Contact Us
                </h4>
                <div className="user-footer__section-contact">
                  <p>
                    <i className="fa-solid fa-location-dot"></i> Iloilo City,
                    Philippines
                  </p>
                  <p>
                    <i className="fa-solid fa-phone"></i> (033) 123-4567
                  </p>
                  <p>
                    <i className="fa-regular fa-envelope"></i>{" "}
                    info@redcross.gov.ph
                  </p>
                </div>
                <div className="user-footer__section-social">
                  <a href="#" aria-label="Facebook">
                    <i className="fa-brands fa-facebook-f"></i>
                  </a>
                  <a href="#" aria-label="Twitter">
                    <i className="fa-brands fa-twitter"></i>
                  </a>
                  <a href="#" aria-label="Instagram">
                    <i className="fa-brands fa-instagram"></i>
                  </a>
                  <a href="#" aria-label="YouTube">
                    <i className="fa-brands fa-youtube"></i>
                  </a>
                </div>
              </div>
            </div>

            <div className="user-footer__bottom">
              <p>
                <i className="fa-regular fa-copyright"></i>
                {new Date().getFullYear()} Philippine Red Cross - Iloilo
                Chapter. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Chat Widget */}
      <FloatingChat userRole="user" />
    </>
  );
}

export default UserLayout;
