import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ingestUrlSchema } from "@/lib/validations/document";
import { getWorkspace } from "@/services/workspaces";
import { ingestWebsite } from "@/services/ingestion/website";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;
    const workspace = await getWorkspace(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    if (workspace.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = ingestUrlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await ingestWebsite(
      parsed.data.url,
      workspaceId,
      session.user.id
    );

    return NextResponse.json(
      { message: "Ingestion complete", ...result },
      { status: 202 }
    );
  } catch (error) {
    console.error("Ingest URL error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
