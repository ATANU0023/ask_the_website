import { z } from "zod";

export const ingestUrlSchema = z.object({
  url: z.string().url().max(2048),
});

export const uploadFileSchema = z.object({
  workspaceId: z.string().uuid(),
});

export type IngestUrlInput = z.infer<typeof ingestUrlSchema>;
export type UploadFileInput = z.infer<typeof uploadFileSchema>;
