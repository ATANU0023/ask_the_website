import { db } from "@/lib/db";
import {
  users,
  documents,
  workspaces,
  chatSessions,
  usageTracking,
} from "@/lib/db/schema";
import { sql, gte, desc } from "drizzle-orm";

interface Stats {
  totalUsers: number;
  totalDocuments: number;
  totalWorkspaces: number;
  totalChatSessions: number;
  totalStorageBytes: number;
  totalTokenUsage: number;
  totalCost: number;
}

export async function getStats(): Promise<Stats> {
  const [userCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users);
  const [docCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(documents);
  const [workspaceCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(workspaces);
  const [chatCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(chatSessions);
  const [storageResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${documents.fileSize}), 0)` })
    .from(documents);
  const [usageResult] = await db
    .select({
      tokens: sql<number>`COALESCE(SUM(${usageTracking.tokensUsed}), 0)`,
      cost: sql<number>`COALESCE(SUM(${usageTracking.cost}::numeric), 0)`,
    })
    .from(usageTracking);

  return {
    totalUsers: Number(userCount.count),
    totalDocuments: Number(docCount.count),
    totalWorkspaces: Number(workspaceCount.count),
    totalChatSessions: Number(chatCount.count),
    totalStorageBytes: Number(storageResult.total),
    totalTokenUsage: Number(usageResult.tokens),
    totalCost: Number(usageResult.cost),
  };
}

interface DailyUsage {
  date: string;
  actionCount: number;
  tokensUsed: number;
  cost: number;
}

export async function getAllUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function getUsageGraph(days: number = 30): Promise<DailyUsage[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const rows = await db
    .select({
      date: sql<string>`DATE(${usageTracking.createdAt})`,
      actionCount: sql<number>`COUNT(*)`,
      tokensUsed: sql<number>`COALESCE(SUM(${usageTracking.tokensUsed}), 0)`,
      cost: sql<number>`COALESCE(SUM(${usageTracking.cost}::numeric), 0)`,
    })
    .from(usageTracking)
    .where(gte(usageTracking.createdAt, startDate))
    .groupBy(sql`DATE(${usageTracking.createdAt})`)
    .orderBy(sql`DATE(${usageTracking.createdAt})`);

  const usageMap = new Map<string, DailyUsage>();
  for (const row of rows) {
    usageMap.set(row.date, {
      date: row.date,
      actionCount: Number(row.actionCount),
      tokensUsed: Number(row.tokensUsed),
      cost: Number(row.cost),
    });
  }

  const result: DailyUsage[] = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    result.push(
      usageMap.get(dateStr) ?? {
        date: dateStr,
        actionCount: 0,
        tokensUsed: 0,
        cost: 0,
      }
    );
  }

  return result;
}
