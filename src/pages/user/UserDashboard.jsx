import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./UserDashboard.scss";
import {
  getDashboardOverview,
  getUserStats,
  getUserUpcomingEvents,
  getUserUpcomingTraining,
  getRecentAnnouncements,
  getCalendarEvents,
} from "../../services/userDashboardApi";

// Simple Calendar Component
function MiniCalendar({ events, onDateClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState(null);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const hasEventOnDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.some((e) => e.start === dateStr);
  };

  const getEventsForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.start === dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="user-dashboard__calendar">
      <div className="user-dashboard__calendar-header">
        <div className="calendar-nav">
          <button
            onClick={handlePrevMonth}
            className="nav-btn"
            title="Previous month"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <h4 className="calendar-title">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>
          <button
            onClick={handleNextMonth}
            className="nav-btn"
            title="Next month"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
        <button onClick={goToToday} className="today-btn" title="Go to today">
          <i className="fa-regular fa-calendar-check"></i>
          Today
        </button>
      </div>

      <div className="user-dashboard__calendar-weekdays">
        {dayNames.map((day) => (
          <div key={day} className="user-dashboard__calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="user-dashboard__calendar-days">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="user-dashboard__calendar-day empty"
          ></div>
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const hasEvent = hasEventOnDate(day);
          const today = isToday(day);
          const eventsOnDay = getEventsForDate(day);
          const isHovered = hoveredDay === day;

          return (
            <button
              key={day}
              className={`user-dashboard__calendar-day 
                ${hasEvent ? "has-event" : ""} 
                ${today ? "today" : ""}
                ${isHovered ? "hovered" : ""}`}
              onClick={() => onDateClick?.(day)}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <span className="day-number">{day}</span>
              {hasEvent && (
                <>
                  <span className="event-dot"></span>
                  {isHovered && (
                    <div className="event-tooltip">
                      <strong>
                        {eventsOnDay.length} event
                        {eventsOnDay.length > 1 ? "s" : ""}
                      </strong>
                      {eventsOnDay.slice(0, 2).map((e, idx) => (
                        <span key={idx}>{e.title}</span>
                      ))}
                      {eventsOnDay.length > 2 && (
                        <span>+{eventsOnDay.length - 2} more</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="user-dashboard__calendar-legend">
        <div className="legend-item">
          <span className="legend-dot event-dot"></span>
          <span>Events ({events.length})</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot today-dot"></span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

function UserDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    events: 0,
    training: 0,
    requests: 0,
    pending: { events: 0, training: 0, requests: 0 },
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [upcomingTraining, setUpcomingTraining] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [user, setUser] = useState({});
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    // Get user from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);

    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all dashboard data in parallel
      const [
        statsData,
        eventsData,
        trainingData,
        announcementsData,
        calendarData,
      ] = await Promise.all([
        getUserStats(),
        getUserUpcomingEvents(5),
        getUserUpcomingTraining(5),
        getRecentAnnouncements(5),
        getCalendarEvents(),
      ]);

      if (statsData) setStats(statsData);
      setUpcomingEvents(eventsData);
      setUpcomingTraining(trainingData);
      setAnnouncements(announcementsData);
      setCalendarEvents(calendarData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return { day: "?", month: "?", year: "?" };
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      year: date.getFullYear(),
      full: date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };
  };

  const formatDateTime = (dateString, timeString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} • ${timeString}`;
  };

  const handleViewEvent = (eventId) => {
    navigate(`/user/events/${eventId}`);
  };

  const handleViewTraining = (trainingId) => {
    navigate(`/user/training/${trainingId}`);
  };

  const handleViewAnnouncement = (announcementId) => {
    navigate(`/user/announcements/${announcementId}`);
  };

  const handleBloodMap = () => {
    navigate("/user/blood-map");
  };

  const handleCalendarDateClick = (day) => {
    const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const eventsOnDate = calendarEvents.filter((e) => e.start === dateStr);
    if (eventsOnDate.length > 0) {
      // Could open a modal instead of alert
      navigate("/user/events", { state: { date: dateStr } });
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getTimeBasedIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "fa-regular fa-sun";
    if (hour < 18) return "fa-regular fa-cloud-sun";
    return "fa-regular fa-moon";
  };

  if (loading) {
    return (
      <div className="user-dashboard">
        <div className="user-dashboard__container">
          <div className="user-dashboard__loading">
            <div className="loading-spinner">
              <i className="fa-solid fa-spinner fa-spin"></i>
            </div>
            <p>Loading your dashboard...</p>
            <span className="loading-subtitle">
              Preparing your personalized experience
            </span>
          </div>
        </div>
      </div>
    );
  }

  const firstName =
    user?.full_name?.split(" ")[0] || user?.first_name || "User";
  const initials = getInitials(user?.full_name || user?.first_name);
  const totalPending =
    stats.pending.events + stats.pending.training + stats.pending.requests;

  return (
    <div className="user-dashboard">
      <div className="user-dashboard__container">
        {/* Welcome Header */}
        <div className="user-dashboard__welcome">
          <div className="welcome-left">
            <div className="user-avatar">{initials}</div>
            <div className="welcome-text">
              <div className="greeting-badge">
                <i className={getTimeBasedIcon()}></i>
                <span>{greeting}</span>
              </div>
              <h1 className="user-dashboard__welcome-title">
                Welcome back, <span className="highlight">{firstName}!</span>
              </h1>
              <p className="user-dashboard__welcome-subtitle">
                <i className="fa-solid fa-location-dot"></i>
                Your volunteer journey with <strong>PRC Iloilo Chapter</strong>
              </p>
            </div>
          </div>

          {totalPending > 0 && (
            <div className="welcome-alert">
              <i className="fa-solid fa-bell"></i>
              <div className="alert-content">
                <strong>
                  {totalPending} pending {totalPending === 1 ? "item" : "items"}
                </strong>
                <span>Requires your attention</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="user-dashboard__stats">
          <div className="stats-grid">
            <div className="user-dashboard__stats-card">
              <div className="stats-card-inner">
                <div className="stats-card-icon events">
                  <i className="fa-solid fa-calendar-check"></i>
                </div>
                <div className="stats-card-content">
                  <h3>Events</h3>
                  <div className="stats-numbers">
                    <span className="stat-number">{stats.events}</span>
                    {stats.pending.events > 0 && (
                      <span className="pending-badge">
                        {stats.pending.events} pending
                      </span>
                    )}
                  </div>
                  <span className="stats-label">Registered events</span>
                </div>
              </div>
              <Link to="/user/events" className="stats-card-link">
                View Events <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>

            <div className="user-dashboard__stats-card">
              <div className="stats-card-inner">
                <div className="stats-card-icon training">
                  <i className="fa-solid fa-graduation-cap"></i>
                </div>
                <div className="stats-card-content">
                  <h3>Training</h3>
                  <div className="stats-numbers">
                    <span className="stat-number">{stats.training}</span>
                    {stats.pending.training > 0 && (
                      <span className="pending-badge">
                        {stats.pending.training} pending
                      </span>
                    )}
                  </div>
                  <span className="stats-label">Enrolled courses</span>
                </div>
              </div>
              <Link to="/user/training" className="stats-card-link">
                View Training <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>

            <div className="user-dashboard__stats-card">
              <div className="stats-card-inner">
                <div className="stats-card-icon requests">
                  <i className="fa-solid fa-file-pen"></i>
                </div>
                <div className="stats-card-content">
                  <h3>Requests</h3>
                  <div className="stats-numbers">
                    <span className="stat-number">{stats.requests}</span>
                    {stats.pending.requests > 0 && (
                      <span className="pending-badge">
                        {stats.pending.requests} pending
                      </span>
                    )}
                  </div>
                  <span className="stats-label">Active requests</span>
                </div>
              </div>
              <Link to="/user/requests" className="stats-card-link">
                View Requests <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>

            <div
              className="user-dashboard__stats-card interactive"
              onClick={handleBloodMap}
            >
              <div className="stats-card-inner">
                <div className="stats-card-icon blood">
                  <i className="fa-solid fa-droplet"></i>
                </div>
                <div className="stats-card-content">
                  <h3>Blood Map</h3>
                  <div className="stats-numbers">
                    <span className="stat-number">Find</span>
                  </div>
                  <span className="stats-label">Nearby blood banks</span>
                </div>
              </div>
              <span className="stats-card-link">
                View Map <i className="fa-solid fa-arrow-right"></i>
              </span>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="user-dashboard__two-column">
          {/* Left Column - Calendar */}
          <div className="user-dashboard__left-col">
            <div className="user-dashboard__section calendar-section">
              <div className="user-dashboard__section-header">
                <h2>
                  <i className="fa-regular fa-calendar"></i>
                  Calendar Overview
                </h2>
                <Link to="/user/events" className="section-header-link">
                  <span>View All Events</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
              <MiniCalendar
                events={calendarEvents}
                onDateClick={handleCalendarDateClick}
              />
              {calendarEvents.length > 0 && (
                <div className="upcoming-today">
                  <h4>
                    <i className="fa-regular fa-clock"></i>
                    Today's Schedule
                  </h4>
                  <div className="today-events">
                    {calendarEvents
                      .filter(
                        (e) =>
                          e.start === new Date().toISOString().split("T")[0],
                      )
                      .slice(0, 2)
                      .map((event, idx) => (
                        <div key={idx} className="today-event-item">
                          <span className="event-time">
                            {event.time || "All day"}
                          </span>
                          <span className="event-title">{event.title}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Announcements */}
          <div className="user-dashboard__right-col">
            <div className="user-dashboard__section announcements-section">
              <div className="user-dashboard__section-header">
                <h2>
                  <i className="fa-solid fa-bullhorn"></i>
                  Latest Announcements
                </h2>
                <Link to="/user/announcements" className="section-header-link">
                  <span>View All</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>

              {announcements.length > 0 ? (
                <div className="announcements-list">
                  {announcements.map((announcement) => {
                    const date = formatDate(announcement.date);
                    const isUrgent = announcement.category === "urgent";

                    return (
                      <div
                        key={announcement.id}
                        className={`announcement-card ${isUrgent ? "urgent" : ""}`}
                        onClick={() => handleViewAnnouncement(announcement.id)}
                      >
                        <div className="announcement-icon">
                          {announcement.category === "urgent" && (
                            <i className="fa-solid fa-circle-exclamation"></i>
                          )}
                          {announcement.category === "events" && (
                            <i className="fa-regular fa-calendar"></i>
                          )}
                          {announcement.category === "training" && (
                            <i className="fa-solid fa-graduation-cap"></i>
                          )}
                          {announcement.category === "general" && (
                            <i className="fa-solid fa-bullhorn"></i>
                          )}
                        </div>
                        <div className="announcement-content">
                          <div className="announcement-header">
                            <h4>{announcement.title}</h4>
                            {isUrgent && (
                              <span className="urgent-badge">URGENT</span>
                            )}
                          </div>
                          <p className="announcement-preview">
                            {announcement.content.substring(0, 80)}...
                          </p>
                          <div className="announcement-meta">
                            <span className="date">
                              <i className="fa-regular fa-clock"></i>
                              {date.full}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="fa-regular fa-bell-slash"></i>
                  <p>No announcements</p>
                  <span className="empty-sub">
                    Check back later for updates
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="user-dashboard__section events-section">
          <div className="user-dashboard__section-header">
            <h2>
              <i className="fa-regular fa-calendar-check"></i>
              Your Upcoming Events
            </h2>
            <Link to="/user/events" className="section-header-link">
              <span>View All</span>
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="events-grid">
              {upcomingEvents.map((event) => {
                const date = formatDate(event.date);
                return (
                  <div
                    key={event.id}
                    className="event-card"
                    onClick={() => handleViewEvent(event.id)}
                  >
                    <div className="event-date-badge">
                      <span className="day">{date.day}</span>
                      <span className="month">{date.month}</span>
                    </div>
                    <div className="event-details">
                      <h4>{event.title}</h4>
                      <div className="event-meta">
                        <span className="meta-item">
                          <i className="fa-regular fa-clock"></i>
                          {event.time}
                        </span>
                        <span className="meta-item">
                          <i className="fa-solid fa-location-dot"></i>
                          {event.location}
                        </span>
                      </div>
                      <div className="event-footer">
                        <span className={`status-badge status-${event.status}`}>
                          {event.status}
                        </span>
                        {event.status === "pending" && (
                          <span className="action-reminder">
                            <i className="fa-regular fa-bell"></i>
                            Awaiting approval
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fa-regular fa-calendar-xmark"></i>
              <p>No upcoming events</p>
              <span className="empty-sub">Browse and register for events</span>
              <Link to="/user/events" className="empty-action">
                Browse Events <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
          )}
        </div>

        {/* Upcoming Training */}
        <div className="user-dashboard__section training-section">
          <div className="user-dashboard__section-header">
            <h2>
              <i className="fa-solid fa-graduation-cap"></i>
              Your Upcoming Training
            </h2>
            <Link to="/user/training" className="section-header-link">
              <span>View All</span>
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {upcomingTraining.length > 0 ? (
            <div className="training-grid">
              {upcomingTraining.map((training) => {
                const date = formatDate(training.date);
                return (
                  <div
                    key={training.id}
                    className="training-card"
                    onClick={() => handleViewTraining(training.id)}
                  >
                    <div className="training-header">
                      <div className="training-icon">
                        <i className="fa-solid fa-chalkboard-user"></i>
                      </div>
                      <h4>{training.title}</h4>
                    </div>
                    <div className="training-details">
                      <div className="training-meta">
                        <span className="meta-item">
                          <i className="fa-regular fa-calendar"></i>
                          {date.full}
                        </span>
                        <span className="meta-item">
                          <i className="fa-regular fa-clock"></i>
                          {training.time}
                        </span>
                        <span className="meta-item">
                          <i className="fa-solid fa-location-dot"></i>
                          {training.venue}
                        </span>
                        {training.instructor && (
                          <span className="meta-item">
                            <i className="fa-solid fa-user"></i>
                            {training.instructor}
                          </span>
                        )}
                      </div>
                      <div className="training-footer">
                        <span
                          className={`status-badge status-${training.status}`}
                        >
                          {training.status}
                        </span>
                        <span className="training-capacity">
                          <i className="fa-solid fa-users"></i>
                          {training.enrolled || 0}/{training.capacity || "N/A"}{" "}
                          enrolled
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fa-solid fa-book-open"></i>
              <p>No upcoming training</p>
              <span className="empty-sub">
                Explore available training programs
              </span>
              <Link to="/user/training" className="empty-action">
                Browse Training <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
