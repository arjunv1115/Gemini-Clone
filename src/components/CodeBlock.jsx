import { useState } from "react";

function textOf(node) {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node?.props?.children) return textOf(node.props.children);
  return "";
}

/** <pre> renderer for Markdown with a language label and copy button. */
export default function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);
  const className = children?.props?.className || "";
  const lang = (className.match(/language-([\w-]+)/) || [])[1] || "code";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(textOf(children).replace(/\n$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="code-block">
      <div className="code-head">
        <span>{lang}</span>
        <button onClick={copy}>{copied ? "Copied" : "Copy code"}</button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}
