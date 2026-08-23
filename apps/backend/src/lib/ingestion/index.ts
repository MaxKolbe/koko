import fs from "node:fs/promises";
import db from "../../db/db.js";
import path from "node:path";
import { RawHealthRow, RawPidginRow } from "../../types/ingestion.js";
import { ingestEnglish } from "./ingestion.js";
import { ingestPidgin } from "./pidgin.js";
import { parse } from "csv-parse/sync";
import logger from "../../configs/logger.config.js";


 const readCsv = async <T>(filePath: string): Promise<T[]> => {
  const content = await fs.readFile(filePath, "utf8");

  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
  }) as T[];
}

const main = async () => {
  const root = path.resolve(import.meta.dirname, "../../../../../");
  logger.debug(`This is the root directory: ${root}`)
  const dataDir = path.join(root, "data")
  logger.debug(`This is the data directory: ${dataDir}`)
  const healthPath = path.join(dataDir, "health-content.csv");
  const pidginPath = path.join(dataDir, "pidgin-translations.csv");

  logger.info("Starting content ingestion...");

  const healthRows = await readCsv<RawHealthRow>(healthPath);
  const pidginRows = await readCsv<RawPidginRow>(pidginPath);

  await db.transaction(async (tx) => {
    const englishResult = await ingestEnglish(tx, healthRows);

    logger.info(
      `English: ${englishResult.inserted} inserted, ` +
        `${englishResult.updated} updated, ` +
        `${englishResult.duplicates} duplicates`,
    );

    const pidginResult = await ingestPidgin(tx, pidginRows, englishResult.sourceIdToArticleId);

    logger.info(
      `Pidgin: ${pidginResult.inserted} inserted, ` +
        `${pidginResult.updated} updated, ` +
        `${pidginResult.skipped} skipped`,
    );
  });

  logger.info("Content ingestion complete.");
}

main().catch((error) => {
  logger.error("Content ingestion failed:");
  logger.error(error);
  process.exit(1);
});
