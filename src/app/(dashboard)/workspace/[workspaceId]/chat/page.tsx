import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getWorkspace } from "@/services/workspaces";
import { ChatPageClient } from "./ChatPageClient";
import { TabNavigation } from "@/components/shared/TabNavigation";

interface PageProps {
  params: {
    workspaceId: string;
  };
  searchParams: {
    session?: string;
  };
}

export default async function ChatPage({ params, searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspace = await getWorkspace(params.workspaceId);

  if (!workspace) {
    notFound();
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
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

      <div className="flex-1 min-h-0">
        <ChatPageClient
          workspaceId={params.workspaceId}
          userId={session.user.id}
          activeSessionId={searchParams.session}
        />
      </div>
    </div>
  );
}
