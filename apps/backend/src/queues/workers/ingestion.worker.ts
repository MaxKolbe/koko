import { chunkArticle } from "../../utils/chunker.util.js";
import { translations } from "../../db/models/koko.js";
import { NotFoundError } from "../../lib/error.js";
import { chunks } from "../../db/models/koko.js";
import { Worker, Job } from "bullmq";
import { asc, eq } from "drizzle-orm";
import logger from "../../configs/logger.config.js";
import db from "../../db/db.js";
import {
  generateEmbeddingsBatchCached,
  storeChunkEmbeddingsBatch,
} from "../../services/embedding.services.js";

const redis_username = process.env.REDIS_USERNAME! as string;
const redis_password = process.env.REDIS_PASSWORD! as string;
const redis_host = process.env.REDIS_HOST! as string;
const redis_port = Number(process.env.REDIS_PORT!);

const worker = new Worker(
  "ingestion-queue",
  async (job: Job) => {
    const { translationId, correlationId } = job.data;
    const startTime = Date.now();

    logger.info(`translation ingestion started`, {
      translationId,
      correlationId,
    });

    try {
      // Fetch the translation's text
      const [translation] = await db
        .select({
          content: translations.body,
        })
        .from(translations)
        .where(eq(translations.id, translationId));

      if (!translation) {
        throw new NotFoundError("Translation not found");
      }

      await job.updateProgress(10);

      logger.info(`translation content extracted`, {
        translationId,
        correlationId,
      });

      // Chunk the text
      const articleChunks = chunkArticle(translation.content, {});

      await job.updateProgress(30);

      logger.info(`translation chunked`, {
        translationId,
        correlationId,
      });

      // Store chunks in the database
      await db.transaction(async (tx) => {
        // Delete any existing chunks (in case of retry)
        await tx.delete(chunks).where(eq(chunks.translationId, translationId));

        await tx.insert(chunks).values(
          articleChunks.map((articleChunk) => ({
            translationId,
            content: articleChunk.text,
            chunkIndex: articleChunk.index,
          })),
        );

        await job.updateProgress(50);
      });

      //  Generate embeddings (the expensive step)
      const chunkTexts = articleChunks.map((a) => a.text);
      const embeddings = await generateEmbeddingsBatchCached(chunkTexts);
      // const embedding = await generateEmbeddingCached(articleChunks[0]!.text);

      // Store embeddings
      const storedChunks = await db
        .select({ id: chunks.id })
        .from(chunks)
        .orderBy(asc(chunks.chunkIndex))
        .where(eq(chunks.translationId, translationId));

      await storeChunkEmbeddingsBatch(
        storedChunks.map((c, i) => ({
          id: c.id,
          embedding: embeddings[i]!,
        })),
      );

      await job.updateProgress(100);

      const duration = Date.now() - startTime;

      logger.info(`translation ingestion complete`, {
        duration,
        translationId,
        correlationId,
      });

      return {
        success: true,
        durationMs: duration,
      };
    } catch (error: any) {
      logger.error("translation ingestion failed", {
        correlationId,
        translationId,
      });

      throw error; // Re-throw so BullMQ retries
    }
  },
  {
    connection: {
      username: redis_username,
      password: redis_password,
      host: redis_host,
      port: redis_port,
    },
    concurrency: 3,
  },
);

worker.on("completed", (job) => {
  logger.info(`Job completed`, {
    jobId: job.id,
    correlationId: job.data.correlationId,
  });
});

worker.on("failed", async (job, error) => {
  if (!job) {
    return;
  }

  if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
    logger.error(`Job failed permanently`, {
      jobId: job?.id,
      correlationId: job?.data.correlationId,
      error,
    });
  }
});

worker.on("error", (error) => {
  logger.error("Worker error", {
    error,
  });
});

export { worker };
