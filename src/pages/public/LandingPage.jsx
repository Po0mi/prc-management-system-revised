import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import prcLogo from "../../assets/prc-logo.png";
import "./LandingPage.scss";

function LandingPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(
        "http://localhost/prc-management-system/backend/api/announcements.php",
      );
      const data = await response.json();
      if (data.success) {
        setAnnouncements(data.data.slice(0, 3)); // Show only 3
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <img
                src={prcLogo}
                alt="PRC Logo"
                onError={(e) => (e.target.style.display = "none")}
              />
              <div className="logo-text">
                <h1>Philippine Red Cross</h1>
                <p>Serving Humanity</p>
              </div>
            </div>
            <nav className="nav-buttons">
              <Link to="/login" className="btn-login">
                Login
              </Link>
              <Link to="/register" className="btn-register">
                Register
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <span className="hero-badge">
              <i className="fas fa-heart"></i> Humanitarian Excellence
            </span>
            <h1 className="hero-title">
              Empowering Communities
              <br />
              <span className="hero-highlight">Through Compassion</span>
            </h1>
            <p className="hero-description">
              Join the Philippine Red Cross in our mission to alleviate human
              suffering, protect life and health, and uphold human dignity
              especially during emergencies.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn-primary">
                Get Started <i className="fas fa-arrow-right"></i>
              </Link>
              <a href="#services" className="btn-secondary">
                <i className="fas fa-play"></i> Learn More
              </a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <h3>1M+</h3>
                <p>Lives Touched</p>
              </div>
              <div className="stat">
                <h3>500+</h3>
                <p>Communities Served</p>
              </div>
              <div className="stat">
                <h3>24/7</h3>
                <p>Emergency Response</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Carousel Section */}
      <section className="impact">
        <div className="container">
          <h2 className="section-title">Our Impact in Action</h2>
          <p className="section-subtitle">
            Witness the Philippine Red Cross making a difference across the
            nation
          </p>
          <div className="impact-carousel">
            <div className="carousel-item active">
              <div className="carousel-image">
                {/* Placeholder for blood donation image */}
                <div className="image-placeholder">Blood Donation Drives</div>
              </div>
              <div className="carousel-content">
                <h3>Blood Donation Drives</h3>
                <p>
                  Saving lives through voluntary blood donation campaigns
                  nationwide
                </p>
                <button className="btn-carousel">Join Our Drive</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services" id="services">
        <div className="container">
          <span className="section-badge">
            <i className="fas fa-heart"></i> Our Services
          </span>
          <h2 className="section-title">Comprehensive Humanitarian Aid</h2>
          <p className="section-subtitle">
            Discover how we serve humanity through our life-saving programs and
            community initiatives
          </p>

          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon health">
                <i className="fas fa-heartbeat"></i>
              </div>
              <h3>Health Services</h3>
              <p>
                Improving health outcomes for vulnerable communities through
                medical programs and health education initiatives.
              </p>
              <ul>
                <li>✓ Community Health Programs</li>
                <li>✓ Epidemic Control</li>
                <li>✓ Maternal & Child Health</li>
                <li>✓ Water & Sanitation</li>
              </ul>
              <a href="#" className="service-link">
                Learn More →
              </a>
            </div>

            <div className="service-card">
              <div className="service-icon blood">
                <i className="fas fa-tint"></i>
              </div>
              <h3>Blood Services</h3>
              <p>
                Safe blood collection, testing, and distribution to save lives
                through our nationwide blood bank network.
              </p>
              <ul>
                <li>✓ Voluntary Blood Donation</li>
                <li>✓ Blood Testing & Screening</li>
                <li>✓ Emergency Blood Supply</li>
                <li>✓ Donor Education Programs</li>
              </ul>
              <a href="#" className="service-link">
                Donate Blood →
              </a>
            </div>

            <div className="service-card">
              <div className="service-icon training">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <h3>Training & Safety</h3>
              <p>
                Educational programs on first aid, CPR, disaster response, and
                safety courses for all skill levels.
              </p>
              <ul>
                <li>✓ First Aid Certification</li>
                <li>✓ CPR & Life Support</li>
                <li>✓ Disaster Response Training</li>
                <li>✓ Water Safety Training</li>
              </ul>
              <a href="#" className="service-link">
                Join Training →
              </a>
            </div>

            <div className="service-card">
              <div className="service-icon disaster">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3>Disaster Services</h3>
              <p>
                Providing relief and disaster preparedness training to help
                communities during natural and man-made disasters.
              </p>
              <ul>
                <li>✓ Emergency Relief Operations</li>
                <li>✓ Disaster Preparedness</li>
                <li>✓ Community Response Teams</li>
                <li>✓ Recovery Support</li>
              </ul>
              <a href="#" className="service-link">
                Get Involved →
              </a>
            </div>

            <div className="service-card">
              <div className="service-icon welfare">
                <i className="fas fa-hands-helping"></i>
              </div>
              <h3>Welfare Services</h3>
              <p>
                Supporting vulnerable individuals and families through
                comprehensive social welfare programs.
              </p>
              <ul>
                <li>✓ Psychosocial Support</li>
                <li>✓ Family Assistance</li>
                <li>✓ Elderly Care</li>
                <li>✓ Child Protection</li>
              </ul>
              <a href="#" className="service-link">
                Find Support →
              </a>
            </div>

            <div className="service-card">
              <div className="service-icon youth">
                <i className="fas fa-users"></i>
              </div>
              <h3>Red Cross Youth</h3>
              <p>
                Its mission is to educate and empower children and youth through
                Red Cross values by providing training.
              </p>
              <ul>
                <li>✓ Leadership Development Program</li>
                <li>✓ HIV/AIDS Awareness Prevention education</li>
                <li>✓ Substance Abuse Prevention Education</li>
                <li>✓ International Educational Friendship program</li>
              </ul>
              <a href="#" className="service-link">
                Emergency: 143 📞
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      <section className="announcements">
        <div className="container">
          <span className="section-badge">
            <i className="fas fa-newspaper"></i> Latest News
          </span>
          <h2 className="section-title">Stay Updated</h2>
          <p className="section-subtitle">
            Get the latest announcements and important updates from Philippine
            Red Cross
          </p>

          <div className="announcements-grid">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : announcements.length > 0 ? (
              announcements.map((announcement) => (
                <div
                  key={announcement.announcement_id}
                  className="announcement-card"
                >
                  <div className="announcement-image">
                    {announcement.image_url ? (
                      <img
                        src={`http://localhost/prc-management-system/backend/${announcement.image_url}`}
                        alt={announcement.title}
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">PRC Announcement</div>
                    )}
                  </div>
                  <div className="announcement-content">
                    <span className="announcement-date">
                      <i className="far fa-calendar"></i>{" "}
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
                    <Link to="/login" className="read-more">
                      Read More →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-announcements">No announcements available.</p>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Make a Difference?</h2>
          <p>
            Join thousands of volunteers and humanitarian workers in serving
            communities across the Philippines. Your compassion can save lives.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="btn-cta-primary">
              <i className="fas fa-heart"></i> Become a Volunteer
            </Link>
            <Link to="/login" className="btn-cta-secondary">
              <i className="fas fa-sign-in-alt"></i> Member Login
            </Link>
          </div>

          <div className="cta-features">
            <div className="feature">
              <span className="feature-icon">
                <i className="fas fa-phone-alt"></i>
              </span>
              <h4>24/7 Emergency Response</h4>
              <p>Always ready to help when disaster strikes</p>
            </div>
            <div className="feature">
              <span className="feature-icon">
                <i className="fas fa-certificate"></i>
              </span>
              <h4>Professional Training</h4>
              <p>World-class certification programs</p>
            </div>
            <div className="feature">
              <span className="feature-icon">
                <i className="fas fa-hands-helping"></i>
              </span>
              <h4>Community Impact</h4>
              <p>Building resilient communities together</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
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
              <div className="social-links">
                <a href="#" aria-label="Facebook">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" aria-label="Twitter">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" aria-label="Instagram">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" aria-label="YouTube">
                  <i className="fab fa-youtube"></i>
                </a>
              </div>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Quick Access</h4>
                <ul>
                  <li>
                    <Link to="/register">Member Portal</Link>
                  </li>
                  <li>
                    <Link to="/login">Join Us</Link>
                  </li>
                  <li>
                    <a href="#services">Our Services</a>
                  </li>
                  <li>
                    <a href="#announcements">Events</a>
                  </li>
                  <li>
                    <a href="#announcements">Training</a>
                  </li>
                </ul>
              </div>

              <div className="footer-column">
                <h4>Services</h4>
                <ul>
                  <li>
                    <a href="#services">Blood Donation</a>
                  </li>
                  <li>
                    <a href="#services">Emergency Response</a>
                  </li>
                  <li>
                    <a href="#services">Health Programs</a>
                  </li>
                  <li>
                    <a href="#services">Disaster Relief</a>
                  </li>
                  <li>
                    <a href="#services">Training Programs</a>
                  </li>
                </ul>
              </div>

              <div className="footer-column">
                <h4>Contact</h4>
                <ul>
                  <li>
                    <i className="fas fa-phone"></i> 143 (Emergency Hotline)
                  </li>
                  <li>
                    <i className="fas fa-envelope"></i> info@redcross.org.ph
                  </li>
                  <li>
                    <i className="fas fa-map-marker-alt"></i> PRC National
                    Headquarters, Manila
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2025 Philippine Red Cross. All rights reserved.</p>
            <button
              className="scroll-top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <i className="fas fa-arrow-up"></i>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
