"use client"

import { useState, FormEvent } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  className?: string
}

export function SearchBar({ placeholder = "Search...", onSearch, className }: SearchBarProps) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </form>
  )
}
