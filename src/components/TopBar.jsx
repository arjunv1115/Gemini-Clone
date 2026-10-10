import Icon from "./Icon";

export default function TopBar({ onToggleSidebar, sidebarOpen, title }) {
  return (
    <header className="topbar">
      {!sidebarOpen && (
        <button className="icon-btn mobile-menu" onClick={onToggleSidebar} aria-label="Open sidebar">
          <Icon name="menu_icon" />
        </button>
      )}
      <span className="brand">Gemini</span>
      {title && <span className="topbar-title">{title}</span>}
    </header>
  );
}
