import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchQuerySchema } from "@/lib/validations/search";
import { globalSearch } from "@/services/search";
import { getWorkspacesForUser } from "@/services/workspaces";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const raw = {
      q: searchParams.get("q"),
      workspaceId: searchParams.get("workspaceId"),
      type: searchParams.get("type") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    };

    const parsed = searchQuerySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { q, workspaceId, type } = parsed.data;
    const mappedType = type === "chats" ? "messages" : type === "all" ? undefined : type;

    if (workspaceId) {
      const results = await globalSearch(workspaceId, q, mappedType);
      return NextResponse.json(results);
    }

    const workspaces = await getWorkspacesForUser(session.user.id);
    const allResults = {
      documents: [] as any[],
      chunks: [] as any[],
      messages: [] as any[],
    };

    for (const ws of workspaces) {
      const results = await globalSearch(ws.id, q, mappedType);
      allResults.documents.push(...results.documents);
      allResults.chunks.push(...results.chunks);
      allResults.messages.push(...results.messages);
    }

    return NextResponse.json(allResults);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
