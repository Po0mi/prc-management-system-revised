import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Public Pages
import LandingPage from "./pages/public/LandingPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// User Pages
import UserDashboard from "./pages/user/UserDashboard";
import UserEvents from "./pages/user/UserEvents";
import UserEventDetails from "./pages/user/UserEventDetails";
import UserProfile from "./pages/user/UserProfile";
import UserTraining from "./pages/user/UserTraining";
import UserMerch from "./pages/user/UserMech";
import UserAnnouncement from "./pages/user/UserAnnouncment";
import UserDonate from "./pages/user/UserDonate";
import UserBloodMap from "./pages/user/UserBloodMap";
import UserMessages from "./pages/user/UserMessages";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminVolunteers from "./pages/admin/AdminVolunteers";
import AdminTraining from "./pages/admin/AdminTraining";
import AdminBloodBank from "./pages/admin/AdminBloodBank";
import AdminDonations from "./pages/admin/AdminDonations";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminMerchandise from "./pages/admin/AdminMerchandise";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReports from "./pages/admin/AdminReports";
import AdminMessages from "./pages/admin/AdminMessages";

// Layouts
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

// Protected Route Components
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User Routes - Protected */}
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/user/dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="messages" element={<UserMessages />} />
          <Route path="events" element={<UserEvents />} />
          <Route path="events/:id" element={<UserEventDetails />} />
          <Route path="training" element={<UserTraining />} />
          <Route path="merchandise" element={<UserMerch />} />
          <Route path="donations" element={<UserDonate />} />
          <Route path="blood-map" element={<UserBloodMap />} />
          <Route path="announcements" element={<UserAnnouncement />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>

        {/* Admin Routes - ALL ROUTES */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="volunteers" element={<AdminVolunteers />} />
          <Route path="training" element={<AdminTraining />} />
          <Route path="blood-bank" element={<AdminBloodBank />} />
          <Route path="donations" element={<AdminDonations />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="merchandise" element={<AdminMerchandise />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
