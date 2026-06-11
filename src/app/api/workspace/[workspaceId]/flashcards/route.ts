import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateFlashcardsSchema } from "@/lib/validations/flashcard";
import { getWorkspace } from "@/services/workspaces";
import { listFlashcards, generateFlashcards } from "@/services/flashcards";

export async function GET(
  _req: NextRequest,
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

    const flashcards = await listFlashcards(workspaceId);
    return NextResponse.json(flashcards);
  } catch (error) {
    console.error("List flashcards error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const body = await req.json();
    const parsed = generateFlashcardsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { documentIds, count } = parsed.data;

    const flashcards = await generateFlashcards(
      workspaceId,
      session.user.id,
      documentIds,
      count
    );

    return NextResponse.json(flashcards, { status: 201 });
  } catch (error) {
    console.error("Generate flashcards error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
