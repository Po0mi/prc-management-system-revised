import { useEffect } from "react";
import "./UserMessages.scss";

export default function UserMessages() {
  useEffect(() => {
    // Delay gives the FloatingChat widget time to finish mounting
    const id = setTimeout(() => {
      const btn = document.querySelector(".chat-fab");
      if (btn) btn.click();
    }, 300);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="user-messages-redirect">
      <div className="user-messages-redirect__card">
        <div className="user-messages-redirect__icon">
          <i className="fa-solid fa-comments" />
        </div>
        <h2>Messages</h2>
        <p>
          Your conversations are available through the chat widget at the
          bottom-right corner of the page. Click the chat icon to open it and
          message the admin team directly.
        </p>
        <div className="user-messages-redirect__tip">
          <i className="fa-solid fa-circle-info" />
          <span>
            Look for the <strong>chat bubble icon</strong> at the bottom-right
            of every page.
          </span>
        </div>
      </div>
    </div>
  );
}
