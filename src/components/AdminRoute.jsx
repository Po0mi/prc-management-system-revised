import { Navigate } from 'react-router-dom';
import authService from '../services/auth.service';

function AdminRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    // Redirect to user dashboard if not admin
    return <Navigate to="/user/dashboard" replace />;
  }

  return children;
}

export default AdminRoute;
