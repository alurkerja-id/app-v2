import { useMemo, useState } from "react"

import { FilterBar } from "@/components/dashboard/filter-bar"
import { HeaderToolbar } from "@/components/layout/header-toolbar"
import { DashboardExportProvider } from "@/components/dashboard/export-button"
import { DEFAULT_PRESET, presetRange, STANDARD_PRESETS, type DateRangeValue, type RangePreset } from "@/lib/date-presets"
import { describeTyped, type TypedFilterDef, type TypedValues } from "@/lib/typed-filters"

/** Period + filter state for one dashboard. */
export function useDashboardState({
  today = new Date(),
  presets = STANDARD_PRESETS,
  defaultPreset = DEFAULT_PRESET,
}: { today?: Date; presets?: RangePreset[]; defaultPreset?: string } = {}) {
  const [preset, setPreset] = useState<string | null>(defaultPreset)
  const [range, setRange] = useState<DateRangeValue>(() => presetRange(defaultPreset, today, presets))
  const [values, setValues] = useState<TypedValues>({})

  return {
    range,
    preset,
    values,
    setValues,
    period: {
      value: range,
      preset,
      today,
      presets,
      onChange: (r: DateRangeValue, p: string | null) => {
        setRange(r)
        setPreset(p)
      },
    },
  }
}

/**
 * Layout every analytics dashboard shares: title, the filter bar, then content.
 * Also provides the export context, so each card's .xlsx carries the dashboard
 * name, the period and the active filters without prop-drilling.
 */
export function DashboardPage({
  title,
  description,
  state,
  filters = [],
  leading,
  trailing,
  status,
  merged = false,
  children,
}: {
  title: string
  description: string
  state: ReturnType<typeof useDashboardState>
  filters?: TypedFilterDef[]
  leading?: React.ReactNode
  trailing?: React.ReactNode
  /** Right side of the title row — e.g. an "Updating…" indicator. */
  status?: React.ReactNode
  /**
   * Studio-style: title, subtitle and filter bar go inside the header box, under
   * the navbar — one box instead of three stacked blocks.
   */
  merged?: boolean
  children: React.ReactNode
}) {
  const exportCtx = useMemo(
    () => ({ dashboard: title, period: state.range, filters: describeTyped(filters, state.values) }),
    [title, state.range, filters, state.values],
  )

  return (
    <DashboardExportProvider value={exportCtx}>
      <div className="mx-auto max-w-screen-xl space-y-5 p-4 sm:p-6">
        {merged ? (
          <>
            <HeaderToolbar>
              {/* Title row stays white — same weight as the navbar. */}
              <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-3 sm:px-5">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold">{title}</h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
              {/* Filter row: a light tint keeps it a step below the title. */}
              <div className="rounded-b-[inherit] border-t border-border/60 bg-muted/60 px-3 py-2.5 sm:px-4 dark:bg-muted/30">
              <FilterBar
                period={state.period}
                filters={filters}
                values={state.values}
                onValuesChange={state.setValues}
                leading={leading}
                trailing={
                  status || trailing ? (
                    <>
                      {status}
                      {trailing}
                    </>
                  ) : undefined
                }
              />
              </div>
            </HeaderToolbar>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold">{title}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
              </div>
              {status}
            </div>

            <FilterBar
              period={state.period}
              filters={filters}
              values={state.values}
              onValuesChange={state.setValues}
              leading={leading}
              trailing={trailing}
            />
          </>
        )}

        {children}
      </div>
    </DashboardExportProvider>
  )
}
