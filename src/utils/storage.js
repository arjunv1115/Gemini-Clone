const CHATS_KEY = "gemini-clone:chats";
const SETTINGS_KEY = "gemini-clone:settings";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full (large images). Drop image payloads and retry once.
    if (key === CHATS_KEY) {
      const slim = value.map((c) => ({
        ...c,
        messages: c.messages.map((m) => ({ ...m, images: m.images?.map(({ data, ...rest }) => rest) })),
      }));
      try {
        localStorage.setItem(key, JSON.stringify(slim));
      } catch {
        /* give up silently */
      }
    }
  }
}

export const loadChats = () => read(CHATS_KEY, []);
export const saveChats = (chats) => write(CHATS_KEY, chats);
export const loadSettings = () => read(SETTINGS_KEY, { theme: "system", sidebarOpen: true });
export const saveSettings = (s) => write(SETTINGS_KEY, s);
