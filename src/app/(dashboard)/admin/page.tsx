import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getStats, getAllUsers } from "@/services/admin";

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if ((session.user as any).role !== "admin") {
    redirect("/dashboard");
  }

  const [stats, users] = await Promise.all([
    getStats(),
    getAllUsers(),
  ]);

  const { StatsCards } = await import("@/components/admin/StatsCards");
  const { UserListTable } = await import("@/components/admin/UserListTable");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground mt-1">
          System administration and monitoring
        </p>
      </div>

      <StatsCards stats={stats} />

      <div>
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        <UserListTable users={users} />
      </div>
    </div>
  );
}
