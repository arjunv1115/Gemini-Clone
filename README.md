# Gemini Clone (React + Vite + Gemini API)

A Gemini-style AI chat app: streaming answers, Markdown and code rendering, image prompts,
voice input, saved chat history, and light/dark themes. Built with React 18 and Vite, using
the icons from your asset pack.

## 1. Requirements

- Node.js 18 or newer (`node -v`)
- A Gemini API key (https://aistudio.google.com/apikey)

## 2. Setup

```bash
unzip gemini-clone.zip
cd gemini-clone
npm install
npm run dev
```

The app opens at http://localhost:5173.

The `.env` file already contains your key. If you ever need to change it:

```dotenv
VITE_GEMINI_API_KEY=your_key_here
VITE_GEMINI_MODEL=gemini-2.0-flash
```

Rules for `.env`: no quotes, no trailing `;`, and restart `npm run dev` after editing it.
`VITE_GEMINI_MODEL` is optional. If that model isn't available for your key, the app
automatically tries `gemini-2.5-flash` and then `gemini-flash-latest`.

## 3. Features

| Feature | How to use it |
|---|---|
| Streaming replies | Type a prompt and press Enter. Shift+Enter adds a new line. |
| Stop / regenerate | Stop button while streaming; "Regenerate" under the last answer. |
| Conversation memory | Each chat sends its full history, so follow-up questions work. |
| Markdown + code | Headings, lists, tables, syntax-highlighted code with a Copy button. |
| Image prompts | Attach, paste (Ctrl/Cmd+V) or drag images onto the prompt box (up to 4, 8 MB each). |
| Voice input | Mic button (Chrome, Edge, Safari). Allow microphone access when asked. |
| Read aloud | "Read aloud" under any answer. |
| Chat history | Saved in your browser. Search, rename (✎), delete (✕), grouped by date. |
| Themes | Settings → System, Light or Dark. |
| Responsive | The sidebar becomes a slide-over drawer on phones. |

## 4. Project structure

```
src/
├── assets/          Icons from your asset pack + assets.js
├── components/      Sidebar, TopBar, Welcome, MessageList, Message,
│                    CodeBlock, PromptBox, SettingsModal, Icon
├── hooks/           useChat (all chat state/actions), useTheme, useSpeechRecognition
├── services/        gemini.js (API calls, streaming, error messages)
├── utils/           storage.js (localStorage), files.js (images, ids, date groups)
├── styles/          theme, layout, sidebar, chat, prompt, modal
├── App.jsx
└── main.jsx
```

UI components never call the API directly. `useChat` owns the state and calls
`services/gemini.js`, so you can swap the model or provider in one place.

## 5. Build for production

```bash
npm run build      # outputs to dist/
npm run preview    # test the production build locally
```

## 6. Important: protect your API key

Vite embeds `VITE_*` variables in the browser bundle, so anyone who opens the deployed
site can read the key. That's fine for local use and demos, but before you deploy publicly:

1. Create a new key and delete the one you shared in chat.
2. Restrict the key (HTTP referrers) in Google AI Studio / Google Cloud Console, or
   move the API call to a small backend (Node/Express) that keeps the key private.

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| "No API key found" | Check `.env` is in the project root (next to `package.json`) and restart the dev server. |
| "Access denied" / 403 | The key is invalid or the Gemini API isn't enabled for it. Create a fresh key in AI Studio. |
| "Rate limit reached" / 429 | Free-tier limits. Wait a minute and retry. |
| Mic does nothing | Use Chrome/Edge, allow the microphone, and use `localhost` or HTTPS. |
| Chats missing | History is per browser profile; clearing site data removes it. |
