/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { HourglassIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { L, useT, type L10n } from "../i18n"
import { ctl, F, reqMsg } from "../lib"
import type { ComponentDef, Issue, PropField, RuntimeProps } from "../types"
import { allowedText, fmtMinutes, joinParts, maxMsg, minMaxErr, minMsg, optNum } from "./duration-format"

/* Duration — ui_type DURATION, value_kind "number" (total minutes). Number boxes per unit;
   overflow is tidied on blur. Story: closing a maintenance work order. */

type Units = "hm" | "dh" | "dhm"
type HoursPerDay = 8 | 24
type Part = "d" | "h" | "m"

interface DurationProps {
  label: L10n
  name: string
  units: Units
  /** Only used when the boxes include days. */
  hoursPerDay: HoursPerDay
  /** "" = no limit. */
  minMinutes: number | ""
  maxMinutes: number | ""
  /** Quick picks, in minutes (chips editor keeps them as text). */
  presets: string[]
  showTotal: boolean
  required: boolean
}
/** What is typed in each box (kept as text so "1.5" can be flagged, not silently changed). */
type DurationValue = Record<Part, string>

const PARTS: Record<Units, Part[]> = { hm: ["h", "m"], dh: ["d", "h"], dhm: ["d", "h", "m"] }
const SHORT: Record<Part, L10n> = { d: L("d", "hr"), h: L("h", "j"), m: L("m", "m") }
const NAME: Record<Part, L10n> = { d: L("Days", "Hari"), h: L("Hours", "Jam"), m: L("Minutes", "Menit") }
const PRESET_MENU = [5, 10, 15, 30, 45, 60, 90, 120, 180, 240, 480, 960, 1440]
const MAX_PRESETS = 6
const WHOLE = /^\d+$/
const EMPTY: DurationValue = { d: "", h: "", m: "" }

/* ── maths ──────────────────────────────────────────────────────────────── */

const partsOf = (p: DurationProps) => PARTS[p.units] ?? PARTS.hm
const hasDays = (p: DurationProps) => partsOf(p).includes("d")
const hpdOf = (p: DurationProps): HoursPerDay => (Number(p.hoursPerDay) === 24 ? 24 : 8)
/** "3 h 30 m", or with days "1 d 2 h" at the chosen hours per day. */
const fmt = (p: DurationProps, n: number) => fmtMinutes(n, hasDays(p) ? hpdOf(p) : 0)
/** Quick picks in minutes; without a minutes box only whole hours can be shown in the boxes. */
const presetsOf = (p: DurationProps) => p.presets.map(Number).filter((n) => Number.isFinite(n) && n > 0 && (p.units !== "dh" || n % 60 === 0))

interface Parsed {
  /** Total minutes, or null while a box holds something that isn't a whole number. */
  total: number | null
  bad: Part[]
  empty: boolean
}
function parse(p: DurationProps, v: DurationValue): Parsed {
  const parts = partsOf(p)
  const bad = parts.filter((k) => v[k].trim() !== "" && !WHOLE.test(v[k].trim()))
  const empty = parts.every((k) => !v[k].trim())
  if (bad.length) return { total: null, bad, empty }
  const n = (k: Part) => (parts.includes(k) && v[k].trim() ? Number(v[k].trim()) : 0)
  return { total: n("d") * hpdOf(p) * 60 + n("h") * 60 + n("m"), bad, empty }
}

/** Total minutes → one number per box (largest unit first). */
function split(p: DurationProps, total: number): Record<Part, number> {
  const parts = partsOf(p)
  const perDay = hpdOf(p) * 60
  const d = parts.includes("d") ? Math.floor(total / perDay) : 0
  const rest = total - d * perDay
  const h = Math.floor(rest / 60)
  return { d, h, m: parts.includes("m") ? rest - h * 60 : 0 }
}

/** Every box filled, zeros included (quick picks, sample). */
function boxes(p: DurationProps, total: number): DurationValue {
  const s = split(p, total)
  const out = { ...EMPTY }
  for (const k of partsOf(p)) out[k] = String(s[k])
  return out
}

/** 90 m → 1 h 30 m (and 10 h → 1 d 2 h at 8 h a day). Boxes left empty stay empty when their part is 0. */
function tidy(p: DurationProps, v: DurationValue): DurationValue | null {
  const r = parse(p, v)
  if (r.total == null || r.empty) return null
  const s = split(p, r.total)
  const out = { ...v }
  for (const k of partsOf(p)) out[k] = !v[k].trim() && s[k] === 0 ? "" : String(s[k])
  return partsOf(p).some((k) => out[k] !== v[k]) ? out : null
}

/* ── wording ────────────────────────────────────────────────────────────── */

const dayText = (p: DurationProps) =>
  hpdOf(p) === 8 ? L("1 day = 8 working hours", "1 hari = 8 jam kerja") : L("1 day = 24 hours", "1 hari = 24 jam")

const subText = (p: DurationProps) => joinParts([hasDays(p) && dayText(p), allowedText(optNum(p.minMinutes), optNum(p.maxMinutes), (n) => fmt(p, n))])

const totalText = (n: number) => L(`= ${n} minute${n === 1 ? "" : "s"}`, `= ${n} menit`)

/* ── shared bits ────────────────────────────────────────────────────────── */

function SubLine({ p, id }: { p: DurationProps; id?: string }) {
  const t = useT()
  const s = subText(p)
  return s ? (
    <p id={id} className="text-xs text-muted-foreground">
      {t(s)}
    </p>
  ) : null
}

function Presets({ p, total, onPick }: { p: DurationProps; total: number | null; onPick?: (n: number) => void }) {
  const t = useT()
  const list = presetsOf(p)
  if (!list.length) return null
  /* The canvas sits inside clickable cards (overview, palette), so it draws chips, not buttons. */
  if (!onPick)
    return (
      <div className="flex flex-wrap items-center gap-1.5" aria-hidden>
        {list.map((n) => (
          <span
            key={n}
            className={cn(
              "inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-medium tabular-nums",
              total === n ? "border-transparent bg-secondary text-secondary-foreground" : "border-border text-foreground",
            )}
          >
            {t(fmt(p, n))}
          </span>
        ))}
      </div>
    )
  return (
    <div role="group" aria-label={t(L("Quick picks", "Pilihan cepat"))} className="flex flex-wrap items-center gap-1.5">
      {list.map((n) => {
        const on = total === n
        return (
          <Button
            key={n}
            type="button"
            size="xs"
            variant={on ? "secondary" : "outline"}
            aria-pressed={on}
            className="tabular-nums"
            onClick={() => onPick(n)}
          >
            {t(fmt(p, n))}
          </Button>
        )
      })}
    </div>
  )
}

/* ── builder ────────────────────────────────────────────────────────────── */

function DurationCanvas({ props: p }: { props: DurationProps }) {
  const t = useT()
  const sample = durationSample(p)
  const total = parse(p, sample).total ?? 0
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {partsOf(p).map((k) => (
          <div key={k} className="flex h-9 w-24 items-center justify-between rounded-3xl bg-[var(--input-surface)] px-3 text-sm shadow-[var(--input-depth)]">
            <span className="tabular-nums">{sample[k]}</span>
            <span className="font-medium text-muted-foreground">{t(SHORT[k])}</span>
          </div>
        ))}
        {p.showTotal && <span className="text-sm text-muted-foreground tabular-nums">{t(totalText(total))}</span>}
      </div>
      <Presets p={p} total={total} />
      <SubLine p={p} />
    </div>
  )
}

