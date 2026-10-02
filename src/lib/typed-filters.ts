import { endOfDay, format, isWithinInterval, startOfDay } from "date-fns"
import type { FilterOption } from "@/lib/filters"

/* Filters with a data type — the six kinds a form-builder field can expose:
   Text, Number, Date, Date & Time, Boolean and Field Filter (pick from a
   field's values). Each kind has its own editor, its own one-line summary for
   chips, and its own row test. */

export type FilterKind = "text" | "number" | "date" | "datetime" | "boolean" | "field"

export const KIND_LABEL: Record<FilterKind, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  datetime: "Date & Time",
  boolean: "Boolean",
  field: "Field Filter",
}

export interface TypedFilterDef {
  id: string
  label: string
  kind: FilterKind
  /** Field Filter only. */
  options?: FilterOption[]
  /** Number only — formats values in summaries ("Rp"). */
  currency?: boolean
  /** Shown in the bar even when empty (the "pinned" pattern). */
  pinned?: boolean
}

export type NumberOp = "eq" | "gte" | "lte" | "between"
export type TextOp = "contains" | "is"

export type TypedValue =
  | { kind: "text"; op: TextOp; text: string }
  | { kind: "number"; op: NumberOp; a?: number; b?: number }
  | { kind: "date" | "datetime"; from?: Date; to?: Date }
  | { kind: "boolean"; value: boolean }
  | { kind: "field"; values: string[] }

export type TypedValues = Record<string, TypedValue | undefined>

export function isActive(v: TypedValue | undefined): v is TypedValue {
  if (!v) return false
  switch (v.kind) {
    case "text":
      return v.text.trim() !== ""
    case "number":
      return v.op === "between" ? v.a != null || v.b != null : v.a != null
    case "date":
    case "datetime":
      return v.from != null
    case "boolean":
      return true
    case "field":
      return v.values.length > 0
  }
}

const compact = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 })
const num = (def: TypedFilterDef, n: number) => (def.currency ? `Rp ${compact.format(n)}` : n.toLocaleString("id-ID"))

/** Value part of a chip — "HR, IT +1", "≥ Rp 5 jt", "1–15 Sep". */
export function summarize(def: TypedFilterDef, v: TypedValue): string {
  switch (v.kind) {
    case "text":
      return v.op === "is" ? `is “${v.text}”` : `contains “${v.text}”`
    case "number": {
      if (v.op === "between") {
        if (v.a != null && v.b != null) return `${num(def, v.a)} – ${num(def, v.b)}`
        return v.a != null ? `≥ ${num(def, v.a)}` : `≤ ${num(def, v.b!)}`
      }
      return `${{ eq: "=", gte: "≥", lte: "≤" }[v.op]} ${num(def, v.a!)}`
    }
    case "date":
    case "datetime": {
      const f = v.kind === "datetime" ? "d MMM HH:mm" : "d MMM"
      if (!v.to || v.from!.getTime() === v.to.getTime()) return format(v.from!, f)
      return `${format(v.from!, f)} – ${format(v.to, f)}`
    }
    case "boolean":
      return v.value ? "Yes" : "No"
    case "field": {
      const labels = v.values.map((x) => def.options?.find((o) => o.value === x)?.label ?? x)
      return labels.length <= 2 ? labels.join(", ") : `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`
    }
  }
}

/** Does one row value pass this filter? Inactive filters pass everything. */
export function test(v: TypedValue | undefined, x: unknown): boolean {
  if (!isActive(v)) return true
  switch (v.kind) {
    case "text": {
      const s = String(x ?? "").toLowerCase()
      const q = v.text.trim().toLowerCase()
      return v.op === "is" ? s === q : s.includes(q)
    }
    case "number": {
      // No value never matches a number filter — an unrated ticket is not "≤ 2".
      if (x == null || x === "") return false
      const n = Number(x)
      if (v.op === "eq") return n === v.a
      if (v.op === "gte") return n >= v.a!
      if (v.op === "lte") return n <= v.a!
      return (v.a == null || n >= v.a) && (v.b == null || n <= v.b)
    }
    case "date":
    case "datetime": {
      const d = x as Date
      const from = v.kind === "date" ? startOfDay(v.from!) : v.from!
      const to = v.to ? (v.kind === "date" ? endOfDay(v.to) : v.to) : v.kind === "date" ? endOfDay(v.from!) : v.from!
      return isWithinInterval(d, { start: from, end: to })
    }
    case "boolean":
      return Boolean(x) === v.value
    case "field":
      return v.values.includes(String(x))
  }
}

export const activeCount = (values: TypedValues) => Object.values(values).filter(isActive).length

/** At most this many pinned filters (besides the period) — more and the bar stops being one tidy line. */
export const MAX_PINNED = 2

/** "Priority: P1, P2" summaries of the active filters — for export metadata. */
export function describeTyped(defs: TypedFilterDef[], values: TypedValues): string[] {
  return defs.filter((d) => isActive(values[d.id])).map((d) => `${d.label}: ${summarize(d, values[d.id]!)}`)
}

/** Field Filter values as a plain list ([] when inactive). */
export const fieldValues = (v: TypedValue | undefined): string[] => (v?.kind === "field" ? v.values : [])
