"use client"

import { PropsWithChildren } from "react"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toast"

export const Providers = ({ children }: PropsWithChildren) => {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
