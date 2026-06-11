"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  icon: string
  href: string
}

const tabs: Tab[] = [
  { id: "documents", label: "Documents", icon: "description", href: "" },
  { id: "chat", label: "Chat", icon: "chat", href: "/chat" },
  { id: "flashcards", label: "Flashcards", icon: "style", href: "/flashcards" },
  { id: "quizzes", label: "Quizzes", icon: "quiz", href: "/quizzes" },
  { id: "reports", label: "Reports", icon: "assessment", href: "/reports" },
]

interface TabNavigationProps {
  workspaceId: string
  basePath?: string
}

export function TabNavigation({ workspaceId, basePath }: TabNavigationProps) {
  const pathname = usePathname()
  const bp = basePath || `/workspace/${workspaceId}`

  const activeTab = (() => {
    if (pathname === bp || pathname === `${bp}/`) return "documents"
    for (const tab of tabs) {
      if (tab.href && pathname.startsWith(`${bp}${tab.href}`)) return tab.id
    }
    return "documents"
  })()

  return (
    <nav className="flex items-center gap-1">
      {tabs.map((tab) => {
        const href = tab.href ? `${bp}${tab.href}` : bp
        const isActive = activeTab === tab.id
        return (
          <Link
            key={tab.id}
            href={href}
            className={cn(
              "tab-btn flex items-center gap-2",
              isActive ? "active" : ""
            )}
          >
            <span className="material-icon text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
