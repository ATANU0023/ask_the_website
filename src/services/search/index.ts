import { db } from "@/lib/db";
import { documents, documentChunks, chatMessages, chatSessions } from "@/lib/db/schema";
import { eq, and, ilike, or, desc } from "drizzle-orm";

interface GlobalSearchResult {
  documents: Array<{
    id: string;
    title: string;
      sourceType: string;
      status: string | null;
      url?: string;
    score: number;
  }>;
  chunks: Array<{
    id: string;
    content: string;
    documentId: string;
    chunkIndex: number;
    score: number;
  }>;
  messages: Array<{
    id: string;
    content: string;
    role: string;
    sessionId: string;
    score: number;
  }>;
}

export async function globalSearch(
  workspaceId: string,
  query: string,
  type?: "documents" | "chunks" | "messages"
): Promise<GlobalSearchResult> {
  const result: GlobalSearchResult = {
    documents: [],
    chunks: [],
    messages: [],
  };

  const searchTerm = `%${query}%`;

  if (!type || type === "documents") {
    const docs = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.workspaceId, workspaceId),
          or(
            ilike(documents.title, searchTerm),
            ilike(documents.description ?? "", searchTerm)
          )
        )
      )
      .orderBy(desc(documents.createdAt))
      .limit(20);

    result.documents = docs.map((d) => ({
      id: d.id,
      title: d.title,
      sourceType: d.sourceType,
      status: d.status,
      url: d.url ?? undefined,
      score: 1,
    }));
  }

  if (!type || type === "chunks") {
    const chunks = await db
      .select({
        id: documentChunks.id,
        content: documentChunks.content,
        documentId: documentChunks.documentId,
        chunkIndex: documentChunks.chunkIndex,
      })
      .from(documentChunks)
      .where(
        and(
          eq(documentChunks.workspaceId, workspaceId),
          ilike(documentChunks.content, searchTerm)
        )
      )
      .limit(20);

    result.chunks = chunks.map((c) => ({
      ...c,
      score: 1,
    }));
  }

  if (!type || type === "messages") {
    const sessions = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.workspaceId, workspaceId),
          ilike(chatSessions.title ?? "", searchTerm)
        )
      );

    const sessionIds = sessions.map((s) => s.id);

    if (sessionIds.length > 0) {
      const messages = await db
        .select({
          id: chatMessages.id,
          content: chatMessages.content,
          role: chatMessages.role,
          sessionId: chatMessages.sessionId,
        })
        .from(chatMessages)
        .where(
          or(
            ilike(chatMessages.content, searchTerm),
            ...sessionIds.map((sid) => eq(chatMessages.sessionId, sid))
          )
        )
        .limit(20);

      result.messages = messages.map((m) => ({
        ...m,
        score: 1,
      }));
    } else {
      const messages = await db
        .select({
          id: chatMessages.id,
          content: chatMessages.content,
          role: chatMessages.role,
          sessionId: chatMessages.sessionId,
        })
        .from(chatMessages)
        .where(ilike(chatMessages.content, searchTerm))
        .limit(20);

      result.messages = messages.map((m) => ({
        ...m,
        score: 1,
      }));
    }
  }

  return result;
}
