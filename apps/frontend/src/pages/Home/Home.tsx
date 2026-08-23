import { useEffect, useState, useMemo, useCallback } from "react";
import MainLayout from "@/layouts/MainLayout";
import ContentFilter from "@/components/ContentFilter";
import LanguageSelector from "@/components/LanguageSelector";
import ContentList from "@/components/ContentList";
import Chat from "@/components/Chat";
import { getArticles, getLanguages } from "@/services/api";
import type { Article, Language, ContentType, DisplayArticle } from "@/types/api";
import "./Home.css";

const DEFAULT_LANGUAGE = "en";

/**
 * Merge English articles with selected-language articles.
 * For each article id, prefer the selected-language version.
 * If no translation exists for that id, fall back to the English version
 * and mark it with isFallback = true.
 */
function mergeWithFallback(
  englishArticles: Article[],
  selectedArticles: Article[],
  selectedLang: string,
): DisplayArticle[] {
  // If English is selected, no fallback logic needed
  if (selectedLang === DEFAULT_LANGUAGE) {
    return englishArticles.map((a) => ({ ...a, isFallback: false }));
  }

  const selectedMap = new Map<string, Article>();
  for (const article of selectedArticles) {
    selectedMap.set(article.id, article);
  }

  // Build the merged list: for every English article, check if a translation exists
  const result: DisplayArticle[] = [];
  for (const enArticle of englishArticles) {
    const translated = selectedMap.get(enArticle.id);
    if (translated) {
      result.push({ ...translated, isFallback: false });
    } else {
      result.push({ ...enArticle, isFallback: true });
    }
  }

  // Also include any translated articles that might not appear in the English set
  for (const article of selectedArticles) {
    if (!result.some((r) => r.id === article.id)) {
      result.push({ ...article, isFallback: false });
    }
  }

  return result;
}

interface ChatState {
  isOpen: boolean;
  articleId?: string;
  articleTitle?: string;
}

const Home = () => {
  const [englishArticles, setEnglishArticles] = useState<Article[]>([]);
  const [selectedLangArticles, setSelectedLangArticles] = useState<Article[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chat, setChat] = useState<ChatState>({ isOpen: false });

  // Initial load: fetch languages + English articles
  useEffect(() => {
    const fetchInitial = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [articlesRes, languagesRes] = await Promise.all([
          getArticles(DEFAULT_LANGUAGE),
          getLanguages(),
        ]);

        setEnglishArticles(articlesRes.data);
        setSelectedLangArticles([]);
        setLanguages(languagesRes.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitial();
  }, []);

  // When language changes, fetch articles for the selected language
  useEffect(() => {
    if (selectedLanguage === DEFAULT_LANGUAGE) {
      setSelectedLangArticles([]);
      return;
    }

    const fetchTranslations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await getArticles(selectedLanguage);
        setSelectedLangArticles(res.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [selectedLanguage]);

  // Merge + filter articles
  const displayArticles = useMemo(() => {
    const merged = mergeWithFallback(englishArticles, selectedLangArticles, selectedLanguage);

    if (selectedContentType === "all") {
      return merged;
    }
    return merged.filter((a) => a.contentType === selectedContentType);
  }, [englishArticles, selectedLangArticles, selectedLanguage, selectedContentType]);

  // Chat handlers
  const openGeneralChat = useCallback(() => {
    setChat({ isOpen: true });
  }, []);

  const openArticleChat = useCallback((articleId: string, articleTitle: string) => {
    setChat({ isOpen: true, articleId, articleTitle });
  }, []);

  const closeChat = useCallback(() => {
    setChat({ isOpen: false });
  }, []);

  return (
    <MainLayout>
      <div className="home-container">
        <div className="home-controls">
          <ContentFilter
            selected={selectedContentType}
            onChange={setSelectedContentType}
          />
          <LanguageSelector
            languages={languages}
            selected={selectedLanguage}
            onChange={setSelectedLanguage}
          />
        </div>

        <ContentList
          articles={displayArticles}
          isLoading={isLoading}
          error={error}
          onAskAi={openArticleChat}
        />
      </div>

      {/* Floating ASK KOKO button */}
      {!chat.isOpen && (
        <button className="ask-koko-btn" onClick={openGeneralChat}>
          ASK KOKO
        </button>
      )}

      {/* Chat panel */}
      {chat.isOpen && (
        <Chat
          key={chat.articleId ?? "general"}
          articleId={chat.articleId}
          articleTitle={chat.articleTitle}
          language={selectedLanguage}
          onClose={closeChat}
        />
      )}
    </MainLayout>
  );
};

export default Home;
