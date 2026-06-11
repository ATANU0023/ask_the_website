import { db } from "@/lib/db";
import { flashcards, documentChunks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { llm } from "@/services/llm";
import { FLASHCARD_PROMPT } from "@/services/llm/prompts";

export async function generateFlashcards(
  workspaceId: string,
  userId: string,
  documentIds: string[],
  count: number = 10
): Promise<
  { id: string; question: string; answer: string; source: string }[]
> {
  const chunks = await db
    .select({
      content: documentChunks.content,
      documentId: documentChunks.documentId,
    })
    .from(documentChunks)
    .where(
      and(
        eq(documentChunks.workspaceId, workspaceId),
        ...documentIds.map((id) =>
          eq(documentChunks.documentId, id)
        )
      )
    )
    .limit(100);

  const context = chunks.map((c) => c.content).join("\n\n");
  const truncated = context.length > 30000 ? context.substring(0, 30000) : context;

  const prompt = `Based on the following content, create ${count} flashcards:\n\n${truncated}`;

  const response = await llm.generate(prompt, FLASHCARD_PROMPT);

  let pairs: { question: string; answer: string }[];
  try {
    const cleaned = response
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    pairs = JSON.parse(cleaned);
  } catch {
    pairs = [{ question: "Error parsing response", answer: response }];
  }

  const inserted = await db
    .insert(flashcards)
    .values(
      pairs.map((p) => ({
        workspaceId,
        userId,
        documentId: documentIds[0] || null,
        question: p.question,
        answer: p.answer,
        source: documentIds[0] || null,
      }))
    )
    .returning();

  return inserted.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    source: f.source ?? "",
  }));
}

export async function listFlashcards(workspaceId: string) {
  return db
    .select()
    .from(flashcards)
    .where(eq(flashcards.workspaceId, workspaceId))
    .orderBy(flashcards.createdAt);
}

export async function deleteFlashcard(id: string) {
  await db.delete(flashcards).where(eq(flashcards.id, id));
}
