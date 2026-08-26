import { generateEmbeddingCached } from "./embedding.services.js";
import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { chunks } from "../db/models/koko.js";
import logger from "../configs/logger.config.js";
import db from "../db/db.js";

export interface SearchResult {
  chunkId: string;
  translationId: string;
  content: string;
  chunkIndex: number;
  similarityScore: number; // Cosine similarity (-1 to 1, higher = more similar)
  tokenCount?: number;
}

export const semanticSearch = async (options: {
  query: string;
  correlationId?: string
  translationId?: string | undefined;
  topK?: number;
  minScore?: number;
}): Promise<SearchResult[]> => {
  const { query, correlationId, translationId, topK = 5, minScore = 0.4 } = options;

  const startTime = Date.now();

  const queryEmbedding = await generateEmbeddingCached(query);
  const similarityScore = sql<number>`1 - (${cosineDistance(chunks.embedding, queryEmbedding)})`;

  const whereCondition = translationId
    ? and(gt(similarityScore, minScore), eq(chunks.translationId, translationId))
    : gt(similarityScore, minScore);

  const similarChunks = await db
    .select({
      chunkId: chunks.id,
      translationId: chunks.translationId,
      content: chunks.content,
      chunkIndex: chunks.chunkIndex,
      similarityScore,
    })
    .from(chunks)
    .where(whereCondition)
    .orderBy((t) => desc(t.similarityScore))
    .limit(topK);

  const duration = Date.now() - startTime;

  logger.info("Semantic search completed", {
    query: query.substring(0, 100),
    topScore: similarChunks[0]?.similarityScore?.toFixed(4),
    durationMs: duration,
    correlationId,
  });

  return similarChunks;
};
