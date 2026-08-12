/**
 * HelpDesk dashboard — mock dataset + SLA/metric computation.
 *
 * Prototype data only (no API). Modeled on the real helpdesk-react data:
 *  - a ticket is a `TicketResolution` process instance (start/end time, category,
 *    assignee);
 *  - SLA lives per-ticket (a `TicketSla` row) with a resolution deadline derived
 *    from the ticket's priority (an admin-configured `SlaRule`).
 *
 * This org's priorities are P1/P2/P3 with resolution targets 4h / 24h / 3 days.
 * SLA compliance here is resolution-based (met = resolved on/before the
 * resolution deadline) — see docs/helpdesk-dashboard-shaping.md for why, and how
 * first-response SLA relates.
 */

import {
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  differenceInCalendarDays,
  differenceInHours,
  isWithinInterval,
  format,
} from "date-fns"

/* ── Anchor "now" so the mock data lines up with a deterministic demo ── */
export const NOW = new Date(2026, 7, 31, 18, 0, 0) // 31 Aug 2026
const DATA_START = new Date(2026, 0, 1, 8, 0, 0) //  1 Jan 2026

export type Priority = "P1" | "P2" | "P3"

/** Resolution SLA target per priority, in hours (P1 <4h, P2 <24h, P3 <3d). */
export const SLA_TARGET_HOURS: Record<Priority, number> = {
  P1: 4,
  P2: 24,
  P3: 72,
}

export const PRIORITY_META: Record<Priority, { label: string; target: string; color: string }> = {
  P1: { label: "P1", target: "< 4h", color: "#ef4444" },
  P2: { label: "P2", target: "< 24h", color: "#f59e0b" },
  P3: { label: "P3", target: "< 3d", color: "#3b82f6" },
}

export const PRIORITIES: Priority[] = ["P1", "P2", "P3"]

export const CATEGORIES = [
  "Installation",
  "Configuration",
  "Bug Report",
  "Account Access",
  "Billing",
  "How-to / Question",
] as const

export const TEAM = [
  "Anita Nur Hidayati",
  "Budi Santoso",
  "Citra Lestari",
  "Dewi Anggraini",
  "Eko Prasetyo",
] as const

export interface Ticket {
  id: string
  createdAt: Date
  resolvedAt: Date | null
  /** When the process instance fully closed (after resolution + validation). */
  closedAt: Date | null
  category: string
  priority: Priority
  assignee: string
  targetHours: number
  /** true = resolved within SLA, false = breached, null = still open */
  slaMet: boolean | null
  /** 1..5 satisfaction rating; null if no feedback given */
  csat: number | null
}

/* ── Seeded PRNG (mulberry32) so the dataset is stable across reloads ── */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

