import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getWorkspacesForUser } from "@/services/workspaces";
import { DashboardShell } from "./DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspaces = await getWorkspacesForUser(session.user.id);

  return (
    <DashboardShell
      workspaces={workspaces}
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    >
      {children}
    </DashboardShell>
  );
}
