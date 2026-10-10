import { useState } from "react";
import Icon from "./Icon";
import { groupByDate } from "../utils/files";

function ChatItem({ chat, active, onSelect, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(chat.title);

  const commit = () => {
    onRename(chat.id, value);
    setEditing(false);
  };

  return (
    <li className={`chat-item ${active ? "active" : ""}`}>
      {editing ? (
        <input
          className="chat-rename"
          value={value}
          autoFocus
          maxLength={80}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setValue(chat.title);
              setEditing(false);
            }
          }}
        />
      ) : (
        <>
          <button className="chat-select" onClick={() => onSelect(chat.id)} title={chat.title}>
            <Icon name="message_icon" size={18} />
            <span>{chat.title}</span>
          </button>
          <span className="chat-actions">
            <button aria-label="Rename chat" title="Rename" onClick={() => setEditing(true)}>
              ✎
            </button>
            <button aria-label="Delete chat" title="Delete" onClick={() => onDelete(chat.id)}>
              ✕
            </button>
          </span>
        </>
      )}
    </li>
  );
}

export default function Sidebar({
  open,
  onToggle,
  chats,
  activeId,
  onNewChat,
  onSelect,
  onDelete,
  onRename,
  onSettings,
}) {
  const [query, setQuery] = useState("");
  const filtered = query
    ? chats.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
    : chats;
  const groups = groupByDate(filtered);

  return (
    <>
      {open && <div className="sidebar-scrim" onClick={onToggle} />}
      <aside className={`sidebar ${open ? "open" : "closed"}`} aria-label="Chat history">
        <div className="sidebar-top">
          <button className="icon-btn" onClick={onToggle} aria-label="Toggle sidebar">
            <Icon name="menu_icon" />
          </button>

          <button className="new-chat" onClick={onNewChat}>
            <Icon name="plus_icon" size={18} />
            {open && <span>New chat</span>}
          </button>

          {open && (
            <>
              <input
                className="chat-search"
                type="search"
                placeholder="Search chats"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search chats"
              />
              <nav className="recent">
                {groups.length === 0 && (
                  <p className="recent-empty">
                    {query ? "No chats match that search." : "Your conversations will show up here."}
                  </p>
                )}
                {groups.map(([label, list]) => (
                  <section key={label}>
                    <h3>{label}</h3>
                    <ul>
                      {list.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          active={chat.id === activeId}
                          onSelect={onSelect}
                          onDelete={onDelete}
                          onRename={onRename}
                        />
                      ))}
                    </ul>
                  </section>
                ))}
              </nav>
            </>
          )}
        </div>

        <div className="sidebar-bottom">
          <a
            className="bottom-item"
            href="https://support.google.com/gemini"
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="question_icon" />
            {open && <span>Help</span>}
          </a>
          <button className="bottom-item" onClick={() => onSelect(chats[0]?.id ?? null)} disabled={!chats.length}>
            <Icon name="history_icon" />
            {open && <span>Activity</span>}
          </button>
          <button className="bottom-item" onClick={onSettings}>
            <Icon name="setting_icon" />
            {open && <span>Settings</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
