import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Trash2, Sparkles } from "lucide-react";
import { useChat } from "../../hooks/useChat";
import Message from "./Message";
import ChatInput from "./ChatInput";
import EmptyState from "./EmptyState";
import styles from "./ManuWidget.module.css";

export default function ManuWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isStreaming, sendMessage, clearChat } = useChat();
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && isOpen) setIsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Chat panel */}
      <div
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Banku — MyBank AI Assistant"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerAvatar}>
              <Sparkles size={14} style={{ color: "#fff" }} />
            </div>
            <div>
              <span className={styles.headerName}>Banku</span>
              <span className={styles.headerSub}>
                <span className={styles.onlineDot} />
                MyBank Assistant
              </span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={clearChat}
              disabled={messages.length === 0}
              className={styles.iconBtn}
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className={styles.iconBtn}
              title="Close"
              aria-label="Close chat"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          {messages.length === 0 ? (
            <EmptyState onSuggestion={sendMessage} />
          ) : (
            <div className={styles.messageList}>
              {messages.map((msg) => (
                <Message key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} isStreaming={isStreaming} />
      </div>

      {/* Floating button */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        className={`${styles.fab} ${isOpen ? styles.fabOpen : ""}`}
        aria-label={isOpen ? "Close Banku chat" : "Open Banku chat"}
        title="Chat with Banku"
      >
        {isOpen ? (
          <X size={21} />
        ) : (
          <>
            <MessageCircle size={21} />
            {messages.some((m) => m.role === "ai") && (
              <span className={styles.badge} aria-hidden="true" />
            )}
          </>
        )}
      </button>
    </>
  );
}
