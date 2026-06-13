import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getWorkspace } from "@/services/workspaces";
import { getDocumentsForWorkspace } from "@/services/documents";
import { TabNavigation } from "@/components/shared/TabNavigation";
import { DocumentList } from "@/components/documents/DocumentList";

interface PageProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

export default async function WorkspacePage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { workspaceId } = await params;

  const workspace = await getWorkspace(workspaceId);

  if (!workspace) {
    notFound();
  }

  const docs = await getDocumentsForWorkspace(workspaceId);
  const documents = docs.map((d) => ({
    ...d,
    status: d.status ?? "processing",
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">


      {/* Documents View */}
      <DocumentList documents={documents} workspaceId={workspaceId} />
    </div>
  );
}
