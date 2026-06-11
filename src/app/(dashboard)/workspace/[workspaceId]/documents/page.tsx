import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getWorkspace } from "@/services/workspaces";
import { getDocumentsForWorkspace } from "@/services/documents";
import { DocumentList } from "@/components/documents/DocumentList";
import { TabNavigation } from "@/components/shared/TabNavigation";

interface PageProps {
  params: {
    workspaceId: string;
  };
}

export default async function DocumentsPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspace = await getWorkspace(params.workspaceId);

  if (!workspace) {
    notFound();
  }

  const docs = await getDocumentsForWorkspace(params.workspaceId);
  const documents = docs.map((d) => ({
    ...d,
    status: d.status ?? "processing",
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="glass-card-strong px-6 py-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-semibold text-foreground">{workspace.name}</h1>
        </div>
        {workspace.description && (
          <p className="text-sm text-on-surface-variant mb-4">{workspace.description}</p>
        )}
        <TabNavigation workspaceId={params.workspaceId} />
      </div>

      <DocumentList documents={documents} workspaceId={params.workspaceId} />
    </div>
  );
}
