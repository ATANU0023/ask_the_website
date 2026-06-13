"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

interface UsageDataPoint {
  date: string
  tokens: number
  actions: number
}

interface UsageChartProps {
  data: UsageDataPoint[]
}

export function UsageChart({ data }: UsageChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Usage (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <BarChart3 className="h-8 w-8 mr-2" />
            <span>No usage data yet</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxTokens = Math.max(...data.map((d) => d.tokens), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Usage (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-[200px]">
          {data.map((point) => (
            <div
              key={point.date}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-[10px] text-muted-foreground">
                {point.tokens}
              </span>
              <div
                className="w-full bg-primary/20 rounded-t"
                style={{
                  height: `${(point.tokens / maxTokens) * 150}px`,
                }}
              >
                <div
                  className="w-full bg-primary rounded-t transition-all"
                  style={{
                    height: `${(point.actions / Math.max(...data.map((d) => d.actions), 1)) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {new Date(point.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