/* ── runtime ────────────────────────────────────────────────────────────── */

function DurationRuntime({ props: p, value: v, onChange, state, issues, id }: RuntimeProps<DurationProps, DurationValue>) {
  const t = useT()
  const live = state === "active"
  const r = parse(p, v)
  const all = issues.some((i) => i.fid === "boxes")
  const bad = (k: Part) => all || issues.some((i) => i.fid === `box-${k}`) || undefined

  return (
    <div className="flex flex-col gap-2">
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-sub`}
        className="flex flex-wrap items-center gap-2"
        onBlur={(e) => {
          // Tidy the boxes once focus leaves all of them, so typing 1 h then 90 m isn't rewritten mid-way.
          if (!live || e.currentTarget.contains(e.relatedTarget as Node | null)) return
          const next = tidy(p, v)
          if (next) onChange(next)
        }}
      >
        {partsOf(p).map((k, i) => (
          <InputGroup key={k} className="w-24">
            <InputGroupInput
              id={i === 0 ? `${id}-input` : `${id}-${k}`}
              inputMode="numeric"
              autoComplete="off"
              maxLength={5}
              placeholder="0"
              value={v[k]}
              aria-label={t(NAME[k])}
              aria-invalid={bad(k)}
              className="tabular-nums"
              {...ctl(state)}
              onChange={(e) => onChange({ ...v, [k]: e.target.value })}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText aria-hidden>{t(SHORT[k])}</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        ))}
        {p.showTotal && (
          <span className={cn("text-sm tabular-nums", state === "disabled" ? "text-muted-foreground/70" : "text-muted-foreground")} aria-live="polite">
            {r.total ? t(totalText(r.total)) : ""}
          </span>
        )}
      </div>
      {live && <Presets p={p} total={r.total} onPick={(n) => onChange(boxes(p, n))} />}
      <SubLine p={p} id={`${id}-sub`} />
    </div>
  )
}

function validate(p: DurationProps, v: DurationValue): Issue[] {
  const r = parse(p, v)
  if (r.bad.length) return r.bad.map((k) => ({ fid: `box-${k}`, msg: L("Enter whole numbers only", "Isi dengan bilangan bulat saja") }))
  if (r.empty) return p.required ? [{ fid: "boxes", msg: reqMsg(p.label) }] : []
  const total = r.total ?? 0
  if (total === 0) return p.required ? [{ fid: "boxes", msg: L("Enter a duration longer than 0", "Isi durasi lebih dari 0") }] : []
  const min = optNum(p.minMinutes)
  const max = optNum(p.maxMinutes)
  if (min != null && total < min) return [{ fid: "boxes", msg: minMsg(fmt(p, min)) }]
  if (max != null && total > max) return [{ fid: "boxes", msg: maxMsg(fmt(p, max)) }]
  return []
}

/** 2 h 45 m; with days 1 d 2 h (45 m). */
function durationSample(p: DurationProps): DurationValue {
  return boxes(p, p.units === "hm" ? 165 : hpdOf(p) * 60 + 120 + (p.units === "dhm" ? 45 : 0))
}

/* ── definition ─────────────────────────────────────────────────────────── */

function presetsErr(v: unknown, p: DurationProps): L10n | null {
  const list = (Array.isArray(v) ? v : []).map(Number)
  if (list.length > MAX_PRESETS) return L(`Pick up to ${MAX_PRESETS} quick picks`, `Pilih maksimal ${MAX_PRESETS} pilihan cepat`)
  const min = optNum(p.minMinutes)
  const max = optNum(p.maxMinutes)
  if (list.some((n) => (min != null && n < min) || (max != null && n > max)))
    return L("Every quick pick must be within the shortest and longest duration", "Setiap pilihan cepat harus di antara durasi minimal dan maksimal")
  return null
}

const minutesField = (k: "minMinutes" | "maxMinutes", label: L10n, hint: L10n): PropField<DurationProps> => ({
  t: "number",
  k,
  label,
  min: 1,
  max: 100000,
  step: 15,
  suffix: "min",
  allowEmpty: true,
  hint,
  validate: (_, p) => (k === "maxMinutes" ? minMaxErr(p.minMinutes, p.maxMinutes) : null),
})

export const duration: ComponentDef<DurationProps, DurationValue> = {
  slug: "duration",
  wave: 4,
  week: 6,
  ui: "DURATION",
  vk: "number",
  group: "date",
  icon: HourglassIcon,
  label: L("Duration", "Durasi"),
  title: L("Duration", "Durasi"),
  blurb: L("Hours and minutes (or days), saved as a number of minutes.", "Jam dan menit (atau hari), disimpan sebagai jumlah menit."),

  defaults: () => ({
    label: L("Time spent", "Waktu pengerjaan"),
    name: "time_spent",
    units: "hm",
    hoursPerDay: 8,
    minMinutes: "",
    maxMinutes: 720,
    presets: ["15", "30", "60", "120"],
    showTotal: true,
    required: true,
  }),
  schema: (p) => [
    {
      tab: "general",
      fields: [F.name(), F.key(L("Saved as a number of minutes, e.g. `165` for 2 h 45 m.", "Disimpan sebagai jumlah menit, mis. `165` untuk 2 j 45 m."))],
    },
    {
      tab: "general",
      title: L("Boxes", "Kotak isian"),
      fields: [
        {
          t: "seg",
          k: "units",
          label: L("Units", "Satuan"),
          options: [
            { v: "hm", label: L("Hours + minutes", "Jam + menit") },
            { v: "dh", label: L("Days + hours", "Hari + jam") },
            { v: "dhm", label: L("Days + hours + minutes", "Hari + jam + menit") },
          ],
          // Without a minutes box, quick picks must be whole hours.
          set: (o, v) => ({ ...o, units: v as Units, presets: v === "dh" ? o.presets.filter((x) => Number(x) % 60 === 0) : o.presets }),
          hint: L("One box per unit, e.g. [2] h [45] m.", "Satu kotak per satuan, mis. [2] j [45] m."),
        },
        {
          t: "seg",
          k: "hoursPerDay",
          label: L("One day is", "Satu hari dihitung"),
          when: (o) => o.units !== "hm",
          options: [
            { v: 8, label: L("8 h · working day", "8 jam · hari kerja") },
            { v: 24, label: L("24 h · calendar day", "24 jam · hari kalender") },
          ],
          hint: L("Turns days into minutes (Wave 4 open decision 2).", "Dipakai untuk mengubah hari menjadi menit (keputusan terbuka Gelombang 4 no. 2)."),
        },
        {
          t: "chips",
          k: "presets",
          label: L("Quick picks", "Pilihan cepat"),
          options: PRESET_MENU.filter((n) => p.units !== "dh" || n % 60 === 0).map((n) => ({ v: String(n), label: fmt(p, n) })),
          hint: L(`Buttons under the boxes that fill them in one tap, up to ${MAX_PRESETS}. None = no buttons.`, `Tombol di bawah kotak untuk mengisi sekali ketuk, maksimal ${MAX_PRESETS}. Tidak dipilih = tanpa tombol.`),
          validate: presetsErr,
        },
        {
          t: "switch",
          k: "showTotal",
          label: L("Show the total in minutes", "Tampilkan total menit"),
          hint: L("“= 165 minutes” beside the boxes: the number that is saved.", "“= 165 menit” di samping kotak: angka yang disimpan."),
        },
      ],
    },
    {
      tab: "validation",
      fields: [
        F.required(L("0 counts as empty.", "0 dianggap kosong.")),
        minutesField("minMinutes", L("Shortest duration", "Durasi minimal"), L("In minutes. Leave empty for no limit.", "Dalam menit. Kosongkan jika tanpa batas.")),
        minutesField("maxMinutes", L("Longest duration", "Durasi maksimal"), L("In minutes, e.g. 720 = 12 h. Leave empty for no limit.", "Dalam menit, mis. 720 = 12 jam. Kosongkan jika tanpa batas.")),
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: DurationCanvas,

  Runtime: DurationRuntime,
  initial: () => ({ ...EMPTY }),
  sample: durationSample,
  validate,
  value: (p, v) => {
    const total = parse(p, v).total
    return total ? total : null
  },

  spec: (p) => ({
    ui_type: "DURATION",
    value_kind: "number",
    name: p.name,
    label: p.label,
    required: p.required,
    config: {
      units: p.units,
      hours_per_day: hasDays(p) ? hpdOf(p) : null,
      unit: "minutes",
      min_minutes: optNum(p.minMinutes),
      max_minutes: optNum(p.maxMinutes),
      presets: presetsOf(p),
      show_total: p.showTotal,
    },
  }),
  savedAs: (p) =>
    L(
      `One number variable \`${p.name}\`: the total in minutes (\`165\` = 2 h 45 m). Empty is \`null\`.`,
      `Satu variabel angka \`${p.name}\`: total dalam menit (\`165\` = 2 j 45 m). Kosong = \`null\`.`,
    ),
  notes: [
    L(
      "Saved as a whole number of minutes, not ISO 8601 text like `PT2H45M`: easy to add up, compare and report on (Wave 4 open decision 2).",
      "Disimpan sebagai bilangan bulat menit, bukan teks ISO 8601 seperti `PT2H45M`: mudah dijumlah, dibandingkan, dan dilaporkan (keputusan terbuka Gelombang 4 no. 2).",
    ),
    L(
      "With days, one day is `hours_per_day` hours (8 = working day, 24 = calendar day). It is in the spec so reports turn minutes back into days the same way.",
      "Dengan hari, satu hari = `hours_per_day` jam (8 = hari kerja, 24 = hari kalender). Disimpan di spec agar laporan mengubah menit kembali ke hari dengan cara yang sama.",
    ),
    L(
      "Boxes take whole numbers. Overflow is tidied when focus leaves the boxes (90 m → 1 h 30 m; 10 h → 1 d 2 h at 8 h a day); the minutes don't change.",
      "Kotak hanya menerima bilangan bulat. Kelebihan dirapikan saat fokus keluar dari kotak (90 m → 1 j 30 m; 10 j → 1 hr 2 j bila 8 jam sehari); jumlah menitnya tetap.",
    ),
    L(
      "0 counts as empty, so a required field needs more than 0. Shortest / longest compare the total minutes and must match the server validator.",
      "0 dianggap kosong, jadi field wajib butuh nilai lebih dari 0. Durasi minimal / maksimal membandingkan total menit dan harus sejalan dengan validator server.",
    ),
    L(
      "Use Time range when the clock times matter (overtime, shifts) and Duration when only the length does (time spent, estimates).",
      "Pakai Rentang waktu bila jam mulai dan selesai penting (lembur, shift), dan Durasi bila hanya lamanya yang penting (waktu pengerjaan, estimasi).",
    ),
  ],
  story: {
    process: L("Maintenance work order", "Perintah kerja perawatan"),
    step: L("Close out", "Penutupan pekerjaan"),
    ref: "WO-2026-0877",
    due: "2026-11-16",
    task: L("Record the repair", "Catat hasil perbaikan"),
    before: [
      {
        name: "machine",
        label: L("Machine", "Mesin"),
        type: "select",
        required: true,
        value: "im_04",
        options: [
          { v: "im_04", label: L("Injection moulding IM-04", "Mesin injeksi IM-04") },
          { v: "cnc_02", label: L("CNC lathe CNC-02", "Mesin bubut CNC-02") },
          { v: "cmp_01", label: L("Air compressor CMP-01", "Kompresor udara CMP-01") },
        ],
      },
      {
        name: "work_done",
        label: L("What was fixed", "Yang diperbaiki"),
        type: "textarea",
        required: true,
        rows: 2,
        value: "Ganti seal silinder hidrolik yang bocor, lalu kalibrasi ulang tekanan ke 140 bar.",
      },
    ],
  },
}

