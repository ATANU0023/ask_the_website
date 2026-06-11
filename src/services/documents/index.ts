import { db } from "@/lib/db";
import { documents, documentChunks, workspaces } from "@/lib/db/schema";
import { eq, and, ilike, desc, asc, sql } from "drizzle-orm";
import { vectorStore } from "@/services/vector-store";
import { deleteFile } from "./storage";

interface CreateDocumentData {
  workspaceId: string;
  userId: string;
  title: string;
  sourceType: string;
  url?: string;
  fileKey?: string;
  fileSize?: number;
  fileType?: string;
  pageCount?: number;
  author?: string;
}

interface ListDocumentsFilters {
  status?: string;
  sourceType?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function createDocument(data: CreateDocumentData) {
  const [doc] = await db.insert(documents).values(data).returning();
  return doc;
}

export async function getDocument(id: string) {
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id));
  return doc ?? null;
}

export async function listDocuments(
  workspaceId: string,
  filters: ListDocumentsFilters = {}
) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(documents.workspaceId, workspaceId)];

  if (filters?.status) conditions.push(eq(documents.status, filters.status));
  if (filters?.sourceType)
    conditions.push(eq(documents.sourceType, filters.sourceType));

  const orderBy =
    filters?.sortBy === "title"
      ? filters.sortOrder === "desc"
        ? desc(documents.title)
        : asc(documents.title)
      : filters.sortOrder === "asc"
      ? asc(documents.createdAt)
      : desc(documents.createdAt);

  const rows = await db
    .select()
    .from(documents)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(documents)
    .where(and(...conditions));

  return {
    documents: rows,
    pagination: {
      page,
      pageSize,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / pageSize),
    },
  };
}

export async function deleteDocument(id: string) {
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id));

  if (!doc) return;

  if (doc.fileKey) {
    try {
      await deleteFile(doc.fileKey);
    } catch {
      // file may not exist in storage
    }
  }

  await vectorStore.deleteByDocumentId("workspace_documents", id);
  await db.delete(documents).where(eq(documents.id, id));
}

export async function getDocumentsForWorkspace(workspaceId: string) {
  const result = await listDocuments(workspaceId, { pageSize: 1000 });
  return result.documents;
}

export async function getTotalDocumentsForUser(userId: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(documents)
    .where(eq(documents.userId, userId));
  return Number(count);
}

export async function verifyWorkspaceAccess(workspaceId: string, userId: string) {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, userId)));
  return !!workspace;
}

export async function searchDocuments(
  workspaceId: string,
  query: string
) {
  return db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.workspaceId, workspaceId),
        ilike(documents.title, `%${query}%`)
      )
    )
    .orderBy(desc(documents.createdAt))
    .limit(20);
}
