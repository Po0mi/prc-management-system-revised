import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  return (
    <div className="user-dashboard__calendar">
      <div className="user-dashboard__calendar-header">
        <button onClick={handlePrevMonth}>
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <h4>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h4>
        <button onClick={handleNextMonth}>
          <i className="fa-solid fa-chevron-right"></i>
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
          return (
            <button
              key={day}
              className={`user-dashboard__calendar-day ${hasEvent ? "has-event" : ""}`}
              onClick={() => onDateClick?.(day)}
            >
              {day}
              {hasEvent && <span className="event-dot"></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UserDashboard() {
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

  useEffect(() => {
    // Get user from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);

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
    window.location.href = `/user/events/${eventId}`;
  };

  const handleViewTraining = (trainingId) => {
    window.location.href = `/user/training/${trainingId}`;
  };

  const handleViewAnnouncement = (announcementId) => {
    window.location.href = `/user/announcements/${announcementId}`;
  };

  const handleBloodMap = () => {
    window.location.href = "/user/blood-map";
  };

  const handleCalendarDateClick = (day) => {
    const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    // Filter events for this date
    const eventsOnDate = calendarEvents.filter((e) => e.start === dateStr);
    if (eventsOnDate.length > 0) {
      alert(
        `Events on this date: ${eventsOnDate.map((e) => e.title).join(", ")}`,
      );
    }
  };

  if (loading) {
    return (
      <div className="user-dashboard">
        <div className="user-dashboard__container">
          <div className="user-dashboard__loading">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const firstName =
    user?.full_name?.split(" ")[0] || user?.first_name || "User";

  return (
    <div className="user-dashboard">
      <div className="user-dashboard__container">
        {/* Welcome Header */}
        <div className="user-dashboard__welcome">
          <h1 className="user-dashboard__welcome-title">
            <i className="fa-regular fa-circle-user"></i>
            Welcome back, {firstName}!
          </h1>
          <p className="user-dashboard__welcome-subtitle">
            <i className="fa-solid fa-circle"></i>
            Your volunteer journey with <span>PRC Iloilo</span>
          </p>
          {stats.pending.events +
            stats.pending.training +
            stats.pending.requests >
            0 && (
            <div className="user-dashboard__welcome-alert">
              <i className="fa-solid fa-clock"></i>
              <span>
                You have{" "}
                {stats.pending.events +
                  stats.pending.training +
                  stats.pending.requests}{" "}
                pending
                {stats.pending.events +
                  stats.pending.training +
                  stats.pending.requests ===
                1
                  ? " item"
                  : " items"}
              </span>
            </div>
          )}
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
                {stats.pending.events > 0
                  ? `${stats.pending.events} pending`
                  : "Registered"}
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
                {stats.pending.training > 0
                  ? `${stats.pending.training} pending`
                  : "Enrolled"}
              </span>
            </div>
          </div>

          <div className="user-dashboard__stats-card">
            <div className="user-dashboard__stats-card-icon user-dashboard__stats-card-icon--requests">
              <i className="fa-solid fa-file-pen"></i>
            </div>
            <div className="user-dashboard__stats-card-content">
              <h3>Requests</h3>
              <p className="stat-number">{stats.requests}</p>
              <span>
                <i className="fa-regular fa-circle"></i>
                {stats.pending.requests > 0
                  ? `${stats.pending.requests} pending`
                  : "Submitted"}
              </span>
            </div>
          </div>

          <div
            className="user-dashboard__stats-card user-dashboard__stats-card--clickable"
            onClick={handleBloodMap}
          >
            <div className="user-dashboard__stats-card-icon user-dashboard__stats-card-icon--blood">
              <i className="fa-solid fa-droplet"></i>
            </div>
            <div className="user-dashboard__stats-card-content">
              <h3>Blood Map</h3>
              <p className="stat-number">Find Blood</p>
              <span>
                <i className="fa-regular fa-circle"></i>
                Click to view map
              </span>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="user-dashboard__two-column">
          {/* Left Column - Calendar */}
          <div className="user-dashboard__left-col">
            <div className="user-dashboard__section">
              <div className="user-dashboard__section-header">
                <h2>
                  <i className="fa-regular fa-calendar"></i>
                  Calendar
                </h2>
                <Link
                  to="/user/events"
                  className="user-dashboard__section-header-link"
                >
                  View All Events <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
              <MiniCalendar
                events={calendarEvents}
                onDateClick={handleCalendarDateClick}
              />
              <div className="user-dashboard__calendar-legend">
                <span className="legend-item">
                  <span className="legend-dot event-dot"></span>
                  Events
                </span>
                <span className="legend-item">
                  <span className="legend-dot training-dot"></span>
                  Training
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Announcements */}
          <div className="user-dashboard__right-col">
            <div className="user-dashboard__section">
              <div className="user-dashboard__section-header">
                <h2>
                  <i className="fa-solid fa-bullhorn"></i>
                  Latest Announcements
                </h2>
                <Link
                  to="/user/announcements"
                  className="user-dashboard__section-header-link"
                >
                  View All <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>

              {announcements.length > 0 ? (
                <div className="user-dashboard__announcements">
                  {announcements.map((announcement) => {
                    const date = formatDate(announcement.date);
                    return (
                      <div
                        key={announcement.id}
                        className={`user-dashboard__announcement-card user-dashboard__announcement-card--${announcement.category}`}
                        onClick={() => handleViewAnnouncement(announcement.id)}
                      >
                        <div className="user-dashboard__announcement-card-icon">
                          {announcement.category === "urgent" && (
                            <i className="fa-solid fa-exclamation-triangle"></i>
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
                        <div className="user-dashboard__announcement-card-content">
                          <h4>{announcement.title}</h4>
                          <p>{announcement.content.substring(0, 80)}...</p>
                          <span className="date">
                            <i className="fa-regular fa-clock"></i>
                            {date.month} {date.day}, {date.year}
                          </span>
                        </div>
                        {announcement.category === "urgent" && (
                          <span className="urgent-badge">URGENT</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="user-dashboard__empty">
                  <i className="fa-regular fa-bell-slash"></i>
                  <p>No announcements</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="user-dashboard__section">
          <div className="user-dashboard__section-header">
            <h2>
              <i className="fa-regular fa-calendar-check"></i>
              Your Upcoming Events
            </h2>
            <Link
              to="/user/events"
              className="user-dashboard__section-header-link"
            >
              View All <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="user-dashboard__events-grid">
              {upcomingEvents.map((event) => {
                const date = formatDate(event.date);
                return (
                  <div
                    key={event.id}
                    className="user-dashboard__event-card"
                    onClick={() => handleViewEvent(event.id)}
                  >
                    <div className="user-dashboard__event-card-date">
                      <span className="day">{date.day}</span>
                      <span className="month">{date.month}</span>
                    </div>
                    <div className="user-dashboard__event-card-content">
                      <h4>{event.title}</h4>
                      <div className="meta">
                        <span>
                          <i className="fa-regular fa-clock"></i>
                          {event.time}
                        </span>
                        <span>
                          <i className="fa-solid fa-location-dot"></i>
                          {event.location}
                        </span>
                      </div>
                      <span className={`status status--${event.status}`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="user-dashboard__empty">
              <i className="fa-regular fa-calendar-xmark"></i>
              <p>No upcoming events</p>
              <Link to="/user/events" className="empty-action">
                Browse Events
              </Link>
            </div>
          )}
        </div>

        {/* Upcoming Training */}
        <div className="user-dashboard__section">
          <div className="user-dashboard__section-header">
            <h2>
              <i className="fa-solid fa-graduation-cap"></i>
              Your Upcoming Training
            </h2>
            <Link
              to="/user/training"
              className="user-dashboard__section-header-link"
            >
              View All <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {upcomingTraining.length > 0 ? (
            <div className="user-dashboard__training-grid">
              {upcomingTraining.map((training) => {
                const date = formatDate(training.date);
                return (
                  <div
                    key={training.id}
                    className="user-dashboard__training-card"
                    onClick={() => handleViewTraining(training.id)}
                  >
                    <div className="user-dashboard__training-card-header">
                      <i className="fa-solid fa-chalkboard-user"></i>
                      <h4>{training.title}</h4>
                    </div>
                    <div className="user-dashboard__training-card-content">
                      <div className="meta">
                        <span>
                          <i className="fa-regular fa-calendar"></i>
                          {date.month} {date.day}, {date.year}
                        </span>
                        <span>
                          <i className="fa-regular fa-clock"></i>
                          {training.time}
                        </span>
                        <span>
                          <i className="fa-solid fa-location-dot"></i>
                          {training.venue}
                        </span>
                        {training.instructor && (
                          <span>
                            <i className="fa-solid fa-user"></i>
                            {training.instructor}
                          </span>
                        )}
                      </div>
                      <span className={`status status--${training.status}`}>
                        {training.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="user-dashboard__empty">
              <i className="fa-solid fa-book-open"></i>
              <p>No upcoming training</p>
              <Link to="/user/training" className="empty-action">
                Browse Training
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
