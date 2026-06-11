import crypto from "node:crypto";
import { db } from "@/lib/db";
import { documents, documentChunks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { chunkDocument } from "@/services/chunking";
import { embeddingsProvider } from "@/services/embeddings";
import { vectorStore } from "@/services/vector-store";

interface PDFMeta {
  title?: string;
  author?: string;
  pageCount?: number;
}

export async function extractText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}

export async function extractMetadata(buffer: Buffer): Promise<PDFMeta> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const info = await parser.getInfo();
  return {
    title: info.info?.Title || undefined,
    author: info.info?.Author || undefined,
    pageCount: info.total,
  };
}

export async function ingestPDF(
  fileBuffer: Buffer,
  filename: string,
  workspaceId: string,
  userId: string,
  fileKey?: string
): Promise<{ documentId: string; chunks: number }> {
  const text = await extractText(fileBuffer);
  const meta = await extractMetadata(fileBuffer);

  const { chunks, metadata: chunkMeta } = chunkDocument(text, "recursive");

  const [doc] = await db
    .insert(documents)
    .values({
      workspaceId,
      userId,
      title: meta.title || filename.replace(/\.pdf$/i, ""),
      sourceType: "pdf",
      fileKey: fileKey || filename,
      fileSize: fileBuffer.length,
      fileType: "application/pdf",
      pageCount: meta.pageCount ?? null,
      author: meta.author,
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
      sourceType: "pdf",
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
