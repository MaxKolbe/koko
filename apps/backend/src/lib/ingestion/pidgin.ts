import { languages, translations } from "../../db/models/koko.js";
import { RawPidginRow } from "../../types/ingestion.js";
import { normalizePidginRow } from "./normalize.js";
import { eq, and } from "drizzle-orm";
import logger from "../../configs/logger.config.js";
import db from "../../db/db.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const getPidginLanguage = async (tx: Transaction) => {
  const [existing] = await tx.select().from(languages).where(eq(languages.code, "pcm")).limit(1);

  if (existing) return existing;

  const [language] = await tx
    .insert(languages)
    .values({
      code: "pcm",
      name: "Nigerian Pidgin",
    })
    .returning();

  return language;
}

export const ingestPidgin = async(
  tx: Transaction,
  rawRows: RawPidginRow[],
  sourceIdToArticleId: Map<number, string>,
) => {
  const language = await getPidginLanguage(tx);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const raw of rawRows) {
    const row = normalizePidginRow(raw);
    const articleId = sourceIdToArticleId.get(row.sourceArticleId);

    if (!articleId) {
      logger.warn(
        `Skipping Pidgin translation: source article ${row.sourceArticleId} was not imported`,
      );
      skipped++;
      continue;
    }

    const [existing] = await tx
      .select()
      .from(translations)
      .where(and(eq(translations.articleId, articleId), eq(translations.languageId, language!.id)))
      .limit(1);

    if (existing) {
      await tx
        .update(translations)
        .set({
          title: row.title,
          body: row.body,
          updatedAt: new Date(),
        })
        .where(eq(translations.id, existing.id));

      updated++;
      continue;
    }

    await tx.insert(translations).values({
      articleId,
      languageId: language!.id,
      title: row.title,
      body: row.body,
    });

    inserted++;
  }

  return {
    inserted,
    updated,
    skipped,
  };
}
