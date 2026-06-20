"use client"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"

const loadingMessages = [
  "Thinking…",
  "Searching…",
  "Analyzing…",
]

export function LoadingShimmer() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="shimmer-text">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -5, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {loadingMessages[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}
