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
    // Get user's registrations first
    const regsRes = await api.get("/api/registrations.php", {
      params: { action: "my-registrations" },
    });

    if (!regsRes.data?.success) return [];

    const userRegs = regsRes.data.registrations || [];

    // Filter approved and pending registrations
    const activeRegs = userRegs.filter(
      (reg) => reg.status === "approved" || reg.status === "pending",
    );

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
            time: event.start_time ? `${event.start_time.slice(0, 5)} - ${event.end_time?.slice(0, 5) ?? "?"}` : null,
            location: event.location?.split("\n")[0] || event.location,
            description: event.description,
            status: reg.status,
            service: event.major_service,
            registration_id: reg.registration_id,
          };
        }
        return null;
      } catch (error) {
        if (error.response?.status === 404) return null;
        console.error(`Error fetching event ${reg.event_id}:`, error);
        return null;
      }
    });

    const upcomingEvents = await Promise.all(eventPromises);

    return upcomingEvents
      .filter((event) => event !== null)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, limit);
  } catch (error) {
    console.error("Error in getUserUpcomingEvents:", error);
    return [];
  }
};

// ─── UPCOMING TRAINING ────────────────────────────────────────────────────────
export const getUserUpcomingTraining = async (limit = 5) => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  try {
    // Get user's training registrations
    const regsRes = await api.get("/api/session_registrations.php", {
      params: { action: "my-registrations" },
    });

    if (!regsRes.data?.success) return [];

    const userRegs = regsRes.data.registrations || [];

    // Filter approved and pending registrations
    const activeRegs = userRegs.filter(
      (reg) => reg.status === "approved" || reg.status === "pending",
    );

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
            time: training.start_time ? `${training.start_time.slice(0, 5)} - ${training.end_time?.slice(0, 5) ?? "?"}` : null,
            venue: training.venue,
            instructor: training.instructor,
            status: reg.status,
            service: training.major_service,
            registration_id: reg.registration_id,
          };
        }
        return null;
      } catch (error) {
        if (error.response?.status === 404) return null;
        console.error(`Error fetching training ${reg.session_id}:`, error);
        return null;
      }
    });

    const upcomingTraining = await Promise.all(trainingPromises);

    return upcomingTraining
      .filter((training) => training !== null)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, limit);
  } catch (error) {
    console.error("Error in getUserUpcomingTraining:", error);
    return [];
  }
};

// ─── RECENT ANNOUNCEMENTS ─────────────────────────────────────────────────────
export const getRecentAnnouncements = async (limit = 5) => {
  try {
    const res = await api.get("/api/announcements.php", {
      params: { status: "published" },
    });

    if (!res.data?.success) return [];

    return (res.data.data || [])
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
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return [];
  }
};

// ─── CALENDAR EVENTS ──────────────────────────────────────────────────────────
export const getCalendarEvents = async () => {
  try {
    const [eventsResult, trainingResult] = await Promise.allSettled([
      api.get("/api/events.php", { params: { action: "list" } }),
      api.get("/api/training_sessions.php", { params: { action: "list" } }),
    ]);

    const eventsRes = eventsResult.status === "fulfilled" ? eventsResult.value : null;
    const trainingRes = trainingResult.status === "fulfilled" ? trainingResult.value : null;

    const calendarEvents = [];

    if (eventsRes?.data?.success) {
      const events = eventsRes.data.events || [];
      events.forEach((event) => {
        calendarEvents.push({
          id: `event-${event.event_id}`,
          title: event.title,
          start: event.event_date,
          end: event.event_end_date || event.event_date,
          time: event.start_time ? `${event.start_time.slice(0, 5)} - ${event.end_time?.slice(0, 5) ?? "?"}` : null,
          type: "event",
          service: event.major_service,
          location: event.location,
        });
      });
    }

    if (trainingRes?.data?.success) {
      const sessions = trainingRes.data.sessions || [];
      sessions.forEach((session) => {
        calendarEvents.push({
          id: `training-${session.session_id}`,
          title: session.title,
          start: session.session_date,
          end: session.session_end_date || session.session_date,
          time: session.start_time ? `${session.start_time.slice(0, 5)} - ${session.end_time?.slice(0, 5) ?? "?"}` : null,
          type: "training",
          service: session.major_service,
          location: session.venue,
          instructor: session.instructor,
        });
      });
    }

    return calendarEvents;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return [];
  }
};

