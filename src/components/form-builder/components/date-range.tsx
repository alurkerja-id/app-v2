/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useState, type ComponentProps } from "react"
import type { DayButton, DayPicker } from "react-day-picker"
import { format } from "date-fns"
import { enGB, id as idLocale } from "date-fns/locale"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, ArrowDown01Icon, Calendar01Icon, Calendar03Icon, InformationCircleIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { dateTriggerClass } from "@/components/dashboard/date-range-picker"
import { L, useLang, useT, type L10n, type Lang } from "../i18n"
import { F, parseISO, reqMsg, TODAY, toISO } from "../lib"
import type { ComponentDef, Issue, RuntimeProps } from "../types"


/* ui/calendar defines Root and DayButton inline, so every re-render (the hover
   preview below) remounts all day buttons and a click can land on a removed
   button. Stable module-level versions keep the same elements between renders. */
type RootProps = Parameters<NonNullable<NonNullable<ComponentProps<typeof DayPicker>["components"]>["Root"]>>[0]
function CalendarRoot({ className, rootRef, ...rest }: RootProps) {
  return <div data-slot="calendar" ref={rootRef} className={className} {...rest} />
}
function RangeDayButton(props: ComponentProps<typeof DayButton>) {
  return <CalendarDayButton {...props} />
}
const STABLE_PARTS = { Root: CalendarRoot, DayButton: RangeDayButton }
import { dateLimit, LimitEditor, limitError, limitISO, limitSpec, type DateLimit } from "./date-range-limit"

/* Date range + duration — ui_type DATE_RANGE, value_kind "json". Story: annual leave request. */

type CountAs = "calendar_days" | "working_days"

interface DateRangeProps {
  label: L10n
  name: string
  /** Input Date's Placeholder (plain text). Empty = the built-in prompt. */
  placeholder: string
  /** Input Date's display Format (date-fns tokens). The payload stays ISO. */
  format: string
  countAs: CountAs
  includeEnd: boolean
  minDate: DateLimit
  maxDate: DateLimit
  required: boolean
}
/** ISO yyyy-mm-dd, "" while not picked. */
interface DateRangeValue {
  start: string
  end: string
}

const DEFAULT_FORMAT = "dd/MM/yyyy"
const SAMPLE: DateRangeValue = { start: "2026-10-12", end: "2026-10-16" }
const LOCALES = { en: enGB, id: idLocale }
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

/* ── date maths ─────────────────────────────────────────────────────────── */

