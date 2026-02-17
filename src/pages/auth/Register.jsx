import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../../services/auth.service";
import "./Register.scss";

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Account Type, Step 2: Form
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    user_type: "",
    rcy_role: "",
    services: [],
    maab_id: null,
    supporting_doc: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "checkbox") {
      if (checked) {
        setFormData({
          ...formData,
          services: [...formData.services, value],
        });
      } else {
        setFormData({
          ...formData,
          services: formData.services.filter((s) => s !== value),
        });
      }
    } else if (type === "file") {
      setFormData({
        ...formData,
        [name]: files[0],
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const selectAccountType = (type) => {
    setFormData({ ...formData, user_type: type });
    setStep(2);
  };

  const handleCaptchaChange = (value) => {
    setCaptchaVerified(!!value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate captcha
    if (!captchaVerified) {
      setError("Please complete the reCAPTCHA verification");
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "services") {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      const response = await authService.register(submitData);
      if (response.success) {
        // Send verification email
        await authService.sendVerificationEmail(formData.email);

        // Show success modal
        setShowSuccess(true);
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
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
      </div>
    );
  }

  // Step 2: Registration Form
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
            <i
              className={
                formData.user_type === "rcy_member"
                  ? "fas fa-users"
                  : "fas fa-user"
              }
            ></i>
            <span>
              {formData.user_type === "rcy_member"
                ? "RCY Member Registration"
                : "Non-RCY Member Registration"}
            </span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
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
                placeholder="Enter your first name"
                required
              />
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
                placeholder="Enter your last name"
                required
              />
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
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
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
              placeholder="Choose a unique username"
              required
            />
            <small className="help-text">
              4-20 characters. Letters, numbers, and underscores only.
            </small>
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
              placeholder="Enter your email address"
              required
            />
            <small className="help-text">
              We'll send a confirmation email to this address
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              <i className="fas fa-phone"></i> Phone Number{" "}
              <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="09XXXXXXXXX or 02XXXXXXXXX"
              required
            />
            <small className="help-text">
              10 or 11 digits only (mobile or landline)
            </small>
          </div>

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
                placeholder="Create a strong password"
                required
              />
              <small className="help-text">At least 8 characters</small>
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
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          {formData.user_type === "rcy_member" && (
            <>
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
                        <i className="fas fa-check"></i> Provide strategic
                        guidance
                      </li>
                      <li>
                        <i className="fas fa-check"></i> Support program
                        development
                      </li>
                      <li>
                        <i className="fas fa-check"></i> Share expertise and
                        knowledge
                      </li>
                    </ul>
                  </div>

                  <div
                    className={`role-card ${formData.rcy_role === "member" ? "selected" : ""}`}
                    onClick={() =>
                      setFormData({ ...formData, rcy_role: "member" })
                    }
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
                    required
                  />
                  <small className="help-text">
                    Upload your MAAB ID document
                  </small>
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
                    required
                  />
                  <small className="help-text">
                    Additional verification document
                  </small>
                </div>
              </div>

              <div className="document-info">
                <i className="fas fa-info-circle"></i>
                <div>
                  <strong>Accepted:</strong> PDF, DOC, DOCX, JPG, JPEG, PNG
                  <br />
                  <strong>Max size:</strong> 5MB per file
                  <br />
                  <strong>Required:</strong> Both documents must be uploaded for
                  RCY registration
                </div>
              </div>
            </>
          )}

          {/* reCAPTCHA */}
          <div className="form-group captcha-group">
            <div
              className="recaptcha-placeholder"
              onClick={() => setCaptchaVerified(!captchaVerified)}
            >
              <input
                type="checkbox"
                checked={captchaVerified}
                onChange={(e) => setCaptchaVerified(e.target.checked)}
              />
              <span>I'm not a robot</span>
              <div className="recaptcha-logo">
                <i className="fas fa-shield-alt"></i>
                <small>reCAPTCHA</small>
              </div>
            </div>
            <small className="help-text">
              Please verify that you're not a robot
            </small>
          </div>

          <button
            type="submit"
            className="btn-register"
            disabled={loading || !captchaVerified}
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

      {/* Success Modal */}
      {showSuccess && (
        <div className="modal-overlay" onClick={handleSuccessClose}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2>Congratulations!</h2>
            <p>Your account has been created successfully.</p>
            <div className="modal-message">
              <i className="fas fa-envelope"></i>
              <p>
                A verification email has been sent to{" "}
                <strong>{formData.email}</strong>. Please check your inbox and
                verify your email address to activate your account.
              </p>
            </div>
            <button className="btn-modal" onClick={handleSuccessClose}>
              <i className="fas fa-sign-in-alt"></i> Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;
