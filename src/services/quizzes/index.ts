import { db } from "@/lib/db";
import { quizzes, quizQuestions, documentChunks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { llm } from "@/services/llm";
import { QUIZ_PROMPT } from "@/services/llm/prompts";

interface QuizOptions {
  title?: string;
  questionCount?: number;
  types?: ("multiple_choice" | "true_false" | "short_answer")[];
}

export async function generateQuiz(
  workspaceId: string,
  userId: string,
  documentIds: string[],
  options?: QuizOptions
) {
  const questionCount = options?.questionCount ?? 5;

  const chunks = await db
    .select({
      content: documentChunks.content,
    })
    .from(documentChunks)
    .where(
      and(
        eq(documentChunks.workspaceId, workspaceId),
        ...documentIds.map((id) => eq(documentChunks.documentId, id))
      )
    )
    .limit(100);

  const context = chunks.map((c) => c.content).join("\n\n");
  const truncated = context.length > 30000 ? context.substring(0, 30000) : context;

  const prompt = `Based on the following content, create a quiz with ${questionCount} questions:\n\n${truncated}`;

  const response = await llm.generate(prompt, QUIZ_PROMPT);

  let questions: any[];
  try {
    const cleaned = response
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    questions = JSON.parse(cleaned);
  } catch {
    questions = [];
  }

  const [quiz] = await db
    .insert(quizzes)
    .values({
      workspaceId,
      userId,
      documentId: documentIds[0] || null,
      title: options?.title ?? "Quiz",
    })
    .returning();

  if (questions.length > 0) {
    await db.insert(quizQuestions).values(
      questions.map((q, i) => ({
        quizId: quiz.id,
        questionType: q.questionType || "multiple_choice",
        question: q.question,
        options: q.options || null,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || null,
        orderIndex: i,
      }))
    );
  }

  return quiz;
}

export async function listQuizzes(workspaceId: string) {
  return db
    .select()
    .from(quizzes)
    .where(eq(quizzes.workspaceId, workspaceId))
    .orderBy(quizzes.createdAt);
}

export async function getQuiz(id: string) {
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.id, id));

  if (!quiz) return null;

  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, id))
    .orderBy(quizQuestions.orderIndex);

  return { ...quiz, questions };
}

export async function deleteQuiz(id: string) {
  await db.delete(quizzes).where(eq(quizzes.id, id));
}
