import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkspace } from "@/services/workspaces";
import { getReport, deleteReport } from "@/services/reports";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ workspaceId: string; reportId: string }>;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, reportId } = await params;
    const workspace = await getWorkspace(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const report = await getReport(reportId);

    if (!report || report.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Get report error:", error);
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
    params: Promise<{ workspaceId: string; reportId: string }>;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, reportId } = await params;
    const workspace = await getWorkspace(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const report = await getReport(reportId);

    if (!report || report.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    await deleteReport(reportId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
