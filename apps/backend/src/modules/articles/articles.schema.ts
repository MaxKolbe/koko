import * as z from "zod";
import { articleListQuerySchema, languageCodeSchema } from "../../db/globalSchema.js";

export const listArticlesSchema = z.object({
  query: articleListQuerySchema,
});

export const getArticleSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid article ID"),
  }),
  query: z.object({
    language: languageCodeSchema.default("en"),
  }),
});

export const askArticleQuestionSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid article ID"),
  }),
  query: z.object({
    language: languageCodeSchema.default("en"),
  }),
  body: z.object({
    question: z.string().trim().min(1, "Question is required").max(1000),
  }),
});


export const updateArticleStatusSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid article ID"),
  })
});