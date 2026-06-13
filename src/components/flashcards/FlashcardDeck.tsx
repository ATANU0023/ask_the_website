"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { GenerateFlashcardDialog } from "./GenerateFlashcardDialog"

interface Flashcard {
  id: string
  question: string
  answer: string
  source?: string | null
}

interface FlashcardDeckProps {
  flashcards: Flashcard[]
  workspaceId: string
}

export function FlashcardDeck({ flashcards, workspaceId }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [mastered, setMastered] = useState<Set<string>>(new Set())
  const [review, setReview] = useState<Set<string>>(new Set())

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <span className="material-icon text-[32px] text-primary">style</span>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">No flashcards yet</h3>
          <p className="text-sm text-on-surface-variant max-w-sm">
            Generate flashcards from your documents to study key concepts
          </p>
        </div>
        <GenerateFlashcardDialog workspaceId={workspaceId} />
      </div>
    )
  }

  const current = flashcards[currentIndex]
  const totalCards = flashcards.length
  const progress = ((currentIndex + 1) / totalCards) * 100

  function shuffle() {
    setCurrentIndex(Math.floor(Math.random() * flashcards.length))
    setFlipped(false)
  }

  function goNext() {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setFlipped(false)
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setFlipped(false)
    }
  }

  function handleMastered() {
    setMastered((prev) => new Set(prev).add(current.id))
    goNext()
  }

  function handleReview() {
    setReview((prev) => new Set(prev).add(current.id))
    goNext()
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Card Column */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">
            Card {currentIndex + 1} of {totalCards}
          </span>
          <div className="flex gap-2">
            <button
              onClick={shuffle}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-colors"
            >
              <span className="material-icon text-[16px]">shuffle</span>
              Shuffle
            </button>
            <GenerateFlashcardDialog workspaceId={workspaceId} />
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Flashcard 3D Flip */}
        <div
          className="perspective-1000 flex-1 cursor-pointer"
          onClick={() => setFlipped(!flipped)}
        >
          <div className={cn(
            "relative w-full h-full min-h-[320px] preserve-3d transition-transform duration-500",
            flipped && "rotate-y-180"
          )}>
            {/* Front: Question */}
            <div className="glass-card absolute inset-0 backface-hidden flex flex-col p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icon text-on-surface-variant text-[18px]">lightbulb</span>
                <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Question</span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xl text-center font-medium text-foreground leading-relaxed">
                  {current.question}
                </p>
              </div>
              <p className="text-xs text-on-surface-variant/60 text-center mt-4">
                Click to reveal answer
              </p>
            </div>

            {/* Back: Answer */}
            <div className="glass-card absolute inset-0 backface-hidden rotate-y-180 flex flex-col p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icon text-primary text-[18px]">check_circle</span>
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Answer</span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xl text-center font-medium text-foreground leading-relaxed">
                  {current.answer}
                </p>
              </div>
              {current.source && (
                <p className="text-xs text-on-surface-variant/60 text-center mt-4">
                  Source: {current.source}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-on-surface-variant hover:text-foreground hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-icon text-[18px]">chevron_left</span>
            Previous
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleMastered}
              className="rounded-lg px-5 py-2 text-sm font-medium bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-colors"
            >
              <span className="material-icon text-[16px] mr-1.5 align-middle">check_circle</span>
              Mastered
            </button>
            <button
              onClick={handleReview}
              className="rounded-lg px-5 py-2 text-sm font-medium bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors"
            >
              <span className="material-icon text-[16px] mr-1.5 align-middle">refresh</span>
              Need Review
            </button>
          </div>

          <button
            onClick={goNext}
            disabled={currentIndex === flashcards.length - 1}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-on-surface-variant hover:text-foreground hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <span className="material-icon text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Stats Sidebar */}
      <div className="col-span-12 lg:col-span-4">
        <div className="glass-card p-5 space-y-5">
          <h3 className="text-sm font-medium text-foreground">Study Session</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-icon text-[18px] text-primary">credit_card</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{totalCards}</p>
                <p className="text-xs text-on-surface-variant">Cards in Deck</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-400/10">
                <span className="material-icon text-[18px] text-green-400">check_circle</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{mastered.size}</p>
                <p className="text-xs text-on-surface-variant">Mastered</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                <span className="material-icon text-[18px] text-amber-400">refresh</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{review.size}</p>
                <p className="text-xs text-on-surface-variant">Needs Review</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-icon text-[18px] text-primary">trending_up</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{currentIndex + 1}</p>
                <p className="text-xs text-on-surface-variant">Progress</p>
              </div>
            </div>
          </div>

          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
