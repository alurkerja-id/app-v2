import { useState } from "react"
import { endOfDay, format, startOfDay } from "date-fns"
import type { DateRange } from "react-day-picker"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { STANDARD_PRESETS, type DateRangeValue, type RangePreset } from "@/lib/date-presets"

/** Trigger chrome — same editable-field depth as Input / Select. */
export const dateTriggerClass =
  "flex h-9 items-center justify-between gap-2 rounded-3xl border border-transparent bg-[var(--input-surface)] shadow-[var(--input-depth)] [&:hover:not(:focus-visible):not(:disabled)]:shadow-[var(--input-depth-hover)] focus-visible:shadow-[var(--input-depth-focus)] disabled:shadow-none px-3 py-1 text-left text-sm transition-[color,box-shadow,background-color] outline-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground"

export function formatRange(r: { from?: Date; to?: Date } | undefined) {
  if (!r?.from) return "Pick a range"
  if (!r.to) return format(r.from, "d MMM yyyy")
  return r.from.getFullYear() === r.to.getFullYear()
    ? `${format(r.from, "d MMM")} – ${format(r.to, "d MMM yyyy")}`
    : `${format(r.from, "d MMM yyyy")} – ${format(r.to, "d MMM yyyy")}`
}

/**
 * The AlurKerja period picker (preset column + two-month range calendar), shared
 * by every dashboard and the /pages/form-component showcase.
 *
 * Picking a preset applies immediately. On the calendar the first click anchors a
 * new range and the second completes it (same day twice = a one-day range); a
 * half-picked range never reaches the dashboard. Selection is driven from the
 * clicked day rather than DayPicker's computed range: seeded with the current
 * range, DayPicker *adjusts* it on the first click, which would apply a mangled
 * range after a single click.
 */
export function DateRangePicker({
  value,
  preset,
  onChange,
  today = new Date(),
  presets = STANDARD_PRESETS,
  disabled = false,
  align = "start",
  className,
}: {
  value: DateRangeValue
  /** Label of the active preset, or null for a custom range. */
  preset: string | null
  onChange: (range: DateRangeValue, preset: string | null) => void
  /** Reference date for presets and the last selectable day. */
  today?: Date
  presets?: RangePreset[]
  disabled?: boolean
  align?: "start" | "end"
  className?: string
}) {
  const [open, setOpen] = useState(false)
  // What the calendar highlights: the applied range until the first click.
  const [draft, setDraft] = useState<DateRange | undefined>(value)
  const [anchor, setAnchor] = useState<Date | null>(null)

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) {
          setDraft(value)
          setAnchor(null)
        }
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} className={cn(dateTriggerClass, "min-w-0", className)}>
          <span className="flex min-w-0 items-center gap-2">
            <HugeiconsIcon icon={Calendar01Icon} className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{preset ?? formatRange(value)}</span>
          </span>
          {/* A preset name hides the actual dates — show them alongside, quietly. */}
          {preset && (
            <span className="hidden shrink-0 text-xs text-muted-foreground tabular-nums md:inline">{formatRange(value)}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex max-sm:flex-col">
          <div className="flex shrink-0 flex-col gap-0.5 border-r border-border p-2 max-sm:border-b max-sm:border-r-0">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onChange(p.range(today), p.label)
                  setOpen(false)
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                  preset === p.label
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Calendar
            mode="range"
            defaultMonth={value.from}
            selected={draft}
            onSelect={(_computed, day) => {
              if (!anchor) {
                setAnchor(day)
                setDraft({ from: day, to: undefined })
                return
              }
              const [a, b] = day < anchor ? [day, anchor] : [anchor, day]
              setAnchor(null)
              // endOfDay: a range "to 30 Sep" must include 30 Sep's records.
              onChange({ from: startOfDay(a), to: endOfDay(b) }, null)
              setOpen(false)
            }}
            numberOfMonths={2}
            disabled={{ after: today }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
