/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useRef } from "react"
import { StarIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScaleEnds } from "../field-shell"
import { L, useT, type L10n } from "../i18n"
import { F, reqMsg } from "../lib"
import type { ComponentDef, RuntimeProps } from "../types"

/* Star rating — ui_type RATING, value_kind "number". Story: rating a closed helpdesk ticket. */

interface RatingProps {
  label: L10n
  name: string
  max: number
  half: boolean
  lowLabel: L10n
  highLabel: L10n
  showValue: boolean
  required: boolean
}
type RatingValue = number | null

const maxN = (p: RatingProps) => Math.min(10, Math.max(3, Number(p.max) || 5))
const valueText = (p: RatingProps, v: RatingValue) =>
  v == null ? L("Not rated yet", "Belum dinilai") : L(`${v} of ${maxN(p)}`, `${v} dari ${maxN(p)}`)

const STAR_PATH = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"

/** One star: an outline with a filled copy clipped to 0 / 50 / 100 %. */
function Star({ fill, muted }: { fill: 0 | 0.5 | 1; muted?: boolean }) {
  return (
    <span className="relative inline-block size-7">
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-full fill-muted stroke-border" strokeWidth={1.2} aria-hidden>
        <path d={STAR_PATH} />
      </svg>
      {fill > 0 && (
        <span className="absolute inset-0 overflow-hidden" style={{ width: fill === 1 ? "100%" : "50%" }}>
          <svg
            viewBox="0 0 24 24"
            className={cn("size-7", muted ? "fill-muted-foreground/50 stroke-muted-foreground/50" : "fill-amber-400 stroke-amber-500")}
            strokeWidth={1.2}
            aria-hidden
          >
            <path d={STAR_PATH} />
          </svg>
        </span>
      )}
    </span>
  )
}

const fillFor = (v: RatingValue, i: number): 0 | 0.5 | 1 => (v != null && v >= i ? 1 : v != null && v >= i - 0.5 ? 0.5 : 0)

function RatingCanvas({ props: p }: { props: RatingProps }) {
  const t = useT()
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {Array.from({ length: maxN(p) }, (_, i) => (
          <Star key={i} fill={0} />
        ))}
      </div>
      <ScaleEnds low={`1 · ${t(p.lowLabel)}`} high={`${maxN(p)} · ${t(p.highLabel)}`} />
      {p.showValue && <span className="text-xs text-muted-foreground">{t(valueText(p, null))}</span>}
    </div>
  )
}

