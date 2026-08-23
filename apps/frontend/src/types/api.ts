// Types derived from the backend API response shapes.

// --- Article types ---

export interface Article {
  id: string;
  contentType: "article" | "faq" | "tip";
  topic: string;
  status: "draft" | "published";
  title: string;
  summary: string | null;
  languageCode: string;
  languageName: string;
  createdAt: string;
  updatedAt: string;
}

// --- Language types ---

export interface Language {
  id: string;
  code: string;
  name: string;
}

// --- API envelope ---

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  correlationId: string;
}
