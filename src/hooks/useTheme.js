import { useEffect, useState } from "react";
import { loadSettings, saveSettings } from "../utils/storage";

/** Theme: "system" | "light" | "dark". Applied as data-theme on <html>. */
export default function useTheme() {
  const [theme, setTheme] = useState(() => loadSettings().theme || "system");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = resolved;
    };
    apply();
    media.addEventListener("change", apply);
    saveSettings({ ...loadSettings(), theme });
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  return [theme, setTheme];
}
