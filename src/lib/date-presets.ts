import {
  endOfDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns"

export interface DateRangeValue {
  from: Date
  to: Date
}

export interface RangePreset {
  label: string
  range: (today: Date) => DateRangeValue
}

/**
 * The AlurKerja standard set — the same presets as the app-react-v2
 * business-process filter (and the Date range demo on /pages/form-component).
 * Every preset is computed from a reference `today` rather than the wall clock,
 * so dashboards backed by fixed mock data (HelpDesk ends 31 Aug 2026) stay
 * populated.
 */
export const STANDARD_PRESETS: RangePreset[] = [
  { label: "Last 30 days", range: (t) => ({ from: startOfDay(subDays(t, 29)), to: endOfDay(t) }) },
  { label: "Last 3 months", range: (t) => ({ from: startOfDay(subMonths(t, 3)), to: endOfDay(t) }) },
  { label: "Last 6 months", range: (t) => ({ from: startOfDay(subMonths(t, 6)), to: endOfDay(t) }) },
  { label: "Last 12 months", range: (t) => ({ from: startOfDay(subMonths(t, 12)), to: endOfDay(t) }) },
  { label: "This week", range: (t) => ({ from: startOfWeek(t), to: endOfDay(t) }) },
  { label: "This month", range: (t) => ({ from: startOfMonth(t), to: endOfDay(t) }) },
  { label: "This year", range: (t) => ({ from: startOfYear(t), to: endOfDay(t) }) },
]

/** Short ranges for operational dashboards (support queues) that watch days, not quarters. */
export const SHORT_PRESETS: RangePreset[] = [
  { label: "Today", range: (t) => ({ from: startOfDay(t), to: endOfDay(t) }) },
  { label: "Yesterday", range: (t) => ({ from: startOfDay(subDays(t, 1)), to: endOfDay(subDays(t, 1)) }) },
  { label: "Last 7 days", range: (t) => ({ from: startOfDay(subDays(t, 6)), to: endOfDay(t) }) },
]

export const DEFAULT_PRESET = "Last 30 days"

export function presetRange(label: string, today: Date, presets = STANDARD_PRESETS): DateRangeValue {
  const p = presets.find((x) => x.label === label) ?? STANDARD_PRESETS[0]
  return p.range(today)
}
