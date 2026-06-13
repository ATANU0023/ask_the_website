import { db } from "@/lib/db";
import { usageTracking } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function log(
  action: string,
  userId: string,
  tokens?: number,
  cost?: number
): Promise<void> {
  await db.insert(usageTracking).values({
    userId,
    action,
    tokensUsed: tokens ?? 0,
    cost: cost?.toString() ?? "0",
  });
}

export async function getUserUsage(
  userId: string,
  period?: "day" | "week" | "month"
): Promise<{ totalTokens: number; totalCost: number; actionCount: number }> {
  let dateFilter;
  const now = new Date();

  if (period === "day") {
    dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    dateFilter = weekAgo;
  } else if (period === "month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    dateFilter = monthAgo;
  }

  const conditions = [eq(usageTracking.userId, userId)];
  if (dateFilter) conditions.push(gte(usageTracking.createdAt, dateFilter));

  const result = await db
    .select({
      totalTokens: sql<number>`COALESCE(SUM(${usageTracking.tokensUsed}), 0)`,
      totalCost: sql<number>`COALESCE(SUM(${usageTracking.cost}::numeric), 0)`,
      actionCount: sql<number>`COUNT(*)`,
    })
    .from(usageTracking)
    .where(and(...conditions));

  return result[0];
}
