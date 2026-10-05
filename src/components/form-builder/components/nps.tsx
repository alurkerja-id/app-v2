/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useRef } from "react"
import { DashboardSpeed01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { ScaleEnds } from "../field-shell"
import { L, useT, type L10n } from "../i18n"
import { F } from "../lib"
import type { ComponentDef, RuntimeProps } from "../types"

/* Net Promoter Score — ui_type NPS, value_kind "number" (0–10). Story: quarterly helpdesk survey. */

interface NpsProps {
  label: L10n
  name: string
  lowLabel: L10n
  highLabel: L10n
  /** Tint buttons by group (red 0–6, amber 7–8, green 9–10). */
  colored: boolean
  required: boolean
}
/** 0 is a real answer; only null is empty. */
type NpsValue = number | null

const SCORES = Array.from({ length: 11 }, (_, i) => i)
type Group = "det" | "pas" | "pro"
/** Detractor 0–6, passive 7–8, promoter 9–10. Display only, never saved. */
const grp = (n: number): Group => (n <= 6 ? "det" : n <= 8 ? "pas" : "pro")
const TINT: Record<Group, string> = {
  det: "bg-destructive/10 dark:bg-destructive/15",
  pas: "bg-amber-500/15",
  pro: "bg-emerald-500/15",
}

const BOX = "grid h-11 place-items-center rounded-xl border text-sm font-semibold tabular-nums"

function Ends({ p }: { p: NpsProps }) {
  const t = useT()
  return <ScaleEnds low={`0 · ${t(p.lowLabel)}`} high={`10 · ${t(p.highLabel)}`} />
}

function NpsCanvas({ props: p }: { props: NpsProps }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-11 gap-1">
        {SCORES.map((i) => (
          <span key={i} className={cn(BOX, "border-border text-foreground", p.colored ? TINT[grp(i)] : "bg-background")}>
            {i}
          </span>
        ))}
      </div>
      <Ends p={p} />
    </div>
  )
}

function NpsRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<NpsProps, NpsValue>) {
  const t = useT()
  const group = useRef<HTMLDivElement>(null)
  const live = state === "active"
  const disabled = state === "disabled"
  const bad = issues.length > 0

  const set = (n: number) => {
    const next = Math.max(0, Math.min(10, n))
    onChange(next)
    requestAnimationFrame(() => group.current?.querySelector<HTMLButtonElement>(`[data-nps="${next}"]`)?.focus())
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        ref={group}
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-readonly={state === "readonly" || undefined}
        aria-disabled={disabled || undefined}
        aria-invalid={bad || undefined}
        className={cn(
          /* 11 in a row; on a phone 6 + 5 so every button stays at least 44 px. */
          "grid gap-1 rounded-xl",
          compact ? "grid-cols-6" : "grid-cols-11",
          bad && "ring-2 ring-destructive/40 ring-offset-2 ring-offset-background",
        )}
        onKeyDown={(e) => {
          if (!live) return
          const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-nps]")
          if (!btn) return
          const cur = v ?? Number(btn.dataset.nps)
          const step = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : null
          if (step != null) {
            e.preventDefault()
            set(cur + step)
          } else if (e.key === "Home") {
            e.preventDefault()
            set(0)
          } else if (e.key === "End") {
            e.preventDefault()
            set(10)
          }
        }}
      >
        {SCORES.map((i) => {
          const on = v === i
          return (
            <button
              key={i}
              type="button"
              role="radio"
              data-nps={i}
              aria-checked={on}
              aria-label={String(i)}
              tabIndex={disabled ? -1 : (v ?? 0) === i ? 0 : -1}
              disabled={disabled}
              onClick={() => live && set(i)}
              className={cn(
                BOX,
                "outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                on
                  ? disabled
                    ? "border-muted-foreground/40 bg-muted-foreground/25 text-foreground/70"
                    : "border-primary bg-primary text-primary-foreground"
                  : cn("border-border", p.colored ? TINT[grp(i)] : "bg-background", disabled ? "text-muted-foreground" : "text-foreground"),
                live && !on && "transition-colors hover:bg-muted",
                state === "readonly" && "cursor-default",
                disabled && "cursor-not-allowed opacity-70",
              )}
            >
              {i}
            </button>
          )
        })}
      </div>
      <Ends p={p} />
      {v != null && (
        <span className="text-xs text-muted-foreground">
          {t(L("Your score: ", "Skor Anda: "))}
          <b className={cn("font-semibold", disabled ? "text-muted-foreground" : "text-foreground")}>{v}</b>
        </span>
      )}
    </div>
  )
}

