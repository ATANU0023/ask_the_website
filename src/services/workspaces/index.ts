import { db } from "@/lib/db";
import { workspaces, workspaceMembers } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { vectorStore } from "@/services/vector-store";

interface CreateWorkspaceData {
  name: string;
  description?: string;
  ownerId: string;
}

interface UpdateWorkspaceData {
  name?: string;
  description?: string;
}

export async function createWorkspace(data: CreateWorkspaceData) {
  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: data.name,
      description: data.description,
      ownerId: data.ownerId,
    })
    .returning();

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: data.ownerId,
    role: "owner",
  });

  return workspace;
}

export async function getWorkspace(id: string) {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, id));
  return workspace ?? null;
}

export async function listWorkspaces(userId: string) {
  return db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      description: workspaces.description,
      ownerId: workspaces.ownerId,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
      role: workspaceMembers.role,
    })
    .from(workspaces)
    .innerJoin(
      workspaceMembers,
      eq(workspaces.id, workspaceMembers.workspaceId)
    )
    .where(eq(workspaceMembers.userId, userId));
}

export async function updateWorkspace(
  id: string,
  data: UpdateWorkspaceData
) {
  const [workspace] = await db
    .update(workspaces)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(workspaces.id, id))
    .returning();
  return workspace ?? null;
}

export async function deleteWorkspace(id: string) {
  await vectorStore.deleteByWorkspaceId("workspace_documents", id);
  await db.delete(workspaces).where(eq(workspaces.id, id));
}

export const getWorkspacesForUser = listWorkspaces;

export async function getTotalWorkspacesForUser(userId: string) {
  const rows = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId));
  return Number(rows[0]?.count ?? 0);
}
