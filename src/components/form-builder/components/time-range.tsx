/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useId } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight02Icon, Clock01Icon, Moon02Icon, TimeScheduleIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { L, useT, type L10n } from "../i18n"
import { F, reqMsg } from "../lib"
import { Rich } from "../rich"
import type { ComponentDef, Issue, PropField, RuntimeProps } from "../types"
import { allowedText, fmtMinutes, joinParts, maxMsg, minMaxErr, minMsg, optNum } from "./duration-format"

/* Time range — ui_type TIME_RANGE, value_kind "json". Start and end time on one day, with the
   duration (after an unpaid break) worked out. Story: overtime request. */

type Step = 5 | 10 | 15 | 30

interface TimeRangeProps {
  label: L10n
  name: string
  /** Minutes between the times offered in the lists. */
  step: Step
  /** "HH:MM" or "" (no limit). Not used when `allowOvernight`. */
  earliest: string
  latest: string
  /** End earlier than start = the next day (night shift). */
  allowOvernight: boolean
  /** Unpaid break taken off the duration (0–120). */
  breakMinutes: number
  /** After the break; "" = no limit. */
  minMinutes: number | ""
  maxMinutes: number | ""
  showDuration: boolean
  required: boolean
}
/** Local wall-clock "HH:MM", "" while not picked. */
interface TimeRangeValue {
  start: string
  end: string
}

const SAMPLE: TimeRangeValue = { start: "18:00", end: "21:30" }
const DAY = 24 * 60
const STEPS: Step[] = [5, 10, 15, 30]
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

/* ── time maths (minutes since midnight) ────────────────────────────────── */

