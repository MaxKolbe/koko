import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "../types/api";
import { askAboutArticle, askHealthQuestion } from "../services/api";
import "./Chat.css";

interface ChatProps {
  /** When set, the chat is in article-specific mode. */
  articleId?: string;
  /** Current app language code — passed to article ask endpoint. */
  language?: string;
  /** Optional title of the article for display context. */
  articleTitle?: string;
  onClose: () => void;
}

const Chat = ({ articleId, language, articleTitle, onClose }: ChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isArticleMode = Boolean(articleId);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    const question = input.trim();
    if (!question || isLoading) return;

    setError(null);
    setInput("");

    // Add user message
    const userMessage: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);

    try {
      const res = articleId
        ? await askAboutArticle(articleId, question, language)
        : await askHealthQuestion(question);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: res.data.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const headerTitle = isArticleMode ? "Ask about this" : "Ask Koko";

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <h3 className="chat-header-title">{headerTitle}</h3>
            {isArticleMode && articleTitle && (
              <p className="chat-header-context" title={articleTitle}>
                {articleTitle}
              </p>
            )}
          </div>
          <button className="chat-close-btn" onClick={onClose} aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && !isLoading && (
            <p className="chat-empty">
              {isArticleMode
                ? "Ask a question about this content."
                : "Ask any health-related question."}
            </p>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-message chat-message--${msg.role}`}>
              <div className="chat-message-bubble">
                {msg.content.split("\n").map((line, j) =>
                  line.trim() ? <p key={j}>{line}</p> : null
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-message chat-message--assistant">
              <div className="chat-message-bubble chat-message-loading">
                <span className="chat-dot" />
                <span className="chat-dot" />
                <span className="chat-dot" />
              </div>
            </div>
          )}

          {error && (
            <div className="chat-error">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="Type your question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            maxLength={1000}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={isLoading || !input.trim()}
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
