import { L, type L10n } from "./i18n"
import type { FieldState, Issue, ListItem, PropField } from "./types"

/* ── strings ────────────────────────────────────────────────────────────── */

/** Lowercase, accents removed, single spaces. Used for search and duplicate checks. */
export const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()

/** "Unit price" → "unit_price". Keys never start with a digit. */
export const snake = (s: unknown) =>
  norm(s)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^(\d)/, "_$1") || "field"

let uidN = 0
export const uid = (prefix = "n") => `${prefix}_${(Date.now() % 1e5).toString(36)}${(++uidN).toString(36)}`

export const KEY_RE = /^[a-z][a-z0-9_]*$/

/** "Items to purchase is required" / "Barang yang dibeli wajib diisi". */
export const reqMsg = (label: L10n) => L(`${label.en} is required`, `${label.id} wajib diisi`)

/** First duplicate / missing key in a list, or null. */
export function uniqueErr(items: ListItem[], field: string): L10n | null {
  const seen = new Set<string>()
  for (const it of items) {
    const k = String(it[field] ?? "")
    if (!k) return L("Every item needs an English label", "Setiap item butuh label bahasa Inggris")
    if (seen.has(k)) return L(`Two items share the key “${k}”`, `Dua item memakai key “${k}”`)
    seen.add(k)
  }
  return null
}

/* ── shared Edit Element rows (named like Studio: Name, Key, Required) ──── */

type WithLabel = { label: L10n }
type WithName = { name: string }
type WithRequired = { required: boolean }

export const F = {
  name<P extends WithLabel>(label: L10n = L("Name", "Nama"), opts: { multi?: boolean; hint?: L10n } = {}): PropField<P> {
    return {
      t: "i18n",
      k: "label" as Extract<keyof P, string>,
      label,
      multi: opts.multi,
      rows: opts.multi ? 2 : undefined,
      hint: opts.hint ?? L("Shown to the user above the field.", "Tampil untuk user di atas field."),
      validate: (v) => (!(v as L10n).en.trim() ? L("Enter the English name", "Isi nama bahasa Inggris") : null),
    }
  },
  key<P extends WithName>(hint?: L10n): PropField<P> {
    return {
      t: "text",
      k: "name" as Extract<keyof P, string>,
      label: L("Key", "Key"),
      mono: true,
      hint: hint ?? L("Variable name in the process.", "Nama variabel di proses."),
      validate: (v) =>
        !v
          ? L("A key is required", "Key wajib diisi")
          : !KEY_RE.test(String(v))
            ? L("Use lowercase letters, numbers and _ and start with a letter", "Pakai huruf kecil, angka, dan _ serta diawali huruf")
            : null,
    }
  },
  required<P extends WithRequired>(hint?: L10n): PropField<P> {
    return { t: "switch", k: "required" as Extract<keyof P, string>, label: L("Required", "Wajib diisi"), hint }
  },
}

/* ── formatting ─────────────────────────────────────────────────────────── */

export const TODAY = "2026-10-05"

export const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID")

export function parseISO(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "")
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

export function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/* ── runtime helpers ────────────────────────────────────────────────────── */

/** Issues whose fid is `prefix` or starts with it (e.g. every "row-" issue). */
export const issuesFor = (issues: Issue[], prefix: string) => issues.filter((i) => i.fid === prefix || i.fid.startsWith(prefix))

/** Props for native text controls, same rule as the Form Component page. */
export function ctl(state: FieldState) {
  return { disabled: state === "disabled", readOnly: state === "readonly" }
}

/** True when the user may not change the value. */
export const inert = (state: FieldState) => state !== "active"
