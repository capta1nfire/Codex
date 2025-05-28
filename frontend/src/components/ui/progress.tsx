"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const safeValue = Math.min(Math.max(value, 0), 100)
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            // Corporate colors based on progress value
            safeValue > 80 ? "bg-amber-500" : 
            safeValue > 60 ? "bg-orange-500" : 
            "bg-gradient-to-r from-blue-500 to-blue-600"
          )}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress } 