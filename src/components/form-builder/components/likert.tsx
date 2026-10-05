/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useRef } from "react"
import { ChartBarIncreasingIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { L, useT, type L10n } from "../i18n"
import { F } from "../lib"
import type { ComponentDef, FieldState, RuntimeProps } from "../types"

/* Likert scale — ui_type LIKERT, value_kind "number" (1..N). Story: employee engagement survey. */

type Points = 5 | 7

interface LikertLabel {
  label: L10n
  [k: string]: unknown
}
interface LikertProps {
  label: L10n
  name: string
  points: Points
  /** One per point; the saved value is the position (1 = first label). */
  labels: LikertLabel[]
  showLabels: "all" | "ends"
  required: boolean
}
type LikertValue = number | null

const SETS: Record<Points, L10n[]> = {
  5: [
    L("Strongly disagree", "Sangat tidak setuju"),
    L("Disagree", "Tidak setuju"),
    L("Neutral", "Netral"),
    L("Agree", "Setuju"),
    L("Strongly agree", "Sangat setuju"),
  ],
  7: [
    L("Strongly disagree", "Sangat tidak setuju"),
    L("Disagree", "Tidak setuju"),
    L("Somewhat disagree", "Agak tidak setuju"),
    L("Neutral", "Netral"),
    L("Somewhat agree", "Agak setuju"),
    L("Agree", "Setuju"),
    L("Strongly agree", "Sangat setuju"),
  ],
}
/** Fresh default labels for a scale (copies, so editing one never touches SETS). */
const mk = (n: Points): LikertLabel[] => SETS[n].map((l) => ({ label: L(l.en, l.id) }))
const toPoints = (v: unknown): Points => (Number(v) === 7 ? 7 : 5)

/** Ends only: the first and last point show their label, the middle ones their number. */
const showLbl = (p: LikertProps, i: number) => p.showLabels === "all" || i === 0 || i === p.labels.length - 1

function Dot({ on, muted }: { on: boolean; muted?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-[18px] shrink-0 rounded-full border-2",
        on
          ? muted
            ? "border-muted-foreground/60 bg-muted-foreground/60 shadow-[inset_0_0_0_3px_var(--background)]"
            : "border-primary bg-primary shadow-[inset_0_0_0_3px_var(--background)]"
          : "border-input",
      )}
    />
  )
}

function OptionContent({ p, i, on, muted }: { p: LikertProps; i: number; on: boolean; muted?: boolean }) {
  const t = useT()
  return (
    <>
      <Dot on={on} muted={muted} />
      {showLbl(p, i) ? <span>{t(p.labels[i].label)}</span> : <span className="font-mono text-[11px] text-muted-foreground">{i + 1}</span>}
    </>
  )
}

/** Side by side on desktop; stacked rows (44 px min) on a phone. */
const scaleCls = (compact: boolean) => (compact ? "flex flex-col gap-1.5" : "grid auto-cols-fr grid-flow-col gap-1.5")
const optCls = (compact: boolean) =>
  cn(
    "flex rounded-xl border text-xs leading-snug",
    compact ? "min-h-11 flex-row items-center gap-2.5 px-3 py-2 text-left" : "min-h-[72px] flex-col items-center justify-start gap-1.5 px-1.5 py-2.5 text-center",
  )

function LikertCanvas({ props: p }: { props: LikertProps }) {
  return (
    <div className={scaleCls(false)}>
      {p.labels.map((_, i) => (
        <span key={i} className={cn(optCls(false), "border-border bg-background text-foreground/80")}>
          <OptionContent p={p} i={i} on={false} />
        </span>
      ))}
    </div>
  )
}

function optState(on: boolean, state: FieldState) {
  if (state === "disabled") return cn("cursor-not-allowed opacity-70", on ? "border-muted-foreground/40 bg-muted text-foreground/70" : "border-border bg-background text-muted-foreground")
  return cn(
    on ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-foreground/80",
    state === "active" && !on && "transition-colors hover:bg-muted",
    state === "readonly" && "cursor-default",
  )
}

function LikertRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<LikertProps, LikertValue>) {
  const t = useT()
  const group = useRef<HTMLDivElement>(null)
  const n = p.labels.length
  const live = state === "active"
  const disabled = state === "disabled"
  const bad = issues.length > 0

  const set = (x: number) => {
    const next = Math.max(1, Math.min(n, x))
    onChange(next)
    requestAnimationFrame(() => group.current?.querySelector<HTMLButtonElement>(`[data-lk="${next}"]`)?.focus())
  }

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-labelledby={`${id}-label`}
      aria-readonly={state === "readonly" || undefined}
      aria-disabled={disabled || undefined}
      aria-invalid={bad || undefined}
      className={cn(scaleCls(compact), "rounded-xl", bad && "ring-2 ring-destructive/40 ring-offset-2 ring-offset-background")}
      onKeyDown={(e) => {
        if (!live) return
        const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-lk]")
        if (!btn) return
        const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : null
        if (step == null) return
        e.preventDefault()
        set((v ?? Number(btn.dataset.lk)) + step)
      }}
    >
      {p.labels.map((o, i) => {
        const pos = i + 1
        const on = v === pos
        return (
          <button
            key={i}
            type="button"
            role="radio"
            data-lk={pos}
            aria-checked={on}
            aria-label={`${pos} · ${t(o.label)}`}
            tabIndex={disabled ? -1 : (v ?? 1) === pos ? 0 : -1}
            disabled={disabled}
            onClick={() => live && set(pos)}
            className={cn(optCls(compact), "outline-none focus-visible:ring-3 focus-visible:ring-ring/40", optState(on, state))}
          >
            <OptionContent p={p} i={i} on={on} muted={disabled} />
          </button>
        )
      })}
    </div>
  )
}

