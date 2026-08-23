import { callOpenAIApi } from "../lib/https/openai.client.js";
import logger from "../configs/logger.config.js";
import { SearchResult } from "./search.services.js";
import { RAG_SYSTEM_PROMPT } from "../lib/systemprompt.js";
import { ChatCompletionResult } from "../types/chatcompletion.js";

interface AssembledContext {
  chunks: SearchResult[];
  contextText: string;
//   translationId: string;
}

interface RAGResponse {
  answer: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
//   translationId: string;
}

const CHAT_MODEL = "gpt-4o";

export const generateRAGResponse = async (options: {
  question: string;
  context: AssembledContext;
  correlationId?: string;
  conversationHistory?: { role: string; content: string }[] | undefined;
}): Promise<RAGResponse> => {
  const { question, context, correlationId, conversationHistory } = options;

  // Build the messages array
  const messages: any[] = [{ role: "system", content: RAG_SYSTEM_PROMPT }];

  // Add the context and question
  if (context.chunks.length > 0) {
    messages.push({
      role: "user",
      content: [
        "Here is the relevant context from organization's published resources:",
        "",
        context.contextText,
        "",
        "---",
        "",
        `My question: ${question}`,
      ].join("\n"),
    });
  } else {
    // No relevant context found
    messages.push({
      role: "user",
      content: [
        "No relevant context was found from the organization's published resources for this question.",
        "",
        `My question: ${question}`,
      ].join("\n"),
    });
  }

  const startTime = Date.now();

  const { data } = await callOpenAIApi<ChatCompletionResult>("/chat/completions", {
    method: "POST",
    body: {
      model: CHAT_MODEL,
      messages,
      temperature: 0.1,
      max_tokens: 1500,
    },
    resultMode: "all",
    throwOnError: true,
  });

  const answer = data.choices[0]!.message.content;
  const usage = data.usage;
  const duration = Date.now() - startTime;
  logger.info("RAG response generated", {
    correlationId,
    model: CHAT_MODEL,
    contextChunks: context.chunks.length,
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    durationMs: duration,
  });

  return {
    answer,
    tokensUsed: {
      prompt: usage.prompt_tokens,
      completion: usage.completion_tokens,
      total: usage.total_tokens,
    },
    model: CHAT_MODEL,
    // translationId: context.translationId
  };
}
