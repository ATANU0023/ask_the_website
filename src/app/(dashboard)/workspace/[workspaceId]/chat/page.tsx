import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getWorkspace } from "@/services/workspaces";
import { ChatPageClient } from "./ChatPageClient";
import { TabNavigation } from "@/components/shared/TabNavigation";

interface PageProps {
  params: Promise<{
    workspaceId: string;
  }>;
  searchParams: Promise<{
    session?: string;
  }>;
}

export default async function ChatPage({ params, searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [{ workspaceId }, { session: activeSessionId }] = await Promise.all([
    params,
    searchParams,
  ]);

  const workspace = await getWorkspace(workspaceId);

  if (!workspace) {
    notFound();
  }

  return (
    <div className="h-[calc(100vh-112px)] lg:h-[calc(100vh-128px)] flex flex-col glass-card-strong rounded-xl overflow-hidden border border-border/50">


      <div className="flex-1 min-h-0 bg-background/20 relative">
        <ChatPageClient
          workspaceId={workspaceId}
          userId={session.user.id}
          activeSessionId={activeSessionId}
        />
      </div>
    </div>
  );
}
