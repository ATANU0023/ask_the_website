"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface ChatSession {
  id: string
  title: string | null
  createdAt: string
}

interface ChatHistoryProps {
  sessions: ChatSession[]
  activeSessionId?: string
  onSelectSession: (id: string) => void
  onNewSession: () => void
  onDeleteSession: (id: string) => void
}

export function ChatHistory({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: ChatHistoryProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <button
          onClick={onNewSession}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <span className="material-icon text-[18px]">add</span>
          New Chat
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">
              No chat sessions yet
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                  activeSessionId === session.id
                    ? "bg-primary/10 text-foreground"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-foreground"
                )}
                onClick={() => onSelectSession(session.id)}
              >
                <span className="material-icon text-[16px] shrink-0">chat</span>
                <span className="truncate flex-1">
                  {session.title || "Untitled Chat"}
                </span>
                <button
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded text-on-surface-variant hover:text-red-400 hover:bg-red-400/10 transition-all"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSession(session.id)
                  }}
                >
                  <span className="material-icon text-[14px]">delete</span>
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
