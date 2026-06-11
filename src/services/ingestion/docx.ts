import crypto from "node:crypto";
import mammoth from "mammoth";
import { db } from "@/lib/db";
import { documents, documentChunks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { chunkDocument } from "@/services/chunking";
import { embeddingsProvider } from "@/services/embeddings";
import { vectorStore } from "@/services/vector-store";

export async function extractText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function ingestDOCX(
  fileBuffer: Buffer,
  filename: string,
  workspaceId: string,
  userId: string,
  fileKey?: string
): Promise<{ documentId: string; chunks: number }> {
  const text = await extractText(fileBuffer);

  const { chunks, metadata: chunkMeta } = chunkDocument(text, "recursive");

  const [doc] = await db
    .insert(documents)
    .values({
      workspaceId,
      userId,
      title: filename.replace(/\.docx$/i, ""),
      sourceType: "docx",
      fileKey: fileKey || filename,
      fileSize: fileBuffer.length,
      fileType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      status: "processing",
      totalChunks: chunks.length,
    })
    .returning();

  const embeddingBatch = await embeddingsProvider.generateBatch(chunks);

  const points = embeddingBatch.map((vector, i) => ({
    id: crypto.randomUUID(),
    vector,
    payload: {
      workspaceId,
      userId,
      documentId: doc.id,
      chunkId: chunkMeta[i]?.index.toString() ?? i.toString(),
      sourceType: "docx",
      pageNumber: chunkMeta[i]?.pageNumber,
      section: chunkMeta[i]?.section,
      content: chunks[i],
      chunkIndex: i,
    },
  }));

  await vectorStore.upsertChunks("workspace_documents", points);

  await db.insert(documentChunks).values(
    chunks.map((content, i) => ({
      documentId: doc.id,
      workspaceId,
      userId,
      chunkIndex: i,
      content,
      pageNumber: chunkMeta[i]?.pageNumber,
      section: chunkMeta[i]?.section,
      tokenCount: Math.ceil(content.length / 4),
    }))
  );

  await db
    .update(documents)
    .set({ status: "processed" })
    .where(eq(documents.id, doc.id));

  return { documentId: doc.id, chunks: chunks.length };
}