const toMin = (s: string) => {
  const m = TIME_RE.exec(s)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
const hhmm = (n: number) => {
  const x = ((n % DAY) + DAY) % DAY
  return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`
}
const seq = (from: number, to: number, step: number) => {
  const out: number[] = []
  for (let x = from; x <= to; x += step) out.push(x)
  return out
}

const stepOf = (p: TimeRangeProps) => (STEPS.includes(Number(p.step) as Step) ? Number(p.step) : 15)
const breakOf = (p: TimeRangeProps) => Math.min(120, Math.max(0, Math.round(Number(p.breakMinutes) || 0)))
/** Earliest / latest in minutes, or null. Overnight ranges ignore them. */
const lowOf = (p: TimeRangeProps) => (p.allowOvernight ? null : toMin(p.earliest))
const highOf = (p: TimeRangeProps) => (p.allowOvernight ? null : toMin(p.latest))

/** Last end time on the same day: latest end, or the last step before midnight. */
const lastEnd = (p: TimeRangeProps) => Math.min(highOf(p) ?? DAY, DAY - stepOf(p))

/** Start choices: the whole day when overnight, else the window minus one step (room for an end). */
function startTimes(p: TimeRangeProps) {
  const s = stepOf(p)
  return p.allowOvernight ? seq(0, DAY - s, s) : seq(lowOf(p) ?? 0, lastEnd(p) - s, s)
}

interface EndChoice {
  t: number
  /** Clock time from the start, when one is picked. */
  span: number | null
  nextDay: boolean
}
/** End choices after the start; overnight wraps past midnight up to one step before the start. */
function endTimes(p: TimeRangeProps, start: number | null): EndChoice[] {
  const s = stepOf(p)
  if (p.allowOvernight)
    return start == null
      ? seq(0, DAY - s, s).map((t) => ({ t, span: null, nextDay: false }))
      : seq(s, DAY - s, s).map((k) => ({ t: (start + k) % DAY, span: k, nextDay: start + k >= DAY }))
  return start == null
    ? seq((lowOf(p) ?? 0) + s, lastEnd(p), s).map((t) => ({ t, span: null, nextDay: false }))
    : seq(start + s, lastEnd(p), s).map((t) => ({ t, span: t - start, nextDay: false }))
}

interface Calc {
  /** Clock time between start and end. */
  span: number
  /** After the break — what is saved. */
  net: number
  overnight: boolean
}
function calc(p: TimeRangeProps, v: TimeRangeValue): Calc | null {
  const s = toMin(v.start)
  const e = toMin(v.end)
  if (s == null || e == null || s === e || (e < s && !p.allowOvernight)) return null
  const overnight = e < s
  const span = overnight ? e + DAY - s : e - s
  return { span, net: span - breakOf(p), overnight }
}

/* ── wording ────────────────────────────────────────────────────────────── */

function windowText(p: TimeRangeProps): L10n | null {
  if (p.allowOvernight) return L("Can end the next day", "Boleh selesai keesokan harinya")
  const lo = lowOf(p) != null ? p.earliest : ""
  const hi = highOf(p) != null ? p.latest : ""
  if (lo && hi) return L(`Between ${lo} and ${hi}`, `Antara pukul ${lo} dan ${hi}`)
  if (lo) return L(`From ${lo}`, `Mulai pukul ${lo}`)
  if (hi) return L(`Until ${hi}`, `Sampai pukul ${hi}`)
  return null
}

function windowMsg(p: TimeRangeProps): L10n {
  const lo = lowOf(p) != null ? p.earliest : ""
  const hi = highOf(p) != null ? p.latest : ""
  if (lo && hi) return L(`Times must be between ${lo} and ${hi}`, `Jam harus di antara pukul ${lo} dan ${hi}`)
  if (lo) return L(`Start at ${lo} or later`, `Jam mulai paling awal pukul ${lo}`)
  return L(`End by ${hi} at the latest`, `Jam selesai paling lambat pukul ${hi}`)
}

/** Window · break (with the sum once both times are in) · allowed duration. */
function subText(p: TimeRangeProps, v: TimeRangeValue): L10n | null {
  const b = breakOf(p)
  const c = calc(p, v)
  const fb = fmtMinutes(b)
  const breakPart = !b
    ? null
    : c && p.showDuration
      ? L(`${fmtMinutes(c.span).en} − ${fb.en} break`, `${fmtMinutes(c.span).id} − istirahat ${fb.id}`)
      : L(`${fb.en} break deducted`, `Dipotong istirahat ${fb.id}`)
  return joinParts([windowText(p), breakPart, allowedText(optNum(p.minMinutes), optNum(p.maxMinutes), (n) => fmtMinutes(n))])
}

const NEXT_DAY = L("Ends next day", "Selesai keesokan hari")

/* ── shared bits ────────────────────────────────────────────────────────── */

/** Duration (after the break) and the next-day mark. */
function Badges({ p, v, muted }: { p: TimeRangeProps; v: TimeRangeValue; muted?: boolean }) {
  const t = useT()
  const c = calc(p, v)
  if (!c) return null
  return (
    <>
      {p.showDuration && c.net > 0 && (
        <Badge variant="secondary" className={cn("shrink-0 tabular-nums", muted && "opacity-60")}>
          {t(fmtMinutes(c.net))}
        </Badge>
      )}
      {c.overnight && (
        <Badge variant="outline" className={cn("shrink-0", muted && "opacity-60")}>
          <HugeiconsIcon icon={Moon02Icon} />
          {t(NEXT_DAY)}
        </Badge>
      )}
    </>
  )
}

function SubLine({ p, v, id }: { p: TimeRangeProps; v: TimeRangeValue; id?: string }) {
  const t = useT()
  const s = subText(p, v)
  return s ? (
    <p id={id} className="text-xs text-muted-foreground">
      {t(s)}
    </p>
  ) : null
}

/** "Start 18:00" — the word stays visible so the order reads on a phone too. */
function TimeFace({ which, time }: { which: "start" | "end"; time: string }) {
  const t = useT()
  return (
    <span className="flex min-w-0 items-center gap-2">
      <HugeiconsIcon icon={Clock01Icon} className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{t(which === "start" ? L("Start", "Mulai") : L("End", "Selesai"))}</span>
      {time ? (
        <span className="tabular-nums">{time}</span>
      ) : (
        <>
          <span className="text-muted-foreground tabular-nums" aria-hidden>
            --:--
          </span>
          <span className="sr-only">{t(L("not picked", "belum dipilih"))}</span>
        </>
      )}
    </span>
  )
}

/* ── builder ────────────────────────────────────────────────────────────── */

function TimeRangeCanvas({ props: p }: { props: TimeRangeProps }) {
  const box = "flex h-9 w-44 min-w-0 items-center rounded-3xl bg-[var(--input-surface)] px-3 text-sm shadow-[var(--input-depth)]"
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className={box}>
          <TimeFace which="start" time={SAMPLE.start} />
        </div>
        <HugeiconsIcon icon={ArrowRight02Icon} className="size-4 text-muted-foreground" />
        <div className={box}>
          <TimeFace which="end" time={SAMPLE.end} />
        </div>
        <Badges p={p} v={SAMPLE} />
      </div>
      <SubLine p={p} v={SAMPLE} />
    </div>
  )
}

/* ── runtime ────────────────────────────────────────────────────────────── */

function TimeRangeRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<TimeRangeProps, TimeRangeValue>) {
  const t = useT()
  const bad = (fid: "start" | "end") => issues.some((i) => i.fid === fid || i.fid === "range") || undefined

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
            "flex min-h-9 w-fit max-w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-3xl border border-transparent bg-muted px-3 py-1.5 text-sm outline-none",
            state === "disabled" ? "cursor-not-allowed text-muted-foreground" : "cursor-default text-foreground select-text focus-visible:shadow-[var(--input-depth-readonly-focus)]",
          )}
        >
          <HugeiconsIcon icon={Clock01Icon} className="size-4 shrink-0 text-muted-foreground" />
          <span className="tabular-nums">
            {v.start || "--:--"}
            <span className="mx-1.5 text-muted-foreground" aria-hidden>
              →
            </span>
            <span className="sr-only"> – </span>
            {v.end || "--:--"}
          </span>
          <Badges p={p} v={v} muted={state === "disabled"} />
        </div>
        <SubLine p={p} v={v} id={`${id}-sub`} />
      </div>
    )
  }

  const startMin = toMin(v.start)
  const pickStart = (s: string) => {
    const sm = toMin(s)
    const em = toMin(v.end)
    // Keep the end while it still comes after the new start; otherwise ask for it again.
    const keep = sm != null && em != null && em !== sm && (p.allowOvernight || em > sm)
    onChange({ start: s, end: keep ? v.end : "" })
  }
  const trigger = cn("min-w-0", compact ? "w-full" : "w-44")

  return (
    <div className="flex flex-col gap-1.5">
      <div className={cn("flex gap-2", compact ? "flex-col items-stretch" : "flex-wrap items-center")}>
        <Select value={v.start} onValueChange={pickStart}>
          <SelectTrigger
            id={`${id}-input`}
            aria-labelledby={`${id}-label ${id}-input`}
            aria-describedby={`${id}-sub`}
            aria-invalid={bad("start")}
            className={trigger}
          >
            <SelectValue placeholder={<TimeFace which="start" time="" />}>
              <TimeFace which="start" time={v.start} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {startTimes(p).map((x) => (
              <SelectItem key={x} value={hhmm(x)} className="tabular-nums">
                {hhmm(x)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!compact && <HugeiconsIcon icon={ArrowRight02Icon} className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
        <Select value={v.end} onValueChange={(e) => onChange({ start: v.start, end: e })}>
          <SelectTrigger
            id={`${id}-end`}
            aria-labelledby={`${id}-label ${id}-end`}
            aria-describedby={`${id}-sub`}
            aria-invalid={bad("end")}
            className={trigger}
          >
            <SelectValue placeholder={<TimeFace which="end" time="" />}>
              <TimeFace which="end" time={v.end} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {endTimes(p, startMin).map((o) => (
              <SelectItem key={o.t} value={hhmm(o.t)} textValue={hhmm(o.t)}>
                <span className="tabular-nums">{hhmm(o.t)}</span>
                {o.span != null && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {o.nextDay ? `${t(L("next day", "besok"))} · ` : ""}
                    {t(fmtMinutes(o.span))}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className={cn("flex items-center gap-2", compact && "flex-wrap empty:hidden")} aria-live="polite">
          <Badges p={p} v={v} />
        </div>
      </div>
      <SubLine p={p} v={v} id={`${id}-sub`} />
    </div>
  )
}

function validate(p: TimeRangeProps, v: TimeRangeValue): Issue[] {
  if (!v.start && !v.end) return p.required ? [{ fid: "range", msg: reqMsg(p.label) }] : []
  const s = toMin(v.start)
  const e = toMin(v.end)
  if (s == null) return [{ fid: "start", msg: L("Pick a start time", "Pilih jam mulai") }]
  if (e == null) return [{ fid: "end", msg: L("Pick an end time", "Pilih jam selesai") }]
  if (e === s || (e < s && !p.allowOvernight)) return [{ fid: "end", msg: L("End must be after start", "Jam selesai harus setelah jam mulai") }]
  const lo = lowOf(p)
  const hi = highOf(p)
  if (lo != null && s < lo) return [{ fid: "start", msg: windowMsg(p) }]
  if (hi != null && e > hi) return [{ fid: "end", msg: windowMsg(p) }]
  const c = calc(p, v)
  if (!c) return []
  const b = fmtMinutes(breakOf(p))
  if (c.net <= 0) return [{ fid: "range", msg: L(`The time must be longer than the ${b.en} break`, `Waktunya harus lebih lama dari istirahat ${b.id}`) }]
  const min = optNum(p.minMinutes)
  const max = optNum(p.maxMinutes)
  if (min != null && c.net < min) return [{ fid: "range", msg: minMsg(fmtMinutes(min)) }]
  if (max != null && c.net > max) return [{ fid: "range", msg: maxMsg(fmtMinutes(max)) }]
  return []
}

/* ── Edit Element: earliest start / latest end ──────────────────────────── */

const HALF_HOURS = seq(0, DAY - 30, 30).map(hhmm)

function windowErr(p: TimeRangeProps): L10n | null {
  if (p.allowOvernight) return null
  const lo = toMin(p.earliest)
  const hi = toMin(p.latest)
  return lo != null && hi != null && hi <= lo ? L("Latest end must be after the earliest start", "Jam selesai paling lambat harus setelah jam mulai paling awal") : null
}

function WindowEditor({ props: p, set }: { props: TimeRangeProps; set: (patch: Partial<TimeRangeProps>) => void }) {
  const t = useT()
  const uid = useId()
  const invalid = windowErr(p) != null || undefined
  const pick = (k: "earliest" | "latest", label: L10n) => (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={`${uid}-${k}`} className="text-sm font-medium">
        {t(label)}
      </Label>
      {/* Radix Select cannot hold "" — "no limit" travels as "_none". */}
      <Select value={p[k] || "_none"} onValueChange={(x) => set({ [k]: x === "_none" ? "" : x })}>
        <SelectTrigger id={`${uid}-${k}`} className="w-full tabular-nums" aria-invalid={k === "latest" ? invalid : undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">{t(L("No limit", "Tanpa batas"))}</SelectItem>
          {HALF_HOURS.map((x) => (
            <SelectItem key={x} value={x} className="tabular-nums">
              {x}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-3">
        {pick("earliest", L("Earliest start", "Jam mulai paling awal"))}
        {pick("latest", L("Latest end", "Jam selesai paling lambat"))}
      </div>
      <p className="text-xs text-muted-foreground">
        <Rich text={L("The lists only offer times in this window. **No limit** = any time of the day.", "Daftar jam hanya berisi jam di rentang ini. **Tanpa batas** = jam berapa pun.")} />
      </p>
    </div>
  )
}

/* ── definition ─────────────────────────────────────────────────────────── */

const minutesField = (k: "minMinutes" | "maxMinutes", label: L10n, hint: L10n): PropField<TimeRangeProps> => ({
  t: "number",
  k,
  label,
  min: 5,
  max: DAY,
  step: 15,
  suffix: "min",
  allowEmpty: true,
  hint,
  validate: (_, p) => (k === "maxMinutes" ? minMaxErr(p.minMinutes, p.maxMinutes) : null),
})

export const timeRange: ComponentDef<TimeRangeProps, TimeRangeValue> = {
  slug: "time-range",
  wave: 4,
  week: 6,
  ui: "TIME_RANGE",
  vk: "json",
  group: "date",
  icon: TimeScheduleIcon,
  label: L("Time range", "Rentang waktu"),
  title: L("Time range + duration", "Rentang waktu + durasi"),
  blurb: L("Start and end time on one day, with the duration worked out.", "Jam mulai dan selesai di satu hari, dengan durasi dihitung otomatis."),

  defaults: () => ({
    label: L("Overtime hours", "Jam lembur"),
    name: "overtime_hours",
    step: 15,
    earliest: "06:00",
    latest: "22:00",
    allowOvernight: false,
    breakMinutes: 30,
    minMinutes: 30,
    maxMinutes: 240,
    showDuration: true,
    required: true,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [F.name(), F.key(L("Saved as one JSON object: start, end, minutes and overnight.", "Disimpan sebagai satu objek JSON: start, end, minutes, dan overnight."))],
    },
    {
      tab: "general",
      title: L("Times", "Jam"),
      fields: [
        {
          t: "seg",
          k: "step",
          label: L("Time step", "Kelipatan waktu"),
          options: STEPS.map((s) => ({ v: s, label: L(`${s} min`, `${s} menit`) })),
          hint: L("The lists offer times at this step, e.g. 18:00, 18:15, 18:30.", "Daftar jam berisi kelipatan ini, mis. 18:00, 18:15, 18:30."),
        },
        {
          t: "switch",
          k: "allowOvernight",
          label: L("Allow ending the next day", "Boleh selesai keesokan harinya"),
          hint: L(
            "For night shifts such as 22:00–06:00: an end earlier than the start means the next day. Earliest start and latest end no longer apply.",
            "Untuk shift malam seperti 22:00–06:00: jam selesai yang lebih awal dari jam mulai berarti keesokan harinya. Jam mulai paling awal dan jam selesai paling lambat tidak berlaku lagi.",
          ),
        },
        {
          t: "custom",
          id: "window",
          when: (p) => !p.allowOvernight,
          render: ({ props, set }) => <WindowEditor props={props} set={set} />,
          validate: (_, p) => windowErr(p),
        },
      ],
    },
    {
      tab: "general",
      title: L("Duration", "Durasi"),
      fields: [
        {
          t: "number",
          k: "breakMinutes",
          label: L("Unpaid break", "Istirahat tidak dibayar"),
          min: 0,
          max: 120,
          step: 5,
          suffix: "min",
          hint: L("Taken off the duration, e.g. 30 for a meal break. 0 = no break.", "Dikurangkan dari durasi, mis. 30 untuk istirahat makan. 0 = tanpa istirahat."),
        },
        {
          t: "switch",
          k: "showDuration",
          label: L("Show the duration", "Tampilkan durasi"),
          hint: L("“3 h 30 m” beside the times. The minutes are saved either way.", "“3 j 30 m” di samping jam. Menit tetap disimpan walau tidak ditampilkan."),
        },
      ],
    },
    {
      tab: "validation",
      fields: [
        F.required(L("Both times are needed. End after start is always checked.", "Kedua jam wajib diisi. Jam selesai setelah jam mulai selalu dicek.")),
        minutesField("minMinutes", L("Shortest duration", "Durasi minimal"), L("After the break. Leave empty for no limit.", "Setelah dipotong istirahat. Kosongkan jika tanpa batas.")),
        minutesField(
          "maxMinutes",
          L("Longest duration", "Durasi maksimal"),
          L("After the break, e.g. 240 = 4 h, the daily overtime cap. Leave empty for no limit.", "Setelah dipotong istirahat, mis. 240 = 4 jam, batas lembur harian. Kosongkan jika tanpa batas."),
        ),
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: TimeRangeCanvas,

  Runtime: TimeRangeRuntime,
  initial: () => ({ start: "", end: "" }),
  sample: (p) => (p.allowOvernight ? { start: "22:00", end: "06:00" } : { ...SAMPLE }),
  validate,
  value: (p, v) => {
    const c = calc(p, v)
    return {
      start: toMin(v.start) != null ? v.start : null,
      end: toMin(v.end) != null ? v.end : null,
      minutes: c && c.net > 0 ? c.net : null,
      overnight: c?.overnight ?? false,
    }
  },

  spec: (p) => ({
    ui_type: "TIME_RANGE",
    value_kind: "json",
    name: p.name,
    label: p.label,
    required: p.required,
    config: {
      step_minutes: stepOf(p),
      earliest: lowOf(p) != null ? p.earliest : null,
      latest: highOf(p) != null ? p.latest : null,
      allow_overnight: p.allowOvernight,
      break_minutes: breakOf(p),
      min_minutes: optNum(p.minMinutes),
      max_minutes: optNum(p.maxMinutes),
      show_duration: p.showDuration,
    },
  }),
  savedAs: (p) =>
    L(
      `One JSON variable \`${p.name}\` with \`start\` and \`end\` (\`HH:MM\`), \`minutes\` after the break, and \`overnight\`.`,
      `Satu variabel JSON \`${p.name}\` berisi \`start\` dan \`end\` (\`HH:MM\`), \`minutes\` setelah dipotong istirahat, dan \`overnight\`.`,
    ),
  notes: [
    L(
      "No date and no time zone in the value: times are local wall-clock times (WIB). The day comes from the separate Date field before it.",
      "Nilai tidak berisi tanggal maupun zona waktu: jam adalah jam lokal (WIB). Harinya diambil dari field Date terpisah di atasnya.",
    ),
    L(
      "`minutes` is the time after the unpaid break, saved so payroll and history read it without recomputing. Minutes rather than ISO 8601 text follows Wave 4 open decision 2.",
      "`minutes` adalah waktu setelah dipotong istirahat tidak dibayar, disimpan agar payroll dan history membacanya tanpa menghitung ulang. Menit, bukan teks ISO 8601, mengikuti keputusan terbuka Gelombang 4 no. 2.",
    ),
    L(
      "With Allow ending the next day, an end earlier than the start means the next day (`overnight: true`); earliest start and latest end are then not used and saved as `null`.",
      "Dengan Boleh selesai keesokan harinya, jam selesai yang lebih awal dari jam mulai berarti keesokan harinya (`overnight: true`); jam mulai paling awal dan jam selesai paling lambat tidak dipakai dan disimpan `null`.",
    ),
    L(
      "The end list only offers times after the start, each with its length. End after start, the window and the shortest / longest duration are still checked on Complete Task and must match the server validator.",
      "Daftar jam selesai hanya berisi jam setelah jam mulai, masing-masing dengan lamanya. Selesai setelah mulai, rentang jam, dan durasi minimal / maksimal tetap dicek saat Complete Task dan harus sejalan dengan validator server.",
    ),
    L(
      "The story caps overtime at 4 h a day (PP 35/2021). The weekly cap needs earlier requests and is out of scope.",
      "Story membatasi lembur 4 jam sehari (PP 35/2021). Batas mingguan butuh data pengajuan sebelumnya dan di luar scope.",
    ),
  ],
  story: {
    process: L("Overtime request", "Pengajuan lembur"),
    step: L("Employee request", "Pengajuan karyawan"),
    ref: "OT-2026-0218",
    due: "2026-11-13",
    task: L("Request overtime", "Ajukan lembur"),
    before: [{ name: "overtime_date", label: L("Overtime date", "Tanggal lembur"), type: "date", required: true, value: "2026-11-12" }],
    after: [
      {
        name: "project",
        label: L("Project", "Proyek"),
        type: "select",
        required: true,
        value: "erp_golive",
        options: [
          { v: "erp_golive", label: L("ERP go-live", "Go-live ERP") },
          { v: "month_end_close", label: L("Month-end closing", "Tutup buku akhir bulan") },
          { v: "stock_count", label: L("Warehouse stock count", "Stock opname gudang") },
        ],
      },
      {
        name: "reason",
        label: L("Reason", "Alasan"),
        type: "textarea",
        required: true,
        rows: 2,
        value: "Migrasi data akhir sebelum go-live ERP hari Senin.",
      },
    ],
  },
}
