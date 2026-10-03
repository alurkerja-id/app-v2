import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

/** Change vs the previous equal-length period. `goodDown` flips the colour for metrics where lower is better. */
export function DeltaBadge({ delta, unit = "%", goodDown = false }: { delta: number | null; unit?: "%" | "pp"; goodDown?: boolean }) {
  if (delta == null) return <span className="text-[11px] text-muted-foreground">no prior data</span>
  if (Math.round(delta * 10) === 0) return <span className="text-[11px] text-muted-foreground">no change</span>
  const up = delta > 0
  const good = goodDown ? !up : up
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-medium",
        good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
      )}
    >
      <HugeiconsIcon icon={up ? ArrowUp01Icon : ArrowDown01Icon} className="size-3" />
      {Math.abs(delta).toFixed(unit === "pp" ? 1 : 0)}
      {unit === "pp" ? " pp" : "%"}
      <span className="font-normal text-muted-foreground">vs prev</span>
    </span>
  )
}

/**
 * Headline metric tile. No .xlsx download: a single number has nothing to
 * tabulate — the exports live on the chart and table cards.
 */
export function KpiCard({
  icon,
  label,
  value,
  sub,
  delta,
  deltaUnit,
  goodDown,
  accent,
  footer,
}: {
  icon: typeof ArrowUp01Icon
  label: string
  value: string
  sub?: string
  delta?: number | null
  deltaUnit?: "%" | "pp"
  goodDown?: boolean
  /** Tailwind classes for the icon chip. */
  accent?: string
  footer?: React.ReactNode
}) {
  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", accent ?? "bg-muted text-foreground/70")}>
            <HugeiconsIcon icon={icon} className="size-4" />
          </span>
          <span className="min-w-0 flex-1 truncate text-xs">{label}</span>
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
        <div className="mt-1 flex min-h-4 items-center justify-between gap-2">
          {sub ? <span className="truncate text-[11px] text-muted-foreground">{sub}</span> : <span />}
          {delta !== undefined && <DeltaBadge delta={delta} unit={deltaUnit} goodDown={goodDown} />}
        </div>
        {footer}
      </CardContent>
    </Card>
  )
}
