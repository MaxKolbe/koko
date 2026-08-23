import * as p from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { index, unique } from "drizzle-orm/pg-core";

export const contentTypeEnum = p.pgEnum("content_type", ["article", "faq", "tip"]);

export const contentStatusEnum = p.pgEnum("content_status", ["draft", "published"]);

export const authors = p.pgTable("authors", {
  id: p
    .uuid()
    .primaryKey()
    .default(sql`uuid_generate_v4()`)
    .notNull(),
  name: p.text().notNull(),
  createdAt: p
    .timestamp("created_at", {
      withTimezone: true,
    })
    .defaultNow()
    .notNull(),
  updatedAt: p
    .timestamp("updated_at", {
      withTimezone: true,
    })
    .defaultNow()
    .notNull(),
});

export const languages = p.pgTable("languages", {
  id: p
    .uuid()
    .primaryKey()
    .default(sql`uuid_generate_v4()`)
    .notNull(),
  code: p.text().unique().notNull(),
  name: p.text().notNull(),
  createdAt: p
    .timestamp("created_at", {
      withTimezone: true,
    })
    .defaultNow()
    .notNull(),
  updatedAt: p
    .timestamp("updated_at", {
      withTimezone: true,
    })
    .defaultNow()
    .notNull(),
});

export const articles = p.pgTable(
  "articles",
  {
    id: p
      .uuid()
      .primaryKey()
      .default(sql`uuid_generate_v4()`)
      .notNull(),
    contentType: contentTypeEnum("content_type").notNull().default("article"), // article/faq/tip
    topic: p.text().notNull(),
    authorId: p
      .uuid("author_id")
      .notNull()
      .references(() => authors.id),
    status: contentStatusEnum().notNull().default("draft"), // draft/published
    createdAt: p
      .timestamp("created_at", {
        withTimezone: true,
      })
      .defaultNow()
      .notNull(),
    updatedAt: p
      .timestamp("updated_at", {
        withTimezone: true,
      })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("articles_topic_idx").on(table.topic),
    index("articles_status_idx").on(table.status),
  ],
);

export const translations = p.pgTable(
  "translations",
  {
    id: p
      .uuid()
      .primaryKey()
      .default(sql`uuid_generate_v4()`)
      .notNull(),
    articleId: p
      .uuid("article_id")
      .notNull()
      .references(() => articles.id, {
        onDelete: "cascade",
      }),
    languageId: p
      .uuid("language_id")
      .notNull()
      .references(() => languages.id),
    title: p.text().notNull(),
    summary: p.text(),
    body: p.text().notNull(),
    createdAt: p
      .timestamp("created_at", {
        withTimezone: true,
      })
      .defaultNow()
      .notNull(),
    updatedAt: p
      .timestamp("updated_at", {
        withTimezone: true,
      })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("article_language_unique").on(table.articleId, table.languageId),
    index("translations_article_idx").on(table.articleId),
    index("translations_language_idx").on(table.languageId),
  ],
);

export const chunks = p.pgTable(
  "chunk",
  {
    id: p
          .uuid()
          .primaryKey()
          .default(sql`uuid_generate_v4()`)
          .notNull(),
    translationId: p.uuid("translation_id")
      .notNull()
      .references(() => translations.id, {
        onDelete: "cascade",
      }),
    content: p.text().notNull(),
    chunkIndex: p.integer("chunk_index").notNull(),
    embedding: p.vector("embedding", {
      dimensions: 1536,
    }),
    createdAt: p.timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('embeddingIndex').using('hnsw', table.embedding.op('vector_cosine_ops')),
    unique("translation_chunk_index_unique").on(table.translationId, table.chunkIndex),
    index("chunks_translation_idx").on(table.translationId),
  ],
);

 