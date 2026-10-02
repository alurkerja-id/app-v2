import { DateRangePicker } from "@/components/dashboard/date-range-picker"
import { AddFilterMenu, FilterFacet } from "@/components/filters/typed-filter-controls"
import type { DateRangeValue, RangePreset } from "@/lib/date-presets"
import { activeCount, isActive, MAX_PINNED, type TypedFilterDef, type TypedValues } from "@/lib/typed-filters"

/* ────────────────────────────────────────────────────────────────────────
   Dashboard filter bar — "Pinned + Filter" (the Shopify Polaris model; with no
   pinned filters it is the Linear/Notion "add as needed" bar).

     [📅 Period] [scope…] [Pinned 1 ▾] [Pinned 2 ▾] [Added: value ×] [+ Filter]  Clear   …trailing

   • The period is always there, and always first — the same spot on every
     dashboard. Scope selectors (e.g. which process) come after it.
   • Up to MAX_PINNED filters keep a fixed-width slot even when empty, so
     setting one never moves the rest of the bar.
   • Everything else lives behind "+ Filter" and becomes a chip once applied.
     "Filter" rather than "More": it says what the button adds, and it reads the
     same whether or not a dashboard pins anything.
   • Every editor works on a draft and applies with Apply / Enter.
   • Clear resets every filter (not the period).
──────────────────────────────────────────────────────────────────────── */

export interface PeriodProps {
  value: DateRangeValue
  preset: string | null
  onChange: (range: DateRangeValue, preset: string | null) => void
  today?: Date
  presets?: RangePreset[]
}

export function FilterBar({
  period,
  filters = [],
  values = {},
  onValuesChange,
  leading,
  trailing,
}: {
  period: PeriodProps
  filters?: TypedFilterDef[]
  values?: TypedValues
  onValuesChange?: (next: TypedValues) => void
  /** Scope controls, placed right after the period (e.g. which process). */
  leading?: React.ReactNode
  /** View controls / actions, pushed to the right (e.g. heatmap mode, refresh). */
  trailing?: React.ReactNode
}) {
  const declared = filters.filter((f) => f.pinned)
  if (import.meta.env.DEV && declared.length > MAX_PINNED) {
    console.warn(`FilterBar: ${declared.length} pinned filters; only the first ${MAX_PINNED} are pinned.`)
  }
  const pinned = declared.slice(0, MAX_PINNED)
  const rest = filters.filter((f) => !pinned.includes(f))
  const set = (id: string, v: TypedValues[string]) => onValuesChange?.({ ...values, [id]: v })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangePicker {...period} className="w-auto max-w-full" />
      {leading}

      {pinned.map((f) => (
        <FilterFacet key={f.id} def={f} value={values[f.id]} onChange={(v) => set(f.id, v)} removable={false} slot />
      ))}

      {rest
        .filter((f) => isActive(values[f.id]))
        .map((f) => (
          <FilterFacet key={f.id} def={f} value={values[f.id]} onChange={(v) => set(f.id, v)} />
        ))}
      <AddFilterMenu
        defs={rest.filter((f) => !isActive(values[f.id]))}
        values={values}
        onChange={set}
        label="Filter"
      />

      {activeCount(values) > 0 && (
        <button
          type="button"
          onClick={() => onValuesChange?.({})}
          className="h-9 px-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear
        </button>
      )}

      {trailing && <div className="ml-auto flex flex-wrap items-center gap-2">{trailing}</div>}
    </div>
  )
}
