import db from "../db/db.js";
import { addTranslationToQueue } from "../queues/ingestion.queue.js";
import { translations } from "../db/models/koko.js";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../lib/error.js";

export const editTranslation = async (
  id: string,
  data: { title?: string; summary?: string; body?: string },
  correlationId: string
) => {
  const [updatedTranslation] = await db
    .update(translations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(translations.id, id))
    .returning();

  if (!updatedTranslation) {
    throw new NotFoundError("Translation not found");
  }
  
  // Re-enqueue the translation for vector ingestion if content might have changed
  await addTranslationToQueue(updatedTranslation.id, correlationId);

  return {
    code: 200,
    message: "Translation updated successfully",
    data: updatedTranslation,
    meta: { correlationId },
  };
};
