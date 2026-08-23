import * as z from "zod";

export const askHealthQuestionSchema = z.object({
  body: z.object({
    question: z.string().trim().min(1, "Question is required").max(1000),
  }),
});
