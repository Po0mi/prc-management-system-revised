/**
 * userDashboardApi.js
 * Path: src/services/userDashboardApi.js
 *
 * Aggregates user-specific data from all backend APIs
 */
import api from "./api";

// Get current user ID from localStorage/session
const getCurrentUserId = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user?.user_id || null;
};

// ─── USER STATS ───────────────────────────────────────────────────────────────
export const getUserStats = async () => {
  const userId = getCurrentUserId();
  if (!userId) return null;

  try {
    console.log("📡 Fetching stats for user:", userId);

    // Get user's event registrations
    const eventsRes = await api.get("/api/registrations.php", {
      params: { action: "my-registrations" },
    });

    // Get user's training registrations
    const trainingRes = await api.get("/api/session_registrations.php", {
      params: { action: "my-registrations" },
    });

    // Get user's training requests
    const requestsRes = await api.get("/api/training_requests.php", {
      params: { action: "my-requests" },
    });

    // Calculate stats
    const eventRegs = eventsRes.data?.registrations || [];
    const trainingRegs = trainingRes.data?.registrations || [];
    const userRequests = requestsRes.data?.requests || [];

    console.log(
      "📊 Stats - Events:",
      eventRegs.length,
      "Training:",
      trainingRegs.length,
      "Requests:",
      userRequests.length,
    );

    return {
      events: eventRegs.length,
      training: trainingRegs.length,
      requests: userRequests.length,
      pending: {
        events: eventRegs.filter((r) => r.status === "pending").length,
        training: trainingRegs.filter((r) => r.status === "pending").length,
        requests: userRequests.filter((r) => r.status === "pending").length,
      },
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      events: 0,
      training: 0,
      requests: 0,
      pending: {
        events: 0,
        training: 0,
        requests: 0,
      },
    };
  }
};

// ─── UPCOMING EVENTS ──────────────────────────────────────────────────────────
export const getUserUpcomingEvents = async (limit = 5) => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  try {
    console.log("📅 Fetching upcoming events for user:", userId);

    // Get user's registrations first
    const regsRes = await api.get("/api/registrations.php", {
      params: { action: "my-registrations" },
    });

    if (!regsRes.data?.success) {
      console.log("❌ Registrations API not successful");
      return [];
    }

    const userRegs = regsRes.data.registrations || [];
    console.log("📋 User registrations:", userRegs);

    // Filter approved and pending registrations
    const activeRegs = userRegs.filter(
      (reg) => reg.status === "approved" || reg.status === "pending",
    );
    console.log("✅ Active registrations:", activeRegs);

    if (activeRegs.length === 0) return [];

    // Get event details for each registration
    const eventPromises = activeRegs.map(async (reg) => {
      try {
        const eventRes = await api.get("/api/events.php", {
          params: { action: "details", id: reg.event_id },
        });

        if (eventRes.data?.success) {
          const event = eventRes.data.event;
          return {
            id: event.event_id,
            title: event.title,
            date: event.event_date,
            time: `${event.start_time?.slice(0, 5)} - ${event.end_time?.slice(0, 5)}`,
            location: event.location?.split("\n")[0] || event.location,
            description: event.description,
            status: reg.status,
            service: event.major_service,
            registration_id: reg.registration_id,
          };
        }
        return null;
      } catch (error) {
        // Handle 404 errors gracefully (event might be deleted/archived)
        if (error.response?.status === 404) {
          console.log(
            `⚠️ Event ${reg.event_id} not found (may be archived), skipping`,
          );
          return null;
        }
        console.error(`❌ Error fetching event ${reg.event_id}:`, error);
        return null;
      }
    });

    const upcomingEvents = await Promise.all(eventPromises);

    // Filter out null values and sort by date
    const validEvents = upcomingEvents.filter((event) => event !== null);
    console.log("📅 Valid events after filtering:", validEvents);

    return validEvents
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, limit);
  } catch (error) {
    console.error("❌ Error in getUserUpcomingEvents:", error);
    return [];
  }
};