function buildTickets(): Ticket[] {
  const rng = mulberry32(20260807)
  const tickets: Ticket[] = []
  const totalDays = differenceInCalendarDays(NOW, DATA_START)
  let seq = 1

  for (let d = 0; d <= totalDays; d++) {
    const day = new Date(DATA_START.getTime() + d * 86400000)
    const dow = day.getDay()
    // Fewer tickets on weekends; a mild upward trend over the year.
    const base = dow === 0 || dow === 6 ? 1 : 3
    const growth = 1 + d / totalDays // 1.0 → 2.0
    const count = Math.round((base + rng() * 2) * growth)

    for (let i = 0; i < count; i++) {
      const createdAt = new Date(
        day.getTime() + Math.floor(rng() * 10 + 8) * 3600000 + Math.floor(rng() * 60) * 60000,
      )
      if (createdAt > NOW) continue

      // P1 rare, P3 common — typical helpdesk mix.
      const priority = pick(rng, ["P1", "P2", "P2", "P3", "P3", "P3"] as Priority[])
      const category = pick(rng, CATEGORIES)
      const assignee = pick(rng, TEAM)
      const targetHours = SLA_TARGET_HOURS[priority]

      // Age of ticket in hours (up to NOW).
      const ageHours = differenceInHours(NOW, createdAt)

      // ~55% of recent-enough tickets are still open.
      const stillOpen = ageHours < targetHours * 2 && rng() < 0.55

      let resolvedAt: Date | null = null
      let closedAt: Date | null = null
      let slaMet: boolean | null = null
      let csat: number | null = null

      if (!stillOpen) {
        // Resolution time: usually under target, sometimes over (breach).
        // Compliance improves slightly through the year.
        const breachChance = 0.22 - 0.1 * (d / totalDays)
        const breached = rng() < breachChance
        const factor = breached
          ? 1.1 + rng() * 1.6 // 1.1x – 2.7x of target
          : 0.15 + rng() * 0.8 // 0.15x – 0.95x of target
        let resHours = targetHours * factor
        if (resHours > ageHours) resHours = Math.max(0.5, ageHours * (0.4 + rng() * 0.5))
        resolvedAt = new Date(createdAt.getTime() + resHours * 3600000)
        if (resolvedAt > NOW) resolvedAt = NOW
        slaMet = resHours <= targetHours
        // Process closes after resolution: a validation / waiting-user tail.
        const validationLagHours = pick(rng, [0.5, 1, 2, 3, 4, 6, 8, 12, 24]) * (0.4 + rng())
        closedAt = new Date(resolvedAt.getTime() + validationLagHours * 3600000)
        if (closedAt > NOW) closedAt = NOW
        // ~70% of resolved tickets leave CSAT; happier when SLA met.
        if (rng() < 0.7) {
          csat = slaMet
            ? pick(rng, [3, 4, 4, 5, 5, 5])
            : pick(rng, [1, 1, 2, 2, 3, 4])
        }
      }

      tickets.push({
        id: `TKT-${format(createdAt, "yyMM")}-${String(seq++).padStart(5, "0")}`,
        createdAt,
        resolvedAt,
        closedAt,
        category,
        priority,
        assignee,
        targetHours,
        slaMet,
        csat,
      })
    }
  }
  return tickets
}

export const TICKETS: Ticket[] = buildTickets()

/* ── Predefined periods — AlurKerja standard set + HelpDesk short ranges ── */
export interface DateRangeValue {
  from: Date
  to: Date
}

export interface RangePreset {
  label: string
  range: () => DateRangeValue
}

export const RANGE_PRESETS: RangePreset[] = [
  { label: "Today", range: () => ({ from: startOfDay(NOW), to: NOW }) },
  { label: "Yesterday", range: () => ({ from: startOfDay(subDays(NOW, 1)), to: endOfDay(subDays(NOW, 1)) }) },
  { label: "Last 7 days", range: () => ({ from: startOfDay(subDays(NOW, 6)), to: NOW }) },
  { label: "Last 30 days", range: () => ({ from: startOfDay(subDays(NOW, 29)), to: NOW }) },
  { label: "This week", range: () => ({ from: startOfWeek(NOW), to: NOW }) },
  { label: "Last week", range: () => ({ from: startOfWeek(subDays(NOW, 7)), to: endOfWeek(subDays(NOW, 7)) }) },
  { label: "This month", range: () => ({ from: startOfMonth(NOW), to: NOW }) },
  { label: "Last month", range: () => ({ from: startOfMonth(subDays(startOfMonth(NOW), 1)), to: endOfMonth(subDays(startOfMonth(NOW), 1)) }) },
  { label: "This year", range: () => ({ from: startOfYear(NOW), to: NOW }) },
]

export const DEFAULT_RANGE_LABEL = "Last 30 days"

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/* ── Metric computation ────────────────────────────────────────────────── */

export interface KpiWithDelta {
  value: number
  /** percentage-point (rate) or percent (count) change vs previous window */
  deltaPct: number | null
}

export interface TrendPoint {
  label: string
  created: number
  resolved: number
  slaRate: number | null
}

export interface CategoryStat {
  category: string
  met: number
  breached: number
  total: number
}

export interface TeamStat {
  name: string
  resolved: number
  slaRate: number
}

/** One row of the "Breakdown per Prioritas" table. */
export interface PriorityStat {
  priority: Priority
  label: string
  target: string
  color: string
  masuk: number // incoming (created in range)
  selesai: number // resolved in range
  breach: number // resolved late in range
  compliance: number // 0..100
}

