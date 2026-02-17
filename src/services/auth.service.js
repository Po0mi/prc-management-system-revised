import api from './api';

const authService = {
  // Login user
  async login(username, password) {
    try {
      const response = await api.post('/auth.php?action=login', {
        username,
        password,
      });
      
      if (response.data.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
      throw new Error(response.data.message);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Register new user
  async register(userData) {
    try {
      const response = await api.post('/auth.php?action=register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Logout user
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is logged in
  isAuthenticated() {
    return !!this.getCurrentUser();
  },

  // Check if user is admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user?.role === 'admin' || user?.is_admin === 1;
  },
};

export default authService;