// ─── DASHBOARD OVERVIEW ──────────────────────────────────────────────────────
// Fetches all dashboard data with shared registration calls to avoid duplicates.
export const getDashboardOverview = async () => {
  const userId = getCurrentUserId();
  const empty = {
    stats: { events: 0, training: 0, requests: 0, pending: { events: 0, training: 0, requests: 0 } },
    upcomingEvents: [],
    upcomingTraining: [],
    recentAnnouncements: [],
    calendarEvents: [],
  };

  if (!userId) return empty;

  try {
    // Fetch shared registration lists once — reused by stats, upcoming events, and upcoming training
    const [eventRegsRes, trainingRegsRes, requestsRes, announcementsRes, calendarRes] =
      await Promise.allSettled([
        api.get("/api/registrations.php", { params: { action: "my-registrations" } }),
        api.get("/api/session_registrations.php", { params: { action: "my-registrations" } }),
        api.get("/api/training_requests.php", { params: { action: "my-requests" } }),
        getRecentAnnouncements(5),
        getCalendarEvents(),
      ]);

    const eventRegs = eventRegsRes.status === "fulfilled" ? (eventRegsRes.value.data?.registrations ?? []) : [];
    const trainingRegs = trainingRegsRes.status === "fulfilled" ? (trainingRegsRes.value.data?.registrations ?? []) : [];
    const userRequests = requestsRes.status === "fulfilled" ? (requestsRes.value.data?.requests ?? []) : [];

    // Stats derived from the shared registration lists
    const stats = {
      events: eventRegs.length,
      training: trainingRegs.length,
      requests: userRequests.length,
      pending: {
        events: eventRegs.filter((r) => r.status === "pending").length,
        training: trainingRegs.filter((r) => r.status === "pending").length,
        requests: userRequests.filter((r) => r.status === "pending").length,
      },
    };

    // Fetch event and training details for active registrations in parallel
    const activeEventRegs = eventRegs.filter((r) => r.status === "approved" || r.status === "pending");
    const activeTrainingRegs = trainingRegs.filter((r) => r.status === "approved" || r.status === "pending");

    const [eventDetails, trainingDetails] = await Promise.all([
      Promise.all(
        activeEventRegs.slice(0, 5).map(async (reg) => {
          try {
            const res = await api.get("/api/events.php", { params: { action: "details", id: reg.event_id } });
            if (!res.data?.success) return null;
            const e = res.data.event;
            return {
              id: e.event_id,
              title: e.title,
              date: e.event_date,
              time: e.start_time ? `${e.start_time.slice(0, 5)} - ${e.end_time?.slice(0, 5) ?? "?"}` : null,
              location: e.location?.split("\n")[0] || e.location,
              status: reg.status,
              service: e.major_service,
              registration_id: reg.registration_id,
            };
          } catch (err) {
            if (err.response?.status === 404) return null;
            console.error(`Error fetching event ${reg.event_id}:`, err);
            return null;
          }
        }),
      ),
      Promise.all(
        activeTrainingRegs.slice(0, 5).map(async (reg) => {
          try {
            const res = await api.get("/api/training_sessions.php", { params: { action: "details", id: reg.session_id } });
            if (!res.data?.success) return null;
            const t = res.data.session;
            return {
              id: t.session_id,
              title: t.title,
              date: t.session_date,
              time: t.start_time ? `${t.start_time.slice(0, 5)} - ${t.end_time?.slice(0, 5) ?? "?"}` : null,
              venue: t.venue,
              instructor: t.instructor,
              status: reg.status,
              service: t.major_service,
              registration_id: reg.registration_id,
            };
          } catch (err) {
            if (err.response?.status === 404) return null;
            console.error(`Error fetching training ${reg.session_id}:`, err);
            return null;
          }
        }),
      ),
    ]);

    return {
      stats,
      upcomingEvents: eventDetails.filter(Boolean).sort((a, b) => new Date(a.date) - new Date(b.date)),
      upcomingTraining: trainingDetails.filter(Boolean).sort((a, b) => new Date(a.date) - new Date(b.date)),
      recentAnnouncements: announcementsRes.status === "fulfilled" ? announcementsRes.value : [],
      calendarEvents: calendarRes.status === "fulfilled" ? calendarRes.value : [],
    };
  } catch (error) {
    console.error("Error in getDashboardOverview:", error);
    return empty;
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
