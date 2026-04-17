import { useState, useEffect } from "react";
import authService from "../../services/auth.service";
import api from "../../services/api";
import "./UserProfile.scss";

const ROLE_LABELS = {
  user:            "Member",
  super_admin:     "Super Admin",
  safety_admin:    "Safety Admin",
  welfare_admin:   "Welfare Admin",
  health_admin:    "Health Admin",
  disaster_admin:  "Disaster Admin",
  youth_admin:     "Youth Admin",
};

function UserProfile() {
  const [user, setUser]       = useState(authService.getCurrentUser() || {});
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [form, setForm] = useState({
    full_name:  "",
    email:      "",
    phone:      "",
    gender:     "",
  });

  useEffect(() => {
    setForm({
      full_name: user.full_name  || "",
      email:     user.email      || "",
      phone:     user.phone      || "",
      gender:    user.gender     || "",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.user_id]); // only re-init when the logged-in user changes

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      showToast("Full name is required.", "error");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put(
        `/api/users.php?action=update&id=${user.user_id}`,
        { ...form, role: user.role, user_type: user.user_type || "non_rcy_member" },
      );
      if (data.success) {
        // Update local storage so layout reflects new name
        const updated = { ...user, ...form };
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
        setEditing(false);
        showToast("Profile updated successfully.");
      } else {
        showToast(data.message || "Update failed.", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const initials = (user.full_name || user.username || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="up-page">
      {toast && (
        <div className={`up-toast up-toast--${toast.type}`}>{toast.msg}</div>
      )}

      <div className="up-hero">
        <div className="up-hero__avatar">{initials}</div>
        <div className="up-hero__info">
          <h1>{user.full_name || user.username}</h1>
          <span className="up-hero__role">
            {ROLE_LABELS[user.role] || user.role || "Member"}
          </span>
          {user.email && <p className="up-hero__email">{user.email}</p>}
        </div>
        {!editing && (
          <button className="up-edit-btn" onClick={() => setEditing(true)}>
            <i className="fa-solid fa-pen" /> Edit Profile
          </button>
        )}
      </div>

      <div className="up-body">
        {editing ? (
          <form className="up-form" onSubmit={handleSave}>
            <h2>Edit Profile</h2>

            <div className="up-form__grid">
              <div className="up-form__field">
                <label>Full Name <span>*</span></label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="up-form__field">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="up-form__field">
                <label>Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+63 9XX XXX XXXX"
                />
              </div>

              <div className="up-form__field">
                <label>Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="up-form__actions">
              <button type="button" className="up-btn up-btn--ghost" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="up-btn up-btn--primary" disabled={saving}>
                {saving ? <><i className="fa-solid fa-circle-notch fa-spin" /> Saving…</> : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="up-details">
            <h2>Account Details</h2>
            <dl className="up-dl">
              <div>
                <dt><i className="fa-solid fa-user" /> Username</dt>
                <dd>{user.username || "—"}</dd>
              </div>
              <div>
                <dt><i className="fa-solid fa-id-card" /> Full Name</dt>
                <dd>{user.full_name || "—"}</dd>
              </div>
              <div>
                <dt><i className="fa-solid fa-envelope" /> Email</dt>
                <dd>{user.email || "—"}</dd>
              </div>
              <div>
                <dt><i className="fa-solid fa-phone" /> Phone</dt>
                <dd>{user.phone || "—"}</dd>
              </div>
              <div>
                <dt><i className="fa-solid fa-venus-mars" /> Gender</dt>
                <dd style={{ textTransform: "capitalize" }}>{user.gender || "—"}</dd>
              </div>
              <div>
                <dt><i className="fa-solid fa-shield-halved" /> Role</dt>
                <dd>{ROLE_LABELS[user.role] || user.role || "Member"}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
