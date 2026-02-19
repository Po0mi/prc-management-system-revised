// UserDonate.jsx
// Path: src/pages/UserDonate/UserDonate.jsx

import { useState, useEffect } from "react";
import "./UserDonate.scss";

// ─── TOAST COMPONENT ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`ud-toast ud-toast--${type}`} onClick={onClose}>
      <i
        className={`fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`}
      />
      <span>{message}</span>
      <button className="ud-toast__close" onClick={onClose}>
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function UserDonate() {
  const [activeTab, setActiveTab] = useState("blood");
  const [copiedField, setCopiedField] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedField(field);
        showToast(`${field} copied to clipboard!`);
        setTimeout(() => setCopiedField(null), 2000);
      },
      () => {
        showToast("Failed to copy", "error");
      },
    );
  };

  const handleDirections = () => {
    const address = encodeURIComponent(
      "Brgy. Danao, Bonifacio Drive, Iloilo City, 5000",
    );
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${address}`,
      "_blank",
    );
  };

  const handleCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber.replace(/\s/g, "")}`;
  };

  const handleEmail = (email) => {
    window.location.href = `mailto:${email}`;
  };

  // Blood donation data
  const bloodTypes = [
    {
      type: "A+",
      description: "Can donate to A+, AB+",
      bg: "#c41e3a15",
      color: "#c41e3a",
    },
    {
      type: "A-",
      description: "Can donate to A-, A+, AB-, AB+",
      bg: "#c41e3a15",
      color: "#c41e3a",
    },
    {
      type: "B+",
      description: "Can donate to B+, AB+",
      bg: "#15803d15",
      color: "#15803d",
    },
    {
      type: "B-",
      description: "Can donate to B-, B+, AB-, AB+",
      bg: "#15803d15",
      color: "#15803d",
    },
    {
      type: "AB+",
      description: "Universal recipient",
      bg: "#7c3aed15",
      color: "#7c3aed",
    },
    {
      type: "AB-",
      description: "Can donate to AB-, AB+",
      bg: "#7c3aed15",
      color: "#7c3aed",
    },
    {
      type: "O+",
      description: "Can donate to O+, A+, B+, AB+",
      bg: "#c2410c15",
      color: "#c2410c",
    },
    {
      type: "O-",
      description: "Universal donor",
      bg: "#c2410c15",
      color: "#c2410c",
    },
  ];

  const eligibilityRequirements = [
    {
      icon: "fa-solid fa-cake-candles",
      text: "At least 16 years old (with parental consent if 16-17)",
    },
    {
      icon: "fa-solid fa-weight-scale",
      text: "Weighs at least 50 kg (110 lbs)",
    },
    {
      icon: "fa-solid fa-heart-pulse",
      text: "In good health and feeling well",
    },
    {
      icon: "fa-solid fa-syringe",
      text: "No recent tattoos or piercings (within 6 months)",
    },
    {
      icon: "fa-solid fa-pills",
      text: "Not taking certain medications (consult with staff)",
    },
    {
      icon: "fa-regular fa-clock",
      text: "At least 3 months since last blood donation",
    },
  ];

  // Goods donation data
  const goodsCategories = [
    {
      category: "Food Items",
      icon: "fa-solid fa-bowl-food",
      items: [
        "Canned goods (sardines, corned beef, tuna)",
        "Rice (5-10 kg packs)",
        "Noodles (instant noodles, pasta)",
        "Cooking oil",
        "Canned milk",
        "Coffee, sugar, and biscuits",
      ],
    },
    {
      category: "Hygiene Kits",
      icon: "fa-solid fa-soap",
      items: [
        "Soap (bath and laundry)",
        "Toothpaste and toothbrushes",
        "Shampoo and conditioner",
        "Sanitary napkins",
        "Diapers (baby and adult)",
        "Tissue paper and wet wipes",
      ],
    },
    {
      category: "Clothing & Linens",
      icon: "fa-solid fa-shirt",
      items: [
        "Blankets and sleeping mats",
        "T-shirts and shorts",
        "Underwear and socks",
        "Towels",
        "Jackets and raincoats",
      ],
    },
    {
      category: "Medical Supplies",
      icon: "fa-solid fa-kit-medical",
      items: [
        "First aid kits",
        "Bandages and gauze",
        "Face masks and gloves",
        "Alcohol and disinfectants",
        "Vitamins and supplements",
      ],
    },
    {
      category: "Other Essentials",
      icon: "fa-solid fa-box",
      items: [
        "Water bottles or jugs",
        "Flashlights and batteries",
        "Mosquito nets and repellent",
        "School supplies for children",
        "Kitchen utensils",
      ],
    },
  ];

  const goodsGuidelines = [
    "All items must be new or in good condition",
    "Food items should have at least 3 months before expiry",
    "Pack items in sealed bags or boxes",
    "Label boxes with contents and quantity",
    "Drop off during business hours (8:00 AM - 5:00 PM, Monday to Friday)",
  ];

  // Cash donation data
  const cashOptions = [
    {
      method: "Bank Transfer",
      icon: "fa-solid fa-building-columns",
      details: [
        { label: "Bank", value: "Bank of the Philippine Islands (BPI)" },
        {
          label: "Account Name",
          value: "Philippine Red Cross - Iloilo Chapter",
        },
        { label: "Account Number", value: "1234-5678-90" },
        { label: "Branch", value: "Iloilo City Main" },
      ],
    },
    {
      method: "GCash",
      icon: "fa-solid fa-mobile-screen",
      details: [
        { label: "Mobile Number", value: "0917 117 0066" },
        { label: "Account Name", value: "PRC Iloilo Chapter" },
      ],
    },
    {
      method: "PayMaya",
      icon: "fa-solid fa-wallet",
      details: [
        { label: "Mobile Number", value: "0917 117 0066" },
        { label: "Account Name", value: "PRC Iloilo Chapter" },
      ],
    },
    {
      method: "Over-the-Counter",
      icon: "fa-solid fa-hand-holding-dollar",
      details: [
        { label: "Location", value: "PRC Iloilo Chapter Office" },
        {
          label: "Address",
          value: "Brgy. Danao, Bonifacio Drive, Iloilo City",
        },
        { label: "Receipt", value: "Official receipt provided upon donation" },
      ],
    },
  ];

  const cashGuidelines = [
    "All cash donations are tax-deductible",
    "Official receipts will be issued for all donations",
    "Specify your donation purpose (e.g., disaster response, blood services, general fund)",
    "For bank transfers, email the deposit slip to iloilo@redcross.org.ph",
    "For large donations, please contact us in advance",
  ];

  return (
    <div className="ud-root">
      {/* Header */}
      <div className="ud-header">
        <div className="ud-header__content">
          <div>
            <div className="ud-header__eyebrow">
              <i className="fa-solid fa-hand-holding-heart" />
              Support Our Cause
            </div>
            <h1 className="ud-header__title">Make a Donation</h1>
            <p className="ud-header__subtitle">
              Your generosity helps us serve communities in need. Choose how
              you'd like to contribute.
            </p>
          </div>
          <div className="ud-header__stats">
            <div className="ud-header__stat">
              <div className="ud-header__stat-num">1M+</div>
              <div className="ud-header__stat-label">Lives Touched</div>
            </div>
            <div className="ud-header__stat">
              <div className="ud-header__stat-num">500+</div>
              <div className="ud-header__stat-label">Communities Served</div>
            </div>
            <div className="ud-header__stat">
              <div className="ud-header__stat-num">24/7</div>
              <div className="ud-header__stat-label">Emergency Response</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="ud-body">
        {/* Important Notice */}
        <div className="ud-notice">
          <div className="ud-notice__icon">
            <i className="fa-solid fa-info-circle" />
          </div>
          <div className="ud-notice__content">
            <h3>Important Information</h3>
            <p>
              The Philippine Red Cross welcomes all forms of donations. For
              blood donations, please visit our chapter directly. For goods and
              cash donations, you may drop them off at our office or use the
              bank details provided below.
            </p>
          </div>
        </div>

        {/* Donation Type Tabs */}
        <div className="ud-tabs">
          <button
            className={`ud-tab ${activeTab === "blood" ? "ud-tab--active" : ""}`}
            onClick={() => setActiveTab("blood")}
          >
            <i className="fa-solid fa-droplet" />
            Blood Donation
          </button>
          <button
            className={`ud-tab ${activeTab === "goods" ? "ud-tab--active" : ""}`}
            onClick={() => setActiveTab("goods")}
          >
            <i className="fa-solid fa-box" />
            Goods Donation
          </button>
          <button
            className={`ud-tab ${activeTab === "cash" ? "ud-tab--active" : ""}`}
            onClick={() => setActiveTab("cash")}
          >
            <i className="fa-solid fa-money-bill" />
            Cash Donation
          </button>
        </div>

        {/* Blood Donation Tab */}
        {activeTab === "blood" && (
          <>
            {/* Chapter Information */}
            <div className="ud-section">
              <h2 className="ud-section__title">
                <i className="fa-solid fa-location-dot" />
                Visit Your Nearest Philippine Red Cross Chapter
              </h2>

              <div className="ud-chapter-card">
                <div className="ud-chapter-card__header">
                  <h3>
                    <i className="fa-solid fa-building" />
                    Iloilo Chapter
                  </h3>
                </div>

                <div className="ud-chapter-card__content">
                  {/* Contact Numbers */}
                  <div className="ud-contact-group">
                    <h4>
                      <i className="fa-solid fa-phone" />
                      Contact Numbers
                    </h4>
                    <div className="ud-contact-list">
                      <div className="ud-contact-item">
                        <span className="ud-contact-item__label">
                          Landline:
                        </span>
                        <button
                          className="ud-contact-item__value ud-contact-item__value--clickable"
                          onClick={() => handleCall("(033) 503-3393")}
                          title="Click to call"
                        >
                          <i className="fa-solid fa-phone" />
                          (033) 503-3393
                        </button>
                        <button
                          className={`ud-copy-btn ${copiedField === "landline" ? "ud-copy-btn--copied" : ""}`}
                          onClick={() =>
                            copyToClipboard("(033) 503-3393", "landline")
                          }
                          title="Copy to clipboard"
                        >
                          <i
                            className={`fa-solid ${copiedField === "landline" ? "fa-check" : "fa-copy"}`}
                          />
                        </button>
                      </div>

                      <div className="ud-contact-item">
                        <span className="ud-contact-item__label">Mobile:</span>
                        <button
                          className="ud-contact-item__value ud-contact-item__value--clickable"
                          onClick={() => handleCall("09171170066")}
                          title="Click to call"
                        >
                          <i className="fa-solid fa-mobile" />
                          0917 117 0066
                        </button>
                        <button
                          className={`ud-copy-btn ${copiedField === "mobile" ? "ud-copy-btn--copied" : ""}`}
                          onClick={() =>
                            copyToClipboard("09171170066", "mobile")
                          }
                          title="Copy to clipboard"
                        >
                          <i
                            className={`fa-solid ${copiedField === "mobile" ? "fa-check" : "fa-copy"}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="ud-contact-group">
                    <h4>
                      <i className="fa-regular fa-envelope" />
                      Email Address
                    </h4>
                    <div className="ud-contact-item">
                      <button
                        className="ud-contact-item__value ud-contact-item__value--clickable"
                        onClick={() => handleEmail("iloilo@redcross.org.ph")}
                        title="Click to send email"
                      >
                        <i className="fa-regular fa-envelope" />
                        iloilo@redcross.org.ph
                      </button>
                      <button
                        className={`ud-copy-btn ${copiedField === "email" ? "ud-copy-btn--copied" : ""}`}
                        onClick={() =>
                          copyToClipboard("iloilo@redcross.org.ph", "email")
                        }
                        title="Copy to clipboard"
                      >
                        <i
                          className={`fa-solid ${copiedField === "email" ? "fa-check" : "fa-copy"}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="ud-contact-group">
                    <h4>
                      <i className="fa-solid fa-map-pin" />
                      Address
                    </h4>
                    <div className="ud-contact-item ud-contact-item--address">
                      <span className="ud-contact-item__value">
                        <i className="fa-solid fa-location-dot" />
                        Brgy. Danao, Bonifacio Drive, Iloilo City, 5000
                      </span>
                      <button
                        className="ud-copy-btn"
                        onClick={() =>
                          copyToClipboard(
                            "Brgy. Danao, Bonifacio Drive, Iloilo City, 5000",
                            "address",
                          )
                        }
                        title="Copy to clipboard"
                      >
                        <i
                          className={`fa-solid ${copiedField === "address" ? "fa-check" : "fa-copy"}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="ud-action-buttons">
                    <button
                      className="ud-btn ud-btn--primary"
                      onClick={handleDirections}
                    >
                      <i className="fa-solid fa-location-arrow" />
                      Get Directions
                    </button>
                    <button
                      className="ud-btn ud-btn--secondary"
                      onClick={() => handleCall("09171170066")}
                    >
                      <i className="fa-solid fa-phone" />
                      Call Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Blood Type Compatibility */}
            <div className="ud-section">
              <h2 className="ud-section__title">
                <i className="fa-solid fa-droplet" />
                Blood Type Compatibility
              </h2>
              <div className="ud-blood-types">
                {bloodTypes.map((item) => (
                  <div key={item.type} className="ud-blood-type">
                    <div
                      className="ud-blood-type__badge"
                      style={{
                        background: item.bg,
                        color: item.color,
                        border: `1px solid ${item.color}33`,
                      }}
                    >
                      {item.type}
                    </div>
                    <p className="ud-blood-type__description">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Eligibility Requirements */}
            <div className="ud-section">
              <h2 className="ud-section__title">
                <i className="fa-solid fa-clipboard-check" />
                Donor Eligibility Requirements
              </h2>
              <div className="ud-requirements">
                {eligibilityRequirements.map((req, index) => (
                  <div key={index} className="ud-requirement">
                    <div className="ud-requirement__icon">
                      <i className={req.icon} />
                    </div>
                    <p className="ud-requirement__text">{req.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Goods Donation Tab */}
        {activeTab === "goods" && (
          <>
            {/* Donation Guidelines */}
            <div className="ud-section">
              <h2 className="ud-section__title">
                <i className="fa-solid fa-circle-check" />
                Donation Guidelines
              </h2>
              <div className="ud-guidelines">
                {goodsGuidelines.map((guideline, index) => (
                  <div key={index} className="ud-guideline">
                    <i className="fa-solid fa-check-circle" />
                    <p>{guideline}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Accepted Items */}
            <div className="ud-section">
              <h2 className="ud-section__title">
                <i className="fa-solid fa-box-open" />
                Accepted Items
              </h2>
              <div className="ud-categories">
                {goodsCategories.map((category, index) => (
                  <div key={index} className="ud-category">
                    <div className="ud-category__header">
                      <i className={category.icon} />
                      <h3>{category.category}</h3>
                    </div>
                    <ul className="ud-category__list">
                      {category.items.map((item, idx) => (
                        <li key={idx}>
                          <i className="fa-solid fa-check" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Drop-off Information */}
            <div className="ud-section">
              <h2 className="ud-section__title">
                <i className="fa-solid fa-location-dot" />
                Drop-off Location
              </h2>
              <div className="ud-dropoff">
                <div className="ud-dropoff__card">
                  <h4>
                    <i className="fa-solid fa-building" />
                    Iloilo Chapter
                  </h4>
                  <p>
                    <i className="fa-solid fa-location-dot" />
                    Brgy. Danao, Bonifacio Drive, Iloilo City, 5000
                  </p>
                  <p>
                    <i className="fa-regular fa-clock" />
                    Monday - Friday, 8:00 AM - 5:00 PM
                  </p>
                  <p>
                    <i className="fa-solid fa-phone" />
                    (033) 503-3393
                  </p>
                  <div className="ud-action-buttons">
                    <button
                      className="ud-btn ud-btn--primary"
                      onClick={handleDirections}
                    >
                      <i className="fa-solid fa-location-arrow" />
                      Get Directions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Cash Donation Tab */}
        {activeTab === "cash" && (
          <>
            {/* Donation Options */}
            <div className="ud-section">
              <h2 className="ud-section__title">
                <i className="fa-solid fa-credit-card" />
                Donation Options
              </h2>
              <div className="ud-cash-options">
                {cashOptions.map((option, index) => (
                  <div key={index} className="ud-cash-option">
                    <div className="ud-cash-option__header">
                      <i className={option.icon} />
                      <h3>{option.method}</h3>
                    </div>
                    <div className="ud-cash-option__details">
                      {option.details.map((detail, idx) => (
                        <div key={idx} className="ud-cash-option__detail">
                          <span className="ud-cash-option__label">
                            {detail.label}:
                          </span>
                          <div className="ud-cash-option__value-group">
                            <span className="ud-cash-option__value">
                              {detail.value}
                            </span>
                            {detail.value.includes("0917") && (
                              <button
                                className={`ud-copy-btn ${copiedField === `cash-${index}-${idx}` ? "ud-copy-btn--copied" : ""}`}
                                onClick={() =>
                                  copyToClipboard(
                                    detail.value,
                                    `cash-${index}-${idx}`,
                                  )
                                }
                                title="Copy to clipboard"
                              >
                                <i
                                  className={`fa-solid ${copiedField === `cash-${index}-${idx}` ? "fa-check" : "fa-copy"}`}
                                />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guidelines */}
            <div className="ud-section">
              <h2 className="ud-section__title">
                <i className="fa-solid fa-circle-info" />
                Important Information
              </h2>
              <div className="ud-guidelines">
                {cashGuidelines.map((guideline, index) => (
                  <div key={index} className="ud-guideline">
                    <i className="fa-solid fa-info-circle" />
                    <p>{guideline}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact for Large Donations */}
            <div className="ud-section">
              <h2 className="ud-section__title">
                <i className="fa-solid fa-handshake" />
                For Large Donations
              </h2>
              <div className="ud-contact-card">
                <p>
                  For corporate partnerships, large donations, or sponsorship
                  inquiries, please contact our Donor Relations Team:
                </p>
                <div className="ud-contact-info">
                  <div className="ud-contact-item">
                    <i className="fa-solid fa-phone" />
                    <span>(033) 503-3393 local 123</span>
                  </div>
                  <div className="ud-contact-item">
                    <i className="fa-regular fa-envelope" />
                    <span>donors@redcross.org.ph</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Common Section: What to Expect (applies to all) */}
        <div className="ud-section">
          <h2 className="ud-section__title">
            <i className="fa-solid fa-clock" />
            What to Expect When You Donate
          </h2>
          <div className="ud-steps">
            <div className="ud-step">
              <div className="ud-step__number">1</div>
              <div className="ud-step__content">
                <h4>Registration</h4>
                <p>Fill out a donor form and present a valid ID</p>
              </div>
            </div>
            <div className="ud-step">
              <div className="ud-step__number">2</div>
              <div className="ud-step__content">
                <h4>Consultation</h4>
                <p>Speak with our staff about your donation</p>
              </div>
            </div>
            <div className="ud-step">
              <div className="ud-step__number">3</div>
              <div className="ud-step__content">
                <h4>Donation</h4>
                <p>Complete your donation (blood, goods, or cash)</p>
              </div>
            </div>
            <div className="ud-step">
              <div className="ud-step__number">4</div>
              <div className="ud-step__content">
                <h4>Acknowledgement</h4>
                <p>Receive your official receipt and thank you letter</p>
              </div>
            </div>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="ud-section">
          <h2 className="ud-section__title">
            <i className="fa-regular fa-circle-question" />
            Frequently Asked Questions
          </h2>
          <div className="ud-faq">
            <div className="ud-faq-item">
              <h4>Are my donations tax-deductible?</h4>
              <p>
                Yes, all donations to the Philippine Red Cross are
                tax-deductible. You will receive an official receipt for your
                donation.
              </p>
            </div>
            <div className="ud-faq-item">
              <h4>Can I specify where my donation goes?</h4>
              <p>
                Yes, you can specify your donation purpose (e.g., disaster
                response, blood services, specific programs) when you donate.
              </p>
            </div>
            <div className="ud-faq-item">
              <h4>How do I get an official receipt?</h4>
              <p>
                Official receipts are issued at the time of donation for cash
                and goods. For bank transfers, please email the deposit slip to
                receive your receipt.
              </p>
            </div>
            <div className="ud-faq-item">
              <h4>Can I donate in kind instead of cash?</h4>
              <p>
                Absolutely! We welcome goods donations. Please check our
                accepted items list and guidelines above.
              </p>
            </div>
          </div>
        </div>

        {/* Reminder */}
        <div className="ud-reminder">
          <i className="fa-solid fa-heart" />
          <p>
            Every donation, whether blood, goods, or cash, makes a difference.
            Thank you for your generosity and support.
          </p>
        </div>
      </div>

      {/* Toast */}
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
