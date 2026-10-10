import { useCallback, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Welcome from "./components/Welcome";
import MessageList from "./components/MessageList";
import PromptBox from "./components/PromptBox";
import SettingsModal from "./components/SettingsModal";
import useChat from "./hooks/useChat";
import useTheme from "./hooks/useTheme";
import { loadSettings, saveSettings } from "./utils/storage";

const isMobile = () => window.matchMedia("(max-width: 800px)").matches;

export default function App() {
  const chat = useChat();
  const [theme, setTheme] = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(() => (isMobile() ? false : loadSettings().sidebarOpen !== false));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefill, setPrefill] = useState("");

  useEffect(() => {
    if (!isMobile()) saveSettings({ ...loadSettings(), sidebarOpen });
  }, [sidebarOpen]);

  const closeOnMobile = () => isMobile() && setSidebarOpen(false);
  const clearPrefill = useCallback(() => setPrefill(""), []);

  const messages = chat.activeChat?.messages ?? [];

  return (
    <div className="app">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        chats={chat.chats}
        activeId={chat.activeId}
        onNewChat={() => {
          chat.newChat();
          closeOnMobile();
        }}
        onSelect={(id) => {
          chat.selectChat(id);
          closeOnMobile();
        }}
        onDelete={chat.deleteChat}
        onRename={chat.renameChat}
        onSettings={() => setSettingsOpen(true)}
      />

      <main className="main">
        <TopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
          title={chat.activeChat?.title}
        />

        {messages.length === 0 ? (
          <Welcome onPick={setPrefill} />
        ) : (
          <MessageList messages={messages} loading={chat.loading} onRegenerate={chat.regenerate} />
        )}

        <PromptBox
          loading={chat.loading}
          onSend={chat.sendMessage}
          onStop={chat.stop}
          prefill={prefill}
          onPrefillUsed={clearPrefill}
        />
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onTheme={setTheme}
        chatCount={chat.chats.length}
        onClearAll={chat.clearAll}
      />
    </div>
  );
}
