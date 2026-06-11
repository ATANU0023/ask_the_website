"use client"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CitationBadge } from "@/components/chat/citation-badge"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface Citation {
  sourceId: string
  sourceTitle: string
  sourceType: string
  pageNumber?: number
  section?: string
  textSnippet: string
}

interface Message {
  id: string
  role: string
  content: string
  citations?: Citation[]
  createdAt: string
}

interface ChatWindowProps {
  sessionId: string
  workspaceId: string
  initialMessages?: Message[]
  citations?: Citation[]
  onToggleSources?: () => void
}

export function ChatWindow({
  sessionId,
  workspaceId,
  initialMessages = [],
  onToggleSources,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setMessages(initialMessages)
  }, [sessionId, initialMessages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    const assistantId = crypto.randomUUID()
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      citations: [],
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    abortRef.current = new AbortController()

    try {
      const res = await fetch(`/api/workspace/${workspaceId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error("Failed to send message")

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""
      let eventType = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim()
            continue
          }
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === '"[DONE]"') {
              eventType = ""
              continue
            }

            try {
              const parsed = JSON.parse(data)
              if (eventType === "citation") {
                const citation = parsed as Citation
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, citations: [...(m.citations || []), citation] }
                      : m
                  )
                )
              } else if (typeof parsed === "string") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + parsed }
                      : m
                  )
                )
              }
            } catch {
              // raw data, skip
            }
            eventType = ""
          }
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, I encountered an error. Please try again." }
            : m
        )
      )
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  function handleStop() {
    abortRef.current?.abort()
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-medium text-foreground">Chat</h3>
        <button
          onClick={onToggleSources}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-colors"
        >
          <span className="material-icon text-[16px]">source</span>
          Sources
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="material-icon text-[56px] text-on-surface-variant/30 mb-4">forum</span>
            <h3 className="text-base font-medium text-foreground">Start a conversation</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Ask questions about your documents and workspace
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <Avatar className="h-8 w-8 mt-1 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <span className="material-icon text-[16px]">bolt</span>
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "rounded-xl px-4 py-3 max-w-[75%]",
                  msg.role === "user"
                    ? "bg-primary/10 text-foreground"
                    : "glass-card"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-code:text-primary prose-a:text-primary">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content || (loading ? "" : "")}
                    </ReactMarkdown>
                    {loading && msg.content === "" && (
                      <div className="flex gap-1.5 mt-2">
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.1s]" />
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap text-foreground">{msg.content}</p>
                )}
                {msg.role === "assistant" &&
                  msg.citations &&
                  msg.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
                      {msg.citations.map((citation, i) => (
                        <CitationBadge
                          key={`${citation.sourceId}-${i}`}
                          sourceTitle={citation.sourceTitle}
                          sourceType={citation.sourceType}
                          pageNumber={citation.pageNumber}
                          section={citation.section}
                        />
                      ))}
                    </div>
                  )}
              </div>
              {msg.role === "user" && (
                <Avatar className="h-8 w-8 mt-1 shrink-0">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                    U
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input Bar */}
      <div className="p-4 shrink-0 border-t border-border">
        <div className="flex items-end gap-2">
          <div className="input-glass flex items-end gap-2 px-4 py-3 flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-on-surface-variant/40 resize-none max-h-32"
              rows={1}
              disabled={loading}
            />
            <div className="flex items-center gap-1 shrink-0">
              <button className="flex h-7 w-7 items-center justify-center rounded text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-colors">
                <span className="material-icon text-[18px]">attach_file</span>
              </button>
            </div>
          </div>
          {loading ? (
            <button
              onClick={handleStop}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors shrink-0"
            >
              <span className="material-icon text-[20px]">stop</span>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <span className="material-icon text-[20px]">send</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
