import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createWorkspaceSchema } from "@/lib/validations/workspace";
import { listWorkspaces, createWorkspace } from "@/services/workspaces";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaces = await listWorkspaces(session.user.id);
    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("List workspaces error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const workspace = await createWorkspace({
      ...parsed.data,
      ownerId: session.user.id,
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error("Create workspace error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
