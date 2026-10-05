/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { addWeeks, differenceInCalendarISOWeeks, getISOWeek, getISOWeekYear, startOfISOWeek } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, Calendar01Icon, Calendar04Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { dateTriggerClass } from "@/components/dashboard/date-range-picker"
import { L, useT, type L10n } from "../i18n"
import { F, parseISO, reqMsg, toISO } from "../lib"
import type { ComponentDef, Issue, RuntimeProps } from "../types"
import { joinParts, optNum } from "./duration-format"

/* Week picker — ui_type WEEK, value_kind "json". One ISO 8601 week (Monday–Sunday).
   Story: weekly progress report. */

interface WeekProps {
  label: L10n
  name: string
  allowPast: boolean
  /** "" = no limit; 0 = up to this week. */
  maxWeeksAhead: number | ""
  showDates: boolean
  required: boolean
}
/** Monday of the picked ISO week (yyyy-mm-dd), "" while not picked. */
type WeekValue = string

/* The mock task is opened on Friday 13 Nov 2026 (ISO week 46), the day its weekly report is due.
   In the app "this week" comes from the server date in Asia/Jakarta. */
const NOW_ISO = "2026-11-13"
const day = (iso: string) => parseISO(iso) ?? new Date(NaN)
const THIS_WEEK = toISO(startOfISOWeek(day(NOW_ISO)))
const SAMPLE = THIS_WEEK

const MONTHS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
}
const MONTHS_LONG = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  id: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
}
const DAYS = { en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"], id: ["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"] }

/* ── ISO week maths ─────────────────────────────────────────────────────── */

interface WeekInfo {
  /** Monday / Sunday, yyyy-mm-dd. */
  start: string
  end: string
  week: number
  /** ISO week-numbering year (2027-01-01 belongs to 2026-W53). */
  year: number
  key: string
}

function info(monday: string): WeekInfo | null {
  const d = parseISO(monday)
  if (!d) return null
  const mon = startOfISOWeek(d)
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6)
  const week = getISOWeek(mon)
  const year = getISOWeekYear(mon)
  return { start: toISO(mon), end: toISO(sun), week, year, key: `${year}-W${String(week).padStart(2, "0")}` }
}

const shiftWeek = (monday: string, n: number) => toISO(addWeeks(day(monday), n))
/** Thursday decides which month a week belongs to (same rule as ISO years). */
const monthOfWeek = (monday: string) => {
  const d = day(monday)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3).getMonth() + d.getFullYear() * 12
}
/** Month index (year * 12 + month) → the Mondays of every week row in its grid. */
function monthRows(m: number): string[] {
  const first = new Date(Math.floor(m / 12), m % 12, 1)
  const next = new Date(Math.floor(m / 12), (m % 12) + 1, 1)
  const out: string[] = []
  for (let d = startOfISOWeek(first); d < next; d = addWeeks(d, 1)) out.push(toISO(d))
  return out
}

/** Mondays of the earliest / latest week that may be picked, or null. */
function bounds(p: WeekProps) {
  const n = optNum(p.maxWeeksAhead)
  return { min: p.allowPast ? null : THIS_WEEK, max: n == null ? null : shiftWeek(THIS_WEEK, Math.max(0, Math.round(n))) }
}
const allowed = (p: WeekProps, monday: string) => {
  const b = bounds(p)
  return (!b.min || monday >= b.min) && (!b.max || monday <= b.max)
}

/* ── wording ────────────────────────────────────────────────────────────── */

/** "9–15 Nov 2026", "30 Nov – 6 Dec 2026", "28 Dec 2026 – 3 Jan 2027". */
function datesText(w: WeekInfo): L10n {
  const a = day(w.start)
  const b = day(w.end)
  const one = (lang: "en" | "id") => {
    const ma = MONTHS[lang][a.getMonth()]
    const mb = MONTHS[lang][b.getMonth()]
    if (a.getFullYear() !== b.getFullYear()) return `${a.getDate()} ${ma} ${a.getFullYear()} – ${b.getDate()} ${mb} ${b.getFullYear()}`
    if (ma !== mb) return `${a.getDate()} ${ma} – ${b.getDate()} ${mb} ${b.getFullYear()}`
    return `${a.getDate()}–${b.getDate()} ${mb} ${b.getFullYear()}`
  }
  return L(one("en"), one("id"))
}

