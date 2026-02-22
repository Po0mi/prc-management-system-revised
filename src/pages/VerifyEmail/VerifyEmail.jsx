// frontend/src/pages/VerifyEmail/VerifyEmail.jsx

import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "./VerifyEmail.scss";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const token = searchParams.get("token");

  // ✅ Add this ref to prevent double calls
  const hasVerified = useRef(false);

  useEffect(() => {
    // ✅ Check if already verified
    if (hasVerified.current) return;

    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    const verifyEmail = async () => {
      try {
        // ✅ Mark as verified immediately to prevent second call
        hasVerified.current = true;

        const apiUrl = `http://localhost/prc-management-system/backend/api/verify-email.php?token=${token}`;
        console.log("Calling API:", apiUrl);

        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log("Response:", data);

        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setStatus("error");
        setMessage("Connection error. Please try again.");
      }
    };

    verifyEmail();
  }, [token]); // ✅ Remove hasVerified from dependencies

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
