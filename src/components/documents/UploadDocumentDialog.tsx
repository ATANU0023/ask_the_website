"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Upload, FileUp, X } from "lucide-react"
import { toast } from "@/components/ui/toast"

interface UploadDocumentDialogProps {
  workspaceId: string
}

export function UploadDocumentDialog({ workspaceId }: UploadDocumentDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError("")
    setProgress(10)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("workspaceId", workspaceId)

      setProgress(30)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      setProgress(90)

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to upload document")
        setLoading(false)
        return
      }

      setProgress(100)
      toast({ title: "Document uploaded", description: `${file.name} has been processed` })

      setOpen(false)
      setFile(null)
      setProgress(0)
      router.refresh()
    } catch {
      setError("Something went wrong")
      toast({ title: "Upload failed", description: "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a PDF, DOCX, or PPTX file (max 10MB).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent transition-colors"
              onClick={() => !loading && inputRef.current?.click()}
            >
              {file ? (
                <div className="space-y-2">
                  <FileUp className="h-8 w-8 mx-auto text-primary" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {!loading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Drop a file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOCX, or PPTX up to 10MB
                  </p>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {loading && (
              <Progress value={progress} className="h-2" />
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setFile(null)
                setError("")
                setProgress(0)
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
