import { useEffect, useState } from 'react';
import { isSuperAdmin, getRoleLabel, getUserRole } from '../../utils/permissions';
import './AdminDashboard.scss';

function AdminDashboard() {
  const [stats, setStats] = useState({
    events: 0,
    volunteers: 0,
    announcements: 0,
    users: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const userRole = getUserRole();
  const isSuper = isSuperAdmin();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Simulated data - replace with actual API calls
    setStats({
      events: 24,
      volunteers: 856,
      announcements: 12,
      users: 1245
    });

    setRecentActivity([
      {
        id: 1,
        type: 'event',
        title: 'New event registered',
        description: 'Blood Drive at CPU Gymnasium',
        time: '2 minutes ago'
      },
      {
        id: 2,
        type: 'volunteer',
        title: 'New volunteer joined',
        description: 'Juan Dela Cruz registered as volunteer',
        time: '15 minutes ago'
      },
      {
        id: 3,
        type: 'announcement',
        title: 'Announcement published',
        description: 'New training schedule released',
        time: '1 hour ago'
      }
    ]);
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening in {getRoleLabel(userRole)}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon events">📅</div>
          <div className="stat-content">
            <h3>{stats.events}</h3>
            <p>Active Events</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon volunteers">👷</div>
          <div className="stat-content">
            <h3>{stats.volunteers}</h3>
            <p>Volunteers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon announcements">📢</div>
          <div className="stat-content">
            <h3>{stats.announcements}</h3>
            <p>Announcements</p>
          </div>
        </div>

        {isSuper && (
          <div className="stat-card">
            <div className="stat-icon users">👥</div>
            <div className="stat-content">
              <h3>{stats.users}</h3>
              <p>Total Users</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className={`activity-icon ${activity.type}`}>
                {activity.type === 'event' && '📅'}
                {activity.type === 'volunteer' && '👷'}
                {activity.type === 'announcement' && '📢'}
              </div>
              <div className="activity-content">
                <h4>{activity.title}</h4>
                <p>{activity.description}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <button className="quick-action-btn">
            <span className="icon">📅</span>
            <span>Create Event</span>
          </button>
          <button className="quick-action-btn">
            <span className="icon">📢</span>
            <span>Post Announcement</span>
          </button>
          <button className="quick-action-btn">
            <span className="icon">👷</span>
            <span>Add Volunteer</span>
          </button>
          <button className="quick-action-btn">
            <span className="icon">📊</span>
            <span>View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
