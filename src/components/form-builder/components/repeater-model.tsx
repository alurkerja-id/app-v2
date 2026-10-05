import type { IconSvgElement } from "@hugeicons/react"
import { Calendar01Icon, DropdownFieldTypeIcon, HashtagIcon, TextAlignLeftIcon, TextIcon } from "@hugeicons/core-free-icons"

import { L, tr, type L10n, type Lang } from "../i18n"
import { parseISO, rupiah, uid } from "../lib"
import type { Issue } from "../types"

/* Repeater ★ — types and pure helpers shared by the definition, the Edit Element
   editors and the runtime. No React components here. */

/* ── types ──────────────────────────────────────────────────────────────── */

export type ChildKind = "text" | "number" | "textarea" | "date" | "dropdown"

export interface ChildOption {
  v: string
  label: L10n
  [k: string]: unknown
}

/** One field repeated in every row (`children[]` in the spec). */
export interface ChildField {
  /** Stable id inside the builder; never saved. */
  id: string
  kind: ChildKind
  /** Key in each row, e.g. `items[0].qty`. */
  name: string
  label: L10n
  required: boolean
  /** Text and Textarea. */
  placeholder?: L10n
  /** Number: minimum value ("" while the stepper is empty). */
  min?: number | ""
  /** Number: Rupiah format. */
  currency?: boolean
  /** Dropdown. */
  options?: ChildOption[]
}

export interface RepeaterProps {
  label: L10n
  name: string
  required: boolean
  minRows: number | ""
  maxRows: number | ""
  addLabel: L10n
  subtotal: boolean
  layout: "table" | "cards"
  mobileLayout: "cards" | "table"
  fields: ChildField[]
}

/** One row while the task is open: raw input text per child field id. */
export interface RepeaterRow {
  id: string
  v: Record<string, string>
}

/** Runtime state (same parts as the prototype's `rt`). Only `rows` reaches the payload. */
export interface RepeaterValue {
  rows: RepeaterRow[]
  /** Collapsed cards: row id → the row's issue key when it was collapsed (new issues re-open it). */
  collapsed: Record<string, string>
  /** Last removed card, for the inline Undo of the cards layout. */
  removed: { row: RepeaterRow; index: number } | null
}

/* ── child field kinds ──────────────────────────────────────────────────── */

export const KINDS: Record<ChildKind, { icon: IconSvgElement; label: L10n; ui: string; fft: string; vk: "string" | "number" }> = {
  text: { icon: TextIcon, label: L("Text", "Teks"), ui: "INPUT", fft: "text", vk: "string" },
  number: { icon: HashtagIcon, label: L("Number", "Angka"), ui: "INPUT", fft: "number", vk: "number" },
  textarea: { icon: TextAlignLeftIcon, label: L("Textarea", "Teks panjang"), ui: "TEXTAREA", fft: "textarea", vk: "string" },
  date: { icon: Calendar01Icon, label: L("Date", "Tanggal"), ui: "DATE", fft: "date", vk: "string" },
  dropdown: { icon: DropdownFieldTypeIcon, label: L("Dropdown", "Daftar pilihan"), ui: "SELECT", fft: "select", vk: "string" },
}

/** Palette order. No Repeater inside a Repeater. */
export const KIND_ORDER: ChildKind[] = ["text", "number", "textarea", "date", "dropdown"]

const defaultOptions = (): ChildOption[] => [
  { v: "option_1", label: L("Option 1", "Opsi 1") },
  { v: "option_2", label: L("Option 2", "Opsi 2") },
]

/** Fill the settings a kind needs (same as the prototype's Type `set`). Idempotent. */
export function normalizeChild(c: ChildField): ChildField {
  const next = { ...c }
  if (next.kind === "number") {
    if (next.min == null) next.min = 0
    next.currency = Boolean(next.currency)
  }
  if (next.kind === "dropdown" && !next.options?.length) next.options = defaultOptions()
  if ((next.kind === "text" || next.kind === "textarea") && !next.placeholder) next.placeholder = L("", "")
  return next
}

