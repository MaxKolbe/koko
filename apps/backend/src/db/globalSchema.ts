import * as z from "zod";

export const optionalQueryNumber = (defaultValue: number) =>
  z.preprocess((v) => {
    if (v === "" || v === undefined || Number.isNaN(Number(v))) {
      return undefined;
    }

    return v;
  }, z.coerce.number().int().min(1).max(100).default(defaultValue));

export const contentTypeSchema = z.enum([
  "article",
  "faq",
  "tip",
]);

export const contentStatusSchema = z.enum([
  "draft",
  "published",
]);

export const languageCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(10);

export const createLanguageSchema = z.object({
  code: languageCodeSchema,
  name: z.string().trim().min(1).max(100),
});

export const createAuthorSchema = z.object({
  name: z.string().trim().min(1).max(200),
});

export const createArticleSchema = z.object({
  contentType: contentTypeSchema.default("article"),
  topic: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(100),
  authorId: z.uuid(),
  status: contentStatusSchema.default("draft"),
});

export const createTranslationSchema = z.object({
  articleId: z.uuid(),
  languageId: z.uuid(),
  title: z.string().trim().min(1),
  summary: z
    .string()
    .trim()
    .nullable()
    .optional(),
  body: z.string().trim().min(1),
});

export const createChunkSchema = z.object({
  translationId: z.uuid(),
  content: z.string().trim().min(1),
  chunkIndex: z.number().int().nonnegative(),
  embedding: z
    .array(z.number().finite())
    .length(1536)
    .nullable()
    .optional(),
});


// UPDATES
export const updateArticleSchema =
  createArticleSchema.partial();

export const updateTranslationSchema =
  createTranslationSchema
    .omit({
      articleId: true,
      languageId: true,
    })
    .partial();

// PUBLIC API
export const articleListQuerySchema = z.object({
  language: languageCodeSchema
    .default("en"),
  status: contentStatusSchema
    .default("published"),
  topic: z
    .string()
    .trim()
    .toLowerCase()
    .optional(),
  contentType: contentTypeSchema.optional(),
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(50)
    .default(20),
});