// ─── UPCOMING TRAINING ────────────────────────────────────────────────────────
export const getUserUpcomingTraining = async (limit = 5) => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  try {
    console.log("🎓 Fetching upcoming training for user:", userId);

    // Get user's training registrations
    const regsRes = await api.get("/api/session_registrations.php", {
      params: { action: "my-registrations" },
    });

    if (!regsRes.data?.success) {
      console.log("❌ Training registrations API not successful");
      return [];
    }

    const userRegs = regsRes.data.registrations || [];
    console.log("📋 User training registrations:", userRegs);

    // Filter approved and pending registrations
    const activeRegs = userRegs.filter(
      (reg) => reg.status === "approved" || reg.status === "pending",
    );
    console.log("✅ Active training registrations:", activeRegs);

    if (activeRegs.length === 0) return [];

    // Get training details for each registration
    const trainingPromises = activeRegs.map(async (reg) => {
      try {
        const trainingRes = await api.get("/api/training_sessions.php", {
          params: { action: "details", id: reg.session_id },
        });

        if (trainingRes.data?.success) {
          const training = trainingRes.data.session;
          return {
            id: training.session_id,
            title: training.title,
            date: training.session_date,
            time: `${training.start_time?.slice(0, 5)} - ${training.end_time?.slice(0, 5)}`,
            venue: training.venue,
            instructor: training.instructor,
            status: reg.status,
            service: training.major_service,
            registration_id: reg.registration_id,
          };
        }
        return null;
      } catch (error) {
        // Handle 404 errors gracefully
        if (error.response?.status === 404) {
          console.log(
            `⚠️ Training session ${reg.session_id} not found, skipping`,
          );
          return null;
        }
        console.error(`❌ Error fetching training ${reg.session_id}:`, error);
        return null;
      }
    });

    const upcomingTraining = await Promise.all(trainingPromises);

    // Filter out null values and sort by date
    const validTraining = upcomingTraining.filter(
      (training) => training !== null,
    );
    console.log("🎓 Valid training after filtering:", validTraining);

    return validTraining
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, limit);
  } catch (error) {
    console.error("❌ Error in getUserUpcomingTraining:", error);
    return [];
  }
};

// ─── RECENT ANNOUNCEMENTS ─────────────────────────────────────────────────────
export const getRecentAnnouncements = async (limit = 5) => {
  try {
    console.log("📢 Fetching recent announcements...");

    const res = await api.get("/api/announcements.php", {
      params: { status: "published" },
    });

    if (!res.data?.success) {
      console.log("❌ Announcements API not successful");
      return [];
    }

    const announcements = (res.data.data || [])
      .filter((a) => a.status === "published")
      .map((a) => ({
        id: a.announcement_id,
        title: a.title,
        content: a.content,
        date: a.posted_at,
        category: a.category,
        target_role: a.target_role,
        image_path: a.image_path,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    console.log("📢 Announcements fetched:", announcements.length);
    return announcements;
  } catch (error) {
    console.error("❌ Error fetching announcements:", error);
    return [];
  }
};

// ─── CALENDAR EVENTS ──────────────────────────────────────────────────────────
export const getCalendarEvents = async () => {
  try {
    console.log("🗓️ Fetching calendar events...");

    // Fetch both events and training sessions
    const [eventsRes, trainingRes] = await Promise.all([
      api.get("/api/events.php"),
      api.get("/api/training_sessions.php"),
    ]);

    const calendarEvents = [];

    // Add events
    if (eventsRes.data?.success) {
      const events = eventsRes.data.events || [];
      events.forEach((event) => {
        calendarEvents.push({
          id: `event-${event.event_id}`,
          title: event.title,
          start: event.event_date,
          end: event.event_end_date || event.event_date,
          time: `${event.start_time?.slice(0, 5)} - ${event.end_time?.slice(0, 5)}`,
          type: "event",
          service: event.major_service,
          location: event.location,
        });
      });
    }

    // Add training sessions
    if (trainingRes.data?.success) {
      const sessions = trainingRes.data.sessions || [];
      sessions.forEach((session) => {
        calendarEvents.push({
          id: `training-${session.session_id}`,
          title: session.title,
          start: session.session_date,
          end: session.session_end_date || session.session_date,
          time: `${session.start_time?.slice(0, 5)} - ${session.end_time?.slice(0, 5)}`,
          type: "training",
          service: session.major_service,
          location: session.venue,
          instructor: session.instructor,
        });
      });
    }

    console.log("🗓️ Calendar events fetched:", calendarEvents.length);
    return calendarEvents;
  } catch (error) {
    console.error("❌ Error fetching calendar events:", error);
    return [];
  }
};

// ─── DASHBOARD OVERVIEW ──────────────────────────────────────────────────────
export const getDashboardOverview = async () => {
  console.log("🚀 Fetching complete dashboard overview...");

  try {
    const [stats, events, training, announcements, calendar] =
      await Promise.all([
        getUserStats(),
        getUserUpcomingEvents(5),
        getUserUpcomingTraining(5),
        getRecentAnnouncements(5),
        getCalendarEvents(),
      ]);

    console.log("✅ Dashboard overview complete:", {
      stats,
      eventsCount: events.length,
      trainingCount: training.length,
      announcementsCount: announcements.length,
      calendarCount: calendar.length,
    });

    return {
      stats,
      upcomingEvents: events,
      upcomingTraining: training,
      recentAnnouncements: announcements,
      calendarEvents: calendar,
    };
  } catch (error) {
    console.error("❌ Error in getDashboardOverview:", error);
    return {
      stats: {
        events: 0,
        training: 0,
        requests: 0,
        pending: { events: 0, training: 0, requests: 0 },
      },
      upcomingEvents: [],
      upcomingTraining: [],
      recentAnnouncements: [],
      calendarEvents: [],
    };
  }
};

export default {
  getUserStats,
  getUserUpcomingEvents,
  getUserUpcomingTraining,
  getRecentAnnouncements,
  getCalendarEvents,
  getDashboardOverview,
};
