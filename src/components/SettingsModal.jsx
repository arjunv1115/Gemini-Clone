import { useEffect } from "react";

const THEMES = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export default function SettingsModal({ open, onClose, theme, onTheme, chatCount, onClearAll }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 id="settings-title">Settings</h2>
          <button className="icon-btn" aria-label="Close settings" onClick={onClose}>
            ✕
          </button>
        </div>

        <fieldset className="setting">
          <legend>Theme</legend>
          <div className="segmented">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={theme === t.id ? "selected" : ""}
                aria-pressed={theme === t.id}
                onClick={() => onTheme(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="setting">
          <span className="setting-label">Chat history</span>
          <p className="setting-hint">
            {chatCount} saved {chatCount === 1 ? "chat" : "chats"}, stored only in this browser.
          </p>
          <button
            className="danger"
            disabled={!chatCount}
            onClick={() => {
              if (window.confirm("Delete all chats? This can't be undone.")) {
                onClearAll();
                onClose();
              }
            }}
          >
            Delete all chats
          </button>
        </div>
      </div>
    </div>
  );
}
