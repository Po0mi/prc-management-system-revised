import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import prcLogo from "../../assets/prc-logo.png";
import "./LandingPage.scss";

function LandingPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    fetchAnnouncements();

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(
        "http://localhost/prc-management-system/backend/api/announcements.php",
      );
      const data = await response.json();
      if (data.success) {
        // Filter only published announcements and limit to 3
        const publishedAnnouncements = data.data
          .filter((a) => a.status === "published")
          .slice(0, 3);
        setAnnouncements(publishedAnnouncements);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const impactSlides = [
    {
      title: "Blood Donation Drives",
      description:
        "Saving lives through voluntary blood donation campaigns nationwide",
      icon: "fa-solid fa-droplet",
    },
    {
      title: "Disaster Response",
      description:
        "Rapid emergency response and relief operations across the Philippines",
      icon: "fa-solid fa-truck-fast",
    },
    {
      title: "Community Training",
      description:
        "Empowering communities with life-saving skills and knowledge",
      icon: "fa-solid fa-graduation-cap",
    },
  ];

  // Helper function to get the correct image URL
  const getImageUrl = (announcement) => {
    // Check both possible image fields
    const imagePath = announcement.image_path || announcement.image_url;
    if (!imagePath) return null;

    // Construct the full URL
    return `http://localhost/prc-management-system/${imagePath}`;
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className={`header ${scrolled ? "scrolled" : ""}`}>
        <div className="container">
          <div className="header__content">
            <Link to="/" className="header__logo">
              <img
                src={prcLogo}
                alt="PRC Logo"
                className="header__logo-img"
                onError={(e) => (e.target.style.display = "none")}
              />
              <div className="header__logo-text">
                <h1>Philippine Red Cross</h1>
                <p>Serving Humanity</p>
              </div>
            </Link>
            <nav className="header__nav">
              <Link
                to="/login"
                className="header__nav-btn header__nav-btn--login"
              >
                <i className="fa-solid fa-right-to-bracket"></i>
                Login
              </Link>
              <Link
                to="/register"
                className="header__nav-btn header__nav-btn--register"
              >
                <i className="fa-solid fa-user-plus"></i>
                Register
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero__content">
            <span className="hero__badge">
              <i className="fa-solid fa-heart"></i>
              Humanitarian Excellence Since 1947
            </span>
            <h1 className="hero__title">
              Empowering Communities
              <span className="hero__title-highlight">Through Compassion</span>
            </h1>
            <p className="hero__description">
              Join the Philippine Red Cross in our mission to alleviate human
              suffering, protect life and health, and uphold human dignity
              especially during emergencies.
            </p>
            <div className="hero__buttons">
              <Link to="/register" className="hero__btn hero__btn--primary">
                Get Started <i className="fa-solid fa-arrow-right"></i>
              </Link>
              <a href="#services" className="hero__btn hero__btn--secondary">
                <i className="fa-solid fa-play"></i> Learn More
              </a>
            </div>
            <div className="hero__stats">
              <div className="hero__stat">
                <h3>1M+</h3>
                <p>Lives Touched</p>
              </div>
              <div className="hero__stat">
                <h3>500+</h3>
                <p>Communities Served</p>
              </div>
              <div className="hero__stat">
                <h3>24/7</h3>
                <p>Emergency Response</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact">
        <div className="container">
          <span className="section__badge">
            <i className="fa-solid fa-star"></i>
            Our Impact
          </span>
          <h2 className="section__title">Making a Difference Every Day</h2>
          <p className="section__subtitle">
            Witness the Philippine Red Cross in action across the nation
          </p>

          <div className="impact__carousel">
            <div className="impact__item">
              <div className="impact__item-image">
                <div className="image-placeholder">
                  <i
                    className={`fa-solid ${impactSlides[activeSlide].icon}`}
                  ></i>
                </div>
              </div>
              <div className="impact__item-content">
                <h3>{impactSlides[activeSlide].title}</h3>
                <p>{impactSlides[activeSlide].description}</p>
                <button className="impact__item-content-btn">
                  Join Now <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
            <div className="impact__indicators">
              {impactSlides.map((_, index) => (
                <button
                  key={index}
                  className={`impact__indicator ${index === activeSlide ? "impact__indicator--active" : ""}`}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services" id="services">
        <div className="container">
          <span className="section__badge">
            <i className="fa-solid fa-heart"></i>
            What We Do
          </span>
          <h2 className="section__title">
            Comprehensive Humanitarian Services
          </h2>
          <p className="section__subtitle">
            Discover how we serve humanity through our life-saving programs and
            initiatives
          </p>

          <div className="services__grid">
            {/* Health Services */}
            <div className="services__card">
              <div className="services__card-icon services__card-icon--health">
                <i className="fa-solid fa-heart-pulse"></i>
              </div>
              <h3>Health Services</h3>
              <p>
                Improving health outcomes for vulnerable communities through
                medical programs and health education initiatives.
              </p>
              <ul>
                <li>Community Health Programs</li>
                <li>Epidemic Control</li>
                <li>Maternal & Child Health</li>
                <li>Water & Sanitation</li>
              </ul>
              <a href="#" className="services__card-link">
                Learn More <i className="fa-solid fa-arrow-right"></i>
              </a>
            </div>

            {/* Blood Services */}
            <div className="services__card">
              <div className="services__card-icon services__card-icon--blood">
                <i className="fa-solid fa-droplet"></i>
              </div>
              <h3>Blood Services</h3>
              <p>
                Safe blood collection, testing, and distribution to save lives
                through our nationwide blood bank network.
              </p>
              <ul>
                <li>Voluntary Blood Donation</li>
                <li>Blood Testing & Screening</li>
                <li>Emergency Blood Supply</li>
                <li>Donor Education Programs</li>
              </ul>
              <a href="#" className="services__card-link">
                Donate Blood <i className="fa-solid fa-arrow-right"></i>
              </a>
            </div>

            {/* Training Services */}
            <div className="services__card">
              <div className="services__card-icon services__card-icon--training">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <h3>Training & Safety</h3>
              <p>
                Educational programs on first aid, CPR, disaster response, and
                safety courses for all skill levels.
              </p>
              <ul>
                <li>First Aid Certification</li>
                <li>CPR & Life Support</li>
                <li>Disaster Response Training</li>
                <li>Water Safety Training</li>
              </ul>
              <a href="#" className="services__card-link">
                Join Training <i className="fa-solid fa-arrow-right"></i>
              </a>
            </div>

            {/* Disaster Services */}
            <div className="services__card">
              <div className="services__card-icon services__card-icon--disaster">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h3>Disaster Services</h3>
              <p>
                Providing relief and disaster preparedness training to help
                communities during natural and man-made disasters.
              </p>
              <ul>
                <li>Emergency Relief Operations</li>
                <li>Disaster Preparedness</li>
                <li>Community Response Teams</li>
                <li>Recovery Support</li>
              </ul>
              <a href="#" className="services__card-link">
                Get Involved <i className="fa-solid fa-arrow-right"></i>
              </a>
            </div>

            {/* Welfare Services */}
            <div className="services__card">
              <div className="services__card-icon services__card-icon--welfare">
                <i className="fa-solid fa-hand-holding-heart"></i>
              </div>
              <h3>Welfare Services</h3>
              <p>
                Supporting vulnerable individuals and families through
                comprehensive social welfare programs.
              </p>
              <ul>
                <li>Psychosocial Support</li>
                <li>Family Assistance</li>
                <li>Elderly Care</li>
                <li>Child Protection</li>
              </ul>
              <a href="#" className="services__card-link">
                Find Support <i className="fa-solid fa-arrow-right"></i>
              </a>
            </div>

            {/* Red Cross Youth */}
            <div className="services__card">
              <div className="services__card-icon services__card-icon--youth">
                <i className="fa-solid fa-users"></i>
              </div>
              <h3>Red Cross Youth</h3>
              <p>
                Educating and empowering youth through Red Cross values,
                leadership training, and community service.
              </p>
              <ul>
                <li>Leadership Development</li>
                <li>Peer Education</li>
                <li>Community Service</li>
                <li>International Friendship</li>
              </ul>
              <a href="#" className="services__card-link">
                Join Youth <i className="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      <section className="announcements" id="announcements">
        <div className="container">
          <span className="section__badge">
            <i className="fa-regular fa-newspaper"></i>
            Latest News
          </span>
          <h2 className="section__title">Stay Updated</h2>
          <p className="section__subtitle">
            Get the latest announcements and important updates from Philippine
            Red Cross
          </p>

          <div className="announcements__grid">
            {loading ? (
              <div className="announcements__loading">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <p>Loading announcements...</p>
              </div>
            ) : announcements.length > 0 ? (
              announcements.map((announcement) => {
                const imageUrl = getImageUrl(announcement);

                return (
                  <div
                    key={announcement.announcement_id}
                    className="announcements__card"
                  >
                    <div className="announcements__card-image">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={announcement.title}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23999'%3EImage Not Found%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      ) : (
                        <div className="image-placeholder">
                          <i className="fa-regular fa-image"></i>
                          <span>No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="announcements__card-content">
                      <span className="announcements__card-date">
                        <i className="fa-regular fa-calendar"></i>
                        {new Date(announcement.posted_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                      <h3>{announcement.title}</h3>
                      <p>{announcement.content.substring(0, 120)}...</p>
                      <Link to="/login" className="announcements__card-link">
                        Read More <i className="fa-solid fa-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="announcements__empty">
                <i className="fa-regular fa-newspaper"></i>
                <p>No announcements available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta__content">
            <h2>Ready to Make a Difference?</h2>
            <p>
              Join thousands of volunteers and humanitarian workers in serving
              communities across the Philippines. Your compassion can save
              lives.
            </p>
            <div className="cta__buttons">
              <Link to="/register" className="cta__btn cta__btn--primary">
                <i className="fa-solid fa-heart"></i>
                Become a Volunteer
              </Link>
              <Link to="/login" className="cta__btn cta__btn--secondary">
                <i className="fa-solid fa-right-to-bracket"></i>
                Member Login
              </Link>
            </div>

            <div className="cta__features">
              <div className="cta__feature">
                <i className="fa-solid fa-phone-volume"></i>
                <h4>24/7 Emergency Response</h4>
                <p>Always ready to help when disaster strikes</p>
              </div>
              <div className="cta__feature">
                <i className="fa-solid fa-certificate"></i>
                <h4>Professional Training</h4>
                <p>World-class certification programs</p>
              </div>
              <div className="cta__feature">
                <i className="fa-solid fa-hand-holding-heart"></i>
                <h4>Community Impact</h4>
                <p>Building resilient communities together</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer__content">
            <div className="footer__brand">
              <div className="footer__brand-logo">
                <img
                  src={prcLogo}
                  alt="PRC"
                  onError={(e) => (e.target.style.display = "none")}
                />
                <h3>Philippine Red Cross</h3>
              </div>
              <p>
                The Philippine Red Cross is committed to providing humanitarian
                services that help vulnerable communities become self-reliant.
              </p>
              <div className="footer__social">
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

            <div className="footer__links">
              <div className="footer__column">
                <h4>Quick Access</h4>
                <ul>
                  <li>
                    <i className="fa-solid fa-chevron-right"></i>
                    <Link to="/register">Member Portal</Link>
                  </li>
                  <li>
                    <i className="fa-solid fa-chevron-right"></i>
                    <Link to="/login">Join Us</Link>
                  </li>
                  <li>
                    <i className="fa-solid fa-chevron-right"></i>
                    <a href="#services">Our Services</a>
                  </li>
                  <li>
                    <i className="fa-solid fa-chevron-right"></i>
                    <a href="#announcements">Events</a>
                  </li>
                  <li>
                    <i className="fa-solid fa-chevron-right"></i>
                    <a href="#announcements">Training</a>
                  </li>
                </ul>
              </div>

              <div className="footer__column">
                <h4>Services</h4>
                <ul>
                  <li>
                    <i className="fa-solid fa-chevron-right"></i>
                    <a href="#services">Blood Donation</a>
                  </li>
                  <li>
                    <i className="fa-solid fa-chevron-right"></i>
                    <a href="#services">Emergency Response</a>
                  </li>
                  <li>
                    <i className="fa-solid fa-chevron-right"></i>
                    <a href="#services">Health Programs</a>
                  </li>
                  <li>
                    <i className="fa-solid fa-chevron-right"></i>
                    <a href="#services">Disaster Relief</a>
                  </li>
                  <li>
                    <i className="fa-solid fa-chevron-right"></i>
                    <a href="#services">Training Programs</a>
                  </li>
                </ul>
              </div>

              <div className="footer__column">
                <h4>Contact</h4>
                <ul>
                  <li>
                    <i className="fa-solid fa-phone"></i>
                    143 (Emergency Hotline)
                  </li>
                  <li>
                    <i className="fa-solid fa-envelope"></i>
                    info@redcross.org.ph
                  </li>
                  <li>
                    <i className="fa-solid fa-location-dot"></i>
                    PRC National Headquarters, Manila
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer__bottom">
            <p>
              <i className="fa-regular fa-copyright"></i>
              {new Date().getFullYear()} Philippine Red Cross. All rights
              reserved.
            </p>
            <button
              className="footer__scroll-top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <i className="fa-solid fa-arrow-up"></i>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
