import { articles, languages, translations } from "../../db/models/koko.js";
import { RawHealthRow, NormalizedHealthRow } from "../../types/ingestion.js";
import { normalizeHealthRow } from "./normalize.js";
import { deduplicate } from "./deduplicate.js";
import { resolveAuthor } from "./authors.js";
import { eq, and } from "drizzle-orm";
import logger from "../../configs/logger.config.js";
import db from "../../db/db.js";

export type IngestionResult = {
  sourceIdToArticleId: Map<number, string>;
  inserted: number;
  updated: number;
  duplicates: number;
};

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function getEnglishLanguage(tx: Transaction) {
  const [existing] = await tx
    .select()
    .from(languages)
    .where(eq(languages.code, "en"))
    .limit(1);

  if (existing) return existing;

  const [language] = await tx
    .insert(languages)
    .values({
      code: "en",
      name: "English",
    })
    .returning();

  return language;
}

async function findExistingArticle(
  tx: Transaction,
  row: NormalizedHealthRow,
  englishLanguageId: string,
) {
  const [existing] = await tx
    .select({
      article: articles,
      translation: translations,
    })
    .from(translations)
    .innerJoin(articles, eq(translations.articleId, articles.id))
    .where(
      and(
        eq(translations.languageId, englishLanguageId),
        eq(translations.title, row.title),
      ),
    )
    .limit(1);

  return existing ?? null;
}

async function upsertArticle(
  tx: Transaction,
  row: NormalizedHealthRow,
  englishLanguageId: string,
) {
  const author = await resolveAuthor(tx, row.author);

  const existing = await findExistingArticle(
    tx,
    row,
    englishLanguageId,
  );

  if (existing) {
    const [article] = await tx
      .update(articles)
      .set({
        contentType: row.contentType,
        topic: row.topic,
        authorId: author!.id,
        status: row.status,
        updatedAt: row.lastUpdated ?? new Date(),
      })
      .where(eq(articles.id, existing.article.id))
      .returning();

    await tx
      .update(translations)
      .set({
        title: row.title,
        summary: row.summary,
        body: row.body,
        updatedAt: row.lastUpdated ?? new Date(),
      })
      .where(eq(translations.id, existing.translation.id));

    return {
      article,
      created: false,
    };
  }

  const [article] = await tx
    .insert(articles)
    .values({
      contentType: row.contentType,
      topic: row.topic,
      authorId: author!.id,
      status: row.status,
      createdAt: row.lastUpdated ?? new Date(),
      updatedAt: row.lastUpdated ?? new Date(),
    })
    .returning();

  await tx.insert(translations).values({
    articleId: article!.id,
    languageId: englishLanguageId,
    title: row.title,
    summary: row.summary,
    body: row.body,
    createdAt: row.lastUpdated ?? new Date(),
    updatedAt: row.lastUpdated ?? new Date(),
  });

  return {
    article,
    created: true,
  };
}

export async function ingestEnglish(
  tx: Transaction,
  rawRows: RawHealthRow[],
): Promise<IngestionResult> {
  const normalized = rawRows.map(normalizeHealthRow);

  const { unique, duplicateGroups } = deduplicate(normalized);

  logger.info(`Read ${rawRows.length} English rows`);
  logger.info(`Normalized ${normalized.length} rows`);
  logger.info(`Canonical rows: ${unique.length}`);
  logger.info(`Duplicates: ${duplicateGroups.length}`);

  for (const group of duplicateGroups) {
    logger.warn(
      `Duplicate: ${group.canonical.sourceId} <- ${group.duplicates
        .map((row) => row.sourceId)
        .join(", ")}`,
    );
  }

  const english = await getEnglishLanguage(tx);
  const sourceIdToArticleId = new Map<number, string>();

  let inserted = 0;
  let updated = 0;

  for (const row of unique) {
    const result = await upsertArticle(
      tx,
      row,
      english!.id,
    );

    if (result.created) {
      inserted++;
    } else {
      updated++;
    }

    sourceIdToArticleId.set(
      row.sourceId,
      result.article!.id,
    );

    // Also point duplicate source IDs to the canonical article.
    const group = duplicateGroups.find(
      (group) =>
        group.canonical.sourceId === row.sourceId,
    );

    for (const duplicate of group?.duplicates ?? []) {
      sourceIdToArticleId.set(
        duplicate.sourceId,
        result.article!.id,
      );
    }
  }

  return {
    sourceIdToArticleId,
    inserted,
    updated,
    duplicates: duplicateGroups.length,
  };
}