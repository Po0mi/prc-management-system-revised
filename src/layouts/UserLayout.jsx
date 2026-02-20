import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import authService from "../services/auth.service";
import FloatingChat from "../components/FloatingChat";
import Notifications from "../components/Notifications";
import prcLogo from "./../assets/prc-logo.png";
import "./styles/UserLayout.scss";

function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 992) {
        setMobileMenuOpen(false);
      }
    };

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
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

  const navItems = [
    {
      path: "/user/dashboard",
      icon: "fa-solid fa-chart-pie",
      label: "Dashboard",
      color: "#c41e3a",
    },
    {
      path: "/user/events",
      icon: "fa-solid fa-calendar-days",
      label: "Events",
      color: "#f59e0b",
    },
    {
      path: "/user/training",
      icon: "fa-solid fa-graduation-cap",
      label: "Training",
      color: "#7c3aed",
    },
    {
      path: "/user/donations",
      icon: "fa-solid fa-hand-holding-heart",
      label: "Donations",
      color: "#10b981",
    },
    {
      path: "/user/merchandise",
      icon: "fa-solid fa-shirt",
      label: "Merchandise",
      color: "#0891b2",
    },
    {
      path: "/user/blood-map",
      icon: "fa-solid fa-map-location-dot",
      label: "Blood Map",
      color: "#c2410c",
    },
    {
      path: "/user/announcements",
      icon: "fa-solid fa-bullhorn",
      label: "Announcements",
      color: "#f97316",
    },
    {
      path: "/user/profile",
      icon: "fa-regular fa-user",
      label: "Profile",
      color: "#6b7280",
    },
  ];

  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.full_name) return "U";
    return user.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get first name only
  const firstName = user?.full_name?.split(" ")[0] || "User";

  return (
    <>
      <div className="user-layout">
        <header
          className={`user-header ${scrolled ? "user-header--scrolled" : ""}`}
        >
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
                    <div className="user-avatar">{getInitials()}</div>
                    <div className="user-info">
                      <span className="user-name">{firstName}</span>
                      <span className="user-role">Member</span>
                    </div>
                    <i className="fa-solid fa-chevron-down"></i>
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
            <div className="user-mobile-menu__header">
              <div className="user-mobile-menu__user">
                <div className="user-mobile-menu__avatar">{getInitials()}</div>
                <div className="user-mobile-menu__info">
                  <span className="user-mobile-menu__name">
                    {user?.full_name || "User"}
                  </span>
                  <span className="user-mobile-menu__role">Member</span>
                </div>
              </div>
            </div>
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
                  <div className="footer-logo">
                    <img
                      src={prcLogo}
                      alt="PRC Logo"
                      className="user-footer__logo-img"
                    />
                    <span>PRC Iloilo</span>
                  </div>
                </h4>
                <p className="user-footer__description">
                  The Philippine Red Cross is committed to providing
                  humanitarian services that help vulnerable communities become
                  self-reliant.
                </p>
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
                  <li>
                    <Link to="/user/merchandise">
                      <i className="fa-solid fa-chevron-right"></i> Merchandise
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
                    <i className="fa-solid fa-location-dot"></i>
                    <span>Iloilo City, Philippines</span>
                  </p>
                  <p>
                    <i className="fa-solid fa-phone"></i>
                    <span>(033) 123-4567</span>
                  </p>
                  <p>
                    <i className="fa-regular fa-envelope"></i>
                    <span>info@redcross.gov.ph</span>
                  </p>
                </div>
                <div className="user-footer__section-social">
                  <a href="#" aria-label="Facebook" title="Facebook">
                    <i className="fa-brands fa-facebook-f"></i>
                  </a>
                  <a href="#" aria-label="Twitter" title="Twitter">
                    <i className="fa-brands fa-twitter"></i>
                  </a>
                  <a href="#" aria-label="Instagram" title="Instagram">
                    <i className="fa-brands fa-instagram"></i>
                  </a>
                  <a href="#" aria-label="YouTube" title="YouTube">
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
              <button
                className="user-footer__scroll-top"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Scroll to top"
              >
                <i className="fa-solid fa-arrow-up"></i>
              </button>
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