export const nps: ComponentDef<NpsProps, NpsValue> = {
  slug: "nps",
  wave: 2,
  ui: "NPS",
  vk: "number",
  group: "survey",
  week: 3,
  icon: DashboardSpeed01Icon,
  label: L("NPS", "NPS"),
  title: L("Net Promoter Score", "Net Promoter Score"),
  blurb: L("One 0–10 question: how likely are you to recommend us?", "Satu pertanyaan 0–10: seberapa mungkin Anda merekomendasikan kami?"),

  defaults: () => ({
    label: L("How likely are you to recommend our helpdesk to a colleague?", "Seberapa mungkin Anda merekomendasikan helpdesk kami ke rekan kerja?"),
    name: "nps_score",
    lowLabel: L("Not at all likely", "Sangat tidak mungkin"),
    highLabel: L("Extremely likely", "Sangat mungkin"),
    colored: false,
    required: true,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(L("Name (the question)", "Nama (pertanyaannya)"), {
          multi: true,
          hint: L("NPS always uses the 0–10 scale, so there is no min/max setting.", "NPS selalu memakai skala 0–10, jadi tidak ada pengaturan min/maks."),
        }),
        F.key(),
        { t: "i18n", k: "lowLabel", label: L("Label under 0", "Label di bawah 0") },
        { t: "i18n", k: "highLabel", label: L("Label under 10", "Label di bawah 10") },
        {
          t: "switch",
          k: "colored",
          label: L("Tint buttons by group", "Warnai tombol per kelompok"),
          hint: L(
            "Red 0–6, amber 7–8, green 9–10. Off by default so colors do not steer answers.",
            "Merah 0–6, kuning 7–8, hijau 9–10. Bawaannya mati agar warna tidak mengarahkan jawaban.",
          ),
        },
      ],
    },
    { tab: "validation", fields: [F.required()] },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: NpsCanvas,

  Runtime: NpsRuntime,
  initial: () => null,
  sample: () => 9,
  /* `== null`, never a falsy check: 0 is a valid score. */
  validate: (p, v) => (p.required && v == null ? [{ fid: "score", msg: L("Pick a score from 0 to 10", "Pilih skor dari 0 sampai 10") }] : []),
  value: (_, v) => v,

  spec: (p) => ({
    ui_type: "NPS",
    value_kind: "number",
    name: p.name,
    label: p.label,
    required: p.required,
    config: { scale: [0, 10], low_label: p.lowLabel, high_label: p.highLabel, tint_groups: p.colored },
  }),
  savedAs: (p) => L(`One whole number from 0 to 10 in \`${p.name}\`.`, `Satu bilangan bulat 0 sampai 10 di \`${p.name}\`.`),
  notes: [
    L(
      "The group (0–6 detractor, 7–8 passive, 9–10 promoter) is computed in reports, **not saved**.",
      "Kelompok (0–6 detractor, 7–8 passive, 9–10 promoter) dihitung di laporan, **tidak disimpan**.",
    ),
    L(
      "The 0–10 scale is fixed; if a team needs another scale, they use Rating or Likert instead.",
      "Skala 0–10 tetap; kalau butuh skala lain, pakai Rating atau Likert.",
    ),
    L("11 buttons wrap to 6 + 5 on narrow screens so each stays at least 44 px.", "11 tombol terbagi 6 + 5 di layar sempit agar tiap tombol tetap minimal 44 px."),
  ],
  story: {
    process: L("Quarterly customer survey", "Survei pelanggan kuartalan"),
    step: L("Customer response", "Jawaban pelanggan"),
    ref: "SRV-2026-Q4-0219",
    due: "2026-10-12",
    task: L("Helpdesk satisfaction survey, Q4 2026", "Survei kepuasan helpdesk, Q4 2026"),
    after: [
      {
        name: "reason",
        label: L("What is the main reason for your score?", "Apa alasan utama skor Anda?"),
        type: "textarea",
        placeholder: L("Optional", "Opsional"),
        rows: 3,
        value: "",
      },
    ],
  },
}
