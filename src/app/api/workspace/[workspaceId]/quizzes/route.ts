import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateQuizSchema } from "@/lib/validations/quiz";
import { getWorkspace } from "@/services/workspaces";
import { listQuizzes, generateQuiz } from "@/services/quizzes";

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

    const quizzes = await listQuizzes(workspaceId);
    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("List quizzes error:", error);
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
    const parsed = generateQuizSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { documentIds, questionTypes, count } = parsed.data;

    const quiz = await generateQuiz(
      workspaceId,
      session.user.id,
      documentIds,
      {
        questionCount: count,
        types: questionTypes,
      }
    );

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("Generate quiz error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