const day = (iso: string) => parseISO(iso) ?? new Date(NaN)
const addDays = (iso: string, n: number) => {
  const d = day(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}
const isWkend = (iso: string) => {
  const g = day(iso).getDay()
  return g === 0 || g === 6
}
const monthOf = (iso: string) => {
  const d = day(iso)
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** Days in the range: `n` in the chosen unit, `cal` in calendar days. */
function duration(p: DateRangeProps, s: string, e: string): { n: number; cal: number } | null {
  if (!ISO_RE.test(s) || !ISO_RE.test(e) || e < s) return null
  const last = p.includeEnd ? e : addDays(e, -1)
  let n = 0
  let cal = 0
  for (let d = s; d <= last; d = addDays(d, 1)) {
    cal++
    if (!isWkend(d)) n++
  }
  return { n: p.countAs === "working_days" ? n : cal, cal }
}

const unitText = (p: DateRangeProps, n: number) =>
  p.countAs === "working_days" ? L(`${n} working day${n === 1 ? "" : "s"}`, `${n} hari kerja`) : L(`${n} day${n === 1 ? "" : "s"}`, `${n} hari`)

const subText = (p: DateRangeProps) =>
  L(
    (p.countAs === "working_days" ? "Weekends not counted" : "Every calendar day counted") + (p.includeEnd ? " · end date included" : " · end date not counted"),
    (p.countAs === "working_days" ? "Akhir pekan tidak dihitung" : "Semua hari kalender dihitung") +
      (p.includeEnd ? " · tanggal selesai ikut dihitung" : " · tanggal selesai tidak dihitung"),
  )

/** "5 Oct 2026" / "5 Okt 2026" — the date inside validation messages. */
const msgDate = (iso: string, loc: string) => new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric" }).format(day(iso))
const msgDateL = (iso: string) => ({ en: msgDate(iso, "en-GB"), id: msgDate(iso, "id-ID") })

/** A date in the Format chosen in Edit Element. */
function showDate(iso: string, fmt: string, lang: Lang) {
  const d = parseISO(iso)
  if (!d) return ""
  try {
    return format(d, fmt.trim() || DEFAULT_FORMAT, { locale: LOCALES[lang] })
  } catch {
    return format(d, DEFAULT_FORMAT)
  }
}

function formatErr(v: unknown): L10n | null {
  const s = String(v ?? "").trim()
  if (!s) return L("Enter a date format", "Isi format tanggal")
  try {
    format(new Date(2026, 9, 12), s)
    return null
  } catch {
    return L("Use a date format like dd/MM/yyyy", "Pakai format tanggal seperti dd/MM/yyyy")
  }
}

/** Latest date before the earliest date (only when both resolve to a date). */
function orderErr(p: DateRangeProps): L10n | null {
  const min = limitISO(p.minDate)
  const max = limitISO(p.maxDate)
  return min && max && max < min ? L("Latest date is before the earliest date", "Tanggal paling akhir lebih awal dari tanggal paling awal") : null
}

/* ── shared bits ────────────────────────────────────────────────────────── */

/** "12/10/2026 → 16/10/2026" with Start / End stand-ins, or the placeholder. */
function RangeText({ p, v }: { p: DateRangeProps; v: DateRangeValue }) {
  const t = useT()
  const { lang } = useLang()
  if (!v.start && !v.end)
    return <span className="min-w-0 flex-1 truncate text-muted-foreground">{p.placeholder.trim() || t(L("Pick the first and last day", "Pilih hari pertama dan terakhir"))}</span>
  return (
    <span className="min-w-0 flex-1 truncate tabular-nums">
      {v.start ? showDate(v.start, p.format, lang) : <span className="text-muted-foreground">{t(L("Start", "Mulai"))}</span>}
      <span className="mx-1.5 text-muted-foreground" aria-hidden>
        →
      </span>
      <span className="sr-only"> – </span>
      {v.end ? showDate(v.end, p.format, lang) : <span className="text-muted-foreground">{t(L("End", "Selesai"))}</span>}
    </span>
  )
}

function DurationBadge({ p, v }: { p: DateRangeProps; v: DateRangeValue }) {
  const t = useT()
  const d = duration(p, v.start, v.end)
  return d ? (
    <Badge variant="secondary" className="shrink-0 tabular-nums">
      {t(unitText(p, d.n))}
    </Badge>
  ) : null
}

function SubLine({ p, v, id }: { p: DateRangeProps; v: DateRangeValue; id?: string }) {
  const t = useT()
  const d = duration(p, v.start, v.end)
  return (
    <p id={id} className="text-xs text-muted-foreground">
      {t(subText(p))}
      {d && p.countAs === "working_days" && d.cal !== d.n ? ` · ${t(L(`${d.cal} calendar days`, `${d.cal} hari kalender`))}` : ""}
    </p>
  )
}

/* ── builder ────────────────────────────────────────────────────────────── */

function DateRangeCanvas({ props: p }: { props: DateRangeProps }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-9 min-w-0 items-center gap-2 rounded-3xl bg-[var(--input-surface)] px-3 text-sm shadow-[var(--input-depth)]">
        <HugeiconsIcon icon={Calendar01Icon} className="size-4 shrink-0 text-muted-foreground" />
        <RangeText p={p} v={SAMPLE} />
        <DurationBadge p={p} v={SAMPLE} />
        <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <SubLine p={p} v={SAMPLE} />
    </div>
  )
}

/* ── runtime ────────────────────────────────────────────────────────────── */

function DateRangeRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<DateRangeProps, DateRangeValue>) {
  const t = useT()
  const { lang } = useLang()
  const min = limitISO(p.minDate)
  const max = limitISO(p.maxDate)
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => monthOf(v.start || (min > TODAY ? min : TODAY)))
  const [hover, setHover] = useState("")
  const bad = issues.length > 0
  const d = duration(p, v.start, v.end)
  /* First click = start, second click = end (an earlier day restarts the range). */
  const picking = v.start && !v.end ? "end" : "start"

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
            state === "disabled"
              ? "cursor-not-allowed text-muted-foreground [&_[data-slot=badge]]:opacity-60"
              : "cursor-default text-foreground select-text focus-visible:shadow-[var(--input-depth-readonly-focus)]",
          )}
        >
          <HugeiconsIcon icon={Calendar01Icon} className="size-4 shrink-0 text-muted-foreground" />
          <RangeText p={p} v={v} />
          <DurationBadge p={p} v={v} />
        </div>
        <SubLine p={p} v={v} id={`${id}-sub`} />
      </div>
    )
  }

  const pick = (iso: string) => {
    if (picking === "start" || iso < v.start) onChange({ start: iso, end: "" })
    else onChange({ start: v.start, end: iso })
  }
  const typed = (which: "start" | "end", iso: string) => {
    onChange(which === "start" ? { start: iso, end: v.end } : { start: v.start, end: iso })
    if (!ISO_RE.test(iso)) return
    let m = monthOf(iso)
    // Two months side by side: show the end date in the right-hand month.
    if (which === "end" && !compact) m = new Date(m.getFullYear(), m.getMonth() - 1, 1)
    if (min && m < monthOf(min)) m = monthOf(min)
    setMonth(m)
  }
  const previewing = picking === "end" && hover > v.start
  const bounds = [...(min ? [{ before: day(min) }] : []), ...(max ? [{ after: day(max) }] : [])]

  return (
    <div className="flex flex-col gap-1.5">
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          setHover("")
          if (o && v.start) setMonth(monthOf(v.start))
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            id={`${id}-input`}
            aria-invalid={bad || undefined}
            aria-describedby={`${id}-sub`}
            className={cn(dateTriggerClass, "w-full min-w-0 justify-start aria-invalid:shadow-[var(--input-depth-invalid)]")}
          >
            <HugeiconsIcon icon={Calendar01Icon} className="size-4 shrink-0 text-muted-foreground" />
            <RangeText p={p} v={v} />
            <DurationBadge p={p} v={v} />
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" aria-label={t(p.label)} className="w-auto max-w-[calc(100vw-1.5rem)] gap-0 p-0">
          <div className={cn("grid gap-3 px-4 pt-4", compact ? "grid-cols-1" : "grid-cols-2")}>
            {(["start", "end"] as const).map((which) => (
              <div key={which} className="flex min-w-0 flex-col gap-1.5">
                <Label htmlFor={`${id}-${which}`} className="text-xs text-muted-foreground">
                  {t(which === "start" ? L("Start date", "Tanggal mulai") : L("End date", "Tanggal selesai"))}
                </Label>
                <Input
                  id={`${id}-${which}`}
                  type="date"
                  value={v[which]}
                  min={min || undefined}
                  max={max || undefined}
                  className="h-8 text-[13px]"
                  onChange={(e) => typed(which, e.target.value)}
                />
              </div>
            ))}
          </div>
          <Calendar
            mode="range"
            numberOfMonths={compact ? 1 : 2}
            month={month}
            onMonthChange={setMonth}
            weekStartsOn={1}
            locale={LOCALES[lang]}
            today={day(TODAY)}
            selected={v.start ? { from: day(v.start), to: v.end ? day(v.end) : undefined } : undefined}
            onSelect={(_range, clicked) => pick(toISO(clicked))}
            onDayMouseEnter={(x) => setHover(toISO(x))}
            components={STABLE_PARTS}
            disabled={bounds}
            modifiers={{
              weekend: { dayOfWeek: [0, 6] },
              preview: (x: Date) => previewing && toISO(x) > v.start && toISO(x) < hover,
            }}
            modifiersClassNames={{
              weekend: "[&>button]:text-muted-foreground",
              preview: "[&>button]:rounded-none [&>button]:bg-muted",
            }}
            labels={{
              labelPrevious: () => t(L("Previous month", "Bulan sebelumnya")),
              labelNext: () => t(L("Next month", "Bulan berikutnya")),
            }}
            className="mx-auto px-4"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-[13px]">
            <span className="text-muted-foreground" aria-live="polite">
              {d ? (
                <>
                  {t(L("Duration", "Durasi"))}: <b className="font-semibold text-foreground">{t(unitText(p, d.n))}</b>
                </>
              ) : (
                t(picking === "end" ? L("Now pick the last day", "Sekarang pilih hari terakhir") : L("Pick the first day", "Pilih hari pertama"))
              )}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => onChange({ start: "", end: "" })}>
                {t(L("Clear", "Kosongkan"))}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                {t(L("Done", "Selesai"))}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <SubLine p={p} v={v} id={`${id}-sub`} />
    </div>
  )
}

