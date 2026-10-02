import {
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  max as maxDate,
  min as minDate,
  startOfDay,
} from "date-fns"
import type { DateRangeValue } from "@/lib/date-presets"

/* Helpers for period-aware mock data: the analytics prototypes have no backend,
   so series are generated per period bucket from stable seeded noise — the same
   period always yields the same numbers, and a longer period yields more. */

export interface Bucket {
  key: string
  label: string
  from: Date
  to: Date
  /** Days of this bucket that fall inside the range (edge buckets are partial). */
  days: number
}

export function rangeDays(r: DateRangeValue) {
  return Math.max(1, differenceInCalendarDays(r.to, r.from) + 1)
}

export type Granularity = "day" | "week" | "month"

/** Daily up to a month, weekly up to ~4 months, monthly beyond — keeps charts at 5–31 points. */
export function granularityOf(r: DateRangeValue): Granularity {
  const span = rangeDays(r)
  return span <= 31 ? "day" : span <= 120 ? "week" : "month"
}

export const GRANULARITY_LABEL: Record<Granularity, string> = { day: "Daily", week: "Weekly", month: "Monthly" }

export function buckets(r: DateRangeValue): Bucket[] {
  const g = granularityOf(r)
  const interval = { start: startOfDay(r.from), end: r.to }
  const clip = (from: Date, to: Date, key: string, label: string): Bucket => {
    const f = maxDate([from, interval.start])
    const t = minDate([to, interval.end])
    return { key, label, from: f, to: t, days: Math.max(1, differenceInCalendarDays(t, f) + 1) }
  }
  if (g === "day") {
    return eachDayOfInterval(interval).map((d) => clip(d, d, format(d, "yyyy-MM-dd"), format(d, "d MMM")))
  }
  if (g === "week") {
    return eachWeekOfInterval(interval).map((w) => clip(w, endOfWeek(w), format(w, "yyyy-'W'II"), format(maxDate([w, interval.start]), "d MMM")))
  }
  return eachMonthOfInterval(interval).map((m) => clip(m, endOfMonth(m), format(m, "yyyy-MM"), format(m, "MMM yy")))
}

/**
 * Stable pseudo-random number in [0, 1) for a set of keys: FNV-1a over the joined
 * keys, then murmur3's fmix32 finalizer. The finalizer matters — the keys here
 * are highly structured (dept × day × metric) and FNV alone leaves them
 * correlated, which skewed the mock totals.
 */
export function noise(...keys: (string | number)[]) {
  let h = 2166136261
  for (const ch of keys.join("|")) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

/** `base` jittered by ±`spread` (fraction), seeded by `keys`. */
export function jitter(base: number, spread: number, ...keys: (string | number)[]) {
  return base * (1 - spread + 2 * spread * noise(...keys))
}

/**
 * Integer that preserves the expected value: rounds up with probability equal to
 * the fractional part (seeded, so stable). Plain Math.round biases small flows
 * to zero — 0.06 hires/day per department rounds to 0 every day, erasing hiring
 * entirely — while keeping cells integer keeps every total an exact sum.
 */
export function seededRound(x: number, ...keys: (string | number)[]) {
  const f = Math.floor(x)
  return f + (noise(...keys, "round") < x - f ? 1 : 0)
}
