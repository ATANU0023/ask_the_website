import { db } from "@/lib/db";
import { reports, documentChunks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { llm } from "@/services/llm";
import { REPORT_PROMPT } from "@/services/llm/prompts";

interface ReportOptions {
  title?: string;
  sections?: string[];
}

export async function generateReport(
  workspaceId: string,
  userId: string,
  documentIds: string[],
  title?: string,
  sections?: string[]
) {
  const chunks = await db
    .select({
      content: documentChunks.content,
    })
    .from(documentChunks)
    .where(
      and(
        eq(documentChunks.workspaceId, workspaceId),
        ...documentIds.map((id) => eq(documentChunks.documentId, id))
      )
    )
    .limit(200);

  const context = chunks.map((c) => c.content).join("\n\n");
  const truncated = context.length > 50000 ? context.substring(0, 50000) : context;

  let prompt = `Generate a report based on the following content:\n\n${truncated}`;

  if (sections && sections.length > 0) {
    prompt += `\n\nInclude the following sections: ${sections.join(", ")}`;
  }

  const reportTitle = title || "Analysis Report";
  const content = await llm.generate(prompt, REPORT_PROMPT);

  const [report] = await db
    .insert(reports)
    .values({
      workspaceId,
      userId,
      title: reportTitle,
      content,
      documentIds: documentIds,
    })
    .returning();

  return report;
}

export async function listReports(workspaceId: string) {
  return db
    .select()
    .from(reports)
    .where(eq(reports.workspaceId, workspaceId))
    .orderBy(reports.createdAt);
}

export async function getReport(id: string) {
  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, id));
  return report ?? null;
}

export async function deleteReport(id: string) {
  await db.delete(reports).where(eq(reports.id, id));
}
