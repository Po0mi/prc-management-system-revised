import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../../services/auth.service";
import "./Login.scss";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const timerRef = useRef(null);

  // Countdown tick
  useEffect(() => {
    if (lockoutSecs <= 0) return;
    timerRef.current = setInterval(() => {
      setLockoutSecs((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [lockoutSecs]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutSecs > 0) return;
    setError("");
    setLoading(true);

    try {
      const response = await authService.login(formData.username, formData.password);
      if (response.success) {
        const user = response.user;
        if (user.is_admin === 1 || user.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      }
    } catch (err) {
      const retryAfter = err.response?.data?.retry_after;
      if (err.response?.status === 429 && retryAfter) {
        setLockoutSecs(retryAfter);
        setError(err.response.data.message || "Too many attempts. Please wait.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const mins = Math.floor(lockoutSecs / 60);
  const secs = lockoutSecs % 60;
  const countdownLabel = lockoutSecs > 0
    ? `${mins}:${String(secs).padStart(2, "0")}`
    : null;

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
          <div className={`error-message${lockoutSecs > 0 ? " error-message--lockout" : ""}`}>
            <i className="fas fa-exclamation-circle"></i>
            {error}
            {countdownLabel && (
              <span className="lockout-timer"> Retry in {countdownLabel}</span>
            )}
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
              disabled={lockoutSecs > 0}
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
              disabled={lockoutSecs > 0}
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading || lockoutSecs > 0}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Logging in...
              </>
            ) : lockoutSecs > 0 ? (
              <>
                <i className="fas fa-lock"></i> Locked ({countdownLabel})
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
