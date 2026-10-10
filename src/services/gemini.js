/**
 * Gemini API service.
 * Streams responses from the Generative Language REST API (Server-Sent Events).
 */
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Tried in order if the configured model is unavailable for this key.
const MODEL_FALLBACKS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"];

export const SYSTEM_PROMPT =
  "You are Gemini, a helpful, accurate and friendly AI assistant. " +
  "Answer in clear Markdown. Use fenced code blocks with a language tag for code.";

export class GeminiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

/** Convert stored chat messages to the Gemini `contents` format. */
export function toContents(messages) {
  return messages
    .filter((m) => !m.error && (m.text || m.images?.length))
    .map((m) => {
      const parts = [];
      (m.images || []).forEach((img) =>
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } })
      );
      if (m.text) parts.push({ text: m.text });
      return { role: m.role === "user" ? "user" : "model", parts };
    });
}

function friendlyError(status, body) {
  const apiMessage = body?.error?.message;
  if (status === 400 && /api key/i.test(apiMessage || ""))
    return "The API key was rejected. Check VITE_GEMINI_API_KEY in your .env file.";
  if (status === 401 || status === 403)
    return "Access denied. Check that your API key is valid and the Gemini API is enabled for it.";
  if (status === 429)
    return "Rate limit reached. Wait a moment and try again.";
  if (status >= 500) return "Gemini is having trouble right now. Try again shortly.";
  return apiMessage || `Request failed (${status}).`;
}

async function streamOnce({ model, contents, signal, onToken }) {
  const res = await fetch(`${API_BASE}/${model}:streamGenerateContent?alt=sse`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    }),
  });

  if (!res.ok) {
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
    throw new GeminiError(friendlyError(res.status, body), res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let blockReason = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        if (json.promptFeedback?.blockReason) blockReason = json.promptFeedback.blockReason;
        const parts = json.candidates?.[0]?.content?.parts || [];
        const text = parts.map((p) => p.text || "").join("");
        if (text) {
          full += text;
          onToken(full);
        }
      } catch {
        /* partial JSON chunk, ignore */
      }
    }
  }

  if (!full && blockReason)
    throw new GeminiError("This prompt was blocked by Gemini's safety filters.", 400);
  return full;
}

/**
 * Stream a reply. `onToken` receives the full text so far.
 * Resolves with the final text. Rejects with GeminiError (or AbortError).
 */
export async function streamReply({ messages, signal, onToken }) {
  if (!API_KEY) {
    throw new GeminiError(
      "No API key found. Add VITE_GEMINI_API_KEY to your .env file and restart the dev server.",
      401
    );
  }

  const contents = toContents(messages);
  const configured = import.meta.env.VITE_GEMINI_MODEL;
  const models = [...new Set([configured, ...MODEL_FALLBACKS].filter(Boolean))];

  let lastError;
  for (const model of models) {
    try {
      return await streamOnce({ model, contents, signal, onToken });
    } catch (err) {
      if (err.name === "AbortError") throw err;
      lastError = err;
      // Only fall through to the next model when this one doesn't exist for the key.
      if (err.status !== 404) throw err;
    }
  }
  throw lastError;
}

/** Short title for the sidebar, generated from the first prompt. */
export function makeTitle(text, hasImage) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return hasImage ? "Image prompt" : "New chat";
  return clean.length > 40 ? clean.slice(0, 40).trimEnd() + "…" : clean;
}
