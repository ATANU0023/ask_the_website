import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { flashcards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getWorkspace } from "@/services/workspaces";
import { deleteFlashcard } from "@/services/flashcards";

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ workspaceId: string; cardId: string }>;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, cardId } = await params;
    const workspace = await getWorkspace(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const flashcard = await db
      .select()
      .from(flashcards)
      .where(and(eq(flashcards.id, cardId), eq(flashcards.workspaceId, workspaceId)))
      .then((rows) => rows[0] ?? null);

    if (!flashcard) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 }
      );
    }

    if (flashcard.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteFlashcard(cardId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete flashcard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
