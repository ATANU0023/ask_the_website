import { z } from "zod";

export const chatMessageSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(10000),
  provider: z.enum(["gemini", "groq"]).optional(),
});

export const createSessionSchema = z.object({
  title: z.string().optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
