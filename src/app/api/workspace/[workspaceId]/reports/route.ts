import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateReportSchema } from "@/lib/validations/report";
import { getWorkspace } from "@/services/workspaces";
import { listReports, generateReport } from "@/services/reports";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;
    const workspace = await getWorkspace(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const reports = await listReports(workspaceId);
    return NextResponse.json(reports);
  } catch (error) {
    console.error("List reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;
    const workspace = await getWorkspace(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = generateReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { documentIds, title, sections } = parsed.data;

    const report = await generateReport(
      workspaceId,
      session.user.id,
      documentIds,
      title,
      sections
    );

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Generate report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
