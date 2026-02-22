// Register.jsx
// Path: frontend/src/pages/Register/Register.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService, { RECAPTCHA_SITE_KEY } from "../../services/auth.service";
import "./Register.scss";

/* global window */
// Toast Notification Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast--${type}`} onClick={onClose}>
      <div className="toast__icon">
        <i
          className={`fas ${type === "error" ? "fa-circle-exclamation" : type === "success" ? "fa-circle-check" : "fa-circle-info"}`}
        />
      </div>
      <div className="toast__content">
        <div className="toast__message">{message}</div>
      </div>
      <button className="toast__close">
        <i className="fas fa-xmark" />
      </button>
    </div>
  );
}

// Password strength indicator component
function PasswordStrength({ password }) {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    const checks = [
      { regex: /.{8,}/, message: "At least 8 characters" },
      { regex: /[A-Z]/, message: "Uppercase letter" },
      { regex: /[a-z]/, message: "Lowercase letter" },
      { regex: /[0-9]/, message: "Number" },
      { regex: /[^A-Za-z0-9]/, message: "Special character" },
    ];

    const passed = checks.filter((check) => check.regex.test(password));
    const failed = checks.filter((check) => !check.regex.test(password));

    setStrength((passed.length / checks.length) * 100);
    setFeedback(failed.map((f) => f.message));
  }, [password]);

  const getStrengthColor = () => {
    if (strength < 40) return "#c41e3a";
    if (strength < 70) return "#f59e0b";
    return "#10b981";
  };

  const getStrengthLabel = () => {
    if (strength < 40) return "Weak";
    if (strength < 70) return "Medium";
    return "Strong";
  };

  if (!password) return null;

  return (
    <div className="password-strength">
      <div className="strength-meter">
        <div
          className="strength-meter-fill"
          style={{
            width: `${strength}%`,
            backgroundColor: getStrengthColor(),
          }}
        />
      </div>
      <div className="strength-label" style={{ color: getStrengthColor() }}>
        {getStrengthLabel()} Password
      </div>
      {feedback.length > 0 && (
        <div className="strength-feedback">
          {feedback.map((msg, i) => (
            <small key={i}>• {msg}</small>
          ))}
        </div>
      )}
    </div>
  );
}

// Phone number input with Philippine format
function PhoneInput({ value, onChange, error, onBlur }) {
  const formatPhone = (input) => {
    let digits = input.replace(/\D/g, "");

    if (digits.startsWith("02") && digits.length <= 10) {
      if (digits.length > 6) {
        return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, (_, p1, p2, p3) => {
          return p3 ? `${p1}-${p2}-${p3}` : `${p1}-${p2}`;
        });
      }
    } else if (digits.startsWith("09") && digits.length <= 11) {
      if (digits.length > 7) {
        return digits.replace(/^(\d{4})(\d{3})(\d{0,4})/, (_, p1, p2, p3) => {
          return p3 ? `${p1}-${p2}-${p3}` : `${p1}-${p2}`;
        });
      }
    }

    return digits;
  };

  const handleChange = (e) => {
    const formatted = formatPhone(e.target.value);
    onChange({
      ...e,
      target: { ...e.target, value: formatted, name: e.target.name },
    });
  };

  const isValidPhilippineNumber = (num) => {
    const digits = num.replace(/\D/g, "");
    return /^(09\d{9}|02\d{8}|\d{8})$/.test(digits);
  };

  return (
    <div className="form-group">
      <label htmlFor="phone">
        <i className="fas fa-phone"></i> Phone Number{" "}
        <span className="required">*</span>
      </label>
      <input
        type="tel"
        id="phone"
        name="phone"
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder="09XX-XXX-XXXX or 02-XXXX-XXXX"
        className={error ? "error" : ""}
        required
      />
      {value && (
        <small className={isValidPhilippineNumber(value) ? "valid" : "invalid"}>
          <i
            className={`fas ${isValidPhilippineNumber(value) ? "fa-check-circle" : "fa-info-circle"}`}
          />
          {isValidPhilippineNumber(value)
            ? " Valid Philippine number"
            : " Please enter a valid Philippine number (e.g., 09123456789 or 0285270864)"}
        </small>
      )}
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}

