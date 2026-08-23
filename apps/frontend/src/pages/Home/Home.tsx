import { useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import ContentList from "@/components/ContentList";
import { getArticles, getLanguages } from "@/services/api";
import type { Article, Language } from "@/types/api";

const Home = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [articlesRes, languagesRes] = await Promise.all([
          getArticles(),
          getLanguages(),
        ]);

        setArticles(articlesRes.data);
        setLanguages(languagesRes.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <MainLayout>
      <div className="home-container">
        <ContentList
          articles={articles}
          isLoading={isLoading}
          error={error}
        />

        {/* Temporary: show fetched languages for development verification */}
        {languages.length > 0 && !isLoading && !error && (
          <div className="languages-debug">
            Available languages: {languages.map((l) => l.name).join(", ")}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Home;
