import type { ApiResponse, Article, Language } from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      errorBody?.error?.message ??
      errorBody?.message ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// --- Phase 1 endpoints ---

export async function getArticles(): Promise<ApiResponse<Article[]>> {
  return request<ApiResponse<Article[]>>("/articles");
}

export async function getLanguages(): Promise<ApiResponse<Language[]>> {
  return request<ApiResponse<Language[]>>("/languages");
}

// --- Phase 2+ stubs (not yet implemented) ---
// export async function getArticle(id: string): Promise<ApiResponse<ArticleDetail>> { ... }
// export async function askAboutArticle(id: string, question: string): Promise<ApiResponse<...>> { ... }
// export async function askHealthQuestion(question: string): Promise<ApiResponse<...>> { ... }