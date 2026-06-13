"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CreateWorkspaceDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  redirectOnCreate?: boolean
}

export function CreateWorkspaceDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  redirectOnCreate = true,
}: CreateWorkspaceDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(controlledOpen ?? false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen)
    }
  }, [controlledOpen])

  function handleOpenChange(val: boolean) {
    setOpen(val)
    controlledOnOpenChange?.(val)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to create workspace")
        setLoading(false)
        return
      }

      const workspace = await res.json()
      handleOpenChange(false)
      setName("")
      setDescription("")

      if (redirectOnCreate) {
        router.push(`/workspace/${workspace.id}`)
      } else {
        router.refresh()
      }
    } catch {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your documents, chats, and more.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Name</Label>
              <Input
                id="workspace-name"
                placeholder="My Workspace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace-desc">Description (optional)</Label>
              <Textarea
                id="workspace-desc"
                placeholder="What is this workspace for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
