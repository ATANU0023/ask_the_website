"use client"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CitationBadge } from "@/components/chat/citation-badge"
import { LoadingShimmer } from "@/components/chat/loading-shimmer"
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
  onTitleUpdate?: (title: string) => void
}

export function ChatWindow({
  sessionId,
  workspaceId,
  initialMessages = [],
  onToggleSources,
  onTitleUpdate,
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

    const provider = typeof window !== "undefined"
      ? (localStorage.getItem("llmProvider") || "gemini")
      : "gemini"

    try {
      const res = await fetch(`/api/workspace/${workspaceId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
          provider,
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
              if (eventType === "title_update") {
                onTitleUpdate?.(parsed as string)
                eventType = ""
                continue
              }
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


      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-12 py-8 pb-40 space-y-10 custom-scrollbar">
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
                "flex items-start gap-6 max-w-4xl",
                msg.role === "user" ? "flex-row-reverse ml-auto" : ""
              )}
            >
              {msg.role === "assistant" ? null : (
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center border border-outline-muted mt-1">
                  <span className="material-icon text-on-surface-variant">person</span>
                </div>
              )}

              <div
                className={cn(
                  "pt-1 flex-1",
                  msg.role === "user" ? "space-y-2 text-right" : "space-y-4"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="font-body-md text-body-md text-on-surface leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-headings:font-headline-lg prose-headings:text-primary prose-strong:text-foreground prose-code:font-code-sm prose-a:text-primary">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {(msg.content || "").replace(/\[citation:[\d,\s]+\]/g, "")}
                    </ReactMarkdown>
                    {loading && msg.content === "" && <LoadingShimmer />}
                  </div>
                ) : (
                  <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">{msg.content}</p>
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
            </div>
          ))
        )}
      </div>

      {/* Input Bar */}
      <div className="pb-4 bg-gradient-to-t from-background via-background to-transparent p-4 shrink-0 absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <div className="max-w-4xl mx-auto glass-card rounded-2xl p-2 shadow-2xl focus-within:ring-2 focus-within:ring-primary/40 transition-all pointer-events-auto">
          <div className="flex items-end gap-2">
            <button className="p-3 text-on-surface-variant hover:text-primary transition-colors" title="Upload Document">
              <span className="material-icon">attach_file</span>
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-on-surface font-body-md py-3 resize-none custom-scrollbar max-h-32 placeholder:text-outline"
              placeholder="Ask anything about Project Alpha..."
              rows={1}
              style={{ overflowY: "hidden" }}
              disabled={loading}
              ref={(el) => {
                if (el) {
                  el.style.height = "auto"
                  el.style.height = el.scrollHeight + "px"
                }
              }}
            />
            {loading ? (
              <button
                onClick={handleStop}
                className="bg-error/10 text-error p-3 rounded-xl active:scale-95 transition-transform shadow-lg hover:opacity-90"
              >
                <span className="material-icon">stop</span>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-primary-container text-on-primary-container p-3 rounded-xl active:scale-95 transition-transform shadow-lg hover:opacity-90 disabled:opacity-50"
              >
                <span className="material-icon" style={{ fontVariationSettings: '"FILL" 1' }}>send</span>
              </button>
            )}
          </div>
        </div>
        <p className="text-center mt-3 text-[11px] text-on-surface-variant/50 pointer-events-auto">Kiwi can make mistakes. Verify important information with citations.</p>
      </div>
    </div>
  )
}