function validate(p: DateRangeProps, { start: s, end: e }: DateRangeValue): Issue[] {
  const f = "trigger"
  if (!s && !e) return p.required ? [{ fid: f, msg: reqMsg(p.label) }] : []
  if (!s) return [{ fid: f, msg: L("Pick a start date", "Pilih tanggal mulai") }]
  if (!e) return [{ fid: f, msg: L("Pick an end date", "Pilih tanggal selesai") }]
  if (e < s) return [{ fid: f, msg: L("End date must be on or after the start date", "Tanggal selesai harus sama atau setelah tanggal mulai") }]
  const min = limitISO(p.minDate)
  const max = limitISO(p.maxDate)
  if (min && s < min) {
    const m = msgDateL(min)
    return [{ fid: f, msg: L(`Start date can’t be before ${m.en}`, `Tanggal mulai tidak boleh sebelum ${m.id}`) }]
  }
  if (max && e > max) {
    const m = msgDateL(max)
    return [{ fid: f, msg: L(`End date can’t be after ${m.en}`, `Tanggal selesai tidak boleh setelah ${m.id}`) }]
  }
  const d = duration(p, s, e)
  const wd = p.countAs === "working_days"
  if (d && d.n === 0) return [{ fid: f, msg: L(`This range has no ${wd ? "working " : ""}days`, `Rentang ini tidak berisi ${wd ? "hari kerja" : "hari"}`) }]
  return []
}