export interface DashboardData {
  range: DateRangeValue
  // ── Headline metrics (the required table) ──
  totalIn: KpiWithDelta // Total tiket masuk
  resolvedInSla: KpiWithDelta // Tiket selesai dalam SLA
  breached: KpiWithDelta // Tiket breach (terlambat)
  compliance: KpiWithDelta // % Compliance SLA (0..100)
  openCount: number // Tiket masih open
  escalatedCount: number // …of which escalated (open past resolution due)
  // ── Breakdown ──
  priorityStats: PriorityStat[]
  // ── Supporting visuals ──
  statusBreakdown: { name: string; value: number }[]
  categoryStats: CategoryStat[]
  teamStats: TeamStat[]
  trend: TrendPoint[]
  avgResolutionHours: KpiWithDelta // hours
  avgCompletionDays: KpiWithDelta // days (full process lifecycle)
  csatScore: number | null // 0..100
  csatCount: number
}

function inRange(d: Date | null, from: Date, to: Date): d is Date {
  return d != null && isWithinInterval(d, { start: from, end: to })
}

function rate(met: number, resolved: number): number {
  return resolved === 0 ? 0 : (met / resolved) * 100
}

/** Core metrics for a window, used for both current and previous periods. */
function windowStats(from: Date, to: Date) {
  const createdIn = TICKETS.filter((t) => inRange(t.createdAt, from, to))
  const resolvedIn = TICKETS.filter((t) => inRange(t.resolvedAt, from, to))
  const met = resolvedIn.filter((t) => t.slaMet === true).length
  const breached = resolvedIn.filter((t) => t.slaMet === false).length
  const resHoursSum = resolvedIn.reduce(
    (s, t) => s + (t.resolvedAt ? differenceInHours(t.resolvedAt, t.createdAt) : 0),
    0,
  )
  // Completion = full process lifecycle (created → closed), in days.
  const complHoursSum = resolvedIn.reduce(
    (s, t) => s + differenceInHours(t.closedAt ?? t.resolvedAt!, t.createdAt),
    0,
  )
  return {
    created: createdIn.length,
    resolved: resolvedIn.length,
    met,
    breached,
    slaRate: rate(met, resolvedIn.length),
    avgResolutionHours: resolvedIn.length ? resHoursSum / resolvedIn.length : 0,
    avgCompletionDays: resolvedIn.length ? complHoursSum / resolvedIn.length / 24 : 0,
    createdIn,
    resolvedIn,
  }
}

function pctDelta(cur: number, prev: number): number | null {
  if (prev === 0) return null
  return ((cur - prev) / prev) * 100
}

function bucketTrend(from: Date, to: Date): TrendPoint[] {
  const days = differenceInCalendarDays(to, from) + 1
  const mode: "day" | "week" | "month" = days <= 31 ? "day" : days <= 130 ? "week" : "month"
  const buckets = new Map<string, { label: string; order: number; created: number; resolved: number; met: number }>()

  const keyFor = (d: Date) => {
    if (mode === "day") return { key: format(d, "yyyy-MM-dd"), label: format(d, "d MMM"), order: d.getTime() }
    if (mode === "week") {
      const ws = startOfWeek(d)
      return { key: format(ws, "yyyy-MM-dd"), label: format(ws, "d MMM"), order: ws.getTime() }
    }
    const ms = startOfMonth(d)
    return { key: format(ms, "yyyy-MM"), label: format(ms, "MMM yyyy"), order: ms.getTime() }
  }

  const ensure = (d: Date) => {
    const { key, label, order } = keyFor(d)
    if (!buckets.has(key)) buckets.set(key, { label, order, created: 0, resolved: 0, met: 0 })
    return buckets.get(key)!
  }

  for (const t of TICKETS) {
    if (inRange(t.createdAt, from, to)) ensure(t.createdAt).created++
    if (inRange(t.resolvedAt, from, to)) {
      const b = ensure(t.resolvedAt)
      b.resolved++
      if (t.slaMet === true) b.met++
    }
  }

  return [...buckets.values()]
    .sort((a, b) => a.order - b.order)
    .map((b) => ({
      label: b.label,
      created: b.created,
      resolved: b.resolved,
      slaRate: b.resolved ? Math.round(rate(b.met, b.resolved)) : null,
    }))
}

