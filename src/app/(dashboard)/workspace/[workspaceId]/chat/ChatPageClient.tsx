"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChatHistory } from "@/components/chat/ChatHistory"
import { ChatWindow } from "@/components/chat/ChatWindow"

interface ChatSession {
  id: string
  title: string | null
  createdAt: string
}

interface Message {
  id: string
  role: string
  content: string
  citations?: any[]
  createdAt: string
}

interface ChatPageClientProps {
  workspaceId: string
  userId: string
  activeSessionId?: string
}

export function ChatPageClient({
  workspaceId,
  userId,
  activeSessionId,
}: ChatPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [showSources, setShowSources] = useState(true)

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch(`/api/workspace/${workspaceId}/chat/sessions`)
        if (res.ok) {
          const data = await res.json()
          setSessions(data)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [workspaceId])

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([])
      return
    }
    async function fetchMessages() {
      try {
        const res = await fetch(
          `/api/workspace/${workspaceId}/chat/sessions/${activeSessionId}`
        )
        if (res.ok) {
          const data = await res.json()
          setMessages(data)
        }
      } catch {
        // ignore
      }
    }
    fetchMessages()
  }, [activeSessionId, workspaceId])

  const handleNewSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/chat/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        const session = await res.json()
        setSessions((prev) => [session, ...prev])
        const params = new URLSearchParams(searchParams.toString())
        params.set("session", session.id)
        router.push(`/workspace/${workspaceId}/chat?${params.toString()}`)
      }
    } catch {
      // ignore
    }
  }, [workspaceId, userId, router, searchParams])

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    try {
      await fetch(
        `/api/workspace/${workspaceId}/chat/sessions/${sessionId}`,
        { method: "DELETE" }
      )
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch {
      // ignore
    }
  }, [workspaceId])

  // Collect all citations from current messages
  const allCitations = messages.flatMap((m) => m.citations || []).filter(Boolean)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-on-surface-variant">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full rounded-xl overflow-hidden glass-card-strong">
      {/* Chat History Sidebar */}
      <div className="w-64 shrink-0 border-r border-border">
        <ChatHistory
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set("session", id)
            router.push(`/workspace/${workspaceId}/chat?${params.toString()}`)
          }}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeSessionId ? (
          <ChatWindow
            sessionId={activeSessionId}
            workspaceId={workspaceId}
            initialMessages={messages}
            citations={allCitations}
            onToggleSources={() => setShowSources(!showSources)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <span className="material-icon text-[64px] text-on-surface-variant/30 mb-4">chat</span>
            <h3 className="text-lg font-medium text-foreground">No Chat Selected</h3>
            <p className="text-sm text-on-surface-variant mt-1 mb-4">
              Select a chat session from the sidebar or start a new one
            </p>
          </div>
        )}
      </div>

      {/* Sources Sidebar */}
      {activeSessionId && showSources && (
        <div className="w-72 shrink-0 border-l border-border overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">Sources</h3>
              <button
                onClick={() => setShowSources(false)}
                className="flex h-6 w-6 items-center justify-center rounded text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-colors"
              >
                <span className="material-icon text-[16px]">close</span>
              </button>
            </div>
            {allCitations.length === 0 ? (
              <p className="text-xs text-on-surface-variant/60">
                Sources will appear here when the AI references documents
              </p>
            ) : (
              <div className="space-y-3">
                {allCitations.map((citation: any, i: number) => (
                  <div key={i} className="glass-card p-3">
                    <div className="flex items-start gap-2">
                      <span className="material-icon text-[16px] text-primary shrink-0 mt-0.5">description</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {citation.sourceTitle || "Document"}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {citation.sourceType}
                          {citation.pageNumber ? ` · p.${citation.pageNumber}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant/70 mt-2 line-clamp-3">
                      {citation.textSnippet}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
