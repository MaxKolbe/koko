import { cacheGet, cacheSet, CACHE_TTL } from "../lib/cache.js";
import { callOpenAIApi } from "../lib/https/openai.client.js";
import { EmbeddingResponse } from "../types/embedding.js";
import { appEvents } from "../lib/events.js";
import logger from "../configs/logger.config.js";
import db from "../db/db.js";
import crypto from "crypto";
import { chunks } from "../db/models/koko.js";
import { eq } from "drizzle-orm";

const EMBEDDING_MODEL = "text-embedding-3-small";

const contentHash = (text: string): string => {
  return crypto.createHash("sha256").update(text).digest("hex");
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const startTime = Date.now();

  const { data } = await callOpenAIApi<EmbeddingResponse>("/embeddings", {
    method: "POST",
    body: {
      input: text,
      model: EMBEDDING_MODEL,
    },
    resultMode: "all",
    throwOnError: true,
  });

  const embedding = data?.data[0]!.embedding;
  const duration = Date.now() - startTime;

  logger.info("Embedding generated", {
    model: EMBEDDING_MODEL,
    durationMs: duration,
    tokensUsed: data.usage?.total_tokens,
  });

  appEvents.emit("ai:embedding-generated", {
    model: EMBEDDING_MODEL,
    durationMs: duration,
    tokensUsed: data.usage?.total_tokens,
  });

  return embedding;
};

export const generateEmbeddingCached = async (text: string): Promise<number[]> => {
  const hash = contentHash(text);
  const cacheKey = `koko:embed:${hash}`;

  // Check cache
  const cached = await cacheGet<number[]>(cacheKey);
  if (cached) {
    logger.debug("Embedding cache hit", { hash: hash.substring(0, 12) });
    return cached;
  }
  // Cache miss — generate
  const embedding = await generateEmbedding(text);

  // Cache for 7 days (embeddings don't change for the same input)
  await cacheSet(cacheKey, embedding, CACHE_TTL.EMBEDDING);

  logger.debug("Embedding cached", { hash: hash.substring(0, 12) });
  return embedding;
};

export const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
  if (texts.length === 0) return [];

  // OpenAI supports up to 2048 inputs per request
  const BATCH_SIZE = 100; // Stay well under the limit
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const { data } = await callOpenAIApi<EmbeddingResponse>("/embeddings", {
      method: "POST",
      body: {
        input: batch,
        model: EMBEDDING_MODEL,
      },
      resultMode: "all",
      throwOnError: true,
    });

    // Sort by index to maintain order
    const sorted = data.data.sort((a: any, b: any) => a.index - b.index);

    for (const item of sorted) {
      allEmbeddings.push(item.embedding);
    }

    logger.info("Embedding batch processed", {
      batchIndex: Math.floor(i / BATCH_SIZE),
      batchSize: batch.length,
      totalTexts: texts.length,
      tokensUsed: data.usage?.total_tokens,
    });

    appEvents.emit("ai:embedding-generated", {
      model: EMBEDDING_MODEL,
      tokensUsed: data.usage?.total_tokens,
    });
  }

  logger.debug("Embeddings were created successfully (cacheset)");

  return allEmbeddings;
};

export const generateEmbeddingsBatchCached = async (texts: string[]): Promise<number[][]> => {
  const results: (number[] | null)[] = new Array(texts.length).fill(null);
  const uncached: { index: number; text: string }[] = [];

  // Check cache for each text
  for (let i = 0; i < texts.length; i++) {
    const hash = contentHash(texts[i]!);
    const cached = await cacheGet<number[]>(`embed:${hash}`);
    if (cached) {
      results[i] = cached;
    } else {
      uncached.push({ index: i, text: texts[i]! });
    }
  }

  logger.info("Embedding batch cache check", {
    total: texts.length,
    cacheHits: texts.length - uncached.length,
    cacheMisses: uncached.length,
  });

  // 2. Generate embeddings only for uncached texts
  if (uncached.length > 0) {
    const newEmbeddings = await generateEmbeddings(uncached.map((u) => u.text));

    // 3. Cache the new embeddings and fill in results
    for (let i = 0; i < uncached.length; i++) {
      const hash = contentHash(uncached[i]!.text);
      await cacheSet(`embed:${hash}`, newEmbeddings[i], CACHE_TTL.EMBEDDING);
      results[uncached[i]!.index] = newEmbeddings[i]!;
    }
  }

  logger.debug("Embeddings were created successfully");
  return results as number[][];
};

export const storeChunkEmbedding = async (chunkId: string, embedding: number[]): Promise<void> => {
  await db
    .update(chunks)
    .set({
      embedding,
    })
    .where(eq(chunks.id, chunkId));
};

export const storeChunkEmbeddingsBatch = async (
  articleChunks: { id: string; embedding: number[] }[],
): Promise<void> => {
  // Use a transaction for atomicity
  await db.transaction(async (tx) => {
    await Promise.all(
      articleChunks.map((articleChunk) =>
        tx.update(chunks)
          .set({
            embedding: articleChunk.embedding,
          })
          .where(eq(chunks.id, articleChunk.id))
      ),
    );
  });
};
