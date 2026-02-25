// frontend/src/pages/VerifyEmail/VerifyEmail.jsx

import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../services/api";
import "./VerifyEmail.scss";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const token = searchParams.get("token");
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;

    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    const verifyEmail = async () => {
      try {
        hasVerified.current = true;

        // Use the same api instance as the rest of the app (handles baseURL automatically)
        const response = await api.get(
          `/api/verify-email.php?token=${encodeURIComponent(token)}`,
        );
        const data = response.data;

        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch (error) {
        console.error("Verify error:", error);
        const msg =
          error.response?.data?.message ||
          "Connection error. Please try again.";
        setStatus("error");
        setMessage(msg);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="verify-page">
      <div className="verify-container">
        <div className="verify-card">
          {status === "verifying" && (
            <div className="verifying">
              <div className="spinner"></div>
              <h2>Verifying your email...</h2>
            </div>
          )}

          {status === "success" && (
            <div className="success">
              <div className="icon">✓</div>
              <h2>Email Verified!</h2>
              <p>{message}</p>
              <Link to="/login" className="btn-login">
                Go to Login
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="error">
              <div className="icon">✗</div>
              <h2>Verification Failed</h2>
              <p>{message}</p>
              <div className="actions">
                <Link to="/login" className="btn-login">
                  Go to Login
                </Link>
                <Link to="/register" className="btn-register">
                  Register Again
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
