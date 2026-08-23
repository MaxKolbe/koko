import { generateRAGResponse } from "./rag.services.js";
import { semanticSearch } from "./search.services.js";
import logger from "../configs/logger.config.js";

export const sendMessage = async (options: {
  question: string;
  correlationId: string;
  translationId?: string;
  topK?: number;
  minScore?: number;
  conversationHistory?: { role: string; content: string }[];
}) => {
  const { question, correlationId, translationId, topK, minScore, conversationHistory } = options;

  // 1. Retrieve relevant chunks via semantic search
  const chunks = await semanticSearch({
    query: question,
    correlationId,
    translationId,
  });

  // 2. Assemble context text from chunks
  const contextText = chunks
    .map((chunk, i) => `[Source ${i + 1}]\n${chunk.content}`)
    .join("\n\n");

  logger.info("Message context assembled", {
    correlationId,
    chunksFound: chunks.length,
  });

  // 3. Generate the RAG response
  const response = await generateRAGResponse({
    question,
    context: { chunks, contextText },
    correlationId,
    conversationHistory,
  });

  return {
    answer: response.answer,
    sources: chunks,
    tokensUsed: response.tokensUsed,
    model: response.model,
  };
};
