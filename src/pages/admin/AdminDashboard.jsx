import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  isSuperAdmin,
  getRoleLabel,
  getUserRole,
} from "../../utils/permissions";
import "./AdminDashboard.scss";

function AdminDashboard() {
  const [stats, setStats] = useState({
    events: 0,
    volunteers: 0,
    announcements: 0,
    users: 0,
    trainings: 0,
    donations: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const userRole = getUserRole();
  const isSuper = isSuperAdmin();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Simulated data - replace with actual API calls
      setTimeout(() => {
        setStats({
          events: 24,
          volunteers: 856,
          announcements: 12,
          users: 1245,
          trainings: 8,
          donations: 156,
        });

        setRecentActivity([
          {
            id: 1,
            type: "event",
            icon: "fa-solid fa-calendar-check",
            title: "New Event Created",
            description: "Blood Drive at CPU Gymnasium - March 15, 2024",
            time: "2 minutes ago",
            isNew: true,
          },
          {
            id: 2,
            type: "volunteer",
            icon: "fa-solid fa-hand-peace",
            title: "New Volunteer Registration",
            description: "Juan Dela Cruz joined as Event Coordinator",
            time: "15 minutes ago",
            badge: "New",
          },
          {
            id: 3,
            type: "announcement",
            icon: "fa-solid fa-bullhorn",
            title: "Announcement Published",
            description: "New training schedule for Q2 2024 released",
            time: "1 hour ago",
          },
          {
            id: 4,
            type: "training",
            icon: "fa-solid fa-graduation-cap",
            title: "Training Completed",
            description: "First Aid Training for 25 volunteers",
            time: "3 hours ago",
          },
          {
            id: 5,
            type: "donation",
            icon: "fa-solid fa-hand-holding-heart",
            title: "New Donation Received",
            description: "₱50,000 from Iloilo City Government",
            time: "5 hours ago",
            badge: "Urgent",
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard__loading">
          <i className="fa-solid fa-spinner"></i>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-dashboard__header">
        <div className="admin-dashboard__header-title">
          <h1>
            <i className="fa-solid fa-chart-pie"></i>
            Dashboard
          </h1>
          <p>
            <i className="fa-solid fa-circle"></i>
            Welcome back! Here's what's happening in {getRoleLabel(userRole)}
          </p>
        </div>
        <div className="admin-dashboard__header-badge">
          <i className="fa-regular fa-calendar"></i>
          <span>
            <strong>
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </strong>
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-dashboard__stats">
        <div className="admin-dashboard__stats-card">
          <div className="admin-dashboard__stats-card-icon admin-dashboard__stats-card-icon--events">
            <i className="fa-solid fa-calendar-days"></i>
          </div>
          <div className="admin-dashboard__stats-card-content">
            <h3>{stats.events}</h3>
            <p>
              <i className="fa-regular fa-circle"></i>
              Active Events
            </p>
          </div>
        </div>

        <div className="admin-dashboard__stats-card">
          <div className="admin-dashboard__stats-card-icon admin-dashboard__stats-card-icon--volunteers">
            <i className="fa-solid fa-hand-peace"></i>
          </div>
          <div className="admin-dashboard__stats-card-content">
            <h3>{stats.volunteers}</h3>
            <p>
              <i className="fa-regular fa-circle"></i>
              Volunteers
            </p>
          </div>
        </div>

        <div className="admin-dashboard__stats-card">
          <div className="admin-dashboard__stats-card-icon admin-dashboard__stats-card-icon--announcements">
            <i className="fa-solid fa-bullhorn"></i>
          </div>
          <div className="admin-dashboard__stats-card-content">
            <h3>{stats.announcements}</h3>
            <p>
              <i className="fa-regular fa-circle"></i>
              Announcements
            </p>
          </div>
        </div>

        {isSuper && (
          <div className="admin-dashboard__stats-card">
            <div className="admin-dashboard__stats-card-icon admin-dashboard__stats-card-icon--users">
              <i className="fa-solid fa-users"></i>
            </div>
            <div className="admin-dashboard__stats-card-content">
              <h3>{stats.users}</h3>
              <p>
                <i className="fa-regular fa-circle"></i>
                Total Users
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="admin-dashboard__section">
        <div className="admin-dashboard__section-header">
          <h2>
            <i className="fa-solid fa-clock-rotate-left"></i>
            Recent Activity
          </h2>
          <Link
            to="/admin/activity"
            className="admin-dashboard__section-header-link"
          >
            View All <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>

        <div className="admin-dashboard__section-activity">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="admin-dashboard__section-activity-item"
              >
                <div
                  className={`admin-dashboard__section-activity-item-icon admin-dashboard__section-activity-item-icon--${activity.type}`}
                >
                  <i className={activity.icon}></i>
                </div>
                <div className="admin-dashboard__section-activity-item-content">
                  <h4>
                    {activity.title}
                    {activity.isNew && (
                      <span className="admin-dashboard__new-badge">
                        <i className="fa-solid fa-bolt"></i>
                        NEW
                      </span>
                    )}
                  </h4>
                  <p>{activity.description}</p>
                  <div className="admin-dashboard__section-activity-item-content-meta">
                    <span className="admin-dashboard__section-activity-item-content-meta-time">
                      <i className="fa-regular fa-clock"></i>
                      {activity.time}
                    </span>
                    {activity.badge && (
                      <span
                        className={`admin-dashboard__section-activity-item-content-meta-badge admin-dashboard__section-activity-item-content-meta-badge--${activity.badge.toLowerCase()}`}
                      >
                        <i className="fa-solid fa-circle"></i>
                        {activity.badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="admin-dashboard__empty">
              <i className="fa-regular fa-clock"></i>
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-dashboard__section">
        <div className="admin-dashboard__section-header">
          <h2>
            <i className="fa-solid fa-bolt"></i>
            Quick Actions
          </h2>
        </div>

        <div className="admin-dashboard__section-actions">
          <button className="admin-dashboard__section-actions-btn">
            <i className="fa-solid fa-calendar-plus"></i>
            <span>Create Event</span>
          </button>
          <button className="admin-dashboard__section-actions-btn">
            <i className="fa-solid fa-bullhorn"></i>
            <span>Post Announcement</span>
          </button>
          <button className="admin-dashboard__section-actions-btn">
            <i className="fa-solid fa-user-plus"></i>
            <span>Add Volunteer</span>
          </button>
          <button className="admin-dashboard__section-actions-btn">
            <i className="fa-solid fa-chart-line"></i>
            <span>View Reports</span>
          </button>
          <button className="admin-dashboard__section-actions-btn">
            <i className="fa-solid fa-hand-holding-heart"></i>
            <span>Record Donation</span>
          </button>
          <button className="admin-dashboard__section-actions-btn">
            <i className="fa-solid fa-graduation-cap"></i>
            <span>Schedule Training</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
