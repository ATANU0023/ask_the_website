import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";

export default async function NewWorkspacePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Create a New Workspace</h1>
        <p className="text-muted-foreground">
          Organize your documents, chats, and more.
        </p>
        <CreateWorkspaceDialog open={true} />
      </div>
    </div>
  );
}
