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

interface GenerateQuizDialogProps {
  workspaceId: string
  documentIds?: string[]
}

export function GenerateQuizDialog({
  workspaceId,
  documentIds = [],
}: GenerateQuizDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(5)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/workspace/${workspaceId}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds,
          count,
          questionTypes: ["multiple_choice", "true_false"],
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast({ title: "Failed to generate quiz", description: data.error })
        return
      }

      toast({ title: "Quiz generated!" })
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
      <DialogContent className="bg-surface-container border border-outline-muted/20">
        <DialogHeader>
          <DialogTitle className="text-foreground">Generate Quiz</DialogTitle>
          <DialogDescription className="text-on-surface-variant">
            AI will create a quiz from your documents.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-count" className="text-foreground">Number of questions</Label>
              <Input
                id="quiz-count"
                type="number"
                min={1}
                max={30}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 5)}
                className="input-glass"
              />
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
