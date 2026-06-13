"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, FolderKanban, Activity } from "lucide-react"

interface Stats {
  totalUsers: number
  totalDocuments: number
  totalWorkspaces: number
}

export function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Registered accounts",
    },
    {
      title: "Total Documents",
      value: stats.totalDocuments,
      icon: FileText,
      description: "Uploaded documents",
    },
    {
      title: "Total Workspaces",
      value: stats.totalWorkspaces,
      icon: FolderKanban,
      description: "Active workspaces",
    },
    {
      title: "Activity",
      value: "Live",
      icon: Activity,
      description: "System is running",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
