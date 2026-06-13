import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getWorkspace } from "@/services/workspaces";
import { QuizList } from "@/components/quizzes/QuizList";
import { GenerateQuizDialog } from "@/components/quizzes/GenerateQuizDialog";
import { TabNavigation } from "@/components/shared/TabNavigation";
import { db } from "@/lib/db";
import { quizzes, quizQuestions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface PageProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

export default async function QuizzesPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { workspaceId } = await params;

  const workspace = await getWorkspace(workspaceId);

  if (!workspace) {
    notFound();
  }

  const quizRecords = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.workspaceId, workspaceId))
    .orderBy(quizzes.createdAt);

  const quizData = await Promise.all(
    quizRecords.map(async (quiz) => {
      const questions = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, quiz.id))
        .orderBy(quizQuestions.orderIndex);

      return {
        id: quiz.id,
        title: quiz.title,
        createdAt: quiz.createdAt.toISOString(),
        questions: questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options as string[] | null,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          questionType: q.questionType,
        })),
      };
    })
  );

  return (
    <div className="space-y-6 h-full flex flex-col">


      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-medium text-foreground">Quizzes</h2>
          <p className="text-sm text-on-surface-variant">Test your knowledge with AI-generated quizzes</p>
        </div>
        <GenerateQuizDialog workspaceId={workspaceId} />
      </div>

      <div className="flex-1 min-h-0">
        <QuizList quizzes={quizData} workspaceId={workspaceId} />
      </div>
    </div>
  );
}
