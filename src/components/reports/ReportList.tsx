"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { GenerateReportDialog } from "./GenerateReportDialog"

interface Report {
  id: string
  title: string
  content: string
  documentIds: string[] | null
  createdAt: string
  updatedAt: string
}

interface ReportListProps {
  reports: Report[]
  workspaceId: string
}

function getRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export function ReportList({ reports, workspaceId }: ReportListProps) {
  const [activeReport, setActiveReport] = useState<string | null>(null)

  const report = activeReport
    ? reports.find((r) => r.id === activeReport)
    : null

  if (report) {
    // Parse content sections (assuming markdown-ish structure)
    const lines = report.content.split("\n").filter(Boolean)
    const sections: { heading?: string; content: string[] }[] = []
    let currentSection: { heading?: string; content: string[] } = { content: [] }

    for (const line of lines) {
      if (line.startsWith("#") || line.startsWith("##") || line.startsWith("###")) {
        if (currentSection.content.length > 0 || currentSection.heading) {
          sections.push(currentSection)
        }
        currentSection = {
          heading: line.replace(/^#+\s*/, ""),
          content: [],
        }
      } else {
        currentSection.content.push(line)
      }
    }
    if (currentSection.content.length > 0 || currentSection.heading) {
      sections.push(currentSection)
    }

    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveReport(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-colors"
            >
              <span className="material-icon text-[18px]">arrow_back</span>
            </button>
            <div>
              <h3 className="text-base font-semibold text-foreground">{report.title}</h3>
              <p className="text-xs text-on-surface-variant">
                Updated {getRelativeTime(report.updatedAt)}
              </p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-colors">
            <span className="material-icon text-[16px]">download</span>
            Export
          </button>
        </div>

        {/* Bento Grid Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {sections.length > 0 ? (
              sections.map((section, idx) => (
                <div key={idx} className="glass-card p-5">
                  {section.heading && (
                    <h4 className="text-sm font-medium text-foreground mb-3">{section.heading}</h4>
                  )}
                  {section.content.map((text, i) => {
                    // Try to detect bullet points
                    if (text.startsWith("- ") || text.startsWith("* ")) {
                      return (
                        <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                          <p className="text-sm text-on-surface-variant">{text.replace(/^[-*]\s*/, "")}</p>
                        </div>
                      )
                    }
                    return (
                      <p key={i} className="text-sm text-on-surface-variant leading-relaxed mb-2 last:mb-0">
                        {text}
                      </p>
                    )
                  })}
                </div>
              ))
            ) : (
              <div className="glass-card p-5">
                <p className="text-sm text-on-surface-variant leading-relaxed">{report.content}</p>
              </div>
            )}
          </div>

          {/* Sidebar Widgets */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Key Findings */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icon text-[18px] text-primary">lightbulb</span>
                <h4 className="text-sm font-medium text-foreground">Key Findings</h4>
              </div>
              <div className="space-y-3">
                {["Document analysis complete", "Key concepts identified", "Relationships mapped"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-400/10">
                      <span className="material-icon text-[12px] text-green-400">check</span>
                    </span>
                    <span className="text-xs text-on-surface-variant">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Snapshot */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icon text-[18px] text-primary">bar_chart</span>
                <h4 className="text-sm font-medium text-foreground">Data Snapshot</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-on-surface-variant">Relevance</span>
                    <span className="text-xs text-foreground">92%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: "92%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-on-surface-variant">Coverage</span>
                    <span className="text-xs text-foreground">78%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: "78%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-on-surface-variant">Accuracy</span>
                    <span className="text-xs text-foreground">95%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: "95%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-icon text-[18px] text-primary">checklist</span>
            <h4 className="text-sm font-medium text-foreground">Action Items</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-surface-container/50">
              <p className="text-sm font-medium text-foreground">Review Key Concepts</p>
              <p className="text-xs text-on-surface-variant mt-1">Go through the identified topics</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container/50">
              <p className="text-sm font-medium text-foreground">Generate Flashcards</p>
              <p className="text-xs text-on-surface-variant mt-1">Create study cards from findings</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container/50">
              <p className="text-sm font-medium text-foreground">Export Report</p>
              <p className="text-xs text-on-surface-variant mt-1">Save for offline reference</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-4">
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <span className="material-icon text-[32px] text-primary">assessment</span>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">No reports yet</h3>
            <p className="text-sm text-on-surface-variant max-w-sm">
              Generate comprehensive reports from your documents
            </p>
          </div>
          <GenerateReportDialog workspaceId={workspaceId} />
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((r) => (
            <div
              key={r.id}
              className="glass-card p-5 cursor-pointer hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5"
              onClick={() => setActiveReport(r.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <span className="material-icon text-[20px] text-primary">assessment</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-on-surface-variant">Updated {getRelativeTime(r.updatedAt)}</p>
                  </div>
                </div>
                <span className="material-icon text-on-surface-variant text-[18px]">chevron_right</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
