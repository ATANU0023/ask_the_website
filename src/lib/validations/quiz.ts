import { z } from "zod";

export const generateQuizSchema = z.object({
  documentIds: z.array(z.string()).default([]),
  questionTypes: z
    .array(z.enum(["multiple_choice", "true_false", "short_answer"]))
    .optional(),
  count: z.number().min(1).max(30).default(10),
});

export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;
