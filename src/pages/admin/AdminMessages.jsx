import { useEffect } from "react";
import "./AdminMessages.scss";

export default function AdminMessages() {
  useEffect(() => {
    // Delay gives the FloatingChat widget time to finish mounting
    const id = setTimeout(() => {
      const btn = document.querySelector(".chat-fab");
      if (btn) btn.click();
    }, 300);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="admin-messages-redirect">
      <div className="admin-messages-redirect__card">
        <div className="admin-messages-redirect__icon">
          <i className="fa-solid fa-comments" />
        </div>
        <h2>Messages</h2>
        <p>
          All conversations with users are managed through the live chat widget
          at the bottom-right corner of every admin page. Click the chat icon to
          view and respond to user messages in real time.
        </p>
        <div className="admin-messages-redirect__tip">
          <i className="fa-solid fa-circle-info" />
          <span>
            The <strong>chat bubble icon</strong> at the bottom-right opens a
            full inbox of all user conversations.
          </span>
        </div>
      </div>
    </div>
  );
}