/* Mock HRIS card beside the form: what the duration does to the leave balance. */
function LeaveBalance({ props: p, value: v }: { props: DateRangeProps; value: DateRangeValue }) {
  const t = useT()
  const d = duration(p, v.start, v.end)
  const left = 9
  const after = d && p.countAs === "working_days" ? left - d.n : null
  return (
    <Card className="gap-3 p-4">
      <div>
        <p className="text-sm font-semibold">{t(L("Annual leave balance", "Saldo cuti tahunan"))}</p>
        <p className="text-xs text-muted-foreground">{t(L("Read from HRIS. Uses the duration above.", "Dibaca dari HRIS. Memakai durasi di atas."))}</p>
      </div>
      <dl className="flex flex-col gap-1.5 text-sm">
        {[
          [L("Quota 2026", "Kuota 2026"), L("12 days", "12 hari")],
          [L("Used", "Terpakai"), L("3 days", "3 hari")],
          [L("Left now", "Sisa sekarang"), L(`${left} days`, `${left} hari`)],
        ].map(([k, x]) => (
          <div key={k.en} className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t(k)}</dt>
            <dd className="font-semibold tabular-nums">{t(x)}</dd>
          </div>
        ))}
      </dl>
      {after == null ? (
        <p className="text-xs text-muted-foreground">
          {t(
            p.countAs === "working_days"
              ? L("Pick a range to see what is left.", "Pilih rentang untuk melihat sisanya.")
              : L("Leave is deducted in working days; switch “Count as” in Builder to compare.", "Cuti dipotong dalam hari kerja; ubah “Hitung sebagai” di Builder untuk membandingkan."),
          )}
        </p>
      ) : (
        <Alert variant={after < 0 ? "destructive" : "default"} role="status">
          <HugeiconsIcon icon={after < 0 ? Alert02Icon : InformationCircleIcon} />
          <AlertTitle>
            {t(after < 0 ? L(`Over balance by ${-after} days`, `Melebihi saldo ${-after} hari`) : L(`${after} days left after this request`, `Sisa ${after} hari setelah pengajuan ini`))}
          </AlertTitle>
        </Alert>
      )}
    </Card>
  )
}

