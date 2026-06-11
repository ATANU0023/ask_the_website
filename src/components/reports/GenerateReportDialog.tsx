"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { useRouter } from "next/navigation"

interface GenerateReportDialogProps {
  workspaceId: string
  documentIds?: string[]
}

export function GenerateReportDialog({
  workspaceId,
  documentIds = [],
}: GenerateReportDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [sections, setSections] = useState<string[]>([])
  const [sectionInput, setSectionInput] = useState("")
  const [loading, setLoading] = useState(false)

  function addSection() {
    if (sectionInput.trim()) {
      setSections((prev) => [...prev, sectionInput.trim()])
      setSectionInput("")
    }
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/workspace/${workspaceId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds,
          title: title || undefined,
          sections: sections.length > 0 ? sections : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast({ title: "Failed to generate report", description: data.error })
        return
      }

      toast({ title: "Report generated!" })
      setOpen(false)
      router.refresh()
    } catch {
      toast({ title: "Something went wrong" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
          <span className="material-icon text-[16px]">auto_awesome</span>
          Generate
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-surface-container border border-outline-muted/20">
        <DialogHeader>
          <DialogTitle className="text-foreground">Generate Report</DialogTitle>
          <DialogDescription className="text-on-surface-variant">
            AI will create a comprehensive report from your documents.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-title" className="text-foreground">Title (optional)</Label>
              <Input
                id="report-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Analysis Report"
                className="input-glass"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Sections (optional)</Label>
              <div className="flex gap-2">
                <Input
                  value={sectionInput}
                  onChange={(e) => setSectionInput(e.target.value)}
                  placeholder="Executive Summary"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSection())}
                  className="input-glass"
                />
                <button
                  type="button"
                  onClick={addSection}
                  className="rounded-lg px-3 py-2 text-sm text-primary hover:bg-primary/10 transition-colors"
                >
                  Add
                </button>
              </div>
              {sections.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {sections.map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSection(i)}
                        className="hover:text-red-400"
                      >
                        <span className="material-icon text-[14px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-sm text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="material-icon text-[16px] animate-spin">progress_activity</span>
                  Generating...
                </span>
              ) : (
                "Generate"
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
