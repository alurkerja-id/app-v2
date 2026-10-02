import type { DateRangeValue } from "@/lib/date-presets"
import { opts } from "@/lib/filters"
import { test, type TypedFilterDef, type TypedValues } from "@/lib/typed-filters"
import { buckets, granularityOf, jitter, seededRound } from "@/lib/mock-series"

/* Workforce Analytics mock. Headcount is a snapshot (split by employment type
   per department, so the type filter subtracts real people); hiring, attrition
   and leave are flows generated per period bucket from each department's size. */

const EMPLOYMENT = ["Full-time", "Contract", "Part-time"] as const
type Employment = (typeof EMPLOYMENT)[number]

interface DeptDef {
  id: string
  name: string
  location: string
  headcount: number
  /** Share of headcount per employment type, in EMPLOYMENT order. */
  mix: [number, number, number]
  tenure: number
  openRoles: number
  completion: number
}

const DEPARTMENTS: DeptDef[] = [
  { id: "engineering", name: "Engineering", location: "Jakarta", headcount: 62, mix: [0.82, 0.14, 0.04], tenure: 3.2, openRoles: 3, completion: 87 },
  { id: "operations", name: "Operations", location: "Surabaya", headcount: 38, mix: [0.7, 0.2, 0.1], tenure: 4.1, openRoles: 1, completion: 79 },
  { id: "sales", name: "Sales", location: "Jakarta", headcount: 34, mix: [0.76, 0.15, 0.09], tenure: 2.8, openRoles: 2, completion: 83 },
  { id: "hr", name: "HR", location: "Jakarta", headcount: 18, mix: [0.89, 0.06, 0.05], tenure: 5.0, openRoles: 0, completion: 91 },
  { id: "finance", name: "Finance", location: "Bandung", headcount: 22, mix: [0.86, 0.09, 0.05], tenure: 4.6, openRoles: 1, completion: 89 },
  { id: "marketing", name: "Marketing", location: "Bandung", headcount: 26, mix: [0.69, 0.19, 0.12], tenure: 2.3, openRoles: 1, completion: 81 },
  { id: "legal", name: "Legal", location: "Jakarta", headcount: 14, mix: [0.86, 0.14, 0], tenure: 6.1, openRoles: 0, completion: 92 },
  { id: "it-support", name: "IT Support", location: "Remote", headcount: 34, mix: [0.62, 0.29, 0.09], tenure: 3.7, openRoles: 1, completion: 85 },
]

export const WORKFORCE_FILTERS: TypedFilterDef[] = [
  { id: "department", label: "Department", kind: "field", pinned: true, options: DEPARTMENTS.map((d) => ({ value: d.id, label: d.name })) },
  { id: "location", label: "Location", kind: "field", pinned: true, options: opts(["Jakarta", "Bandung", "Surabaya", "Remote"]) },
  { id: "employment", label: "Employment type", kind: "field", options: opts(EMPLOYMENT) },
]

export interface DeptRow {
  department: string
  location: string
  headcount: number
  leaveDays: number
  avgTenure: number
  openRoles: number
}

const pct = (cur: number, prev: number) => (prev === 0 ? null : ((cur - prev) / prev) * 100)

type Flow = { hired: number; resigned: number; annual: number; sick: number; unpaid: number }
const FLOW_KEYS = ["hired", "resigned", "annual", "sick", "unpaid"] as const
const RATES: Record<keyof Flow, [rate: number, spread: number]> = {
  hired: [0.0009, 0.6],
  resigned: [0.0005, 0.6],
  annual: [0.012, 0.4],
  sick: [0.004, 0.4],
  unpaid: [0.0012, 0.4],
}

/** Per-department, per-bucket flows — integers here, so every total is an exact sum of rows. */
function deptFlows(range: DateRangeValue, d: DeptDef, hc: number) {
  return buckets(range).map((b) => {
    const f = {} as Flow
    for (const k of FLOW_KEYS) f[k] = seededRound(jitter(hc * RATES[k][0] * b.days, RATES[k][1], d.id, b.key, k), d.id, b.key, k)
    return { label: b.label, ...f }
  })
}

function sumFlows(perDept: ReturnType<typeof deptFlows>[]) {
  return (perDept[0] ?? []).map((b, i) => {
    const f = { label: b.label } as Flow & { label: string }
    for (const k of FLOW_KEYS) f[k] = perDept.reduce((s, d) => s + d[i][k], 0)
    return f
  })
}

const leaveOf = (s: Flow[]) => s.reduce((a, x) => a + x.annual + x.sick + x.unpaid, 0)

export function computeWorkforce(range: DateRangeValue, values: TypedValues) {
  const types = EMPLOYMENT.map((t, i) => [t, i] as const).filter(([t]) => test(values.employment, t))
  // People per department × employment type, rounded once — so headcount, the
  // type pie and the table are exact sums of the same integers.
  const depts = DEPARTMENTS.filter((d) => test(values.department, d.id) && test(values.location, d.location)).map(
    (d) => {
      const byType = types.map(([, i]) => Math.round(d.headcount * d.mix[i]))
      return { d, byType, hc: byType.reduce((a, b) => a + b, 0) }
    },
  )

  const len = range.to.getTime() - range.from.getTime()
  const prevTo = new Date(range.from.getTime() - 1)
  const prevRange = { from: new Date(prevTo.getTime() - len), to: prevTo }

  const perDept = depts.map(({ d, hc }) => deptFlows(range, d, hc))
  const series = sumFlows(perDept)
  const prevLeave = leaveOf(sumFlows(depts.map(({ d, hc }) => deptFlows(prevRange, d, hc))))
  const sum = (k: keyof Flow) => series.reduce((a, x) => a + x[k], 0)
  const headcount = depts.reduce((s, x) => s + x.hc, 0)
  const leaveTotal = leaveOf(series)

  return {
    granularity: granularityOf(range),
    kpi: {
      headcount: { value: headcount, net: sum("hired") - sum("resigned") },
      departments: { value: depts.length, locations: new Set(depts.map((x) => x.d.location)).size },
      leaveDays: { value: leaveTotal, delta: pct(leaveTotal, prevLeave) },
      openRoles: { value: depts.reduce((s, x) => s + x.d.openRoles, 0) },
    },
    series,
    byDept: depts.map(({ d, hc }) => ({ name: d.name, headcount: hc })),
    byType: types
      .map(([t], j) => ({ name: t as Employment, value: depts.reduce((s, x) => s + x.byType[j], 0) }))
      .filter((x) => x.value > 0),
    scatter: depts.map(({ d, hc }) => ({ name: d.name, x: hc, y: d.completion })),
    table: depts.map(({ d, hc }, i): DeptRow => ({
      department: d.name,
      location: d.location,
      headcount: hc,
      leaveDays: leaveOf(perDept[i]),
      avgTenure: d.tenure,
      openRoles: d.openRoles,
    })),
  }
}