export const dateRange: ComponentDef<DateRangeProps, DateRangeValue> = {
  slug: "date-range",
  wave: 1,
  ui: "DATE_RANGE",
  vk: "json",
  group: "date",
  week: 2,
  icon: Calendar03Icon,
  label: L("Date range", "Rentang tanggal"),
  title: L("Date range + duration", "Rentang tanggal + durasi"),
  blurb: L("One picker for start and end, with the duration counted for you.", "Satu pemilih untuk tanggal mulai dan selesai, durasinya dihitung otomatis."),

  defaults: () => ({
    label: L("Leave period", "Periode cuti"),
    name: "leave_period",
    placeholder: "",
    format: DEFAULT_FORMAT,
    countAs: "working_days",
    includeEnd: true,
    minDate: dateLimit("", true),
    maxDate: dateLimit("2026-12-31"),
    required: true,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(),
        F.key(L("Saved as one JSON object with start, end and duration.", "Disimpan sebagai satu objek JSON berisi mulai, selesai, dan durasi.")),
        {
          t: "text",
          k: "placeholder",
          label: L("Placeholder", "Placeholder"),
          placeholder: L("Pick the first and last day", "Pilih hari pertama dan terakhir"),
          hint: L("Shown while no date is picked. Same as Input Date.", "Tampil selama belum ada tanggal dipilih. Sama dengan Input Date."),
        },
        {
          t: "text",
          k: "format",
          label: L("Format", "Format"),
          mono: true,
          placeholder: L(DEFAULT_FORMAT),
          hint: L("How dates show on screen, e.g. `dd/MM/yyyy`. The payload always uses `yyyy-mm-dd`.", "Cara tanggal tampil di layar, mis. `dd/MM/yyyy`. Payload selalu memakai `yyyy-mm-dd`."),
          validate: formatErr,
        },
      ],
    },
    {
      tab: "general",
      title: L("Duration", "Durasi"),
      fields: [
        {
          t: "seg",
          k: "countAs",
          label: L("Count as", "Hitung sebagai"),
          options: [
            { v: "calendar_days", label: L("Calendar days", "Hari kalender") },
            { v: "working_days", label: L("Working days", "Hari kerja") },
          ],
          hint: L("Working days skip Saturday and Sunday.", "Hari kerja tidak menghitung Sabtu dan Minggu."),
        },
        { t: "switch", k: "includeEnd", label: L("Include end date", "Hitung tanggal selesai"), hint: L("12–16 Oct counts as 5 days, not 4.", "12–16 Okt dihitung 5 hari, bukan 4.") },
      ],
    },
    {
      tab: "general",
      title: L("Allowed dates", "Tanggal yang boleh dipilih"),
      fields: [
        {
          t: "custom",
          id: "minDate",
          render: ({ props, set }) => (
            <LimitEditor
              label={L("Earliest date", "Tanggal paling awal")}
              hint={L("Leave empty for no limit.", "Kosongkan jika tanpa batas.")}
              limit={props.minDate}
              invalid={limitError(props.minDate) != null}
              onChange={(minDate) => set({ minDate })}
            />
          ),
          validate: (_, p) => limitError(p.minDate),
        },
        {
          t: "custom",
          id: "maxDate",
          render: ({ props, set }) => (
            <LimitEditor
              label={L("Latest date", "Tanggal paling akhir")}
              limit={props.maxDate}
              invalid={(limitError(props.maxDate) ?? orderErr(props)) != null}
              onChange={(maxDate) => set({ maxDate })}
            />
          ),
          validate: (_, p) => limitError(p.maxDate) ?? orderErr(p),
        },
      ],
    },
    { tab: "validation", fields: [F.required(L("Both dates are needed. End ≥ start is always checked.", "Kedua tanggal wajib ada. Selesai ≥ mulai selalu dicek."))] },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: DateRangeCanvas,

  Runtime: DateRangeRuntime,
  initial: () => ({ start: "", end: "" }),
  sample: () => ({ ...SAMPLE }),
  validate,
  value: (p, v) => {
    const d = duration(p, v.start, v.end)
    return d ? { start: v.start, end: v.end, duration: d.n, unit: p.countAs } : null
  },
  Aside: LeaveBalance,

  spec: (p) => ({
    ui_type: "DATE_RANGE",
    value_kind: "json",
    name: p.name,
    label: p.label,
    ...(p.placeholder.trim() ? { placeholder: p.placeholder } : {}),
    required: p.required,
    config: {
      format: p.format,
      count_as: p.countAs,
      include_end_date: p.includeEnd,
      min_date: limitSpec(p.minDate),
      max_date: limitSpec(p.maxDate),
    },
  }),
  savedAs: (p) =>
    L(
      `One JSON variable \`${p.name}\` with start, end, the computed duration and its unit.`,
      `Satu variabel JSON \`${p.name}\` berisi mulai, selesai, durasi terhitung, dan satuannya.`,
    ),
  notes: [
    L("Replaces 5 MFE uses of “date range with duration” (shaping §1).", "Menggantikan 5 pemakaian MFE “rentang tanggal dengan durasi” (shaping §1)."),
    L(
      "The duration is saved with the value, so history and Camunda read it without recomputing. Readers must parse `value_kind: \"json\"`.",
      "Durasi disimpan bersama nilai, jadi history dan camunda membacanya tanpa menghitung ulang. Pembaca harus mengurai `value_kind: \"json\"`.",
    ),
    L(
      "Working days skip Saturday and Sunday only. Public holidays need a data-source decision and are out of scope.",
      "Hari kerja hanya melewati Sabtu dan Minggu. Hari libur nasional butuh keputusan sumber data dan di luar scope.",
    ),
    L(
      "End ≥ start, min and max are checked in the browser and must match the server validator.",
      "Selesai ≥ mulai, batas awal, dan batas akhir dicek di browser dan harus sejalan dengan validator server.",
    ),
    L(
      "Dates in the payload are always ISO `yyyy-mm-dd`, whatever the display Format.",
      "Tanggal selalu ISO `yyyy-mm-dd` di payload, apa pun Format tampilannya.",
    ),
    L(
      "Earliest / latest date reuse Input Date’s Date Validation block. `min_date` / `max_date` hold `\"today\"`, a date, or From Other Field as `${key}` — the same value format as Input Date (decision 3).",
      "Tanggal paling awal / akhir memakai ulang blok Date Validation milik Input Date. `min_date` / `max_date` berisi `\"today\"`, tanggal, atau From Other Field sebagai `${key}` — format nilai sama dengan Input Date (keputusan 3).",
    ),
  ],
  story: {
    process: L("Leave request", "Izin cuti"),
    step: L("Employee request", "Pengajuan pegawai"),
    ref: "CUTI-2026-0388",
    due: "2026-10-07",
    task: L("Request annual leave", "Ajukan cuti tahunan"),
    before: [
      {
        name: "leave_type",
        label: L("Leave type", "Jenis cuti"),
        type: "select",
        required: true,
        value: "annual",
        options: [
          { v: "annual", label: L("Annual leave", "Cuti tahunan") },
          { v: "sick", label: L("Sick leave", "Cuti sakit") },
          { v: "important", label: L("Leave for important reasons", "Cuti alasan penting") },
        ],
      },
    ],
    after: [
      {
        name: "reason",
        label: L("Reason", "Alasan"),
        type: "textarea",
        value: "Acara keluarga di Yogyakarta",
        placeholder: L("Optional for annual leave", "Opsional untuk cuti tahunan"),
        rows: 2,
      },
    ],
  },
}
