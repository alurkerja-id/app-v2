import { L, type L10n } from "../i18n"
import { KEY_RE, rupiah, snake, uid } from "../lib"
import type { Issue } from "../types"
import { childSpec, filled, normalizeChild, num, type ChildField, type ChildKind } from "./repeater-model"

/* Containers (Tabs ★, Accordion ★, Multi-step wizard ★) — shared types and pure helpers.
   Shaping §4f: a container keeps its parts in `children`; each tab / section / step is a
   child with its own `children`. The fields inside stay ordinary top-level process
   variables, so the payload is flat and keys must be unique across the whole form. */

export interface Section {
  /** Stable id inside the builder; never saved. */
  id: string
  /** Saved as the tab / section / step key (from the English label). */
  key: string
  label: L10n
  /** Wizard steps only: one line under the step title. */
  description?: L10n
  fields: ChildField[]
}

/** Raw input per child field id — the same strings the inputs hold. */
export type Vals = Record<string, string>

export function field(kind: ChildKind, name: string, en: string, id: string, extra: Partial<ChildField> = {}): ChildField {
  return normalizeChild({ id: uid("c"), kind, name, label: L(en, id), required: false, ...extra })
}

export function section(en: string, id: string, fields: ChildField[], description?: L10n): Section {
  return { id: uid("s"), key: snake(en), label: L(en, id), description, fields }
}

export const allFields = (sections: Section[]) => sections.flatMap((s) => s.fields)

/** Issue id of one child control. */
export const fieldFid = (f: ChildField) => `cf-${f.id}`

/** Index of the section that holds an issue, or -1. */
export const sectionOfFid = (sections: Section[], fid: string) => sections.findIndex((s) => s.fields.some((f) => fieldFid(f) === fid))

/** Issue count per section, in section order. */
export const issueCounts = (sections: Section[], issues: Issue[]) =>
  sections.map((s) => issues.filter((i) => s.fields.some((f) => fieldFid(f) === i.fid)).length)

/* ── validation ─────────────────────────────────────────────────────────── */

/** Messages for one child field. No "Row n" prefix: every field is its own variable. */
export function fieldIssues(f: ChildField, v: string | undefined): Issue[] {
  const fid = fieldFid(f)
  if (!filled(v)) return f.required ? [{ fid, msg: L(`${f.label.en} is required`, `${f.label.id} wajib diisi`) }] : []
  if (f.kind === "number") {
    if (Number.isNaN(Number(v))) return [{ fid, msg: L(`${f.label.en} must be a number`, `${f.label.id} harus angka`) }]
    if (f.min != null && f.min !== "" && Number(v) < f.min) {
      const m = f.currency ? rupiah(f.min) : String(f.min)
      return [{ fid, msg: L(`${f.label.en} must be at least ${m}`, `${f.label.id} minimal ${m}`) }]
    }
  }
  return []
}

export const sectionIssues = (s: Section, vals: Vals) => s.fields.flatMap((f) => fieldIssues(f, vals[f.id]))
export const containerIssues = (sections: Section[], vals: Vals) => sections.flatMap((s) => sectionIssues(s, vals))

/* ── payload and spec ───────────────────────────────────────────────────── */

/** Flat payload: one key per child field; numbers as numbers (empty → null), text as "". */
export function entries(sections: Section[], vals: Vals): Record<string, unknown> {
  return Object.fromEntries(allFields(sections).map((f) => [f.name, f.kind === "number" ? num(vals[f.id]) : (vals[f.id] ?? "")]))
}

/** `children` of the container node: one child per section, each with its own `children`. */
export function sectionsSpec(sections: Section[], uiType: string): Record<string, unknown>[] {
  return sections.map((s) => ({
    ui_type: uiType,
    key: s.key,
    label: s.label,
    ...(s.description && (s.description.en || s.description.id) ? { description: s.description } : {}),
    children: s.fields.map(childSpec),
  }))
}

/* ── Edit Element checks ────────────────────────────────────────────────── */

/** Problem with one child field's key, given every field in the container. */
export function childKeyError(c: ChildField, sections: Section[]): L10n | null {
  const s = c.name
  if (!s) return L("A key is required", "Key wajib diisi")
  if (!KEY_RE.test(s)) return L("Use lowercase letters, numbers and _ and start with a letter", "Pakai huruf kecil, angka, dan _ serta diawali huruf")
  if (allFields(sections).some((x) => x.id !== c.id && x.name === s))
    return L("Another field in this container uses this key", "Field lain di container ini sudah memakai key ini")
  return null
}

/** First problem in the sections editor (also blocks Save Changes), or null. */
export function sectionsError(sections: Section[], noun: L10n, min: number): L10n | null {
  if (sections.length < min) return L(`Keep at least ${min} ${noun.en.toLowerCase()}s`, `Minimal ${min} ${noun.id.toLowerCase()}`)
  const keys = new Set<string>()
  for (const s of sections) {
    if (!s.label.en.trim()) return L(`Every ${noun.en.toLowerCase()} needs an English name`, `Setiap ${noun.id.toLowerCase()} butuh nama bahasa Inggris`)
    if (keys.has(s.key)) return L(`Two ${noun.en.toLowerCase()}s share the key “${s.key}”`, `Dua ${noun.id.toLowerCase()} memakai key “${s.key}”`)
    keys.add(s.key)
    if (!s.fields.length) return L(`${s.label.en} has no fields`, `${s.label.id} belum punya field`)
    for (const f of s.fields) {
      if (!f.label.en.trim()) return L(`${s.label.en}: a field needs an English name`, `${s.label.id}: ada field tanpa nama bahasa Inggris`)
      const k = childKeyError(f, sections)
      if (k) return L(`${s.label.en} · ${f.label.en}: ${k.en}`, `${s.label.id} · ${f.label.id}: ${k.id}`)
      if (f.kind === "dropdown" && !(f.options ?? []).length) return L(`${f.label.en} needs options`, `${f.label.id} butuh opsi`)
    }
  }
  return null
}

/* ── sample values (Read-only / Disabled columns) ───────────────────────── */

export function sampleFor(f: ChildField, i: number): string {
  if (f.kind === "number") return f.currency ? String(1250000 * (i + 1)) : String(i + 2)
  if (f.kind === "date") return `2026-11-${String(9 + i).padStart(2, "0")}`
  if (f.kind === "dropdown") return f.options?.[0]?.v ?? ""
  if (f.kind === "textarea") return "Sudah dicek bersama tim."
  return `${f.label.id || f.label.en}`
}

/** Fill every field: the given values first, a plausible sample for the rest. */
export function fillVals(sections: Section[], byKey: Record<string, string> = {}): Vals {
  return Object.fromEntries(allFields(sections).map((f, i) => [f.id, byKey[f.name] ?? sampleFor(f, i)]))
}

/** Map values by key onto the current field ids; unknown keys stay empty. */
export const valsByKey = (sections: Section[], byKey: Record<string, string>): Vals =>
  Object.fromEntries(allFields(sections).map((f) => [f.id, byKey[f.name] ?? ""]))
