import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadFileSchema } from "@/lib/validations/document";
import { uploadFile } from "@/services/documents/storage";
import { ingestPDF } from "@/services/ingestion/pdf";
import { ingestDOCX } from "@/services/ingestion/docx";
import { ingestPPTX } from "@/services/ingestion/pptx";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const workspaceId = formData.get("workspaceId") as string | null;

    if (!file || !workspaceId) {
      return NextResponse.json(
        { error: "File and workspaceId are required" },
        { status: 400 }
      );
    }

    const parsed = uploadFileSchema.safeParse({ workspaceId });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, DOCX, PPTX" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { key: fileKey } = await uploadFile(buffer, file.name, file.type, session.user.id);

    let result: { documentId: string; chunks: number };

    if (file.type === "application/pdf") {
      result = await ingestPDF(buffer, file.name, workspaceId, session.user.id, fileKey);
    } else if (file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
      result = await ingestPPTX(buffer, file.name, workspaceId, session.user.id, fileKey);
    } else {
      result = await ingestDOCX(buffer, file.name, workspaceId, session.user.id, fileKey);
    }

    return NextResponse.json(
      { message: "Upload successful, processing complete", ...result },
      { status: 202 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
