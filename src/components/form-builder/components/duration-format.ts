import { L, type L10n } from "../i18n"

/*
 * Shared wording for the Wave 4 date components (Duration, Time range, Week picker), so all three
 * read the same: durations as "3 h 30 m" / "3 j 30 m", and limits as one "Allowed: …" / "Batas: …"
 * line under the control. Private helper of duration.tsx; time-range.tsx and week.tsx import it.
 */

/** Edit Element numbers that may be empty ("" = no limit). */
export const optNum = (v: unknown): number | null => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v))

/**
 * 210 → "3 h 30 m" / "3 j 30 m"; 180 → "3 h" / "3 j"; 0 → "0 m".
 * With `hoursPerDay` (Duration with days), whole days come first: 600 at 8 h a day → "1 d 2 h" / "1 hr 2 j".
 */
export function fmtMinutes(total: number, hoursPerDay = 0): L10n {
  const n = Math.max(0, Math.round(total))
  const perDay = hoursPerDay * 60
  const d = perDay ? Math.floor(n / perDay) : 0
  const rest = n - d * perDay
  const h = Math.floor(rest / 60)
  const m = rest % 60
  const en: string[] = []
  const id: string[] = []
  if (d) {
    en.push(`${d} d`)
    id.push(`${d} hr`)
  }
  if (h) {
    en.push(`${h} h`)
    id.push(`${h} j`)
  }
  if (m || (!d && !h)) {
    en.push(`${m} m`)
    id.push(`${m} m`)
  }
  return L(en.join(" "), id.join(" "))
}

/** "Allowed: 30 m to 4 h" / "Batas: 30 m sampai 4 j"; null without limits. */
export function allowedText(min: number | null, max: number | null, fmt: (n: number) => L10n): L10n | null {
  if (min != null && max != null) {
    const a = fmt(min)
    const b = fmt(max)
    return L(`Allowed: ${a.en} to ${b.en}`, `Batas: ${a.id} sampai ${b.id}`)
  }
  if (min != null) {
    const a = fmt(min)
    return L(`Allowed: at least ${a.en}`, `Batas: minimal ${a.id}`)
  }
  if (max != null) {
    const b = fmt(max)
    return L(`Allowed: up to ${b.en}`, `Batas: maksimal ${b.id}`)
  }
  return null
}

export const minMsg = (s: L10n) => L(`The duration must be at least ${s.en}`, `Durasi minimal ${s.id}`)
export const maxMsg = (s: L10n) => L(`The duration can’t be more than ${s.en}`, `Durasi tidak boleh lebih dari ${s.id}`)

/** Edit Element: Longest duration below Shortest duration. */
export function minMaxErr(min: unknown, max: unknown): L10n | null {
  const a = optNum(min)
  const b = optNum(max)
  return a != null && b != null && b < a
    ? L("Longest duration is shorter than the shortest duration", "Durasi maksimal lebih pendek dari durasi minimal")
    : null
}

/** Parts of the muted line under a control, joined with " · " (empty parts dropped). */
export function joinParts(parts: (L10n | null | false | undefined)[]): L10n | null {
  const list = parts.filter((x): x is L10n => Boolean(x))
  return list.length ? L(list.map((x) => x.en).join(" · "), list.map((x) => x.id).join(" · ")) : null
}
