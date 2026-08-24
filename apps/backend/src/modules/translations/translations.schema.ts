import * as z from "zod";

export const editTranslationSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid translation ID"),
  }),
  body: z.object({
    title: z.string().min(1, "Title cannot be empty").optional(),
    summary: z.string().optional(),
    body: z.string().min(1, "Body cannot be empty").optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),
});
