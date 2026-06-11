import { db } from "@/lib/db";
import { documents, documentChunks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { vectorStore } from "@/services/vector-store";
import { chunkDocument } from "@/services/chunking";
import { embeddingsProvider } from "@/services/embeddings";
import { ingestPDF } from "./pdf";
import { ingestDOCX } from "./docx";
import { ingestPPTX } from "./pptx";
import { ingestWebsite } from "./website";

export async function processDocument(
  documentId: string
): Promise<{ chunks: number }> {
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId));

  if (!doc) throw new Error(`Document ${documentId} not found`);

  if (doc.sourceType === "website" && doc.url) {
    return ingestWebsite(doc.url, doc.workspaceId, doc.userId);
  }

  throw new Error(`Unsupported source type: ${doc.sourceType}`);
}

export async function reprocessDocument(
  documentId: string
): Promise<{ chunks: number }> {
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId));

  if (!doc) throw new Error(`Document ${documentId} not found`);

  await vectorStore.deleteByDocumentId("workspace_documents", documentId);
  await db
    .delete(documentChunks)
    .where(eq(documentChunks.documentId, documentId));

  return processDocument(documentId);
}

export { ingestPDF, ingestDOCX, ingestPPTX, ingestWebsite };
