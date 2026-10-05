import { L, type L10n } from "./i18n"
import { uniqueErr } from "./lib"
import type { EditorTab, ListItem, PropField, PropSection } from "./types"

/* Rules shared by every Edit Element field. Components add their own with `validate`. */

export const isVisible = <P>(f: PropField<P>, p: P) => !f.when || f.when(p)

export function valueOf<P>(f: PropField<P>, p: P): unknown {
  return "k" in f ? (p as Record<string, unknown>)[f.k] : undefined
}

export function fieldError<P>(f: PropField<P>, p: P): L10n | null {
  if (f.t === "note") return null
  const v = valueOf(f, p)

  // The field's own message wins over the generic ones below (e.g. "Use 120–600 px").
  const own = f.validate ? f.validate(v, p) : null
  if (own) return own

  if (f.t === "number" && v !== "" && v != null) {
    const n = Number(v)
    if (Number.isNaN(n)) return L("Enter a number", "Isi angka")
    if (f.min != null && n < f.min) return L(`Use ${f.min} or more`, `Minimal ${f.min}`)
    if (f.max != null && n > f.max) return L(`Use ${f.max} or less`, `Maksimal ${f.max}`)
  }
  if (f.t === "number" && (v === "" || v == null) && !f.allowEmpty) return L("Enter a number", "Isi angka")

  if (f.t === "list") {
    const items = (v as ListItem[] | undefined) ?? []
    if (f.min != null && items.length < f.min) return L(`Keep at least ${f.min}`, `Minimal ${f.min}`)
    if (f.i18n !== false && items.some((it) => !it.label?.en.trim()))
      return L("Every item needs an English label", "Setiap item butuh label bahasa Inggris")
    if (f.keyField) {
      const dup = uniqueErr(items, f.keyField)
      if (dup) return dup
    }
  }

  if (f.t === "chips" && f.validate == null && Array.isArray(v) && v.length === 0)
    return L("Pick at least one", "Pilih minimal satu")

  return null
}

/** Number of invalid visible fields per Edit Element tab. */
export function errorsByTab<P>(sections: PropSection<P>[], p: P): Record<EditorTab, number> {
  const out: Record<EditorTab, number> = { general: 0, logic: 0, validation: 0 }
  for (const s of sections)
    for (const f of s.fields) if (isVisible(f, p) && fieldError(f, p)) out[s.tab] += 1
  return out
}
