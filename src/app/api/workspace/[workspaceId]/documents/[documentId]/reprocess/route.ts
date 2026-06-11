import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkspace } from "@/services/workspaces";
import { getDocument } from "@/services/documents";
import { reprocessDocument } from "@/services/ingestion";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; documentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, documentId } = await params;
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

    const document = await getDocument(documentId);

    if (!document || document.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const result = await reprocessDocument(documentId);

    return NextResponse.json(
      { message: "Reprocessing complete", ...result },
      { status: 202 }
    );
  } catch (error) {
    console.error("Reprocess document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
