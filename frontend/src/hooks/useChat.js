import { useState, useRef, useCallback } from "react";

const SESSION_ID = "session_" + Math.random().toString(36).slice(2);

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const isStreamingRef = useRef(false); // ref so sendMessage never needs it as a dep
  const abortRef = useRef(null);

  const sendMessage = useCallback(async (text) => {
    // Guard via ref — stable across renders, no stale closure issues
    if (!text.trim() || isStreamingRef.current) return;

    isStreamingRef.current = true;
    setIsStreaming(true);

    const userMsgId = Date.now();
    const aiId = userMsgId + 1;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: text },
      { id: aiId,      role: "ai",   content: "", streaming: true },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: SESSION_ID }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("Server error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let event;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          if (event.token) {
            accumulated += event.token;
            setMessages((prev) =>
              prev.map((m) => m.id === aiId ? { ...m, content: accumulated } : m)
            );
          }
          if (event.done) {
            setMessages((prev) =>
              prev.map((m) => m.id === aiId ? { ...m, streaming: false } : m)
            );
          }
          if (event.error) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiId
                  ? { ...m, content: event.error, streaming: false, error: true }
                  : m
              )
            );
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId
              ? { ...m, content: "Connection error. Make sure the backend is running.", streaming: false, error: true }
              : m
          )
        );
      }
    } finally {
      isStreamingRef.current = false;
      setIsStreaming(false);
    }
  }, []); // stable — no deps needed, guard is via ref

  const clearChat = useCallback(async () => {
    try {
      await fetch("/api/session", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: SESSION_ID }),
      });
    } catch (_) {}
    setMessages([]);
  }, []);

  return { messages, isStreaming, sendMessage, clearChat };
}
