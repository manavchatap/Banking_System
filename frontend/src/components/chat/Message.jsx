import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Sparkles, User, AlertCircle, Copy, Check } from "lucide-react";
import styles from "./Message.module.css";

function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className={styles.copyBtn} title="Copy code" aria-label="Copy code">
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

const MarkdownComponents = {
  // eslint-disable-next-line no-unused-vars
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const codeString = String(children).replace(/\n$/, "");
    if (!inline && match) {
      return (
        <div className={styles.codeBlock}>
          <div className={styles.codeHeader}>
            <span className={styles.codeLang}>{match[1]}</span>
          </div>
          <div className={styles.codeBody}>
            <CopyButton code={codeString} />
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              customStyle={{ margin: 0, borderRadius: "0 0 8px 8px", border: "1px solid #334155", borderTop: "none", fontSize: "0.85em" }}
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        </div>
      );
    }
    return <code className={styles.inlineCode} {...props}>{children}</code>;
  },
};

export default function Message({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : ""}`}>
      {/* Avatar */}
      <div className={`${styles.avatar} ${isUser ? styles.avatarUser : styles.avatarAi}`}>
        {isUser
          ? <User size={13} style={{ color: "#fff" }} />
          : <Sparkles size={13} style={{ color: "#fff" }} />
        }
      </div>

      {/* Bubble */}
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : message.error ? styles.bubbleError : styles.bubbleAi}`}>
        {message.error && (
          <div className={styles.errorLabel}>
            <AlertCircle size={12} /> Error
          </div>
        )}

        {isUser ? (
          <p className={styles.userText}>{message.content}</p>
        ) : (
          <>
            {message.content && (
              <div className={styles.prose}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Typing dots */}
            {message.streaming && !message.content && (
              <div className={styles.dots}>
                {[0, 1, 2].map((i) => (
                  <span key={i} className={styles.dot} style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            )}

            {/* Blinking cursor */}
            {message.streaming && message.content && (
              <span className={styles.cursor} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
