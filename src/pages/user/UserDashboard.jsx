import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./UserDashboard.scss";

function UserDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    events: 0,
    training: 0,
    certificates: 0,
    donations: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [trainingProgress, setTrainingProgress] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Simulated data - replace with actual API calls
      setTimeout(() => {
        setStats({
          events: 3,
          training: 5,
          certificates: 2,
          donations: 1560,
        });

        setUpcomingEvents([
          {
            id: 1,
            title: "Blood Drive",
            date: "2026-02-20",
            time: "8:00 AM - 5:00 PM",
            location: "CPU Gymnasium, Iloilo City",
            description:
              "Join us for a community blood drive. Your donation can save lives!",
            status: "registered",
            certificate: false,
          },
          {
            id: 2,
            title: "First Aid Training",
            date: "2026-02-25",
            time: "9:00 AM - 4:00 PM",
            location: "PRC Chapter Office, Iloilo City",
            description: "Basic first aid and CPR certification training",
            status: "registered",
            certificate: true,
          },
          {
            id: 3,
            title: "Disaster Response Workshop",
            date: "2026-03-05",
            time: "8:30 AM - 5:30 PM",
            location: "Iloilo Convention Center",
            description: "Workshop on disaster preparedness and response",
            status: "pending",
            certificate: false,
          },
        ]);

        setTrainingProgress([
          {
            id: 1,
            title: "Basic Life Support",
            progress: 75,
            nextSession: "2026-02-22",
            modules: 8,
            completed: 6,
          },
          {
            id: 2,
            title: "Water Safety",
            progress: 40,
            nextSession: "2026-02-24",
            modules: 10,
            completed: 4,
          },
        ]);

        setCertificates([
          {
            id: 1,
            title: "First Aid Training",
            issueDate: "2026-01-15",
            expiryDate: "2027-01-15",
          },
          {
            id: 2,
            title: "CPR Certification",
            issueDate: "2026-01-20",
            expiryDate: "2027-01-20",
          },
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      year: date.getFullYear(),
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="user-dashboard">
        <div className="user-dashboard__container">
          <div className="user-dashboard__loading">
            <i className="fa-solid fa-spinner"></i>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <div className="user-dashboard__container">
        {/* Welcome Header */}
        <div className="user-dashboard__welcome">
          <h1 className="user-dashboard__welcome-title">
            <i className="fa-regular fa-circle-user"></i>
            Welcome back, {user?.full_name?.split(" ")[0] || "User"}!
          </h1>
          <p className="user-dashboard__welcome-subtitle">
            <i className="fa-solid fa-circle"></i>
            Here's your volunteer journey with <span>PRC Iloilo</span>
          </p>
        </div>

        {/* Stats Cards */}
        <div className="user-dashboard__stats">
          <div className="user-dashboard__stats-card">
            <div className="user-dashboard__stats-card-icon user-dashboard__stats-card-icon--events">
              <i className="fa-solid fa-calendar-check"></i>
            </div>
            <div className="user-dashboard__stats-card-content">
              <h3>Events</h3>
              <p className="stat-number">{stats.events}</p>
              <span>
                <i className="fa-regular fa-circle"></i>
                Registered Events
              </span>
            </div>
          </div>

          <div className="user-dashboard__stats-card">
            <div className="user-dashboard__stats-card-icon user-dashboard__stats-card-icon--training">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div className="user-dashboard__stats-card-content">
              <h3>Training</h3>
              <p className="stat-number">{stats.training}</p>
              <span>
                <i className="fa-regular fa-circle"></i>
                Completed Modules
              </span>
            </div>
          </div>

          <div className="user-dashboard__stats-card">
            <div className="user-dashboard__stats-card-icon user-dashboard__stats-card-icon--certificates">
              <i className="fa-solid fa-certificate"></i>
            </div>
            <div className="user-dashboard__stats-card-content">
              <h3>Certificates</h3>
              <p className="stat-number">{stats.certificates}</p>
              <span>
                <i className="fa-regular fa-circle"></i>
                Available
              </span>
            </div>
          </div>

          <div className="user-dashboard__stats-card">
            <div className="user-dashboard__stats-card-icon user-dashboard__stats-card-icon--donations">
              <i className="fa-solid fa-hand-holding-heart"></i>
            </div>
            <div className="user-dashboard__stats-card-content">
              <h3>Donations</h3>
              <p className="stat-number">{formatCurrency(stats.donations)}</p>
              <span>
                <i className="fa-regular fa-circle"></i>
                Total Donated
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="user-dashboard__section">
          <div className="user-dashboard__section-header">
            <h2>
              <i className="fa-regular fa-calendar"></i>
              Upcoming Events
            </h2>
            <Link
              to="/user/events"
              className="user-dashboard__section-header-link"
            >
              View All <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="user-dashboard__section-events">
              {upcomingEvents.map((event) => {
                const date = formatDate(event.date);
                return (
                  <div
                    key={event.id}
                    className="user-dashboard__section-events-card"
                  >
                    <div className="user-dashboard__section-events-card-date">
                      <span className="day">{date.day}</span>
                      <span className="month">{date.month}</span>
                      <span className="year">{date.year}</span>
                    </div>
                    <div className="user-dashboard__section-events-card-details">
                      <h3>
                        {event.title}
                        {event.certificate && (
                          <span className="user-dashboard__new-badge">
                            <i className="fa-solid fa-certificate"></i>
                            Certificate
                          </span>
                        )}
                      </h3>
                      <div className="user-dashboard__section-events-card-details-meta">
                        <span>
                          <i className="fa-regular fa-clock"></i>
                          {event.time}
                        </span>
                        <span>
                          <i className="fa-solid fa-location-dot"></i>
                          {event.location}
                        </span>
                      </div>
                      <p className="user-dashboard__section-events-card-details-description">
                        {event.description}
                      </p>
                      <div className="user-dashboard__section-events-card-details-footer">
                        <span
                          className={`user-dashboard__section-events-card-details-status user-dashboard__section-events-card-details-status--${event.status}`}
                        >
                          <i className="fa-solid fa-circle"></i>
                          {event.status}
                        </span>
                        <div className="user-dashboard__section-events-card-details-actions">
                          <button className="btn-view">
                            <i className="fa-regular fa-eye"></i>
                            View
                          </button>
                          {event.certificate && (
                            <button className="btn-certificate">
                              <i className="fa-solid fa-download"></i>
                              Certificate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="user-dashboard__empty">
              <i className="fa-regular fa-calendar-xmark"></i>
              <p>No upcoming events</p>
              <span className="user-dashboard__empty-sub">
                Check back later for new events
              </span>
            </div>
          )}
        </div>

        {/* Training Progress */}
        <div className="user-dashboard__section">
          <div className="user-dashboard__section-header">
            <h2>
              <i className="fa-solid fa-graduation-cap"></i>
              Training Progress
            </h2>
            <Link
              to="/user/training"
              className="user-dashboard__section-header-link"
            >
              View All <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {trainingProgress.length > 0 ? (
            <div className="user-dashboard__section-training">
              {trainingProgress.map((training) => (
                <div
                  key={training.id}
                  className="user-dashboard__section-training-card"
                >
                  <div className="user-dashboard__section-training-card-header">
                    <i className="fa-solid fa-book-open"></i>
                    <h4>{training.title}</h4>
                  </div>
                  <div className="user-dashboard__section-training-card-progress">
                    <div className="user-dashboard__section-training-card-progress-bar">
                      <div style={{ width: `${training.progress}%` }}></div>
                    </div>
                    <span className="user-dashboard__section-training-card-progress-text">
                      <i className="fa-regular fa-circle"></i>
                      {training.completed}/{training.modules} modules completed
                    </span>
                  </div>
                  <div className="user-dashboard__section-training-card-footer">
                    <span className="date">
                      <i className="fa-regular fa-clock"></i>
                      Next:{" "}
                      {new Date(training.nextSession).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" },
                      )}
                    </span>
                    <button className="btn-continue">Continue</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="user-dashboard__empty">
              <i className="fa-solid fa-book-open"></i>
              <p>No training in progress</p>
              <span className="user-dashboard__empty-sub">
                Start your first training course
              </span>
            </div>
          )}
        </div>

        {/* My Certificates */}
        <div className="user-dashboard__section">
          <div className="user-dashboard__section-header">
            <h2>
              <i className="fa-solid fa-certificate"></i>
              My Certificates
            </h2>
            <Link
              to="/user/certificates"
              className="user-dashboard__section-header-link"
            >
              View All <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {certificates.length > 0 ? (
            <div className="user-dashboard__section-certificates">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="user-dashboard__section-certificates-card"
                >
                  <i className="fa-solid fa-certificate"></i>
                  <div className="user-dashboard__section-certificates-card-info">
                    <h4>{cert.title}</h4>
                    <p>
                      <i className="fa-regular fa-calendar"></i>
                      Issued:{" "}
                      {new Date(cert.issueDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <button className="btn-download" title="Download Certificate">
                    <i className="fa-solid fa-download"></i>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="user-dashboard__empty">
              <i className="fa-solid fa-certificate"></i>
              <p>No certificates yet</p>
              <span className="user-dashboard__empty-sub">
                Complete training to earn certificates
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
