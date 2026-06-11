import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getWorkspace } from "@/services/workspaces";
import { FlashcardDeck } from "@/components/flashcards/FlashcardDeck";
import { GenerateFlashcardDialog } from "@/components/flashcards/GenerateFlashcardDialog";
import { TabNavigation } from "@/components/shared/TabNavigation";
import { db } from "@/lib/db";
import { flashcards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface PageProps {
  params: {
    workspaceId: string;
  };
}

export default async function FlashcardsPage({ params }: PageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const workspace = await getWorkspace(params.workspaceId);

  if (!workspace) {
    notFound();
  }

  const cards = await db
    .select()
    .from(flashcards)
    .where(eq(flashcards.workspaceId, params.workspaceId))
    .orderBy(flashcards.createdAt);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Workspace Header */}
      <div className="glass-card-strong px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-semibold text-foreground">{workspace.name}</h1>
        </div>
        {workspace.description && (
          <p className="text-sm text-on-surface-variant mb-4">{workspace.description}</p>
        )}
        <TabNavigation workspaceId={params.workspaceId} />
      </div>

      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-medium text-foreground">Flashcards</h2>
          <p className="text-sm text-on-surface-variant">Study and review key concepts</p>
        </div>
        <GenerateFlashcardDialog workspaceId={params.workspaceId} />
      </div>

      <div className="flex-1 min-h-0">
        <FlashcardDeck flashcards={cards} workspaceId={params.workspaceId} />
      </div>
    </div>
  );
}
