import { db } from "@/lib/db";
import { documents, summaries, documentChunks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { llm } from "@/services/llm";
import { SUMMARIZATION_PROMPT } from "@/services/llm/prompts";

export async function generateSummary(
  documentId: string
): Promise<{
  executiveSummary: string;
  keyTakeaways: string[];
  entities: string[];
  topics: string[];
}> {
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId));

  if (!doc) throw new Error(`Document ${documentId} not found`);

  const chunks = await db
    .select({ content: documentChunks.content })
    .from(documentChunks)
    .where(eq(documentChunks.documentId, documentId))
    .orderBy(documentChunks.chunkIndex);

  const fullText = chunks.map((c) => c.content).join("\n\n");
  const truncatedText =
    fullText.length > 50000
      ? fullText.substring(0, 50000)
      : fullText;

  const prompt = `Document title: ${doc.title}\n\nContent:\n${truncatedText}`;

  const response = await llm.generate(prompt, SUMMARIZATION_PROMPT);

  let parsed: {
    executiveSummary: string;
    keyTakeaways: string[];
    entities: string[];
    topics: string[];
  };

  try {
    const cleaned = response
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = {
      executiveSummary: response,
      keyTakeaways: [],
      entities: [],
      topics: [],
    };
  }

  const [existing] = await db
    .select()
    .from(summaries)
    .where(eq(summaries.documentId, documentId));

  if (existing) {
    await db
      .update(summaries)
      .set({
        executiveSummary: parsed.executiveSummary,
        keyTakeaways: parsed.keyTakeaways,
        entities: parsed.entities,
        topics: parsed.topics,
        updatedAt: new Date(),
      })
      .where(eq(summaries.documentId, documentId));
  } else {
    await db.insert(summaries).values({
      documentId,
      executiveSummary: parsed.executiveSummary,
      keyTakeaways: parsed.keyTakeaways,
      entities: parsed.entities,
      topics: parsed.topics,
    });
  }

  return parsed;
}
