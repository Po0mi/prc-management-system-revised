import api from './api';

const eventsService = {
  // Get all events
  async getAllEvents() {
    try {
      const response = await api.get('/events.php');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single event by ID
  async getEventById(id) {
    try {
      const response = await api.get(`/events.php?id=${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new event
  async createEvent(eventData) {
    try {
      const response = await api.post('/events.php', eventData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update event
  async updateEvent(id, eventData) {
    try {
      const response = await api.put(`/events.php?id=${id}`, eventData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete event
  async deleteEvent(id) {
    try {
      const response = await api.delete(`/events.php?id=${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default eventsService;
