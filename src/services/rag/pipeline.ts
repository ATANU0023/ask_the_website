import { llm } from "@/services/llm";
import { embeddingsProvider } from "@/services/embeddings";
import { hybridSearch } from "@/services/retrieval";
import { rerank } from "@/services/reranking";
import {
  buildContextWithCitations,
  type Citation,
} from "@/services/citations";
import { RAG_SYSTEM_PROMPT } from "@/services/llm/prompts";
import { QUERY_REWRITER_PROMPT } from "@/services/llm/prompts";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

interface RAGResult {
  answer: string;
  citations: Citation[];
}

export async function runRAG(
  workspaceId: string,
  question: string,
  chatHistory?: { role: "user" | "assistant"; content: string }[],
  provider?: "gemini" | "groq"
): Promise<RAGResult> {
  const rewrittenQuery = await rewriteQuery(question, chatHistory, provider);

  const queryEmbedding = await embeddingsProvider.generate(rewrittenQuery);

  const retrievedChunks = await hybridSearch(
    workspaceId,
    rewrittenQuery,
    queryEmbedding
  );

  const chunkItems = retrievedChunks.map((c) => ({
    id: c.id,
    content: c.content,
    metadata: c.metadata as unknown as Record<string, unknown>,
    score: c.score,
  }));

  const topChunks = await rerank(rewrittenQuery, chunkItems, 10);

  const docIds = Array.from(
    new Set(topChunks.map((c) => (c.metadata as any).documentId as string))
  );

  const docs = docIds.length > 0
    ? await db
        .select({ id: documents.id, title: documents.title, sourceType: documents.sourceType })
        .from(documents)
        .where(inArray(documents.id, docIds))
    : [];

  const docMap = new Map(docs.map((d) => [d.id, d]));

  const chunksWithCitations = topChunks.map((c) => {
    const meta = c.metadata as any;
    const doc = docMap.get(meta.documentId);
    return {
      content: c.content,
      citationIndex: 0,
      metadata: {
        documentId: meta.documentId,
        documentTitle: doc?.title ?? "Unknown",
        sourceType: doc?.sourceType ?? meta.sourceType ?? "unknown",
        pageNumber: meta.pageNumber,
        section: meta.section,
      },
    };
  });

  const { context, citations } = buildContextWithCitations(chunksWithCitations);

  const chatHistoryText = chatHistory
    ? chatHistory
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n")
    : "";

  const prompt = chatHistoryText
    ? `Chat history:\n${chatHistoryText}\n\nContext:\n${context}\n\nQuestion: ${rewrittenQuery}`
    : `Context:\n${context}\n\nQuestion: ${rewrittenQuery}`;

  const answer = await llm.generate(prompt, RAG_SYSTEM_PROMPT, provider);

  return { answer, citations };
}

export async function runRAGStream(
  workspaceId: string,
  question: string,
  chatHistory?: { role: "user" | "assistant"; content: string }[],
  provider?: "gemini" | "groq"
): Promise<{ stream: ReadableStream<string>; citations: Citation[] }> {
  const rewrittenQuery = await rewriteQuery(question, chatHistory, provider);

  const queryEmbedding = await embeddingsProvider.generate(rewrittenQuery);

  const retrievedChunks = await hybridSearch(
    workspaceId,
    rewrittenQuery,
    queryEmbedding
  );

  const chunkItems = retrievedChunks.map((c) => ({
    id: c.id,
    content: c.content,
    metadata: c.metadata as unknown as Record<string, unknown>,
    score: c.score,
  }));

  const topChunks = await rerank(rewrittenQuery, chunkItems, 10);

  const docIds = Array.from(
    new Set(topChunks.map((c) => (c.metadata as any).documentId as string))
  );

  const docs = docIds.length > 0
    ? await db
        .select({ id: documents.id, title: documents.title, sourceType: documents.sourceType })
        .from(documents)
        .where(inArray(documents.id, docIds))
    : [];

  const docMap = new Map(docs.map((d) => [d.id, d]));

  const chunksWithCitations = topChunks.map((c) => {
    const meta = c.metadata as any;
    const doc = docMap.get(meta.documentId);
    return {
      content: c.content,
      citationIndex: 0,
      metadata: {
        documentId: meta.documentId,
        documentTitle: doc?.title ?? "Unknown",
        sourceType: doc?.sourceType ?? meta.sourceType ?? "unknown",
        pageNumber: meta.pageNumber,
        section: meta.section,
      },
    };
  });

  const { context, citations } = buildContextWithCitations(chunksWithCitations);

  const chatHistoryText = chatHistory
    ? chatHistory
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n")
    : "";

  const prompt = chatHistoryText
    ? `Chat history:\n${chatHistoryText}\n\nContext:\n${context}\n\nQuestion: ${rewrittenQuery}`
    : `Context:\n${context}\n\nQuestion: ${rewrittenQuery}`;

  const stream = await llm.generateStream(prompt, RAG_SYSTEM_PROMPT, provider);

  return { stream, citations };
}

async function rewriteQuery(
  question: string,
  chatHistory?: { role: "user" | "assistant"; content: string }[],
  provider?: "gemini" | "groq"
): Promise<string> {
  if (!chatHistory || chatHistory.length === 0) return question;

  const historyText = chatHistory
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const prompt = `Chat history:\n${historyText}\n\nLatest question: ${question}\n\nRewritten query:`;

  try {
    const rewritten = await llm.generate(prompt, QUERY_REWRITER_PROMPT, provider);
    return rewritten.trim() || question;
  } catch {
    return question;
  }
}
