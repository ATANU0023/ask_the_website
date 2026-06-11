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
    <div className="flex h-full">
      {/* Chat History Sidebar */}
      <div className="w-64 shrink-0 border-r border-outline-muted bg-surface-container-lowest flex flex-col">
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
      <div className="flex-1 flex flex-col min-w-0 h-full bg-background relative">
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
        <aside className="w-80 h-full border-l border-outline-muted bg-surface-container-lowest flex flex-col p-gutter overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider">Sources</h2>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                {allCitations.length} CITED
              </span>
              <button
                onClick={() => setShowSources(false)}
                className="flex h-6 w-6 items-center justify-center rounded text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-colors"
              >
                <span className="material-icon text-[16px]">close</span>
              </button>
            </div>
          </div>
          {allCitations.length === 0 ? (
            <p className="text-xs text-on-surface-variant/60 italic">
              Sources will appear here when the AI references documents
            </p>
          ) : (
            <div className="space-y-6">
              {allCitations.map((citation: any, i: number) => (
                <div key={i} className="glass-card rounded-xl p-4 transition-all cursor-pointer group">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-5 h-5 flex items-center justify-center bg-primary text-on-primary rounded text-[10px] font-bold">{i + 1}</span>
                    <span className="text-xs font-medium text-on-surface-variant truncate">
                      {citation.sourceTitle || "Document"}
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-on-surface-variant line-clamp-4 italic group-hover:text-on-surface transition-colors">
                    "{citation.textSnippet}"
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-primary text-[11px] font-semibold uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Open Document</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      )}
    </div>
  )
}
