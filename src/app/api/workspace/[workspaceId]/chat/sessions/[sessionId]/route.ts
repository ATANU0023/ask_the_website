import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkspace } from "@/services/workspaces";
import { getSessionMessages, deleteSession, getSession } from "@/services/chat";

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ workspaceId: string; sessionId: string }>;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, sessionId } = await params;
    const workspace = await getWorkspace(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const chatSession = await getSession(sessionId);

    if (!chatSession || chatSession.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (chatSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await getSessionMessages(sessionId);
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Get session messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ workspaceId: string; sessionId: string }>;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, sessionId } = await params;
    const workspace = await getWorkspace(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const chatSession = await getSession(sessionId);

    if (!chatSession || chatSession.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (chatSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteSession(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
