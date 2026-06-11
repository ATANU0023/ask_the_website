import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  workspaceId: z.string().uuid().optional(),
  type: z
    .enum(["documents", "chunks", "chats", "all"])
    .optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
