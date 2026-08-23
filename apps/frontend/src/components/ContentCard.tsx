import type { Article } from "../types/api";
import "./ContentCard.css";

interface ContentCardProps {
  article: Article;
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

const ContentCard = ({ article }: ContentCardProps) => {
  return (
    <article className="content-card">
      <div className="content-card-header">
        <span className="content-card-type">{contentTypeLabel(article.contentType)}</span>
        <span className="content-card-lang">{article.languageCode.toUpperCase()}</span>
      </div>

      <h2 className="content-card-title">{article.title}</h2>

      {article.summary && (
        <p className="content-card-summary">{article.summary}</p>
      )}

      <div className="content-card-footer">
        <span className="content-card-topic">{article.topic}</span>
        <time className="content-card-date" dateTime={article.createdAt}>
          {formatDate(article.createdAt)}
        </time>
      </div>
    </article>
  );
};

export default ContentCard;
