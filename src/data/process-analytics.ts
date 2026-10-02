import { format } from "date-fns"
import type { DateRangeValue } from "@/lib/date-presets"
import { opts } from "@/lib/filters"
import { test, type TypedFilterDef, type TypedValues } from "@/lib/typed-filters"
import { buckets, granularityOf, jitter, seededRound } from "@/lib/mock-series"

/* Process Analytics mock. Each process has its own daily volume, completion rate
   and cycle time; every number on the page is derived from one per-process ×
   per-bucket matrix, so the table, charts and KPIs always agree with each other
   and respond to the period and filters. */

interface ProcessDef {
  id: string
  name: string
  short: string
  department: string
  perDay: number
  completion: number
  cycleDays: number
}

const PROCESSES: ProcessDef[] = [
  { id: "onboarding", name: "Employee Onboarding", short: "Onboarding", department: "HR", perDay: 0.9, completion: 0.55, cycleDays: 5.2 },
  { id: "expense", name: "Expense Reimbursement", short: "Expense", department: "Finance", perDay: 2.4, completion: 0.78, cycleDays: 2.1 },
  { id: "it", name: "IT Support Ticket", short: "IT Ticket", department: "IT", perDay: 3.1, completion: 0.82, cycleDays: 1.8 },
  { id: "leave", name: "Leave Request", short: "Leave", department: "HR", perDay: 2.7, completion: 0.9, cycleDays: 1.2 },
  { id: "procurement", name: "Procurement Request", short: "Procurement", department: "Finance", perDay: 1.1, completion: 0.45, cycleDays: 6.8 },
  { id: "travel", name: "Travel Request", short: "Travel", department: "Operations", perDay: 0.8, completion: 0.6, cycleDays: 4.5 },
  { id: "hiring", name: "Hiring Request", short: "Hiring", department: "HR", perDay: 0.4, completion: 0.35, cycleDays: 9.3 },
  { id: "training", name: "Training Enrollment", short: "Training", department: "Operations", perDay: 1.3, completion: 0.7, cycleDays: 3.1 },
]

export const PROCESS_FILTERS: TypedFilterDef[] = [
  { id: "process", label: "Process", kind: "field", pinned: true, options: PROCESSES.map((p) => ({ value: p.id, label: p.name })) },
  { id: "department", label: "Owner department", kind: "field", options: opts(["HR", "Finance", "IT", "Operations"]) },
]

export interface ProcessRow {
  process: string
  short: string
  department: string
  total: number
  active: number
  completed: number
  avgDays: number
}

const round1 = (n: number) => Math.round(n * 10) / 10
const pct = (cur: number, prev: number) => (prev === 0 ? null : ((cur - prev) / prev) * 100)

function compute(range: DateRangeValue, procs: ProcessDef[]) {
  const bs = buckets(range)
  const rangeKey = `${format(range.from, "yyyyMMdd")}-${format(range.to, "yyyyMMdd")}`

  const rows = procs.map((p) => {
    const series = bs.map((b) => {
      const submitted = seededRound(jitter(p.perDay * b.days, 0.35, p.id, b.key), p.id, b.key)
      const completed = Math.min(submitted, seededRound(submitted * jitter(p.completion, 0.15, p.id, b.key, "c"), p.id, b.key, "c"))
      return { submitted, completed }
    })
    const total = series.reduce((s, x) => s + x.submitted, 0)
    const completed = series.reduce((s, x) => s + x.completed, 0)
    return {
      row: {
        process: p.name,
        short: p.short,
        department: p.department,
        total,
        completed,
        active: total - completed,
        avgDays: round1(jitter(p.cycleDays, 0.12, p.id, rangeKey)),
      } satisfies ProcessRow,
      series,
    }
  })

  const total = rows.reduce((s, r) => s + r.row.total, 0)
  const completed = rows.reduce((s, r) => s + r.row.completed, 0)
  // Cycle time is per completed instance, so weight each process by its completions.
  const avgDays = completed ? round1(rows.reduce((s, r) => s + r.row.avgDays * r.row.completed, 0) / completed) : 0
  return { bs, rows, total, completed, active: total - completed, avgDays }
}

export function computeProcessAnalytics(range: DateRangeValue, values: TypedValues) {
  const procs = PROCESSES.filter((p) => test(values.process, p.id) && test(values.department, p.department))
  const cur = compute(range, procs)

  // Previous window of equal length, immediately before `from` — for the deltas.
  const len = range.to.getTime() - range.from.getTime()
  const prevTo = new Date(range.from.getTime() - 1)
  const prev = compute({ from: new Date(prevTo.getTime() - len), to: prevTo }, procs)

  const flow = cur.bs.map((b, i) => ({
    label: b.label,
    submitted: cur.rows.reduce((s, r) => s + r.series[i].submitted, 0),
    completed: cur.rows.reduce((s, r) => s + r.series[i].completed, 0),
  }))
  // Burn-up: the gap between the two cumulative lines is the open backlog.
  let cs = 0
  let cc = 0
  const burnup = flow.map((f) => ({ label: f.label, submitted: (cs += f.submitted), completed: (cc += f.completed) }))

  return {
    granularity: granularityOf(range),
    kpi: {
      total: { value: cur.total, delta: pct(cur.total, prev.total) },
      active: { value: cur.active, share: cur.total ? Math.round((cur.active / cur.total) * 100) : 0 },
      completed: { value: cur.completed, delta: pct(cur.completed, prev.completed) },
      avgDays: { value: cur.avgDays, delta: pct(cur.avgDays, prev.avgDays) },
    },
    table: cur.rows.map((r) => r.row),
    flow,
    burnup,
    status: [
      { name: "Completed", value: cur.completed },
      { name: "Active", value: cur.active },
    ],
    scatter: cur.rows.map((r) => ({ name: r.row.short, x: r.row.total, y: r.row.avgDays })),
  }
}
