import { db } from "@/lib/db";
import { chatSessions, chatMessages } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { llm } from "@/services/llm";

export async function createSession(
  workspaceId: string,
  userId: string,
  title?: string
) {
  const [session] = await db
    .insert(chatSessions)
    .values({
      workspaceId,
      userId,
      title: title || "New Chat",
    })
    .returning();
  return session;
}

export async function listSessions(workspaceId: string, userId: string) {
  return db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.workspaceId, workspaceId),
        eq(chatSessions.userId, userId)
      )
    )
    .orderBy(desc(chatSessions.updatedAt));
}

export async function getSession(id: string) {
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, id));
  return session ?? null;
}

export async function getSessionMessages(sessionId: string) {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);
}

export async function deleteSession(id: string) {
  await db.delete(chatSessions).where(eq(chatSessions.id, id));
}

export async function getTotalChatSessionsForUser(userId: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId));
  return Number(count);
}

export async function updateSessionTitle(sessionId: string, title: string) {
  await db
    .update(chatSessions)
    .set({ title, updatedAt: new Date() })
    .where(eq(chatSessions.id, sessionId));
}

export async function generateAndUpdateTitle(
  sessionId: string,
  firstUserMessage: string
): Promise<string | null> {
  try {
    const title = await llm.generateChatTitle(firstUserMessage);
    if (title) {
      await updateSessionTitle(sessionId, title);
      return title;
    }
    return null;
  } catch {
    return null;
  }
}

export async function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  citations?: any[]
) {
  const [message] = await db
    .insert(chatMessages)
    .values({
      sessionId,
      role,
      content,
      citations: citations ?? null,
      tokenCount: Math.ceil(content.length / 4),
    })
    .returning();

  await db
    .update(chatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessions.id, sessionId));

  return message;
}
