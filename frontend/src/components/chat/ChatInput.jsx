import { useRef, useEffect } from "react";
import { SendHorizonal, Loader2 } from "lucide-react";
import styles from "./ChatInput.module.css";

export default function ChatInput({ onSend, isStreaming }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  });

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    const value = textareaRef.current?.value.trim();
    if (!value || isStreaming) return;
    onSend(value);
    textareaRef.current.value = "";
    textareaRef.current.style.height = "auto";
  };

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.row} ${isStreaming ? styles.rowStreaming : ""}`}>
        <textarea
          ref={textareaRef}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder={isStreaming ? "Banku is thinking…" : "Ask about your account, transfers, or how MyBank works…"}
          rows={1}
          className={styles.textarea}
          aria-label="Chat message"
        />
        <button
          onClick={submit}
          disabled={isStreaming}
          className={`${styles.sendBtn} ${isStreaming ? styles.sendBtnDisabled : ""}`}
          aria-label="Send"
        >
          {isStreaming
            ? <Loader2 size={15} className={styles.spinner} />
            : <SendHorizonal size={15} />
          }
        </button>
      </div>
      <p className={styles.hint}>Banku only answers questions about MyBank · Shift+Enter for new line</p>
    </div>
  );
}
