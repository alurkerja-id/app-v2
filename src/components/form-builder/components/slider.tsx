/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import type { ReactNode } from "react"
import { SlidersHorizontalIcon } from "@hugeicons/core-free-icons"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { ScaleEnds } from "../field-shell"
import { L, useT, type L10n } from "../i18n"
import { F } from "../lib"
import type { ComponentDef, RuntimeProps } from "../types"

/* Slider — ui_type SLIDER, value_kind "number". Story: weekly progress on a project task. */

interface SliderProps {
  label: L10n
  name: string
  /** Number fields hold "" while the Edit Element input is empty. */
  min: number | ""
  max: number | ""
  step: number | ""
  unit: string
  /** Empty = no starting value: the slider starts untouched and the value is null. */
  defaultValue: number | ""
  showEnds: boolean
  required: boolean
}
/** null = untouched ("Not set"). */
type SliderValue = number | null

const num = (v: unknown): number | null => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v))
const lo = (p: SliderProps) => num(p.min) ?? 0
const hi = (p: SliderProps) => num(p.max) ?? 100
const st = (p: SliderProps) => {
  const s = num(p.step)
  return s && s > 0 ? s : 1
}
/** "65%" but "8 hours": no space before %. */
const fmtV = (p: SliderProps, v: number | null) => (v == null ? "" : `${v}${p.unit ? (p.unit === "%" ? "" : " ") + p.unit : ""}`)
const snap = (p: SliderProps, x: number) => Math.min(hi(p), Math.max(lo(p), lo(p) + Math.round((x - lo(p)) / st(p)) * st(p)))

const NOT_SET = L("Not set", "Belum diisi")

/** Track + value on the right, min / max under the track. */
function Layout({ track, out, p }: { track: ReactNode; out: ReactNode; p: SliderProps }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1">
      {track}
      {out}
      {p.showEnds && <ScaleEnds low={fmtV(p, lo(p))} high={fmtV(p, hi(p))} className="col-start-1 tabular-nums" />}
    </div>
  )
}

function Output({ text, empty, muted, htmlFor }: { text: string; empty: boolean; muted?: boolean; htmlFor?: string }) {
  const cls = cn(
    "min-w-14 text-right tabular-nums",
    empty ? "text-[13px] font-medium text-muted-foreground" : "text-[15px] font-semibold",
    !empty && (muted ? "text-muted-foreground" : "text-foreground"),
  )
  return htmlFor ? (
    <output htmlFor={htmlFor} className={cls}>
      {text}
    </output>
  ) : (
    <span className={cls}>{text}</span>
  )
}

const THUMB = "block h-4 w-6 shrink-0 rounded-full bg-white shadow-md ring-1 ring-black/10 not-dark:bg-clip-padding"

function SliderCanvas({ props: p }: { props: SliderProps }) {
  const t = useT()
  const d = num(p.defaultValue)
  const pct = d == null ? 50 : Math.min(100, Math.max(0, ((d - lo(p)) / (hi(p) - lo(p) || 1)) * 100))
  return (
    <Layout
      p={p}
      track={
        <div className="relative flex h-7 items-center">
          <span className="relative h-2 w-full overflow-hidden rounded-full bg-input/90">
            <span className={cn("absolute inset-y-0 left-0", d == null ? "bg-muted-foreground/25" : "bg-primary")} style={{ width: `${pct}%` }} />
          </span>
          <span className={cn(THUMB, "absolute top-1/2 -translate-x-1/2 -translate-y-1/2", d == null && "opacity-60")} style={{ left: `${pct}%` }} />
        </div>
      }
      out={<Output text={d == null ? t(NOT_SET) : fmtV(p, d)} empty={d == null} />}
    />
  )
}

function SliderRuntime({ props: p, value: v, onChange, state, issues, id }: RuntimeProps<SliderProps, SliderValue>) {
  const t = useT()
  const live = state === "active"
  const disabled = state === "disabled"
  const min = lo(p)
  const max = hi(p)
  const step = st(p)
  /* An untouched slider still needs a handle position: the middle, on a step. */
  const shown = v ?? snap(p, (min + max) / 2)
  const untouched = v == null
  const text = untouched ? t(NOT_SET) : fmtV(p, v)
  const bad = issues.length > 0

  return (
    <div className="flex flex-col gap-1.5">
      <Layout
        p={p}
        track={
          /* Controlled: onValueChange fires on every move, so the number on the right
             follows the drag. React re-renders in place, which keeps the drag going. */
          <SliderPrimitive.Root
            value={[shown]}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onValueChange={([n]) => {
              if (live && n !== v) onChange(n)
            }}
            className={cn(
              "relative flex h-7 w-full touch-none items-center select-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
              state === "readonly" && "cursor-default",
            )}
          >
            <SliderPrimitive.Track
              className={cn("relative h-2 w-full grow overflow-hidden rounded-full bg-input/90", bad && "ring-2 ring-destructive/40")}
            >
              <SliderPrimitive.Range className={cn("absolute h-full select-none", untouched ? "bg-muted-foreground/25" : "bg-primary")} />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
              id={`${id}-input`}
              aria-labelledby={`${id}-label`}
              aria-valuetext={text}
              aria-describedby={live ? `${id}-hint` : undefined}
              aria-invalid={bad || undefined}
              aria-readonly={state === "readonly" || undefined}
              className={cn(
                THUMB,
                "transition-[color,box-shadow,opacity] outline-none select-none hover:ring-4 hover:ring-ring/30 focus-visible:ring-4 focus-visible:ring-ring/30",
                untouched && "opacity-60",
                bad && "ring-destructive/60",
              )}
            />
          </SliderPrimitive.Root>
        }
        out={<Output text={text} empty={untouched} muted={disabled} htmlFor={`${id}-input`} />}
      />
      {live && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {t(
            untouched
              ? L("Drag the handle or use the arrow keys.", "Geser pegangan atau pakai tombol panah.")
              : L(`Arrow keys change it by ${step}.`, `Tombol panah mengubah sebesar ${step}.`),
          )}
        </p>
      )}
    </div>
  )
}

