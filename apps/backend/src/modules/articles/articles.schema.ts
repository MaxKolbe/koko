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

export const createArticleSchema = z.object({
  body: z.object({
    contentType: z.enum(["article", "faq", "tip"]).optional(),
    topic: z.string().min(1, "Topic is required"),
    authorId: z.uuid("Invalid author ID"),
    status: z.enum(["draft", "published"]).optional(),
  }),
});

export const createTranslationSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid article ID"),
  }),
  body: z.object({
    languageCode: z.string().min(2, "Language code is required"),
    title: z.string().min(1, "Title is required"),
    summary: z.string().optional(),
    body: z.string().min(1, "Body is required"),
  }),
});

export const editArticleSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid article ID"),
  }),
  body: z.object({
    contentType: z.enum(["article", "faq", "tip"]).optional(),
    topic: z.string().min(1, "Topic cannot be empty").optional(),
    authorId: z.string().uuid("Invalid author ID").optional(),
    status: z.enum(["draft", "published"]).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),
});