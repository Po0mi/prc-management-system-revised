import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../../services/auth.service";
import "./Login.scss";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.login(
        formData.username,
        formData.password,
      );
      if (response.success) {
        const user = response.user;

        // Redirect based on role
        if (user.is_admin === 1 || user.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">
            <img
              src="/prc-logo.png"
              alt="PRC Logo"
              onError={(e) => (e.target.style.display = "none")}
            />
          </div>
          <h1>Philippine Red Cross</h1>
          <p>Management System</p>
          <h2>Sign in to continue</h2>
        </div>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">
              <i className="fas fa-user"></i> Username or Email
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <i className="fas fa-lock"></i> Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Logging in...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i> Login
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/">
            <i className="fas fa-arrow-left"></i> Back to Home
          </Link>
          <Link to="/register">
            Create Account <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