export function computeDashboard(from: Date, to: Date): DashboardData {
  const cur = windowStats(from, to)

  // Previous window of equal length, immediately preceding `from`.
  const lenMs = to.getTime() - from.getTime()
  const prevTo = new Date(from.getTime() - 1)
  const prevFrom = new Date(prevTo.getTime() - lenMs)
  const prev = windowStats(prevFrom, prevTo)

  // Open = created in range, still open at NOW. Escalated = open past resolution due.
  const openTickets = cur.createdIn.filter((t) => t.resolvedAt === null)
  const escalated = openTickets.filter(
    (t) => differenceInHours(NOW, t.createdAt) > t.targetHours,
  ).length

  // Status breakdown (of tickets created in range).
  const resolvedCount = cur.createdIn.length - openTickets.length

  // Breakdown per priority.
  const priorityStats: PriorityStat[] = PRIORITIES.map((priority) => {
    const meta = PRIORITY_META[priority]
    const masuk = cur.createdIn.filter((t) => t.priority === priority).length
    const resolvedItems = cur.resolvedIn.filter((t) => t.priority === priority)
    const breach = resolvedItems.filter((t) => t.slaMet === false).length
    const met = resolvedItems.length - breach
    return {
      priority,
      label: meta.label,
      target: meta.target,
      color: meta.color,
      masuk,
      selesai: resolvedItems.length,
      breach,
      compliance: Math.round(rate(met, resolvedItems.length)),
    }
  })

  // Category stats (of resolved-in-range, met vs breached).
  const categoryStats: CategoryStat[] = CATEGORIES.map((category) => {
    const items = cur.resolvedIn.filter((t) => t.category === category)
    const met = items.filter((t) => t.slaMet === true).length
    const breached = items.filter((t) => t.slaMet === false).length
    return { category, met, breached, total: items.length }
  })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)

  // Team stats (resolved-in-range per assignee).
  const teamStats: TeamStat[] = TEAM.map((name) => {
    const items = cur.resolvedIn.filter((t) => t.assignee === name)
    const met = items.filter((t) => t.slaMet === true).length
    return { name, resolved: items.length, slaRate: Math.round(rate(met, items.length)) }
  })
    .filter((t) => t.resolved > 0)
    .sort((a, b) => b.resolved - a.resolved)

  // CSAT (resolved-in-range with a rating), expressed 0..100.
  const rated = cur.resolvedIn.filter((t) => t.csat != null) as (Ticket & { csat: number })[]
  const csatScore = rated.length
    ? Math.round((rated.reduce((s, t) => s + t.csat, 0) / rated.length / 5) * 100)
    : null

  return {
    range: { from, to },
    totalIn: { value: cur.created, deltaPct: pctDelta(cur.created, prev.created) },
    resolvedInSla: { value: cur.met, deltaPct: pctDelta(cur.met, prev.met) },
    breached: { value: cur.breached, deltaPct: pctDelta(cur.breached, prev.breached) },
    compliance: {
      value: Math.round(cur.slaRate * 10) / 10,
      deltaPct: prev.resolved === 0 ? null : Math.round((cur.slaRate - prev.slaRate) * 10) / 10,
    },
    openCount: openTickets.length,
    escalatedCount: escalated,
    priorityStats,
    statusBreakdown: [
      { name: "Resolved", value: resolvedCount },
      { name: "Open", value: openTickets.length },
    ].filter((s) => s.value > 0),
    categoryStats,
    teamStats,
    trend: bucketTrend(from, to),
    avgResolutionHours: {
      value: Math.round(cur.avgResolutionHours * 10) / 10,
      deltaPct: pctDelta(cur.avgResolutionHours, prev.avgResolutionHours),
    },
    avgCompletionDays: {
      value: Math.round(cur.avgCompletionDays * 10) / 10,
      deltaPct: pctDelta(cur.avgCompletionDays, prev.avgCompletionDays),
    },
    csatScore,
    csatCount: rated.length,
  }
}

/** Human-readable duration from hours (e.g. 5.4 → "5h 24m", 30 → "1d 6h"). */
export function formatDuration(hours: number): string {
  if (hours <= 0) return "0m"
  const totalMin = Math.round(hours * 60)
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
