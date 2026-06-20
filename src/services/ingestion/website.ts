import crypto from "node:crypto";
import * as cheerio from "cheerio";
import { db } from "@/lib/db";
import { documents, documentChunks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { chunkDocument } from "@/services/chunking";
import { embeddingsProvider } from "@/services/embeddings";
import { vectorStore } from "@/services/vector-store";

export async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; KiwiBot/1.0; +https://kiwi.app)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export function cleanContent(html: string): string {
  const $ = cheerio.load(html);

  $("script, style, nav, footer, header, iframe, noscript, svg, form").remove();

  const mainContent =
    $("main").first().text() ||
    $("article").first().text() ||
    $('[role="main"]').first().text() ||
    $("body").text();

  return mainContent.replace(/\s+/g, " ").trim();
}

export function extractMetadata(
  html: string
): { title: string; description: string; author: string } {
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("title").text() ||
    "";

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content") ||
    "";

  const author =
    $('meta[name="author"]').attr("content") ||
    $('meta[property="article:author"]').attr("content") ||
    "";

  return { title, description, author };
}

export async function ingestWebsite(
  url: string,
  workspaceId: string,
  userId: string
): Promise<{ documentId: string; chunks: number }> {
  const html = await fetchPage(url);
  const content = cleanContent(html);
  const metadata = extractMetadata(html);

  const { chunks, metadata: chunkMeta } = chunkDocument(content, "recursive");

  const [doc] = await db
    .insert(documents)
    .values({
      workspaceId,
      userId,
      title: metadata.title || url,
      description: metadata.description,
      sourceType: "website",
      url,
      author: metadata.author || undefined,
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
      sourceType: "website",
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
