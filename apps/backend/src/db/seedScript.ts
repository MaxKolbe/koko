import { authors, articles, chunks, translations, languages } from "./models/koko.js";
import { addTranslationToQueue } from "../queues/ingestion.queue.js";
import { main } from "../lib/ingestion/index.js";
import logger from "../configs/logger.config.js";
import db from "./db.js";
import { eq } from "drizzle-orm";

// CLEAR TABLES
const clearTables = async () => {
  try {
    logger.info("Clearing tables...");
    await db.delete(articles);
    await db.delete(chunks);
    await db.delete(translations);
    await db.delete(languages);
    await db.delete(authors);
    logger.info("Tables cleared :)");
  } catch (error: any) {
    logger.error("Could not delete all tables", {
      message: error.message,
    });
  }
};

// INSTALL EXTENSIONS
const installExtensions = async () => {
  try {
    logger.info("Installing Extensions");
    await db.execute(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await db.execute(`CREATE EXTENSION IF NOT EXISTS "vector"`);
    logger.info("Extensions Installed :)");
  } catch (error: any) {
    logger.error("Could not install extensions", {
      message: error.message,
    });
  }
};

// SLEEP
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// CHUNK EVERYTHING
const chunkInitialData = async () => {
  try {
    // join articles where artcile status = published
    const translationIdsArray = await db
      .select({ id: translations.id })
      .from(translations)
      .innerJoin(articles, eq(articles.id, translations.articleId))
      .where(eq(articles.status, "published"));

    translationIdsArray.forEach(async (translationIdObject) => {
      await addTranslationToQueue(translationIdObject.id, "xxxx-xxxx-xxxx-xxxx");
    });

    logger.info("Added Published Translations to chunking Queue");

  } catch (error: any) {
    logger.error("Could not chunk initial Data", {
      message: error.message,
    });
  }
};

clearTables();
installExtensions();

await sleep(5000);

main();

await sleep(5000);

chunkInitialData();
