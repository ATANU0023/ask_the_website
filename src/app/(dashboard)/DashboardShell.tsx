"use client"

import { useState } from "react"
import { Sidebar } from "@/components/shared/sidebar"
import { Header } from "@/components/shared/header"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface Workspace {
  id: string
  name: string
}

interface DashboardShellProps {
  children: React.ReactNode
  workspaces: Workspace[]
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function DashboardShell({
  children,
  workspaces,
  user,
}: DashboardShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden lg:flex">
        <Sidebar workspaces={workspaces} user={user} />
      </aside>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-3 left-3 z-40 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px]">
          <Sidebar
            workspaces={workspaces}
            user={user}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} workspaces={workspaces} onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-[1440px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