/** "Week 46 · 9–15 Nov 2026" / "Minggu ke-46 · 9–15 Nov 2026"; without dates "Week 46, 2026". */
function weekText(p: WeekProps, w: WeekInfo): L10n {
  if (!p.showDates) return L(`Week ${w.week}, ${w.year}`, `Minggu ke-${w.week}, ${w.year}`)
  const d = datesText(w)
  return L(`Week ${w.week} · ${d.en}`, `Minggu ke-${w.week} · ${d.id}`)
}

const weeksL = (n: number) => L(`${n} week${n === 1 ? "" : "s"}`, `${n} minggu`)

function allowedWeeks(p: WeekProps): L10n | null {
  const n = optNum(p.maxWeeksAhead)
  const w = n == null ? null : weeksL(n)
  if (p.allowPast) {
    if (n == null || !w) return null
    return n === 0 ? L("Allowed: up to this week", "Batas: sampai minggu ini") : L(`Allowed: up to ${w.en} ahead`, `Batas: sampai ${w.id} ke depan`)
  }
  if (n == null || !w) return L("Allowed: this week or later", "Batas: minggu ini atau setelahnya")
  return n === 0 ? L("Allowed: this week only", "Batas: hanya minggu ini") : L(`Allowed: this week to ${w.en} ahead`, `Batas: minggu ini sampai ${w.id} ke depan`)
}

const subText = (p: WeekProps) => joinParts([L("A week runs Monday to Sunday", "Satu minggu = Senin sampai Minggu"), allowedWeeks(p)])

/* ── shared bits ────────────────────────────────────────────────────────── */

function WeekFace({ p, v }: { p: WeekProps; v: WeekValue }) {
  const t = useT()
  const w = info(v)
  return w ? (
    <span className="min-w-0 flex-1 truncate tabular-nums">{t(weekText(p, w))}</span>
  ) : (
    <span className="min-w-0 flex-1 truncate text-muted-foreground">{t(L("Pick a week", "Pilih minggu"))}</span>
  )
}

function SubLine({ p, id }: { p: WeekProps; id?: string }) {
  const t = useT()
  const s = subText(p)
  return s ? (
    <p id={id} className="text-xs text-muted-foreground">
      {t(s)}
    </p>
  ) : null
}

/* ── builder ────────────────────────────────────────────────────────────── */

function WeekCanvas({ props: p }: { props: WeekProps }) {
  const arrow = "flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground"
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className={arrow}>
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
        </span>
        <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-3xl bg-[var(--input-surface)] px-3 text-sm shadow-[var(--input-depth)]">
          <HugeiconsIcon icon={Calendar01Icon} className="size-4 shrink-0 text-muted-foreground" />
          <WeekFace p={p} v={SAMPLE} />
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 shrink-0 text-muted-foreground" />
        </div>
        <span className={arrow}>
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
        </span>
      </div>
      <SubLine p={p} />
    </div>
  )
}

/* ── runtime ────────────────────────────────────────────────────────────── */

