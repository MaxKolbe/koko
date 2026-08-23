import db from "../db/db.js";
import { addTranslationToQueue } from "../queues/ingestion.queue.js";
import { articles, translations, languages, authors } from "../db/models/koko.js";
import { eq, and, sql, count } from "drizzle-orm";
import { NotFoundError } from "../lib/error.js";
import { sendMessage } from "./message.services.js";
import type { articleListQuerySchema } from "../db/globalSchema.js";
import type * as z from "zod";

//SERVICES

type ArticleListQuery = z.infer<typeof articleListQuerySchema>;

export const getArticles = async (query: ArticleListQuery, correlationId: string) => {
  const { language, status, contentType, topic, page, limit } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(articles.status, status), eq(languages.code, language)];

  if (contentType) {
    conditions.push(eq(articles.contentType, contentType));
  }

  if (topic) {
    conditions.push(eq(articles.topic, topic));
  }

  const whereClause = and(...conditions);

  // Get total count for pagination
  const [countResult] = await db
    .select({ total: count() })
    .from(articles)
    .innerJoin(translations, eq(translations.articleId, articles.id))
    .innerJoin(languages, eq(translations.languageId, languages.id))
    .where(whereClause);

  const total = countResult?.total ?? 0;

  // Get paginated results
  const rows = await db
    .select({
      id: articles.id,
      contentType: articles.contentType,
      topic: articles.topic,
      status: articles.status,
      title: translations.title,
      summary: translations.summary,
      languageCode: languages.code,
      languageName: languages.name,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .innerJoin(translations, eq(translations.articleId, articles.id))
    .innerJoin(languages, eq(translations.languageId, languages.id))
    .where(whereClause)
    .orderBy(articles.createdAt)
    .limit(limit)
    .offset(offset);

  return {
    code: 200,
    message: "Articles retrieved successfully",
    data: rows,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      correlationId,
    },
  };
};

export const getArticleById = async (id: string, language: string, correlationId: string) => {
  // Try the requested language first
  const [row] = await db
    .select({
      id: articles.id,
      contentType: articles.contentType,
      topic: articles.topic,
      status: articles.status,
      title: translations.title,
      summary: translations.summary,
      body: translations.body,
      translationId: translations.id,
      languageCode: languages.code,
      languageName: languages.name,
      authorName: authors.name,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .innerJoin(translations, eq(translations.articleId, articles.id))
    .innerJoin(languages, eq(translations.languageId, languages.id))
    .innerJoin(authors, eq(articles.authorId, authors.id))
    .where(and(eq(articles.id, id), eq(articles.status, "published"), eq(languages.code, language)))
    .limit(1);

  if (row) {
    return {
      code: 200,
      message: "Article retrieved successfully",
      data: row,
      meta: { correlationId },
    };
  }

  // Fallback to English if a different language was requested
  if (language !== "en") {
    const [fallbackRow] = await db
      .select({
        id: articles.id,
        contentType: articles.contentType,
        topic: articles.topic,
        status: articles.status,
        title: translations.title,
        summary: translations.summary,
        body: translations.body,
        translationId: translations.id,
        languageCode: languages.code,
        languageName: languages.name,
        authorName: authors.name,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .innerJoin(translations, eq(translations.articleId, articles.id))
      .innerJoin(languages, eq(translations.languageId, languages.id))
      .innerJoin(authors, eq(articles.authorId, authors.id))
      .where(and(eq(articles.id, id), eq(articles.status, "published"), eq(languages.code, "en")))
      .limit(1);

    if (fallbackRow) {
      return {
        code: 200,
        message: "Article retrieved successfully (English fallback)",
        data: fallbackRow,
        meta: { correlationId },
      };
    }
  }

  throw new NotFoundError("Article not found");
};

export const askArticleQuestion = async (
  id: string,
  language: string,
  question: string,
  correlationId: string,
) => {
  const articleResponse = await getArticleById(id, language, correlationId);
  const translationId = articleResponse.data.translationId;

  const result = await sendMessage({
    question,
    correlationId,
    translationId,
  });

  return {
    code: 200,
    message: "Question answered successfully",
    data: result,
    meta: { correlationId },
  };
};

export const updateArticleStatus = async (id: string, correlationId: string) => {
  const [result] = await db
    .update(articles)
    .set({
      status: "published",
    })
    .where(eq(articles.id, id))
    .returning();

  // Make this into another bg job later

  const [translation] = await db
    .select({ id: translations.id })
    .from(translations)
    .where(eq(translations.articleId, id));

  await addTranslationToQueue(translation!.id, correlationId);

  return {
    code: 200,
    message: "Article updated successfully",
    data: result,
    meta: { correlationId },
  };
};
