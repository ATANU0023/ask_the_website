import { z } from "zod";

export const generateReportSchema = z.object({
  documentIds: z.array(z.string()).default([]),
  title: z.string().max(200).optional(),
  sections: z.array(z.string()).optional(),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
