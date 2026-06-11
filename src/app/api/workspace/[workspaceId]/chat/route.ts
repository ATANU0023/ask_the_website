import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { chatMessageSchema } from "@/lib/validations/chat";
import { getWorkspace } from "@/services/workspaces";
import { runRAGStream } from "@/services/rag/pipeline";
import { getSessionMessages, addMessage, getSession } from "@/services/chat";

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
    const parsed = chatMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, message } = parsed.data;

    const chatSession = await getSession(sessionId);
    if (!chatSession || chatSession.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const chatHistory = await getSessionMessages(sessionId);
    const history = chatHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    await addMessage(sessionId, "user", message);

    const { stream, citations } = await runRAGStream(
      workspaceId,
      message,
      history
    );

    const encoder = new TextEncoder();
    let fullResponse = "";

    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          const reader = stream.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = typeof value === "string" ? value : decoder.decode(value);
            fullResponse += chunk;
            const event = `event: token\ndata: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(event));
          }

          for (const citation of citations) {
            const event = `event: citation\ndata: ${JSON.stringify(citation)}\n\n`;
            controller.enqueue(encoder.encode(event));
          }

          controller.enqueue(encoder.encode("event: done\ndata: [DONE]\n\n"));
          controller.close();

          await addMessage(sessionId, "assistant", fullResponse, citations);
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify("An error occurred during streaming")}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
