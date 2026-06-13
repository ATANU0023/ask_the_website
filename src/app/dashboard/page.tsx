import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTotalDocumentsForUser, getTotalStorageForUser } from "@/services/documents";
import { getTotalWorkspacesForUser, getWorkspacesForUser } from "@/services/workspaces";
import { getTotalChatSessionsForUser } from "@/services/chat";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [totalDocuments, totalWorkspaces, totalChatSessions, totalStorageBytes, workspaces] = await Promise.all([
    getTotalDocumentsForUser(session.user.id),
    getTotalWorkspacesForUser(session.user.id),
    getTotalChatSessionsForUser(session.user.id),
    getTotalStorageForUser(session.user.id),
    getWorkspacesForUser(session.user.id),
  ]);

  const totalStorageMB = totalStorageBytes > 0
    ? (totalStorageBytes / (1024 * 1024)).toFixed(1)
    : "0";
  const totalStorageDisplay = totalStorageBytes > 1024 * 1024 * 1024
    ? (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(1) + " GB"
    : totalStorageMB + " MB";

  const user = session.user;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-surface-container to-surface-container-lowest border border-border/50 p-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-fixed-dim/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">
                Welcome{user.name ? `, ${user.name}` : ""}
              </h1>
              <p className="text-sm text-on-surface-variant mt-1">
                Here&apos;s what&apos;s happening across your notebooks
              </p>
            </div>
            <Link
              href="/workspace/new"
              className="flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 transition-all hover:scale-105"
            >
              <span className="material-icon text-[18px]">add</span>
              New Notebook
            </Link>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Stats Row */}
        <div className="col-span-12 lg:col-span-3">
          <div className="glass-card p-5 h-full relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <span className="material-icon text-primary">description</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalDocuments}</p>
                  <p className="text-xs text-on-surface-variant">Documents</p>
                </div>
              </div>
              <div className="w-full h-1 rounded-full bg-surface-container-high overflow-hidden">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary-fixed-dim to-primary/50" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3">
          <div className="glass-card p-5 h-full relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <span className="material-icon text-primary">folder</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalWorkspaces}</p>
                  <p className="text-xs text-on-surface-variant">Notebooks</p>
                </div>
              </div>
              <div className="w-full h-1 rounded-full bg-surface-container-high overflow-hidden">
                <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-primary-fixed-dim to-primary/50" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3">
          <div className="glass-card p-5 h-full relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-400/5">
                  <span className="material-icon text-amber-400">chat</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalChatSessions}</p>
                  <p className="text-xs text-on-surface-variant">Chat Sessions</p>
                </div>
              </div>
              <div className="w-full h-1 rounded-full bg-surface-container-high overflow-hidden">
                <div className="h-full w-1/4 rounded-full bg-gradient-to-r from-amber-400 to-amber-400/50" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3">
          <div className="glass-card p-5 h-full relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-400/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400/20 to-green-400/5">
                  <span className="material-icon text-green-400">cloud</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalStorageDisplay}</p>
                  <p className="text-xs text-on-surface-variant">Storage Used</p>
                </div>
              </div>
              <div className="w-full h-1 rounded-full bg-surface-container-high overflow-hidden">
                <div className="h-full w-1/12 rounded-full bg-gradient-to-r from-green-400 to-green-400/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Notebook Grid */}
        <div className="col-span-12 lg:col-span-8">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-medium text-foreground">Your Notebooks</h2>
              <Link
                href="/workspace/new"
                className="text-xs text-primary hover:text-primary-fixed-dim transition-colors"
              >
                View all
              </Link>
            </div>
            {workspaces.length === 0 ? (
              <div className="text-center py-10">
                <span className="material-icon text-[40px] text-on-surface-variant/30 block mb-3">folder_open</span>
                <p className="text-sm text-on-surface-variant">No notebooks yet</p>
                <Link
                  href="/workspace/new"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-primary hover:text-primary-fixed-dim transition-colors"
                >
                  <span className="material-icon text-[14px]">add</span>
                  Create your first notebook
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {workspaces.map((ws, idx) => (
                  <Link
                    key={ws.id}
                    href={`/workspace/${ws.id}`}
                    className="glass-card p-4 group hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 group-hover:scale-110 transition-transform duration-300">
                          <span className="material-icon text-[18px] text-primary">description</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {ws.name}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {ws.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-on-surface-variant/60">
                        <span>Active</span>
                        <span className="material-icon text-[14px] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transition-transform">
                          arrow_forward
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-4">
          <div className="glass-card p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-medium text-foreground">Recent Activity</h2>
              <span className="material-icon text-on-surface-variant text-[18px]">more_horiz</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 group cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shrink-0 mt-0.5">
                  <span className="material-icon text-[16px] text-primary">add</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground group-hover:text-primary transition-colors truncate">Created new workspace</p>
                  <p className="text-xs text-on-surface-variant/60 mt-0.5">Activity tracking coming soon</p>
                </div>
              </div>
              <div className="flex items-start gap-3 group cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-400/5 shrink-0 mt-0.5">
                  <span className="material-icon text-[16px] text-amber-400">upload_file</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground group-hover:text-amber-400 transition-colors truncate">Uploaded documents</p>
                  <p className="text-xs text-on-surface-variant/60 mt-0.5">Activity tracking coming soon</p>
                </div>
              </div>
              <div className="flex items-start gap-3 group cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-green-400/20 to-green-400/5 shrink-0 mt-0.5">
                  <span className="material-icon text-[16px] text-green-400">chat</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground group-hover:text-green-400 transition-colors truncate">Chat session started</p>
                  <p className="text-xs text-on-surface-variant/60 mt-0.5">Activity tracking coming soon</p>
                </div>
              </div>
              <div className="pt-2">
                <div className="w-full h-px bg-border/50" />
                <p className="text-xs text-on-surface-variant/40 text-center pt-3">End of activity log</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-12">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-icon text-primary text-[18px]">bolt</span>
              <h2 className="text-sm font-medium text-foreground">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/workspace/new"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 p-5 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <span className="material-icon text-[24px] text-primary mb-3 block group-hover:scale-110 transition-transform">
                    note_add
                  </span>
                  <p className="text-sm font-medium text-foreground">New Notebook</p>
                  <p className="text-xs text-on-surface-variant mt-1">Create a workspace for your documents</p>
                </div>
              </Link>
              <Link
                href={workspaces.length > 0 ? `/workspace/${workspaces[0].id}` : "/workspace/new"}
                className="group relative overflow-hidden rounded-xl bg-surface-container/50 border border-border/50 p-5 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer block"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <span className="material-icon text-[24px] text-amber-400 mb-3 block group-hover:scale-110 transition-transform">
                    upload
                  </span>
                  <p className="text-sm font-medium text-foreground">Upload Files</p>
                  <p className="text-xs text-on-surface-variant mt-1">Add PDFs, documents to your notebook</p>
                </div>
              </Link>
              <Link
                href={workspaces.length > 0 ? `/workspace/${workspaces[0].id}` : "/workspace/new"}
                className="group relative overflow-hidden rounded-xl bg-surface-container/50 border border-border/50 p-5 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer block"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <span className="material-icon text-[24px] text-green-400 mb-3 block group-hover:scale-110 transition-transform">
                    language
                  </span>
                  <p className="text-sm font-medium text-foreground">Ingest Website</p>
                  <p className="text-xs text-on-surface-variant mt-1">Import content from any URL</p>
                </div>
              </Link>
              <Link
                href={workspaces.length > 0 ? `/workspace/${workspaces[0].id}/quizzes` : "/workspace/new"}
                className="group relative overflow-hidden rounded-xl bg-surface-container/50 border border-border/50 p-5 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer block"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <span className="material-icon text-[24px] text-purple-400 mb-3 block group-hover:scale-110 transition-transform">
                    quiz
                  </span>
                  <p className="text-sm font-medium text-foreground">Generate Quiz</p>
                  <p className="text-xs text-on-surface-variant mt-1">Test knowledge with AI quizzes</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
