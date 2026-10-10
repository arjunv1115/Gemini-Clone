import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { makeTitle, streamReply } from "../services/gemini";
import { loadChats, saveChats } from "../utils/storage";
import { uid } from "../utils/files";

/**
 * All chat state and actions: chat list, active chat, sending,
 * streaming, stopping, regenerating, renaming and deleting.
 */
export default function useChat() {
  const [chats, setChats] = useState(() => loadChats());
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => saveChats(chats), [chats]);

  const activeChat = useMemo(() => chats.find((c) => c.id === activeId) || null, [chats, activeId]);
  const sorted = useMemo(() => [...chats].sort((a, b) => b.updatedAt - a.updatedAt), [chats]);

  const patchChat = useCallback((id, fn) => {
    setChats((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  const patchLastMessage = useCallback(
    (id, patch) =>
      patchChat(id, (c) => {
        const messages = [...c.messages];
        messages[messages.length - 1] = { ...messages[messages.length - 1], ...patch };
        return { ...c, messages, updatedAt: Date.now() };
      }),
    [patchChat]
  );

  /** Ask Gemini to answer the given message history; fills the last (empty) model message. */
  const generate = useCallback(
    async (chatId, history) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const final = await streamReply({
          messages: history,
          signal: controller.signal,
          onToken: (text) => patchLastMessage(chatId, { text, pending: false }),
        });
        patchLastMessage(chatId, { text: final || "(No response)", pending: false });
      } catch (err) {
        if (err.name === "AbortError") {
          patchChat(chatId, (c) => {
            const last = c.messages[c.messages.length - 1];
            // Keep partial text; drop the placeholder if nothing arrived.
            const messages = last?.text ? [...c.messages.slice(0, -1), { ...last, pending: false, stopped: true }] : c.messages.slice(0, -1);
            return { ...c, messages };
          });
        } else {
          patchLastMessage(chatId, { text: err.message || "Something went wrong.", error: true, pending: false });
        }
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [patchChat, patchLastMessage]
  );

  const sendMessage = useCallback(
    async (text, images = []) => {
      const trimmed = text.trim();
      if ((!trimmed && !images.length) || loading) return;

      const userMsg = { id: uid(), role: "user", text: trimmed, images, createdAt: Date.now() };
      const modelMsg = { id: uid(), role: "model", text: "", pending: true, createdAt: Date.now() };

      let chatId = activeId;
      let history;
      if (!chatId) {
        chatId = uid();
        history = [userMsg];
        const chat = {
          id: chatId,
          title: makeTitle(trimmed, images.length > 0),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [userMsg, modelMsg],
        };
        setChats((prev) => [chat, ...prev]);
        setActiveId(chatId);
      } else {
        history = [...(chats.find((c) => c.id === chatId)?.messages || []), userMsg];
        patchChat(chatId, (c) => ({ ...c, updatedAt: Date.now(), messages: [...c.messages, userMsg, modelMsg] }));
      }
      await generate(chatId, history);
    },
    [activeId, chats, generate, loading, patchChat]
  );

  /** Drop the last model reply and ask again. */
  const regenerate = useCallback(async () => {
    if (!activeChat || loading) return;
    const msgs = activeChat.messages;
    const lastUserIdx = msgs.map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx === -1) return;
    const history = msgs.slice(0, lastUserIdx + 1);
    const modelMsg = { id: uid(), role: "model", text: "", pending: true, createdAt: Date.now() };
    patchChat(activeChat.id, (c) => ({ ...c, messages: [...history, modelMsg] }));
    await generate(activeChat.id, history);
  }, [activeChat, generate, loading, patchChat]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setActiveId(null);
  }, []);

  const selectChat = useCallback((id) => {
    abortRef.current?.abort();
    setActiveId(id);
  }, []);

  const deleteChat = useCallback(
    (id) => {
      if (id === activeId) abortRef.current?.abort();
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (id === activeId) setActiveId(null);
    },
    [activeId]
  );

  const renameChat = useCallback(
    (id, title) => {
      const clean = title.trim();
      if (clean) patchChat(id, (c) => ({ ...c, title: clean }));
    },
    [patchChat]
  );

  const clearAll = useCallback(() => {
    abortRef.current?.abort();
    setChats([]);
    setActiveId(null);
  }, []);

  return {
    chats: sorted,
    activeChat,
    activeId,
    loading,
    sendMessage,
    regenerate,
    stop,
    newChat,
    selectChat,
    deleteChat,
    renameChat,
    clearAll,
  };
}
