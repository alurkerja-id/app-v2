import type { ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { useT, type L10n, type Text } from "./i18n"
import type { Issue } from "./types"

/**
 * Label, required mark, hint and messages around a runtime control — the
 * same layout as a field in the task Form tab (small muted label on top).
 */
export function FieldShell({
  label,
  required,
  htmlFor,
  labelId,
  hint,
  issues = [],
  children,
  className,
}: {
  label: L10n
  required?: boolean
  htmlFor?: string
  labelId?: string
  hint?: Text
  issues?: Issue[]
  children: ReactNode
  className?: string
}) {
  const t = useT()
  const msgs = [...new Set(issues.map((i) => t(i.msg)))]
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} id={labelId} className="text-xs text-muted-foreground">
        {t(label)}
        {required && (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{t(hint)}</p>}
      {msgs.map((m) => (
        <p key={m} role="alert" className="text-xs font-medium text-destructive">
          {m}
        </p>
      ))}
    </div>
  )
}

/* ── canvas helpers (static previews in the builder) ─────────────────────── */

/** Looks like an input, but is only a picture of one. */
export function GhostInput({ children, className, select }: { children?: ReactNode; className?: string; select?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-9 min-w-0 items-center justify-between gap-2 rounded-3xl bg-[var(--input-surface)] px-3 text-sm text-muted-foreground shadow-[var(--input-depth)]",
        className,
      )}
    >
      <span className="truncate">{children}</span>
      {select && <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 shrink-0 text-muted-foreground" />}
    </div>
  )
}

/** "1 · Very poor ……… 5 · Excellent" under a scale. */
export function ScaleEnds({ low, high, className }: { low: ReactNode; high: ReactNode; className?: string }) {
  return (
    <div className={cn("flex justify-between gap-4 text-xs text-muted-foreground", className)}>
      <span>{low}</span>
      <span className="text-right">{high}</span>
    </div>
  )
}
