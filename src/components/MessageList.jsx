import { useEffect, useRef } from "react";
import Message from "./Message";

export default function MessageList({ messages, loading, onRegenerate }) {
  const endRef = useRef(null);
  const wrapRef = useRef(null);
  const stickRef = useRef(true);

  // Follow the stream only while the reader is near the bottom.
  const onScroll = () => {
    const el = wrapRef.current;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  useEffect(() => {
    stickRef.current = true;
  }, [messages.length]);

  useEffect(() => {
    if (stickRef.current) endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <div className="messages" ref={wrapRef} onScroll={onScroll}>
      <div className="messages-inner">
        {messages.map((m, i) => (
          <Message
            key={m.id}
            message={m}
            isLast={i === messages.length - 1}
            loading={loading}
            onRegenerate={onRegenerate}
          />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
