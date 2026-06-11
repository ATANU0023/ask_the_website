import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkspace } from "@/services/workspaces";
import { getQuiz, deleteQuiz } from "@/services/quizzes";

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ workspaceId: string; quizId: string }>;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, quizId } = await params;
    const workspace = await getWorkspace(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const quiz = await getQuiz(quizId);

    if (!quiz || quiz.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Get quiz error:", error);
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
    params: Promise<{ workspaceId: string; quizId: string }>;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, quizId } = await params;
    const workspace = await getWorkspace(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const quiz = await getQuiz(quizId);

    if (!quiz || quiz.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    await deleteQuiz(quizId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete quiz error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