export const slider: ComponentDef<SliderProps, SliderValue> = {
  slug: "slider",
  wave: 2,
  ui: "SLIDER",
  vk: "number",
  group: "survey",
  week: 3,
  icon: SlidersHorizontalIcon,
  label: L("Slider", "Slider"),
  title: L("Slider", "Slider"),
  blurb: L("Drag to pick a number inside a range, with a unit such as %.", "Geser untuk memilih angka dalam rentang, dengan satuan seperti %."),

  defaults: () => ({
    label: L("Work completed", "Pekerjaan selesai"),
    name: "progress_pct",
    min: 0,
    max: 100,
    step: 5,
    unit: "%",
    defaultValue: "",
    showEnds: true,
    required: true,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(),
        F.key(),
        { t: "number", k: "min", label: L("Minimum", "Minimum"), validate: (v) => (num(v) == null ? L("Enter a number", "Isi angka") : null) },
        {
          t: "number",
          k: "max",
          label: L("Maximum", "Maksimum"),
          validate: (_, o) => {
            const a = num(o.min)
            const b = num(o.max)
            return a == null || b == null ? L("Enter a number", "Isi angka") : b <= a ? L("Maximum must be greater than minimum", "Maksimum harus lebih besar dari minimum") : null
          },
        },
        {
          t: "number",
          k: "step",
          label: L("Step", "Kelipatan"),
          min: 1,
          validate: (v, o) => {
            const s = num(v)
            return !s || s <= 0
              ? L("Step must be above 0", "Kelipatan harus lebih dari 0")
              : s > hi(o) - lo(o)
                ? L("Step is larger than the range", "Kelipatan lebih besar dari rentang")
                : null
          },
        },
        {
          t: "text",
          k: "unit",
          label: L("Unit", "Satuan"),
          placeholder: L("e.g. %, hours, km", "mis. %, jam, km"),
          hint: L("Shown after the number. Not saved with the value.", "Tampil setelah angka. Tidak ikut disimpan."),
        },
        {
          t: "number",
          k: "defaultValue",
          label: L("Starting value", "Nilai awal"),
          allowEmpty: true,
          hint: L("Leave empty so the user has to move the slider.", "Kosongkan agar user wajib menggeser slider."),
          validate: (v, o) => {
            if (v === "" || v == null) return null
            const d = num(v)
            return d == null
              ? L("Enter a number or leave empty", "Isi angka atau kosongkan")
              : d < lo(o) || d > hi(o)
                ? L("Must be between minimum and maximum", "Harus di antara minimum dan maksimum")
                : null
          },
        },
        { t: "switch", k: "showEnds", label: L("Show min and max under the track", "Tampilkan min dan maks di bawah") },
      ],
    },
    {
      tab: "validation",
      fields: [F.required(L("Without a starting value, the user must move the slider once.", "Tanpa nilai awal, user wajib menggeser slider sekali."))],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: SliderCanvas,

  Runtime: SliderRuntime,
  initial: (p) => num(p.defaultValue),
  sample: (p) => snap(p, lo(p) + 0.65 * (hi(p) - lo(p))),
  validate: (p, v) =>
    p.required && v == null
      ? [{ fid: "slider", msg: L(`Move the slider to set ${p.label.en.toLowerCase()}`, `Geser slider untuk mengisi ${p.label.id.toLowerCase()}`) }]
      : [],
  value: (_, v) => v,

  spec: (p) => ({
    ui_type: "SLIDER",
    value_kind: "number",
    name: p.name,
    label: p.label,
    required: p.required,
    config: { min: lo(p), max: hi(p), step: st(p), unit: p.unit || null, default: num(p.defaultValue), show_ends: p.showEnds },
  }),
  savedAs: (p) =>
    L(
      `A number between ${lo(p)} and ${hi(p)} in \`${p.name}\`. The unit is not saved.`,
      `Angka antara ${lo(p)} dan ${hi(p)} di \`${p.name}\`. Satuannya tidak ikut disimpan.`,
    ),
  notes: [
    L(
      "Without a starting value the slider is **untouched** and the value is `null`; required checks that the user moved it.",
      "Tanpa nilai awal slider berstatus **belum disentuh** dan nilainya `null`; required mengecek user sudah menggesernya.",
    ),
    L(
      "Re-render only when the drag ends (`change`), not on every `input`, or the drag breaks.",
      "Render ulang hanya saat geseran selesai (`change`), bukan di setiap `input`, agar geseran tidak putus.",
    ),
    L(
      "Builder checks: max > min, step > 0 and not larger than the range, starting value inside the range.",
      "Cek di builder: maks > min, kelipatan > 0 dan tidak melebihi rentang, nilai awal di dalam rentang.",
    ),
  ],
  story: {
    process: L("Project progress report", "Laporan progres proyek"),
    step: L("Weekly update", "Update mingguan"),
    ref: "PRJ-2026-031",
    due: "2026-10-09",
    task: L("Weekly update: office network, Surabaya branch", "Update mingguan: jaringan kantor cabang Surabaya"),
    after: [
      {
        name: "weekly_note",
        label: L("What was done this week?", "Apa yang dikerjakan minggu ini?"),
        type: "textarea",
        required: true,
        rows: 3,
        value: "Kabel lantai 2 selesai ditarik; menunggu switch untuk lantai 3.",
      },
    ],
  },
}
