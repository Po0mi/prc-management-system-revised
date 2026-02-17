import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Notifications.scss';

function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      // TODO: Replace with actual API call
      const mockNotifications = [
        {
          id: 1,
          type: 'event',
          title: 'New Event Registration',
          message: 'Blood Donation Drive - Feb 25, 2026',
          timestamp: '2026-02-17T10:30:00',
          read: false,
          link: '/user/events/1'
        },
        {
          id: 2,
          type: 'announcement',
          title: 'Important Announcement',
          message: 'Updated schedule for training programs',
          timestamp: '2026-02-16T15:20:00',
          read: false,
          link: '/user/announcements'
        },
        {
          id: 3,
          type: 'training',
          title: 'Training Completed',
          message: 'Congratulations! First Aid certificate is ready',
          timestamp: '2026-02-15T09:00:00',
          read: true,
          link: '/user/profile'
        },
        {
          id: 4,
          type: 'message',
          title: 'New Message',
          message: 'Admin Support sent you a message',
          timestamp: '2026-02-14T14:30:00',
          read: true,
          link: '/user/messages'
        }
      ];

      setNotifications(mockNotifications);
      const unread = mockNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // TODO: Replace with actual API call
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Replace with actual API call
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      event: '📅',
      announcement: '📢',
      training: '🎓',
      message: '💬',
      donation: '💰',
      default: '🔔'
    };
    return icons[type] || icons.default;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button 
        className="notifications-button" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.link}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => {
                    markAsRead(notification.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="timestamp">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                  </div>
                  {!notification.read && (
                    <div className="unread-indicator"></div>
                  )}
                </Link>
              ))
            )}
          </div>

          <div className="notifications-footer">
            <Link to="/user/notifications" onClick={() => setIsOpen(false)}>
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;
