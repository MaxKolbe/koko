import type { Article } from "../types/api";
import ContentCard from "./ContentCard";
import "./ContentList.css";

interface ContentListProps {
  articles: Article[];
  isLoading: boolean;
  error: string | null;
}

const ContentList = ({ articles, isLoading, error }: ContentListProps) => {
  if (isLoading) {
    return (
      <div className="content-state">
        <div className="content-spinner" />
        <p className="content-state-text">Loading articles…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-state content-state-error">
        <p className="content-state-heading">Something went wrong</p>
        <p className="content-state-text">{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="content-state">
        <p className="content-state-heading">No articles yet</p>
        <p className="content-state-text">Check back later for health information.</p>
      </div>
    );
  }

  return (
    <div className="content-list">
      {articles.map((article) => (
        <ContentCard key={article.id} article={article} />
      ))}
    </div>
  );
};

export default ContentList;