function GoogleRecaptcha({ onVerify, onExpired }) {
  const recaptchaRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  // Load Google reCAPTCHA script
  useEffect(() => {
    const loadRecaptchaScript = () => {
      return new Promise((resolve) => {
        if (window.grecaptcha) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = `https://www.google.com/recaptcha/api.js?render=explicit`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          window.grecaptcha.ready(() => {
            resolve();
          });
        };
        document.head.appendChild(script);
      });
    };

    loadRecaptchaScript().then(() => {
      setIsLoaded(true);
    });

    return () => {
      // Cleanup - reset captcha if rendered
      if (window.grecaptcha && window.__recaptchaWidgetId !== undefined) {
        try {
          window.grecaptcha.reset(window.__recaptchaWidgetId);
        } catch (e) {
          console.log("Error resetting reCAPTCHA:", e);
        }
      }
    };
  }, []);

  useEffect(() => {
    // Only render if script is loaded, element exists, and not already rendered
    if (isLoaded && window.grecaptcha && recaptchaRef.current && !isRendered) {
      // Check if there's already a reCAPTCHA in this element
      if (recaptchaRef.current.hasChildNodes()) {
        // Clear the element first
        while (recaptchaRef.current.firstChild) {
          recaptchaRef.current.removeChild(recaptchaRef.current.firstChild);
        }
      }

      try {
        // Render the reCAPTCHA widget
        const id = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (response) => {
            onVerify(response);
          },
          "expired-callback": () => {
            onExpired();
          },
          "error-callback": () => {
            console.error("reCAPTCHA error");
            onExpired();
          },
          theme: "light",
          size: "normal",
        });

        window.__recaptchaWidgetId = id;
        setIsRendered(true);
      } catch (error) {
        console.error("Error rendering reCAPTCHA:", error);
      }
    }
  }, [isLoaded, onVerify, onExpired, isRendered]);

  const resetRecaptcha = () => {
    if (window.grecaptcha && window.__recaptchaWidgetId !== undefined) {
      try {
        window.grecaptcha.reset(window.__recaptchaWidgetId);
      } catch (e) {
        console.log("Error resetting reCAPTCHA:", e);
      }
    }
  };

  // Expose reset method to parent
  useEffect(() => {
    window.__resetRecaptcha = resetRecaptcha;
  }, []);

  return (
    <div className="google-recaptcha">
      <div ref={recaptchaRef}></div>
      {!isLoaded && (
        <div className="recaptcha-loading">
          <i className="fas fa-spinner fa-spin"></i> Loading reCAPTCHA...
        </div>
      )}
    </div>
  );
}

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    user_type: "",
    rcy_role: "",
    maab_id: null,
    supporting_doc: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(""); // CHANGED TO "" (empty string) since we won't be using it in test mode
  const [touchedFields, setTouchedFields] = useState({});
  const [toast, setToast] = useState(null);
  const [recaptchaKey, setRecaptchaKey] = useState(0); // For resetting captcha

  const showToast = (message, type = "error") => {
    setToast({ message, type });
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const selectAccountType = (type) => {
    setFormData({ ...formData, user_type: type });
    if (type === "non_rcy_member") {
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleCaptchaVerify = (response) => {
    setCaptchaVerified(true);
    setCaptchaToken(response);
    if (errors.captcha) {
      setErrors((prev) => ({ ...prev, captcha: null }));
    }
  };

  const handleCaptchaExpired = () => {
    setCaptchaVerified(false);
    setCaptchaToken("");
    setRecaptchaKey((prev) => prev + 1); // Force re-render of reCAPTCHA
  };

  const resetCaptcha = () => {
    setCaptchaVerified(false);
    setCaptchaToken("");
    setRecaptchaKey((prev) => prev + 1);
    if (window.__resetRecaptcha) {
      window.__resetRecaptcha();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (!/^[a-zA-Z0-9_]{4,20}$/.test(formData.username)) {
      newErrors.username =
        "Username must be 4-20 characters (letters, numbers, underscores)";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const passwordErrors = [];
      if (formData.password.length < 8)
        passwordErrors.push("at least 8 characters");
      if (!/[A-Z]/.test(formData.password))
        passwordErrors.push("an uppercase letter");
      if (!/[a-z]/.test(formData.password))
        passwordErrors.push("a lowercase letter");
      if (!/[0-9]/.test(formData.password)) passwordErrors.push("a number");
      if (!/[^A-Za-z0-9]/.test(formData.password))
        passwordErrors.push("a special character");

      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain: ${passwordErrors.join(", ")}`;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else {
      const digits = formData.phone.replace(/\D/g, "");
      if (!/^(09\d{9}|02\d{8}|\d{8})$/.test(digits)) {
        newErrors.phone = "Please enter a valid Philippine number";
      }
    }

    if (!formData.first_name) newErrors.first_name = "First name is required";
    if (!formData.last_name) newErrors.last_name = "Last name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";

    if (formData.user_type === "rcy_member") {
      if (!formData.rcy_role) newErrors.rcy_role = "RCY role is required";
      if (!formData.maab_id) newErrors.maab_id = "MAAB ID is required";
      if (!formData.supporting_doc)
        newErrors.supporting_doc = "Supporting document is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      // Show toast for first error
      const firstError = Object.values(validationErrors)[0];
      showToast(firstError, "error");
      return;
    }

    if (!captchaVerified || !captchaToken) {
      const msg = "Please complete the reCAPTCHA verification";
      setErrors({ captcha: msg });
      showToast(msg, "error");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== "") {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add reCAPTCHA token to the form data (using dummy token for testing)
      formDataToSend.append("recaptcha_token", captchaToken);

      const response = await authService.register(formDataToSend);

      if (response.success) {
        setShowSuccess(true);
        resetCaptcha(); // Reset captcha on success
      } else {
        setErrors({ submit: response.message });
        showToast(response.message, "error");
        resetCaptcha(); // Reset captcha on error so user can try again
      }
    } catch (err) {
      const errorMsg = err.message || "Registration failed. Please try again.";
      setErrors({ submit: errorMsg });
      showToast(errorMsg, "error");
      resetCaptcha(); // Reset captcha on error
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate("/login");
  };

  // Step 1: Account Type Selection
  if (step === 1) {
    return (
      <div className="register-page">
        <div className="register-container account-type-selection">
          <div className="register-header">
            <div className="logo">
              <img
                src="/prc-logo.png"
                alt="PRC Logo"
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
            <h1>Philippine Red Cross</h1>
            <p>Management System</p>
            <h2>
              <i className="fas fa-user-plus"></i> Create Your Account
            </h2>
            <p className="subtitle">
              Join the Philippine Red Cross community. All fields marked with *
              are required.
            </p>
          </div>

          <div className="account-type-section">
            <label className="account-type-label">
              Account Type <span className="required">*</span>
            </label>

            <div
              className="account-type-card"
              onClick={() => selectAccountType("non_rcy_member")}
            >
              <div className="card-icon">
                <i className="fas fa-user"></i>
              </div>
              <div className="card-content">
                <h3>Non-RCY Member</h3>
                <p>General community member account</p>
              </div>
              <div className="card-arrow">
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>

            <div
              className="account-type-card rcy-card"
              onClick={() => selectAccountType("rcy_member")}
            >
              <div className="card-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="card-content">
                <h3>RCY Member</h3>
                <p className="card-subtitle">
                  Red Cross Youth member with specialized access
                </p>
                <ul className="benefits-list">
                  <li>
                    <i className="fas fa-check"></i> All Non-RCY Member benefits
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Access to RCY programs and
                    activities
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Member directory and
                    networking
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Advanced training
                    opportunities
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Leadership development
                    programs
                  </li>
                </ul>
              </div>
              <div className="card-arrow">
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>
          </div>

          <div className="register-footer">
            <Link to="/login">
              <i className="fas fa-arrow-left"></i> Already have an account?
              Sign in
            </Link>
          </div>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  // Step 3: Non-RCY Member In-Person Notice
  if (step === 3) {
    return (
      <div className="register-page">
        <div className="register-container account-type-selection">
          <div className="register-header">
            <div className="logo">
              <img
                src="/prc-logo.png"
                alt="PRC Logo"
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
            <h1>Philippine Red Cross</h1>
            <p>Management System</p>
          </div>

          <div className="non-rcy-notice">
            <div className="notice-icon">
              <i className="fas fa-info-circle"></i>
            </div>
            <div className="notice-content">
              <h3>Non-RCY Member Registration Not Available Online</h3>
              <p>
                To register as a Non-RCY Member, you must visit your local RCY
                Chapter to obtain your MAAB ID and complete the registration
                process in person.
              </p>
              <div className="notice-actions">
                <button
                  className="btn-find-chapter"
                  onClick={() =>
                    window.open(
                      "https://www.redcross.org.ph/chapters",
                      "_blank",
                    )
                  }
                >
                  <i className="fas fa-map-marker-alt"></i> Find Nearest Chapter
                </button>
                <button
                  className="btn-back-selection"
                  onClick={() => setStep(1)}
                >
                  <i className="fas fa-arrow-left"></i> Back to Selection
                </button>
              </div>
            </div>
          </div>

          <div className="register-footer">
            <Link to="/login">
              <i className="fas fa-arrow-left"></i> Already have an account?
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Registration Form (RCY Member only)
  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <div className="logo">
            <img
              src="/prc-logo.png"
              alt="PRC Logo"
              onError={(e) => (e.target.style.display = "none")}
            />
          </div>
          <h1>Philippine Red Cross</h1>
          <p>Management System</p>
          <div className="selected-type">
            <i className="fas fa-users"></i>
            <span>RCY Member Registration</span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="register-form"
          encType="multipart/form-data"
        >
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">
                <i className="fas fa-id-badge"></i> First Name{" "}
                <span className="required">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                onBlur={() => handleBlur("first_name")}
                className={
                  errors.first_name && touchedFields.first_name ? "error" : ""
                }
                placeholder="Enter your first name"
                required
              />
              {errors.first_name && touchedFields.first_name && (
                <span className="error-message">{errors.first_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">
                <i className="fas fa-id-badge"></i> Last Name{" "}
                <span className="required">*</span>
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                onBlur={() => handleBlur("last_name")}
                className={
                  errors.last_name && touchedFields.last_name ? "error" : ""
                }
                placeholder="Enter your last name"
                required
              />
              {errors.last_name && touchedFields.last_name && (
                <span className="error-message">{errors.last_name}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="gender">
              <i className="fas fa-venus-mars"></i> Gender{" "}
              <span className="required">*</span>
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              onBlur={() => handleBlur("gender")}
              className={errors.gender && touchedFields.gender ? "error" : ""}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors.gender && touchedFields.gender && (
              <span className="error-message">{errors.gender}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="username">
              <i className="fas fa-user"></i> Username{" "}
              <span className="required">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onBlur={() => handleBlur("username")}
              className={
                errors.username && touchedFields.username ? "error" : ""
              }
              placeholder="Choose a unique username"
              required
            />
            <small className="help-text">
              4-20 characters. Letters, numbers, and underscores only.
            </small>
            {errors.username && touchedFields.username && (
              <span className="error-message">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <i className="fas fa-envelope"></i> Email Address{" "}
              <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur("email")}
              className={errors.email && touchedFields.email ? "error" : ""}
              placeholder="Enter your email address"
              required
            />
            <small className="help-text">
              We'll send a verification email to this address
            </small>
            {errors.email && touchedFields.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <PhoneInput
            value={formData.phone}
            onChange={handleChange}
            onBlur={() => handleBlur("phone")}
            error={errors.phone && touchedFields.phone ? errors.phone : null}
          />

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">
                <i className="fas fa-lock"></i> Password{" "}
                <span className="required">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur("password")}
                className={
                  errors.password && touchedFields.password ? "error" : ""
                }
                placeholder="Create a strong password"
                required
              />
              <PasswordStrength password={formData.password} />
              {errors.password && touchedFields.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <i className="fas fa-lock"></i> Confirm Password{" "}
                <span className="required">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => handleBlur("confirmPassword")}
                className={
                  errors.confirmPassword && touchedFields.confirmPassword
                    ? "error"
                    : ""
                }
                placeholder="Confirm your password"
                required
              />
              {errors.confirmPassword && touchedFields.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>
          </div>

          <div className="section-divider">
            <i className="fas fa-user-shield"></i>
            <span>RCY Member Information</span>
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-user-shield"></i> Select Your RCY Role{" "}
              <span className="required">*</span>
            </label>
            <p className="help-text-block">
              Choose your role within the Red Cross Youth organization.
            </p>

            <div className="role-cards">
              <div
                className={`role-card ${formData.rcy_role === "adviser" ? "selected" : ""}`}
                onClick={() =>
                  setFormData({ ...formData, rcy_role: "adviser" })
                }
              >
                <input
                  type="radio"
                  name="rcy_role"
                  value="adviser"
                  checked={formData.rcy_role === "adviser"}
                  onChange={handleChange}
                />
                <div className="role-icon">
                  <i className="fas fa-chalkboard-teacher"></i>
                </div>
                <h4>Adviser</h4>
                <p>Provide guidance and mentorship to RCY members</p>
                <ul>
                  <li>
                    <i className="fas fa-check"></i> Mentor young volunteers
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Provide strategic guidance
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Support program development
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Share expertise and
                    knowledge
                  </li>
                </ul>
              </div>

              <div
                className={`role-card ${formData.rcy_role === "member" ? "selected" : ""}`}
                onClick={() => setFormData({ ...formData, rcy_role: "member" })}
              >
                <input
                  type="radio"
                  name="rcy_role"
                  value="member"
                  checked={formData.rcy_role === "member"}
                  onChange={handleChange}
                />
                <div className="role-icon">
                  <i className="fas fa-user-friends"></i>
                </div>
                <h4>Member</h4>
                <p>Active participant in RCY programs and activities</p>
                <ul>
                  <li>
                    <i className="fas fa-check"></i> Participate in RCY
                    activities
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Access member resources
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Join training programs
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Volunteer for events
                  </li>
                </ul>
              </div>
            </div>
            {errors.rcy_role && (
              <span className="error-message">{errors.rcy_role}</span>
            )}
          </div>

          <div className="section-divider">
            <i className="fas fa-file-upload"></i>
            <span>Upload Required Documents</span>
          </div>

          <div className="form-row">
            <div className="form-group file-upload">
              <label htmlFor="maab_id">
                <i className="fas fa-id-card"></i> MAAB ID{" "}
                <span className="required">*</span>
              </label>
              <input
                type="file"
                id="maab_id"
                name="maab_id"
                onChange={handleChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className={errors.maab_id ? "error" : ""}
                required
              />
              <small className="help-text">Upload your MAAB ID document</small>
              {errors.maab_id && (
                <span className="error-message">{errors.maab_id}</span>
              )}
            </div>

            <div className="form-group file-upload">
              <label htmlFor="supporting_doc">
                <i className="fas fa-file-alt"></i> Supporting Document{" "}
                <span className="required">*</span>
              </label>
              <input
                type="file"
                id="supporting_doc"
                name="supporting_doc"
                onChange={handleChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className={errors.supporting_doc ? "error" : ""}
                required
              />
              <small className="help-text">
                Additional verification document
              </small>
              {errors.supporting_doc && (
                <span className="error-message">{errors.supporting_doc}</span>
              )}
            </div>
          </div>

          <div className="document-info">
            <i className="fas fa-info-circle"></i>
            <div>
              <strong>Accepted:</strong> PDF, DOC, DOCX, JPG, JPEG, PNG
              <br />
              <strong>Max size:</strong> 5MB per file
              <br />
              <strong>Required:</strong> Both documents must be uploaded for RCY
              registration
            </div>
          </div>

          <div className="form-group captcha-group">
            <label>
              <i className="fas fa-shield-alt"></i> Verification{" "}
              <span className="required">*</span>
            </label>
            <GoogleRecaptcha
              key={recaptchaKey}
              onVerify={handleCaptchaVerify}
              onExpired={handleCaptchaExpired}
            />
            {errors.captcha && (
              <small className="error-message">{errors.captcha}</small>
            )}
            {captchaVerified && (
              <small className="success-message">
                <i className="fas fa-check-circle"></i> reCAPTCHA verified
              </small>
            )}
          </div>

          <button
            type="submit"
            className="btn-register"
            disabled={loading} // Removed !captchaVerified condition
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Creating Account...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus"></i> Register
              </>
            )}
          </button>
        </form>

        <div className="register-footer">
          <button type="button" className="btn-back" onClick={() => setStep(1)}>
            <i className="fas fa-arrow-left"></i> Back to Selection
          </button>
          <Link to="/login">Already have an account? Sign in</Link>
        </div>

        <div className="support-info">
          <i className="fas fa-question-circle"></i>
          Need help? Contact us at{" "}
          <a href="mailto:support@prc-system.com">support@prc-system.com</a> or
          call <strong>(02) 8527-0864</strong>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="modal-overlay" onClick={handleSuccessClose}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2>Registration Successful!</h2>
            <p>Your account has been created successfully.</p>
            <div className="modal-message">
              <i className="fas fa-envelope"></i>
              <p>
                A verification email has been sent to{" "}
                <strong>{formData.email}</strong>. Please check your inbox and
                verify your email address to activate your account.
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn-modal" onClick={handleSuccessClose}>
                <i className="fas fa-sign-in-alt"></i> Go to Login
              </button>
              <button
                className="btn-modal btn-outline"
                onClick={() => window.open(`https://mail.google.com`, "_blank")}
              >
                <i className="fas fa-envelope"></i> Open Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;