/* ── rules ──────────────────────────────────────────────────────────────── */

/** First plain Number × first Rupiah Number, or null. */
export function pair(p: RepeaterProps): [ChildField, ChildField] | null {
  const q = p.fields.find((f) => f.kind === "number" && !f.currency)
  const r = p.fields.find((f) => f.kind === "number" && f.currency)
  return q && r ? [q, r] : null
}

export const showSub = (p: RepeaterProps) => p.subtotal && pair(p) != null

/** Required raises the minimum to 1 row. */
export const minEff = (p: RepeaterProps) => (p.required ? Math.max(1, Number(p.minRows) || 0) : Number(p.minRows) || 0)
export const maxEff = (p: RepeaterProps) => Math.max(1, Number(p.maxRows) || 1)

export const num = (v: unknown): number | null => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v))
export const filled = (v: unknown) => v != null && String(v).trim() !== ""

/** Cards on phones (or always), table otherwise. */
export const cardsFor = (p: RepeaterProps, compact: boolean) => p.layout === "cards" || (compact && p.mobileLayout === "cards")

/** Half-width cell in the card grid. */
export const half = (f: ChildField, phone: boolean) =>
  f.kind === "number" || f.kind === "date" || (!phone && (f.kind === "text" || f.kind === "dropdown"))

/** Qty × Unit price for one row, or null while either is empty. */
export function rowSub(p: RepeaterProps, row: RepeaterRow): number | null {
  const pr = pair(p)
  if (!pr) return null
  const a = num(row.v[pr[0].id])
  const b = num(row.v[pr[1].id])
  return a == null || b == null ? null : a * b
}

export const total = (p: RepeaterProps, rows: RepeaterRow[]) => rows.reduce((s, r) => s + (rowSub(p, r) ?? 0), 0)

/** Issue id of one cell (the prototype's `rp-<row>-<field>`). */
export const cellFid = (row: RepeaterRow, f: ChildField) => `rp-${row.id}-${f.id}`

export const mkRow = (vals: Record<string, string> = {}): RepeaterRow => ({ id: uid("r"), v: { ...vals } })

/* ── formatting ─────────────────────────────────────────────────────────── */

const locale = (lang: Lang) => (lang === "id" ? "id-ID" : "en-GB")

export const fmtNum = (n: number, lang: Lang) => new Intl.NumberFormat(locale(lang)).format(n)

/** Value as shown in a card summary. */
export function display(f: ChildField, v: string | undefined, lang: Lang): string {
  if (!filled(v)) return ""
  const s = String(v)
  if (f.kind === "number") {
    const x = num(s)
    return x == null ? s : f.currency ? rupiah(x) : fmtNum(x, lang)
  }
  if (f.kind === "dropdown") return tr(lang, f.options?.find((o) => o.v === s)?.label ?? L(s, s))
  if (f.kind === "date") {
    const d = parseISO(s)
    return d ? new Intl.DateTimeFormat(locale(lang), { day: "numeric", month: "short", year: "numeric" }).format(d) : s
  }
  return s
}

/* ── validation (messages exactly as the prototype) ─────────────────────── */