export const likert: ComponentDef<LikertProps, LikertValue> = {
  slug: "likert",
  wave: 2,
  ui: "LIKERT",
  vk: "number",
  group: "survey",
  week: 3,
  icon: ChartBarIncreasingIcon,
  label: L("Likert scale", "Skala Likert"),
  title: L("Likert scale", "Skala Likert"),
  blurb: L("One statement answered on a disagree–agree scale.", "Satu pernyataan dijawab dengan skala tidak setuju–setuju."),

  defaults: () => ({
    label: L("I get enough information to finish my tasks.", "Saya mendapat cukup informasi untuk menyelesaikan tugas."),
    name: "enough_info",
    points: 5,
    labels: mk(5),
    showLabels: "all",
    required: true,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(L("Name (the statement)", "Nama (pernyataannya)"), { multi: true }),
        F.key(),
        {
          t: "seg",
          k: "points",
          label: L("Scale", "Skala"),
          options: [
            { v: 5, label: L("5 points", "5 poin") },
            { v: 7, label: L("7 points", "7 poin") },
          ],
          /* Changing the scale resets the point labels to that scale's defaults. */
          set: (p, v) => ({ ...p, points: toPoints(v), labels: mk(toPoints(v)) }),
          hint: L("Changing the scale resets the labels below.", "Mengganti skala mengembalikan label di bawah ke bawaan."),
        },
        {
          t: "list",
          k: "labels",
          label: L("Point labels", "Label tiap poin"),
          fixed: true,
          hint: L("Saved value is the position: 1 = first label.", "Nilai yang disimpan adalah urutannya: 1 = label pertama."),
        },
        {
          t: "seg",
          k: "showLabels",
          label: L("Show labels", "Tampilkan label"),
          options: [
            { v: "all", label: L("Every point", "Semua poin") },
            { v: "ends", label: L("Ends only", "Ujung saja") },
          ],
        },
      ],
    },
    { tab: "validation", fields: [F.required()] },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: LikertCanvas,

  Runtime: LikertRuntime,
  initial: () => null,
  sample: (p) => Math.min(4, p.labels.length),
  validate: (p, v) => (p.required && v == null ? [{ fid: "point", msg: L("Pick how much you agree", "Pilih seberapa setuju Anda") }] : []),
  value: (_, v) => v,

  spec: (p) => ({
    ui_type: "LIKERT",
    value_kind: "number",
    name: p.name,
    label: p.label,
    required: p.required,
    config: {
      points: p.labels.length,
      labels: p.labels.map((o, i) => ({ value: i + 1, label: o.label })),
      show_labels: p.showLabels,
    },
  }),
  savedAs: (p) =>
    L(`The position on the scale (1–${p.labels.length}) in \`${p.name}\`.`, `Posisi pada skala (1–${p.labels.length}) di \`${p.name}\`.`),
  notes: [
    L(
      "The value is the position, not the label text, so reports can average it and labels can be reworded later.",
      "Nilainya adalah posisi, bukan teks label, agar laporan bisa merata-rata dan label bisa diubah kata-katanya nanti.",
    ),
    L(
      "One statement per Likert. Several statements with the same scale → use Matrix.",
      "Satu pernyataan per Likert. Banyak pernyataan dengan skala sama → pakai Matrix.",
    ),
    L("On narrow screens the options stack vertically.", "Di layar sempit pilihan tersusun vertikal."),
  ],
  story: {
    process: L("Employee engagement survey", "Survei keterlibatan karyawan"),
    step: L("Employee response", "Jawaban karyawan"),
    ref: "ENG-2026-Q4",
    due: "2026-10-16",
    task: L("Engagement survey, Q4 2026", "Survei keterlibatan, Q4 2026"),
    before: [
      {
        name: "division",
        label: L("Your division", "Divisi Anda"),
        type: "select",
        required: true,
        value: "product",
        options: [
          { v: "product", label: L("Product", "Produk") },
          { v: "operations", label: L("Operations", "Operasional") },
          { v: "finance", label: L("Finance", "Keuangan") },
          { v: "hr", label: L("People & HR", "SDM") },
        ],
      },
    ],
    after: [{ name: "comment", label: L("Anything to add?", "Ada tambahan?"), type: "textarea", placeholder: L("Optional", "Opsional"), rows: 2, value: "" }],
  },
}
