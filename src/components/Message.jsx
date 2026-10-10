import { memo, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import Icon from "./Icon";
import CodeBlock from "./CodeBlock";

const mdComponents = {
  pre: CodeBlock,
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
  table: ({ node, ...props }) => (
    <div className="table-wrap">
      <table {...props} />
    </div>
  ),
};

function ModelActions({ text, isLast, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const speak = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const plain = text.replace(/```[\s\S]*?```/g, " code block ").replace(/[*_`#>|-]/g, "");
    const u = new SpeechSynthesisUtterance(plain);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  };

  return (
    <div className="msg-actions">
      <button onClick={copy}>{copied ? "Copied" : "Copy"}</button>
      <button onClick={speak}>{speaking ? "Stop reading" : "Read aloud"}</button>
      {isLast && <button onClick={onRegenerate}>Regenerate</button>}
    </div>
  );
}

function Message({ message, isLast, loading, onRegenerate }) {
  const isUser = message.role === "user";
  const ref = useRef(null);

  return (
    <article className={`message ${isUser ? "user" : "model"}`} ref={ref}>
      <div className="avatar">
        <Icon name={isUser ? "user_icon" : "gemini_icon"} size={isUser ? 36 : 34} className={isUser ? "avatar-user" : ""} />
      </div>
      <div className="msg-body">
        {isUser && message.images?.length > 0 && (
          <div className="msg-images">
            {message.images.map((img, i) => (
              <img key={i} src={img.preview || `data:${img.mimeType};base64,${img.data}`} alt={img.name || "Attached"} />
            ))}
          </div>
        )}

        {message.pending && !message.text ? (
          <div className="loader" role="status" aria-label="Gemini is thinking">
            <hr />
            <hr />
            <hr />
          </div>
        ) : isUser ? (
          <p className="user-text">{message.text}</p>
        ) : message.error ? (
          <div className="error-box" role="alert">
            <strong>Couldn't get a response</strong>
            <p>{message.text}</p>
            {isLast && !loading && (
              <button className="retry" onClick={onRegenerate}>
                Try again
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
                components={mdComponents}
              >
                {message.text}
              </ReactMarkdown>
              {loading && isLast && <span className="caret" />}
            </div>
            {message.stopped && <p className="stopped-note">Response stopped.</p>}
            {!(loading && isLast) && (
              <ModelActions text={message.text} isLast={isLast} onRegenerate={onRegenerate} />
            )}
          </>
        )}
      </div>
    </article>
  );
}

export default memo(Message);