function RatingRuntime({ props: p, value: v, onChange, state, issues, id }: RuntimeProps<RatingProps, RatingValue>) {
  const t = useT()
  const group = useRef<HTMLDivElement>(null)
  const n = maxN(p)
  const step = p.half ? 0.5 : 1
  const live = state === "active"
  const focusIdx = v == null ? 1 : Math.ceil(v)

  const set = (next: RatingValue) => {
    const clamped = next == null ? null : Math.min(n, Math.max(step, next))
    onChange(clamped)
    const target = clamped == null ? 1 : Math.ceil(clamped)
    requestAnimationFrame(() => group.current?.querySelector<HTMLButtonElement>(`[data-star="${target}"]`)?.focus())
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        ref={group}
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-readonly={state === "readonly" || undefined}
        aria-disabled={state === "disabled" || undefined}
        aria-invalid={issues.length > 0 || undefined}
        className={cn("flex w-fit gap-1 rounded-xl", issues.length > 0 && "ring-2 ring-destructive/40 ring-offset-2 ring-offset-background")}
        onKeyDown={(e) => {
          if (!live) return
          const cur = v ?? 0
          const next =
            e.key === "ArrowRight" || e.key === "ArrowUp"
              ? cur + step
              : e.key === "ArrowLeft" || e.key === "ArrowDown"
                ? cur - step
                : e.key === "Home"
                  ? step
                  : e.key === "End"
                    ? n
                    : null
          if (next == null) return
          e.preventDefault()
          set(next)
        }}
      >
        {Array.from({ length: n }, (_, k) => {
          const i = k + 1
          return (
            <button
              key={i}
              type="button"
              role="radio"
              data-star={i}
              aria-checked={v != null && Math.ceil(v) === i}
              aria-label={`${i} / ${n}`}
              tabIndex={state === "disabled" ? -1 : i === focusIdx ? 0 : -1}
              disabled={state === "disabled"}
              onClick={(e) => {
                if (!live) return
                const r = e.currentTarget.getBoundingClientRect()
                set(p.half && e.clientX && e.clientX < r.left + r.width / 2 ? i - 0.5 : i)
              }}
              className={cn(
                "rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                live ? "transition-transform hover:scale-110" : "cursor-default",
                state === "disabled" && "cursor-not-allowed",
              )}
            >
              <Star fill={fillFor(v, i)} muted={state === "disabled"} />
            </button>
          )
        })}
      </div>
      <ScaleEnds low={`1 · ${t(p.lowLabel)}`} high={`${n} · ${t(p.highLabel)}`} className="max-w-xs" />
      {(p.showValue || (live && v != null)) && (
        <div className="flex items-center gap-3">
          {p.showValue && (
            <span className={cn("text-xs", state === "disabled" ? "text-muted-foreground" : "font-medium text-foreground")}>
              {t(valueText(p, v))}
            </span>
          )}
          {live && v != null && (
            <Button variant="link" size="xs" className="h-auto px-0" onClick={() => set(null)}>
              {t(L("Clear", "Hapus nilai"))}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export const rating: ComponentDef<RatingProps, RatingValue> = {
  slug: "rating",
  wave: 2,
  ui: "RATING",
  vk: "number",
  group: "survey",
  week: 3,
  icon: StarIcon,
  label: L("Star rating", "Rating bintang"),
  title: L("Star rating", "Rating bintang"),
  blurb: L("Pick 1 to 5 stars, with labels for the low and high end.", "Pilih 1 sampai 5 bintang, dengan label untuk nilai terendah dan tertinggi."),

  defaults: () => ({
    label: L("How was the service?", "Bagaimana layanannya?"),
    name: "service_rating",
    max: 5,
    half: false,
    lowLabel: L("Very poor", "Sangat buruk"),
    highLabel: L("Excellent", "Sangat baik"),
    showValue: true,
    required: true,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(),
        F.key(),
        { t: "number", k: "max", label: L("Number of stars", "Jumlah bintang"), min: 3, max: 10 },
        { t: "switch", k: "half", label: L("Allow half stars", "Boleh setengah bintang"), hint: L("Click the left half of a star for x.5.", "Klik separuh kiri bintang untuk nilai x,5.") },
        { t: "i18n", k: "lowLabel", label: L("Label for the lowest score", "Label nilai terendah") },
        { t: "i18n", k: "highLabel", label: L("Label for the highest score", "Label nilai tertinggi") },
        { t: "switch", k: "showValue", label: L("Show the value as text", "Tampilkan nilai sebagai teks"), hint: L("e.g. “4 of 5” under the stars.", "mis. “4 dari 5” di bawah bintang.") },
      ],
    },
    { tab: "validation", fields: [F.required(L("An empty rating is saved as `null`, never `0`.", "Rating kosong disimpan sebagai `null`, bukan `0`."))] },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: RatingCanvas,

  Runtime: RatingRuntime,
  initial: () => null,
  sample: (p) => Math.min(4, maxN(p)),
  validate: (p, v) => (p.required && v == null ? [{ fid: "stars", msg: reqMsg(p.label) }] : []),
  value: (_, v) => v,

  spec: (p) => ({
    ui_type: "RATING",
    value_kind: "number",
    name: p.name,
    label: p.label,
    required: p.required,
    config: { max: maxN(p), allow_half: p.half, low_label: p.lowLabel, high_label: p.highLabel, show_value: p.showValue },
  }),
  savedAs: (p) =>
    L(
      `A number from 1 to ${maxN(p)}${p.half ? " in steps of 0.5" : ""} in \`${p.name}\`.`,
      `Angka 1 sampai ${maxN(p)}${p.half ? " dengan kelipatan 0,5" : ""} di \`${p.name}\`.`,
    ),
  notes: [
    L("The value is a number. An empty rating is `null`, never `0`, so averages in reports stay correct.", "Nilainya angka. Rating kosong adalah `null`, bukan `0`, agar rata-rata di laporan tetap benar."),
    L("The end labels are display only; they are not saved with the value.", "Label ujung hanya tampilan; tidak ikut disimpan bersama nilai."),
    L("Keyboard: arrow keys change the score, Home/End jump to the ends. Each star is announced as “4 / 5”.", "Keyboard: tombol panah mengubah nilai, Home/End lompat ke ujung. Setiap bintang dibacakan sebagai “4 / 5”."),
  ],
  story: {
    process: L("IT helpdesk", "Helpdesk TI"),
    step: L("Requester feedback", "Umpan balik pelapor"),
    ref: "HD-2026-1184",
    due: "2026-10-07",
    task: L("Rate how your ticket was handled", "Nilai penanganan tiket Anda"),
    after: [{ name: "comment", label: L("What could be better?", "Apa yang bisa lebih baik?"), type: "textarea", placeholder: L("Optional", "Opsional"), rows: 3 }],
  },
}
