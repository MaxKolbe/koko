import { createFetchClient } from "@zayne-labs/callapi";
import logger from "../../configs/logger.config.js";

export const callOpenAIApi = createFetchClient({
  baseURL: process.env.OPENAI_BASE_URL!,
  retryAttempts: 1,
  throwOnError: true,
  timeout: 35000, // 35 secs
  dedupeStrategy: "cancel",
  // credentials: "same-origin",
  auth: process.env.OPENAI_API_KEY!,
  onRequest: () => {
    const startTime = Date.now();

    logger.info("Request to OpenAI has been made", {
      startTime,
    });
  },
  onResponse: (ctx: any) => {
    const responseTime = Date.now();

    logger.info("Response from OpenAI has been received", {
      responseTime,
    });
  },
  onError: (ctx: any) => {
    const responseTime = Date.now();

    logger.error("OpenAI Api returned an error", {
      date: new Date(Date.now()),
      responseTime,
      context: ctx.data,
    });
  },
  onSuccess: () => {
    logger.info("Request to OpenAI was successfully", {
      date: Date.now(),
    });
  },
  onRetry: (ctx: any) => {
    logger.info("Request failed. Retrying...", { date: Date.now(), context: ctx.data });
  },
});
