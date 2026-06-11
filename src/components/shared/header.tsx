"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Menu } from "lucide-react"

interface SearchResult {
  documents: Array<{ id: string; title: string; sourceType: string; url?: string }>
  chunks: Array<{ id: string; content: string; documentId: string }>
  messages: Array<{ id: string; content: string; role: string; sessionId: string }>
}

interface HeaderProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  onMenuClick: () => void
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<SearchResult | null>(null)
  const [searching, setSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [searchOpen])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults(null)
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=all`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        }
      } catch {
        // ignore
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <header className="glass-header flex h-16 items-center gap-4 px-6 shrink-0">
      <Button variant="ghost" size="icon" className="lg:hidden text-on-surface-variant hover:text-foreground" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogTrigger asChild>
            <div className="input-glass flex items-center gap-2 px-3 py-2 cursor-pointer">
              <span className="material-icon text-on-surface-variant text-[18px]">search</span>
              <span className="text-sm text-on-surface-variant/60">Search documents, chats...</span>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col bg-surface-container border border-outline-muted/20">
            <div className="input-glass flex items-center gap-3 px-4 py-3">
              <span className="material-icon text-on-surface-variant">search</span>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all workspaces..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-on-surface-variant/40"
              />
            </div>
            <div className="flex-1 overflow-y-auto mt-3 space-y-4 px-1">
              {searching && (
                <p className="text-sm text-on-surface-variant text-center py-8">Searching...</p>
              )}
              {!searching && !results && searchQuery && (
                <p className="text-sm text-on-surface-variant text-center py-8">No results found</p>
              )}
              {!searching && !searchQuery && (
                <p className="text-sm text-on-surface-variant text-center py-8">
                  Type to search documents, chunks, and chat messages
                </p>
              )}
              {results && results.documents && results.documents.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-on-surface-variant mb-2 flex items-center gap-2 px-1">
                    <span className="material-icon text-[16px]">description</span>
                    Documents ({results.documents.length})
                  </h4>
                  <div className="space-y-1">
                    {results.documents.slice(0, 5).map((doc) => (
                      <button
                        key={doc.id}
                        className="w-full text-left text-sm px-3 py-2.5 rounded-lg hover:bg-surface-container-high transition-colors"
                        onClick={() => {
                          setSearchOpen(false)
                          router.push(`/workspace/${doc.id}/documents`)
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-icon text-[16px] text-on-surface-variant">
                            {doc.sourceType === "website" ? "language" : "description"}
                          </span>
                          <span className="truncate">{doc.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {results && results.chunks && results.chunks.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-on-surface-variant mb-2 flex items-center gap-2 px-1">
                    <span className="material-icon text-[16px]">article</span>
                    Content Matches ({results.chunks.length})
                  </h4>
                  <div className="space-y-1">
                    {results.chunks.slice(0, 5).map((chunk) => (
                      <button
                        key={chunk.id}
                        className="w-full text-left text-sm px-3 py-2.5 rounded-lg hover:bg-surface-container-high transition-colors"
                        onClick={() => setSearchOpen(false)}
                      >
                        <p className="line-clamp-2 text-on-surface-variant">
                          {chunk.content.substring(0, 200)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {results && results.messages && results.messages.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-on-surface-variant mb-2 flex items-center gap-2 px-1">
                    <span className="material-icon text-[16px]">chat</span>
                    Chat Messages ({results.messages.length})
                  </h4>
                  <div className="space-y-1">
                    {results.messages.slice(0, 5).map((msg) => (
                      <button
                        key={msg.id}
                        className="w-full text-left text-sm px-3 py-2.5 rounded-lg hover:bg-surface-container-high transition-colors"
                        onClick={() => setSearchOpen(false)}
                      >
                        <span className="text-xs font-medium uppercase text-on-surface-variant mr-2">
                          [{msg.role}]
                        </span>
                        <span className="line-clamp-1">{msg.content.substring(0, 150)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-colors">
          <span className="material-icon text-[20px]">notifications</span>
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-colors">
          <span className="material-icon text-[20px]">ios_share</span>
        </button>
      </div>
    </header>
  )
}
