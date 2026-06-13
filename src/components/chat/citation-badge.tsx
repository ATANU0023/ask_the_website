"use client"

import { BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CitationBadgeProps {
  sourceTitle: string
  sourceType: string
  pageNumber?: number
  section?: string
  onClick?: () => void
}

export function CitationBadge({ sourceTitle, sourceType, pageNumber, section, onClick }: CitationBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border bg-secondary/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
    >
      <BookOpen className="h-3 w-3" />
      <span>{sourceTitle}</span>
      {pageNumber !== undefined && <span>p.{pageNumber}</span>}
      {section && <span>· {section}</span>}
    </button>
  )
}
