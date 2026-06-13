import { z } from "zod";

export const generateFlashcardsSchema = z.object({
  documentIds: z.array(z.string()).default([]),
  count: z.number().min(1).max(50).default(10),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
