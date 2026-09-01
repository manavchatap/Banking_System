import { Sparkles } from "lucide-react";
import styles from "./EmptyState.module.css";

const SUGGESTIONS = [
  "How do I transfer money?",
  "Why was my transfer rejected?",
  "How is my balance calculated?",
  "How do I reset my password?",
  "What does FROZEN account mean?",
  "Can I open more than one account?",
];

export default function EmptyState({ onSuggestion }) {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrap}>
        <Sparkles size={26} style={{ color: "#fff" }} />
      </div>
      <h2 className={styles.heading}>Hey, I'm Banku! 👋</h2>
      <p className={styles.subtext}>
        I'm your MyBank assistant. Ask me anything about your account,
        transfers, transaction history, or how the app works.
      </p>
      <div className={styles.chips}>
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => onSuggestion(s)} className={styles.chip}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
