import { useState } from "react";
import type { DisplayArticle } from "../types/api";
import { getArticle } from "../services/api";
import "./ContentCard.css";

interface ContentCardProps {
  article: DisplayArticle;
  onAskAi: (articleId: string, articleTitle: string) => void;
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function contentTypeLabel(type: string): string {
  switch (type) {
    case "faq":
      return "FAQ";
    case "tip":
      return "Tip";
    case "article":
      return "Article";
    default:
      return type;
  }
}

const ContentCard = ({ article, onAskAi }: ContentCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [body, setBody] = useState<string | null>(null);
  const [isLoadingBody, setIsLoadingBody] = useState(false);
  const [bodyError, setBodyError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    // If we already fetched the body, just expand
    if (body !== null) {
      setIsExpanded(true);
      return;
    }

    // Fetch the full article body
    setIsLoadingBody(true);
    setBodyError(null);
    try {
      const res = await getArticle(article.id, article.languageCode);
      setBody(res.data.body);
      setIsExpanded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load content";
      setBodyError(message);
    } finally {
      setIsLoadingBody(false);
    }
  };

  return (
    <article className="content-card">
      <div className="content-card-header">
        <div className="content-card-badges">
          <span className="content-card-type">{contentTypeLabel(article.contentType)}</span>
          {article.isFallback && (
            <span className="content-card-fallback">EN</span>
          )}
        </div>
        <button
          className="content-card-ask-ai"
          onClick={() => onAskAi(article.id, article.title)}
        >
          ASK AI
        </button>
      </div>

      <h2 className="content-card-title">{article.title}</h2>

      {article.summary && (
        <p className="content-card-summary">{article.summary}</p>
      )}

      {/* Expanded body */}
      {isExpanded && body && (
        <div className="content-card-body">
          {body.split("\n").map((paragraph, i) => (
            paragraph.trim() ? <p key={i}>{paragraph}</p> : null
          ))}
        </div>
      )}

      {bodyError && (
        <p className="content-card-body-error">{bodyError}</p>
      )}

      <div className="content-card-footer">
        <div className="content-card-meta">
          <span className="content-card-lang">{article.languageCode.toUpperCase()}</span>
          <span className="content-card-separator">·</span>
          <span className="content-card-topic">{article.topic}</span>
          <span className="content-card-separator">·</span>
          <time className="content-card-date" dateTime={article.createdAt}>
            {formatDate(article.createdAt)}
          </time>
        </div>

        <button
          className="content-card-toggle"
          onClick={handleToggle}
          disabled={isLoadingBody}
        >
          {isLoadingBody ? "Loading…" : isExpanded ? "Show less" : "Read more"}
        </button>
      </div>
    </article>
  );
};

export default ContentCard;
