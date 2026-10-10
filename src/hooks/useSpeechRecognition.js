import { useCallback, useEffect, useRef, useState } from "react";

/** Wraps the browser Web Speech API for voice input. */
export default function useSpeechRecognition({ onResult }) {
  const Recognition =
    typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => () => recRef.current?.abort(), []);

  const start = useCallback(() => {
    if (!Recognition) {
      setError("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    setError("");
    const rec = new Recognition();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      onResultRef.current(transcript, e.results[e.results.length - 1].isFinal);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") setError("Microphone access was blocked. Allow it in your browser settings.");
      else if (e.error !== "aborted" && e.error !== "no-speech") setError("Voice input failed. Try again.");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [Recognition]);

  const stop = useCallback(() => recRef.current?.stop(), []);

  return { supported: Boolean(Recognition), listening, error, start, stop, clearError: () => setError("") };
}
