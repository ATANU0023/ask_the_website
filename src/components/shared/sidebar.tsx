"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession, signOut } from "next-auth/react"

interface Workspace {
  id: string
  name: string
}

interface SidebarProps {
  workspaces: Workspace[]
  collapsed?: boolean
  onToggle?: () => void
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function Sidebar({ workspaces, user: propUser }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [workspaceExpanded, setWorkspaceExpanded] = useState(true)
  const [comingSoon, setComingSoon] = useState<string | null>(null)

  const currentUser = propUser || {
    name: session?.user?.name,
    email: session?.user?.email,
    image: session?.user?.image,
  }

  const initials = currentUser.name
    ? currentUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  const isInWorkspace = pathname.startsWith("/workspace/")

  return (
    <aside className="flex flex-col h-screen w-[280px] shrink-0 bg-surface-container-lowest border-r border-border">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-6 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
          <span className="material-icon text-primary">neurology</span>
        </div>
        <span className="font-geist text-lg font-semibold text-foreground tracking-tight">
          CognitiveSync
        </span>
      </div>

      <div className="mx-6 h-px bg-border" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
        {/* Home */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
            pathname === "/dashboard"
              ? "text-foreground bg-surface-container"
              : "text-on-surface-variant hover:text-foreground hover:bg-surface-container"
          )}
        >
          <span className="material-icon text-[20px]">home</span>
          <span>Home</span>
        </Link>

        {/* Workspace toggle */}
        <button
          onClick={() => setWorkspaceExpanded(!workspaceExpanded)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
            isInWorkspace
              ? "text-foreground bg-surface-container"
              : "text-on-surface-variant hover:text-foreground hover:bg-surface-container"
          )}
        >
          <span className="material-icon text-[20px]">folder</span>
          <span className="flex-1 text-left">Workspace</span>
          <span className={cn(
            "material-icon text-[16px] transition-transform duration-200",
            workspaceExpanded && "rotate-90"
          )}>
            chevron_right
          </span>
        </button>

        {/* Workspace sub-items (notebooks) */}
        {workspaceExpanded && (
          <div className="ml-2 pl-4 border-l border-border/50 space-y-0.5 mt-0.5 mb-1">
            {workspaces.length === 0 ? (
              <p className="text-xs text-on-surface-variant/40 px-3 py-2 italic">
                No notebooks yet
              </p>
            ) : (
              workspaces.map((ws) => {
                const isActive = pathname === `/workspace/${ws.id}`
                return (
                  <Link
                    key={ws.id}
                    href={`/workspace/${ws.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                      isActive
                        ? "text-foreground bg-surface-container"
                        : "text-on-surface-variant hover:text-foreground hover:bg-surface-container"
                    )}
                  >
                    <span className="material-icon text-[16px] shrink-0">description</span>
                    <span className="truncate">{ws.name}</span>
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400/70 shrink-0" />
                  </Link>
                )
              })
            )}
            <Link
              href="/workspace/new"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-primary/70 hover:text-primary hover:bg-surface-container transition-all duration-200"
            >
              <span className="material-icon text-[16px]">add</span>
              <span>New Notebook</span>
            </Link>
          </div>
        )}

        {/* Collections */}
        <button
          onClick={() => setComingSoon("Collections")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 relative",
            "text-on-surface-variant hover:text-foreground hover:bg-surface-container"
          )}
        >
          <span className="material-icon text-[20px]">collections_bookmark</span>
          <span>Collections</span>
          {comingSoon === "Collections" && (
            <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 animate-pulse">
              Soon
            </span>
          )}
        </button>

        {/* Deep Research */}
        <button
          onClick={() => setComingSoon("Deep Research")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 relative",
            "text-on-surface-variant hover:text-foreground hover:bg-surface-container"
          )}
        >
          <span className="material-icon text-[20px]">psychology</span>
          <span>Deep Research</span>
          {comingSoon === "Deep Research" && (
            <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 animate-pulse">
              Soon
            </span>
          )}
        </button>

        {/* Sync History */}
        <Link
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-all duration-200"
        >
          <span className="material-icon text-[20px]">sync</span>
          <span>Sync History</span>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
            pathname === "/settings"
              ? "text-foreground bg-surface-container"
              : "text-on-surface-variant hover:text-foreground hover:bg-surface-container"
          )}
        >
          <span className="material-icon text-[20px]">settings</span>
          <span>Settings</span>
        </Link>
      </nav>

      {/* New Notebook Button */}
      <div className="px-4 pb-2 shrink-0">
        <Link href="/workspace/new">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-muted/20 px-4 py-2.5 text-sm text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-all duration-200">
            <span className="material-icon text-[18px]">note_add</span>
            <span>New Notebook</span>
          </button>
        </Link>
      </div>

      {/* User Profile */}
      <div className="mx-4 my-2 h-px bg-border" />
      <div className="flex items-center gap-3 px-6 py-3 shrink-0">
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage src={currentUser.image || ""} alt={currentUser.name || "User"} />
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {currentUser.name || "User"}
          </p>
          <p className="text-xs text-on-surface-variant truncate">
            {currentUser.email || ""}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex h-7 w-7 items-center justify-center rounded text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-colors shrink-0"
        >
          <span className="material-icon text-[18px]">logout</span>
        </button>
      </div>
    </aside>
  )
}
