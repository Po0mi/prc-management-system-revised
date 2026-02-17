import { useEffect, useState } from "react";
import "../../styles/variables.scss";
import "./UserDashboard.scss";

function UserDashboard() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    // Fetch user's upcoming events
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    // Simulated data - replace with actual API call
    setUpcomingEvents([
      {
        id: 1,
        title: "Blood Drive",
        date: "2026-02-20",
        location: "CPU Gymnasium",
        status: "registered",
      },
      {
        id: 2,
        title: "First Aid Training",
        date: "2026-02-25",
        location: "Chapter Office",
        status: "registered",
      },
    ]);
  };

  return (
    <div className="user-dashboard">
      <div className="container">
        <h1>My Dashboard</h1>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>My Events</h3>
            <p className="stat-number">3</p>
            <span>Registered</span>
          </div>

          <div className="stat-card">
            <h3>Training</h3>
            <p className="stat-number">5</p>
            <span>Completed</span>
          </div>

          <div className="stat-card">
            <h3>Certificates</h3>
            <p className="stat-number">2</p>
            <span>Available</span>
          </div>
        </div>

        <div className="section">
          <h2>Upcoming Events</h2>
          <div className="events-list">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="event-card">
                <div className="event-date">
                  <span className="day">{new Date(event.date).getDate()}</span>
                  <span className="month">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="event-details">
                  <h3>{event.title}</h3>
                  <p>📍 {event.location}</p>
                  <span className="status registered">{event.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