export function validate(p: RepeaterProps, r: RepeaterValue): Issue[] {
  const out: Issue[] = []
  const rows = r.rows
  const lb = p.label
  const min = minEff(p)
  const max = maxEff(p)
  if (rows.length < min)
    out.push({ fid: "rp-add", msg: L(`Add at least ${min} row${min > 1 ? "s" : ""} to ${lb.en}`, `Tambahkan minimal ${min} baris ke ${lb.id}`) })
  if (rows.length > max)
    out.push({
      fid: `rp-del-${rows[rows.length - 1].id}`,
      msg: L(`${lb.en} allows ${max} rows. Remove ${rows.length - max}.`, `${lb.id} maksimal ${max} baris. Hapus ${rows.length - max}.`),
    })
  rows.forEach((row, i) =>
    p.fields.forEach((f) => {
      const v = row.v[f.id]
      const n = i + 1
      const fid = cellFid(row, f)
      if (!filled(v)) {
        if (f.required) out.push({ fid, msg: L(`Row ${n}: ${f.label.en} is required`, `Baris ${n}: ${f.label.id} wajib diisi`) })
        return
      }
      if (f.kind === "number") {
        if (Number.isNaN(Number(v))) out.push({ fid, msg: L(`Row ${n}: ${f.label.en} must be a number`, `Baris ${n}: ${f.label.id} harus angka`) })
        else if (f.min != null && f.min !== "" && Number(v) < f.min) {
          const m = f.currency ? rupiah(f.min) : String(f.min)
          out.push({ fid, msg: L(`Row ${n}: ${f.label.en} must be at least ${m}`, `Baris ${n}: ${f.label.id} minimal ${m}`) })
        }
      }
    }),
  )
  return out
}

/* ── payload and spec ───────────────────────────────────────────────────── */

/** One object per row; numbers as numbers (empty → null), empty text as "". */
export const rowsValue = (p: RepeaterProps, r: RepeaterValue) =>
  r.rows.map((row) => Object.fromEntries(p.fields.map((f) => [f.name, f.kind === "number" ? num(row.v[f.id]) : (row.v[f.id] ?? "")])))

export function childSpec(f: ChildField): Record<string, unknown> {
  const k = KINDS[f.kind]
  const o: Record<string, unknown> = { ui_type: k.ui, form_field_type: k.fft, value_kind: k.vk, name: f.name, label: f.label, required: f.required }
  if (f.kind === "number") {
    o.min = f.min === "" || f.min == null ? null : f.min
    if (f.currency) o.currency = "IDR"
  }
  if ((f.kind === "text" || f.kind === "textarea") && f.placeholder && (f.placeholder.en || f.placeholder.id)) o.placeholder = f.placeholder
  if (f.kind === "dropdown") o.options = (f.options ?? []).map((x) => ({ value: x.v, label: x.label }))
  return o
}

/* ── mock rows (the prototype's revision story) ─────────────────────────── */

/** A plausible value for a child field the mock rows don't know (renamed or added in Edit Element). */
function fallback(f: ChildField, i: number): string {
  if (f.kind === "number") return f.currency ? String(250000 * (i + 1)) : String(i + 1)
  if (f.kind === "date") return `2026-10-${String(12 + i).padStart(2, "0")}`
  if (f.kind === "dropdown") return f.options?.[0]?.v ?? ""
  return f.kind === "text" ? `${f.label.en} ${i + 1}` : ""
}

/** Rows by child key, mapped onto the current fields' ids. Unknown keys stay empty unless `fill`. */
function rowsFor(p: RepeaterProps, byKey: Record<string, string>[], fill = false): RepeaterRow[] {
  return byKey.map((src, i) =>
    mkRow(Object.fromEntries(p.fields.map((f) => [f.id, src[f.name] ?? (fill ? fallback(f, i) : "")]))),
  )
}

/** The request returned by the manager: row 2 still misses its Qty; row 1 starts collapsed on cards. */
export function initialValue(p: RepeaterProps): RepeaterValue {
  const rows = rowsFor(p, [
    { item_name: "Laptop", qty: "2", unit_price: "15000000", note: "Untuk 2 staf baru tim desain" },
    { item_name: "Monitor 24 inci", qty: "", unit_price: "2450000", note: "" },
  ])
  return { rows, collapsed: { [rows[0].id]: "" }, removed: null }
}

/** Two complete rows (the shaping payload), for the Read-only / Disabled columns. */
export function sampleValue(p: RepeaterProps): RepeaterValue {
  const rows = rowsFor(p, [
    { item_name: "Laptop", qty: "2", unit_price: "15000000", note: "Untuk 2 staf baru tim desain" },
    { item_name: "Monitor 24 inci", qty: "2", unit_price: "2450000", note: "" },
  ], true)
  return { rows, collapsed: {}, removed: null }
}
