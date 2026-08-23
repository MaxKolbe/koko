import { authors, articles, chunks, translations, languages } from "./models/koko.js";
import logger from "../configs/logger.config.js";
import db from "./db.js";

// CLEAR TABLES
const clearTables = async () => {
  try {
    logger.info("Clearing tables...");
    await db.delete(authors);
    await db.delete(articles);
    await db.delete(chunks);
    await db.delete(translations);
    await db.delete(languages);
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

clearTables();
installExtensions();
