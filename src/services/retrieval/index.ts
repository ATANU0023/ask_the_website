import { db } from "@/lib/db";
import { documentChunks } from "@/lib/db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";
import { vectorStore, type SearchFilter } from "@/services/vector-store";
import { embeddingsProvider } from "@/services/embeddings";

interface RetrievedChunk {
  id: string;
  content: string;
  score: number;
  metadata: {
    documentId: string;
    workspaceId: string;
    chunkIndex: number;
    pageNumber?: number;
    section?: string;
    sourceType: string;
  };
}

export async function vectorSearch(
  workspaceId: string,
  queryEmbedding: number[],
  limit: number = 30
): Promise<RetrievedChunk[]> {
  const filter: SearchFilter = { workspaceId };
  const results = await vectorStore.search(
    "workspace_documents",
    queryEmbedding,
    filter,
    limit
  );

  return results.map((r) => ({
    id: r.payload.chunkId,
    content: r.payload.content,
    score: r.score,
    metadata: {
      documentId: r.payload.documentId,
      workspaceId: r.payload.workspaceId,
      chunkIndex: r.payload.chunkIndex,
      pageNumber: r.payload.pageNumber,
      section: r.payload.section,
      sourceType: r.payload.sourceType,
    },
  }));
}

export async function keywordSearch(
  workspaceId: string,
  query: string,
  limit: number = 30
): Promise<RetrievedChunk[]> {
  const words = query
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length === 0) return [];

  const conditions = words.map((word) =>
    ilike(documentChunks.content, `%${word}%`)
  );

  const results = await db
    .select()
    .from(documentChunks)
    .where(
      and(eq(documentChunks.workspaceId, workspaceId), ...conditions)
    )
    .limit(limit);

  return results.map((chunk) => ({
    id: chunk.id,
    content: chunk.content,
    score: 1,
    metadata: {
      documentId: chunk.documentId,
      workspaceId: chunk.workspaceId,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber ?? undefined,
      section: chunk.section ?? undefined,
      sourceType: "",
    },
  }));
}

function reciprocalRankFusion(
  vectorResults: RetrievedChunk[],
  keywordResults: RetrievedChunk[],
  k: number = 60
): RetrievedChunk[] {
  const scores = new Map<string, { chunk: RetrievedChunk; score: number }>();

  vectorResults.forEach((r, i) => {
    const existing = scores.get(r.id) || {
      chunk: r,
      score: 0,
    };
    existing.score += 1 / (k + i + 1);
    scores.set(r.id, existing);
  });

  keywordResults.forEach((r, i) => {
    const existing = scores.get(r.id) || {
      chunk: r,
      score: 0,
    };
    existing.score += 1 / (k + i + 1);
    scores.set(r.id, existing);
  });

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map((item) => ({ ...item.chunk, score: item.score }));
}

export async function hybridSearch(
  workspaceId: string,
  query: string,
  queryEmbedding: number[]
): Promise<RetrievedChunk[]> {
  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(workspaceId, queryEmbedding),
    keywordSearch(workspaceId, query),
  ]);

  const fused = reciprocalRankFusion(vectorResults, keywordResults);
  return fused.slice(0, 30);
}
