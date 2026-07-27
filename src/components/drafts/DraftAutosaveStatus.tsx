import { HugeiconsIcon } from "@hugeicons/react"
import { Clock01Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { formatClockTime } from "@/lib/drafts"
import type { DraftSaveStatus } from "@/hooks/use-draft"
import { cn } from "@/lib/utils"

interface DraftAutosaveStatusProps {
  status: DraftSaveStatus
  savedAt: string | null
  className?: string
}

export function DraftAutosaveStatus({ status, savedAt, className }: DraftAutosaveStatusProps) {
  if (status === "idle" && !savedAt) return null

  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      {status === "saving" ? (
        <>
          <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
          Saving draft…
        </>
      ) : (
        <>
          <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
          Draft saved{savedAt ? ` at ${formatClockTime(savedAt)}` : ""}
        </>
      )}
    </p>
  )
}
