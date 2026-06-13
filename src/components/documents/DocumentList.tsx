"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/toast"
import { IngestWebsiteDialog } from "@/components/documents/IngestWebsiteDialog"

interface Document {
  id: string
  title: string
  sourceType: string
  status: string
  createdAt: string
  fileType?: string | null
}

interface DocumentListProps {
  documents: Document[]
  workspaceId: string
}

const fileIconColors: Record<string, string> = {
  pdf: "text-red-400 bg-red-400/10",
  docx: "text-blue-400 bg-blue-400/10",
  doc: "text-blue-400 bg-blue-400/10",
  pptx: "text-orange-400 bg-orange-400/10",
  ppt: "text-orange-400 bg-orange-400/10",
  json: "text-green-400 bg-green-400/10",
  csv: "text-green-400 bg-green-400/10",
  txt: "text-zinc-400 bg-zinc-400/10",
  md: "text-purple-400 bg-purple-400/10",
  website: "text-cyan-400 bg-cyan-400/10",
}

function getFileIcon(doc: Document): string {
  const type = doc.fileType?.toLowerCase() || doc.sourceType?.toLowerCase() || ""
  if (type === "website" || type === "url") return "language"
  if (type.includes("pdf")) return "picture_as_pdf"
  if (type.includes("docx") || type.includes("doc")) return "article"
  if (type.includes("pptx") || type.includes("ppt")) return "slideshow"
  if (type.includes("json") || type.includes("csv")) return "data_array"
  if (type.includes("txt") || type.includes("md")) return "text_snippet"
  return "description"
}

function getFileTypeLabel(doc: Document): string {
  if (doc.sourceType === "website") return "Website"
  if (doc.fileType) return doc.fileType.toUpperCase()
  return doc.sourceType.toUpperCase()
}

function getFileColor(doc: Document): string {
  const type = doc.fileType?.toLowerCase() || doc.sourceType?.toLowerCase() || ""
  if (type === "website" || type === "url") return "text-cyan-400 bg-cyan-400/10"
  if (type.includes("pdf")) return "text-red-400 bg-red-400/10"
  if (type.includes("docx") || type.includes("doc")) return "text-blue-400 bg-blue-400/10"
  if (type.includes("pptx") || type.includes("ppt")) return "text-orange-400 bg-orange-400/10"
  if (type.includes("json") || type.includes("csv")) return "text-green-400 bg-green-400/10"
  if (type.includes("txt")) return "text-zinc-400 bg-zinc-400/10"
  if (type.includes("md")) return "text-purple-400 bg-purple-400/10"
  return "text-primary bg-primary/10"
}

function getRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export function DocumentList({ documents, workspaceId }: DocumentListProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  )

  async function handleUpload(file: File) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("workspaceId", workspaceId)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        toast({ title: "Document uploaded", description: `${file.name} has been processed` })
        router.refresh()
      } else {
        const data = await res.json()
        toast({ title: "Upload failed", description: data.error || "Something went wrong" })
      }
    } catch {
      toast({ title: "Upload failed", description: "An unexpected error occurred" })
    }
  }

  async function handleDelete(docId: string) {
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/documents/${docId}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Document deleted" })
        router.refresh()
      } else {
        toast({ title: "Failed to delete document" })
      }
    } catch {
      toast({ title: "Failed to delete document" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex items-center gap-3">
        <div className="input-glass flex items-center gap-2 px-3 py-2 flex-1 max-w-md">
          <span className="material-icon text-on-surface-variant text-[18px]">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-on-surface-variant/40"
          />
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <span className="material-icon text-[18px]">upload</span>
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.pptx,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file)
          }}
        />
        <IngestWebsiteDialog workspaceId={workspaceId} />
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files[0]
          if (file) handleUpload(file)
        }}
        className={cn(
          "glass-card p-8 text-center transition-all duration-200 cursor-pointer",
          dragOver ? "border-primary/50 bg-primary/5" : ""
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container">
            <span className="material-icon text-on-surface-variant text-[24px]">cloud_upload</span>
          </div>
          <p className="text-sm font-medium text-foreground">Drop files here or click to upload</p>
          <p className="text-xs text-on-surface-variant">PDF, DOCX, PPTX (max 10MB)</p>
        </div>
      </div>

      {/* File Cards Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <span className="material-icon text-[48px] text-on-surface-variant/40 mb-3 block">description</span>
          <p className="text-sm text-on-surface-variant">
            {search ? "No documents match your search" : "No documents yet"}
          </p>
          <p className="text-xs text-on-surface-variant/60 mt-1">
            Upload a document or ingest a website to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="glass-card p-4 group relative cursor-pointer hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", getFileColor(doc))}>
                  <span className="material-icon text-[20px]">{getFileIcon(doc)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{getFileTypeLabel(doc)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant/60">{getRelativeTime(doc.createdAt)}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  doc.status === "ready" ? "bg-green-400/10 text-green-400" :
                  doc.status === "processing" ? "bg-amber-400/10 text-amber-400" :
                  doc.status === "error" ? "bg-red-400/10 text-red-400" :
                  "bg-on-surface-variant/10 text-on-surface-variant"
                )}>
                  {doc.status}
                </span>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded text-on-surface-variant/40 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <span className="material-icon text-[16px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Synthesis Summary */}
      {filtered.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icon text-primary text-[18px]">summarize</span>
            <h3 className="text-sm font-medium text-foreground">Synthesis Summary</h3>
          </div>
          <p className="text-sm text-on-surface-variant">
            {filtered.length} document{filtered.length !== 1 ? "s" : ""} available for analysis.
            {filtered.some((d) => d.status === "ready")
              ? " Ready documents can be used in chat, flashcards, and quizzes."
              : " Documents are still being processed."}
          </p>
        </div>
      )}
    </div>
  )
}
