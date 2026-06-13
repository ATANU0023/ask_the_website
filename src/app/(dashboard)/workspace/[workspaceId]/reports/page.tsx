import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getWorkspace } from "@/services/workspaces";
import { ReportList } from "@/components/reports/ReportList";
import { GenerateReportDialog } from "@/components/reports/GenerateReportDialog";
import { TabNavigation } from "@/components/shared/TabNavigation";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface PageProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

export default async function ReportsPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { workspaceId } = await params;

  const workspace = await getWorkspace(workspaceId);

  if (!workspace) {
    notFound();
  }

  const reportRecords = await db
    .select()
    .from(reports)
    .where(eq(reports.workspaceId, workspaceId))
    .orderBy(reports.updatedAt);

  const mapped = reportRecords.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    documentIds: r.documentIds as string[] | null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6 h-full flex flex-col">


      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-medium text-foreground">Reports</h2>
          <p className="text-sm text-on-surface-variant">AI-generated executive summaries and analysis</p>
        </div>
        <GenerateReportDialog workspaceId={workspaceId} />
      </div>

      <div className="flex-1 min-h-0">
        <ReportList reports={mapped} workspaceId={workspaceId} />
      </div>
    </div>
  );
}
