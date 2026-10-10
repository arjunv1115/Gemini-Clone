import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import { MAX_IMAGES, readImage } from "../utils/files";

export default function PromptBox({ loading, onSend, onStop, prefill, onPrefillUsed }) {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const textRef = useRef(null);
  const fileRef = useRef(null);
  const baseTextRef = useRef("");

  const speech = useSpeechRecognition({
    onResult: (transcript) => setText((baseTextRef.current + " " + transcript).trim()),
  });

  // Auto-grow the textarea.
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [text]);

  // Fill from a suggestion card.
  useEffect(() => {
    if (prefill) {
      setText(prefill);
      textRef.current?.focus();
      onPrefillUsed();
    }
  }, [prefill, onPrefillUsed]);

  useEffect(() => {
    const msg = notice || speech.error;
    if (!msg) return;
    const t = setTimeout(() => {
      setNotice("");
      speech.clearError();
    }, 4000);
    return () => clearTimeout(t);
  }, [notice, speech]);

  const addFiles = async (fileList) => {
    const files = Array.from(fileList).slice(0, MAX_IMAGES - images.length);
    if (images.length + fileList.length > MAX_IMAGES) setNotice(`You can attach up to ${MAX_IMAGES} images.`);
    for (const file of files) {
      try {
        const img = await readImage(file);
        setImages((prev) => (prev.length < MAX_IMAGES ? [...prev, img] : prev));
      } catch (err) {
        setNotice(err.message);
      }
    }
  };

  const submit = () => {
    if (loading) return;
    if (!text.trim() && !images.length) return;
    speech.stop();
    onSend(text, images);
    setText("");
    setImages([]);
  };

  const toggleMic = () => {
    if (speech.listening) return speech.stop();
    baseTextRef.current = text;
    speech.start();
  };

  const canSend = text.trim() || images.length;

  return (
    <div className="prompt-area">
      <div
        className={`prompt-box ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        {images.length > 0 && (
          <div className="attachments">
            {images.map((img, i) => (
              <div className="thumb" key={i}>
                <img src={img.preview} alt={img.name} />
                <button
                  aria-label={`Remove ${img.name}`}
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="prompt-row">
          <textarea
            ref={textRef}
            rows={1}
            value={text}
            placeholder={speech.listening ? "Listening…" : "Enter a prompt here"}
            aria-label="Prompt"
            onChange={(e) => setText(e.target.value)}
            onPaste={(e) => {
              const files = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith("image/"));
              if (files.length) {
                e.preventDefault();
                addFiles(files);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <div className="prompt-icons">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              className="icon-btn"
              title="Attach images"
              aria-label="Attach images"
              onClick={() => fileRef.current?.click()}
              disabled={images.length >= MAX_IMAGES}
            >
              <Icon name="gallery_icon" />
            </button>
            <button
              className={`icon-btn ${speech.listening ? "listening" : ""}`}
              title={speech.listening ? "Stop listening" : "Use microphone"}
              aria-label="Voice input"
              aria-pressed={speech.listening}
              onClick={toggleMic}
            >
              <Icon name="mic_icon" />
            </button>
            {loading ? (
              <button className="icon-btn stop-btn" title="Stop response" aria-label="Stop response" onClick={onStop}>
                <span className="stop-square" />
              </button>
            ) : (
              <button
                className="icon-btn send-btn"
                title="Send"
                aria-label="Send message"
                onClick={submit}
                disabled={!canSend}
              >
                <Icon name="send_icon" />
              </button>
            )}
          </div>
        </div>
      </div>

      {(notice || speech.error) && (
        <p className="notice" role="status">
          {notice || speech.error}
        </p>
      )}
      <p className="disclaimer">
        Gemini can make mistakes, so double-check its responses. Press Shift + Enter for a new line.
      </p>
    </div>
  );
}