/** Month grid in a popover; a whole week row is one option. */
function WeekGrid({ p, v, onPick, onClear }: { p: WeekProps; v: WeekValue; onPick: (monday: string) => void; onClear: () => void }) {
  const t = useT()
  const start = v || THIS_WEEK
  const [month, setMonth] = useState(() => monthOfWeek(start))
  const [cursor, setCursor] = useState(start)
  const list = useRef<HTMLDivElement>(null)
  const moved = useRef(true)
  const rows = monthRows(month)
  // Roving focus: the cursor row when it is in view, else the picked week, else the first row.
  const focusKey = rows.includes(cursor) ? cursor : rows.includes(v) ? v : rows[0]
  const monthName = L(`${MONTHS_LONG.en[month % 12]} ${Math.floor(month / 12)}`, `${MONTHS_LONG.id[month % 12]} ${Math.floor(month / 12)}`)

  useEffect(() => {
    if (!moved.current) return
    moved.current = false
    list.current?.querySelector<HTMLElement>(`[data-week="${focusKey}"]`)?.focus()
  }, [focusKey])

  const go = (monday: string) => {
    moved.current = true
    setCursor(monday)
    // A row spanning two months shows in both grids: stay on this month while it is in view.
    if (!monthRows(month).includes(monday)) setMonth(monthOfWeek(monday))
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "PageDown" || e.key === "PageUp") {
      // Previous / next month, same row.
      e.preventDefault()
      const m = month + (e.key === "PageDown" ? 1 : -1)
      const r = monthRows(m)
      moved.current = true
      setMonth(m)
      setCursor(r[Math.min(Math.max(0, rows.indexOf(focusKey)), r.length - 1)])
      return
    }
    const next =
      e.key === "ArrowDown"
        ? shiftWeek(focusKey, 1)
        : e.key === "ArrowUp"
          ? shiftWeek(focusKey, -1)
          : e.key === "Home"
            ? rows[0]
            : e.key === "End"
              ? rows[rows.length - 1]
              : null
    if (next) {
      e.preventDefault()
      go(next)
      return
    }
    if ((e.key === "Enter" || e.key === " ") && allowed(p, focusKey)) {
      e.preventDefault()
      onPick(focusKey)
    }
  }

  return (
    <div className="flex w-72 max-w-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon-sm" aria-label={t(L("Previous month", "Bulan sebelumnya"))} onClick={() => setMonth(month - 1)}>
          <HugeiconsIcon icon={ArrowLeft01Icon} />
        </Button>
        <span className="text-sm font-medium" aria-live="polite">
          {t(monthName)}
        </span>
        <Button variant="ghost" size="icon-sm" aria-label={t(L("Next month", "Bulan berikutnya"))} onClick={() => setMonth(month + 1)}>
          <HugeiconsIcon icon={ArrowRight01Icon} />
        </Button>
      </div>
      <div className="grid grid-cols-8 text-center text-[11px] font-medium text-muted-foreground" aria-hidden>
        <span title={t(L("ISO week number", "Nomor minggu ISO"))}>{t(L("Wk", "Mg"))}</span>
        {DAYS.en.map((_, i) => (
          <span key={i}>{t(L(DAYS.en[i], DAYS.id[i]))}</span>
        ))}
      </div>
      <div ref={list} role="listbox" aria-label={t(L(`Weeks in ${monthName.en}`, `Minggu di ${monthName.id}`))} className="flex flex-col gap-0.5" onKeyDown={onKey}>
        {rows.map((monday) => {
          const w = info(monday)
          if (!w) return null
          const on = monday === v
          const ok = allowed(p, monday)
          const now = monday === THIS_WEEK
          return (
            <div
              key={monday}
              role="option"
              data-week={monday}
              aria-selected={on}
              aria-disabled={!ok || undefined}
              aria-label={t(weekText({ ...p, showDates: true }, w)) + (now ? t(L(" (this week)", " (minggu ini)")) : "")}
              tabIndex={monday === focusKey ? 0 : -1}
              onClick={() => ok && onPick(monday)}
              onFocus={() => setCursor(monday)}
              className={cn(
                "grid h-9 grid-cols-8 items-center rounded-full text-center text-sm tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                on ? "bg-primary text-primary-foreground" : ok ? "cursor-pointer hover:bg-muted" : "cursor-not-allowed text-muted-foreground/50",
              )}
            >
              <span className={cn("text-[11px] font-semibold", on ? "text-primary-foreground/80" : "text-muted-foreground")}>{w.week}</span>
              {Array.from({ length: 7 }, (_, i) => {
                const mon = day(monday)
                const d = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i)
                const inMonth = d.getMonth() === month % 12
                const today = toISO(d) === NOW_ISO
                return (
                  <span
                    key={i}
                    className={cn(
                      "mx-auto flex size-7 items-center justify-center rounded-full",
                      !inMonth && !on && ok && "text-muted-foreground/60",
                      today && (on ? "ring-2 ring-primary-foreground/70" : "font-semibold text-primary ring-2 ring-primary/40"),
                    )}
                  >
                    {d.getDate()}
                  </span>
                )
              })}
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
        <Button variant="outline" size="sm" disabled={!allowed(p, THIS_WEEK)} onClick={() => onPick(THIS_WEEK)}>
          {t(L("This week", "Minggu ini"))}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear}>
          {t(L("Clear", "Kosongkan"))}
        </Button>
      </div>
    </div>
  )
}

function WeekRuntime({ props: p, value: v, onChange, state, issues, id }: RuntimeProps<WeekProps, WeekValue>) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const w = info(v)

  if (state !== "active") {
    return (
      <div className="flex flex-col gap-1.5">
        <div
          id={`${id}-input`}
          role="textbox"
          tabIndex={state === "readonly" ? 0 : -1}
          aria-readonly={state === "readonly" || undefined}
          aria-disabled={state === "disabled" || undefined}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-sub`}
          className={cn(
            "flex min-h-9 min-w-0 items-center gap-2 rounded-3xl border border-transparent bg-muted px-3 py-1.5 text-sm outline-none",
            state === "disabled" ? "cursor-not-allowed text-muted-foreground" : "cursor-default text-foreground select-text focus-visible:shadow-[var(--input-depth-readonly-focus)]",
          )}
        >
          <HugeiconsIcon icon={Calendar01Icon} className="size-4 shrink-0 text-muted-foreground" />
          <WeekFace p={p} v={v} />
        </div>
        <SubLine p={p} id={`${id}-sub`} />
      </div>
    )
  }

  const base = v || THIS_WEEK
  const prev = shiftWeek(base, -1)
  const next = shiftWeek(base, 1)
  const pick = (monday: string) => {
    onChange(monday)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <Button variant="outline" size="icon" aria-label={t(L("Previous week", "Minggu sebelumnya"))} disabled={!allowed(p, prev)} onClick={() => onChange(prev)}>
          <HugeiconsIcon icon={ArrowLeft01Icon} />
        </Button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              id={`${id}-input`}
              aria-labelledby={`${id}-label ${id}-input`}
              aria-describedby={`${id}-sub`}
              aria-invalid={issues.length > 0 || undefined}
              className={cn(dateTriggerClass, "min-w-0 flex-1 justify-start aria-invalid:shadow-[var(--input-depth-invalid)]")}
            >
              <HugeiconsIcon icon={Calendar01Icon} className="size-4 shrink-0 text-muted-foreground" />
              <WeekFace p={p} v={v} />
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            aria-label={t(p.label)}
            className="w-auto max-w-[calc(100vw-1.5rem)] gap-0 p-3"
            // Focus goes to the picked week (or this week) instead of the first button.
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <WeekGrid
              p={p}
              v={v}
              onPick={pick}
              onClear={() => {
                onChange("")
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon" aria-label={t(L("Next week", "Minggu berikutnya"))} disabled={!allowed(p, next)} onClick={() => onChange(next)}>
          <HugeiconsIcon icon={ArrowRight01Icon} />
        </Button>
      </div>
      <span className="sr-only" aria-live="polite">
        {w ? t(weekText({ ...p, showDates: true }, w)) : ""}
      </span>
      <SubLine p={p} id={`${id}-sub`} />
    </div>
  )
}

function validate(p: WeekProps, v: WeekValue): Issue[] {
  const w = info(v)
  if (!w) return p.required ? [{ fid: "week", msg: reqMsg(p.label) }] : []
  const b = bounds(p)
  if (b.min && w.start < b.min) return [{ fid: "week", msg: L("Pick this week or a later one", "Pilih minggu ini atau minggu setelahnya") }]
  if (b.max && w.start > b.max) {
    const n = differenceInCalendarISOWeeks(day(b.max), day(THIS_WEEK))
    if (n === 0) return [{ fid: "week", msg: L("Pick this week or an earlier one", "Pilih minggu ini atau minggu sebelumnya") }]
    const last = info(b.max)
    const wk = weeksL(n)
    return [
      {
        fid: "week",
        msg: L(`Pick a week up to ${wk.en} ahead (week ${last?.week} at the latest)`, `Pilih minggu paling jauh ${wk.id} ke depan (paling lambat minggu ke-${last?.week})`),
      },
    ]
  }
  return []
}

/* ── definition ─────────────────────────────────────────────────────────── */

export const weekPicker: ComponentDef<WeekProps, WeekValue> = {
  slug: "week",
  wave: 4,
  week: 6,
  ui: "WEEK",
  vk: "json",
  group: "date",
  icon: Calendar04Icon,
  label: L("Week picker", "Pilih minggu"),
  title: L("Week picker (ISO week)", "Pilih minggu (minggu ISO)"),
  blurb: L("Pick one ISO week, e.g. week 46 · 9–15 Nov.", "Pilih satu minggu ISO, mis. minggu ke-46 · 9–15 Nov."),

  defaults: () => ({
    label: L("Report week", "Minggu laporan"),
    name: "report_week",
    allowPast: true,
    maxWeeksAhead: 0,
    showDates: true,
    required: true,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(),
        F.key(L("Saved as one JSON object: the ISO week plus its Monday and Sunday.", "Disimpan sebagai satu objek JSON: minggu ISO beserta tanggal Senin dan Minggunya.")),
        {
          t: "switch",
          k: "showDates",
          label: L("Show the dates", "Tampilkan tanggal"),
          hint: L("“Week 46 · 9–15 Nov 2026” instead of “Week 46, 2026”.", "“Minggu ke-46 · 9–15 Nov 2026”, bukan “Minggu ke-46, 2026”."),
        },
      ],
    },
    {
      tab: "general",
      title: L("Allowed weeks", "Minggu yang boleh dipilih"),
      fields: [
        {
          t: "switch",
          k: "allowPast",
          label: L("Allow past weeks", "Boleh minggu yang sudah lewat"),
          hint: L("Off = this week or later, e.g. for planning.", "Mati = minggu ini atau setelahnya, mis. untuk perencanaan."),
        },
        {
          t: "number",
          k: "maxWeeksAhead",
          label: L("Weeks ahead", "Minggu ke depan"),
          min: 0,
          max: 104,
          allowEmpty: true,
          hint: L("How far ahead the user may pick. `0` = up to this week (weekly reports). Empty = no limit.", "Seberapa jauh ke depan user boleh memilih. `0` = sampai minggu ini (laporan mingguan). Kosong = tanpa batas."),
        },
        {
          t: "note",
          text: L(
            "ISO 8601 weeks: Monday start, and week 1 holds the year’s first Thursday, so 2026 has **53 weeks** (W53 = 28 Dec 2026 – 3 Jan 2027). Wave 4 open decision 3.",
            "Minggu ISO 8601: dimulai Senin, dan minggu ke-1 berisi Kamis pertama tahun itu, jadi 2026 punya **53 minggu** (W53 = 28 Des 2026 – 3 Jan 2027). Keputusan terbuka Gelombang 4 no. 3.",
          ),
        },
      ],
    },
    { tab: "validation", fields: [F.required(L("The past / ahead limits are always checked.", "Batas minggu lalu / ke depan selalu dicek."))] },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: WeekCanvas,

  Runtime: WeekRuntime,
  initial: () => "",
  sample: () => SAMPLE,
  validate,
  value: (_, v) => {
    const w = info(v)
    return w ? { week: w.key, start: w.start, end: w.end } : { week: null, start: null, end: null }
  },

  spec: (p) => {
    const n = optNum(p.maxWeeksAhead)
    return {
      ui_type: "WEEK",
      value_kind: "json",
      name: p.name,
      label: p.label,
      required: p.required,
      config: {
        iso: true,
        week_starts_on: "monday",
        allow_past: p.allowPast,
        max_weeks_ahead: n == null ? null : Math.max(0, Math.round(n)),
        show_dates: p.showDates,
      },
    }
  },
  savedAs: (p) =>
    L(
      `One JSON variable \`${p.name}\` with \`week\` (\`2026-W46\`), and \`start\` (Monday) and \`end\` (Sunday) as \`yyyy-mm-dd\`.`,
      `Satu variabel JSON \`${p.name}\` berisi \`week\` (\`2026-W46\`), serta \`start\` (Senin) dan \`end\` (Minggu) dalam format \`yyyy-mm-dd\`.`,
    ),
  notes: [
    L(
      "ISO 8601 weeks only: Monday start, week 1 holds the year’s first Thursday. Use date-fns `getISOWeek`, `getISOWeekYear` and `startOfISOWeek`, never a Sunday-start week (Wave 4 open decision 3).",
      "Hanya minggu ISO 8601: dimulai Senin, minggu ke-1 berisi Kamis pertama tahun itu. Pakai `getISOWeek`, `getISOWeekYear`, dan `startOfISOWeek` dari date-fns, jangan minggu yang dimulai hari Minggu (keputusan terbuka Gelombang 4 no. 3).",
    ),
    L(
      "The payload carries the week plus its Monday and Sunday, so reports can filter by date without ISO maths. Around New Year the ISO year can differ from the calendar year: 1 Jan 2027 is in `2026-W53`.",
      "Payload membawa minggu beserta tanggal Senin dan Minggunya, jadi laporan bisa memfilter per tanggal tanpa hitungan ISO. Di sekitar Tahun Baru, tahun ISO bisa berbeda dari tahun kalender: 1 Jan 2027 masuk `2026-W53`.",
    ),
    L(
      "“This week” is the server date in Asia/Jakarta when the task opens. The prototype pretends today is Friday 13 Nov 2026 (week 46), the day the report is due.",
      "“Minggu ini” diambil dari tanggal server zona Asia/Jakarta saat task dibuka. Prototype menganggap hari ini Jumat 13 Nov 2026 (minggu ke-46), hari tenggat laporan.",
    ),
    L(
      "Weeks outside the limits stay visible in the grid but can’t be picked. The past / ahead rule is checked again on Complete Task and must match the server validator.",
      "Minggu di luar batas tetap tampil di kalender tetapi tidak bisa dipilih. Aturan minggu lalu / ke depan dicek lagi saat Complete Task dan harus sejalan dengan validator server.",
    ),
  ],
  story: {
    process: L("Weekly progress report", "Laporan mingguan"),
    step: L("Write the report", "Tulis laporan"),
    ref: "WR-2026-46-117",
    due: "2026-11-13",
    task: L("Send your weekly report", "Kirim laporan mingguan Anda"),
    after: [
      {
        name: "done_this_week",
        label: L("Done this week", "Selesai minggu ini"),
        type: "textarea",
        required: true,
        rows: 3,
        value: "Uji integrasi ERP–WMS selesai: 14 dari 16 skenario lolos. Pelatihan key user gudang batch 2.",
      },
      {
        name: "plan_next_week",
        label: L("Plan for next week", "Rencana minggu depan"),
        type: "textarea",
        required: true,
        rows: 3,
        value: "Perbaiki 2 skenario retur yang gagal, lalu siapkan data master untuk cut-over.",
      },
      {
        name: "blockers",
        label: L("Blockers", "Kendala"),
        type: "textarea",
        rows: 2,
        placeholder: L("Optional", "Opsional"),
      },
    ],
  },
}

