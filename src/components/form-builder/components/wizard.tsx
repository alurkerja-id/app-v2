/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon, PencilEdit02Icon, Stairs01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { GhostInput } from "../field-shell"
import { L, useLang, useT, type L10n } from "../i18n"
import { F } from "../lib"
import type { ComponentDef, Issue, RuntimeProps } from "../types"
import { SectionsEditor } from "./container-editor"
import {
  allFields,
  containerIssues,
  entries,
  field,
  fieldFid,
  fillVals,
  issueCounts,
  section,
  sectionIssues,
  sectionsError,
  sectionsSpec,
  valsByKey,
  type Section,
  type Vals,
} from "./container-model"
import { IssueBadge, SectionFields } from "./container-ui"
import { display } from "./repeater-model"

/* Multi-step wizard ★ — ui_type WIZARD, value_kind "none" (container). Story: new employee onboarding.
   Each step is a child node with its own `children`; the fields inside are ordinary top-level
   variables (flat payload). The current step is UI state only — never saved. */

interface WizardProps {
  label: L10n
  name: string
  sections: Section[]
  validateOn: "next" | "submit"
  allowBack: boolean
  jumpToVisited: boolean
  progress: "steps" | "bar"
  summaryStep: boolean
  showLabel: boolean
}

interface WizardValue {
  vals: Vals
  /** Index of the open step; `sections.length` = the summary step. */
  step: number
  /** Furthest step reached. */
  reached: number
  /** Problems found by Next on the open step (cleared when the step is fine). */
  stepIssues: Issue[]
}

const NOUN = L("Step", "Langkah")

/** Index of the last screen: the summary when it is on, else the last step. */
const lastIndex = (p: WizardProps) => (p.summaryStep ? p.sections.length : p.sections.length - 1)

function WizardCanvas({ props: p }: { props: WizardProps }) {
  const t = useT()
  const first = p.sections[0]
  return (
    <div className="flex flex-col gap-3">
      {p.showLabel && <p className="text-sm font-medium">{t(p.label)}</p>}
      {p.progress === "steps" ? (
        <ol className="flex flex-wrap items-center gap-2">
          {p.sections.map((s, i) => (
            <li key={s.id} className="flex items-center gap-2 text-xs">
              <span className={cn("flex size-6 items-center justify-center rounded-full text-[11px] font-semibold", i === 0 ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
                {i + 1}
              </span>
              <span className={i === 0 ? "font-medium" : "text-muted-foreground"}>{t(s.label)}</span>
              {i < p.sections.length - 1 && <span className="h-px w-5 bg-border" />}
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">
            {t(L(`Step 1 of ${p.sections.length}`, `Langkah 1 dari ${p.sections.length}`))} · {t(first?.label)}
          </span>
          <Progress value={100 / p.sections.length} className="h-1.5" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {(first?.fields ?? []).slice(0, 4).map((f) => (
          <div key={f.id} className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground">
              {t(f.label)}
              {f.required && <span className="text-destructive"> *</span>}
            </span>
            <GhostInput select={f.kind === "dropdown"} />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{t(L("Back", "Kembali"))}</span>
        <span className="rounded-full bg-foreground px-3 py-1 text-xs text-background">{t(L("Next", "Lanjut"))}</span>
      </div>
    </div>
  )
}

function Summary({ p, v, onEdit, disabled }: { p: WizardProps; v: WizardValue; onEdit: (i: number) => void; disabled: boolean }) {
  const t = useT()
  const { lang } = useLang()
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {t(L("Check everything before you press Complete Task.", "Periksa semuanya sebelum menekan Complete Task."))}
      </p>
      {p.sections.map((s, i) => (
        <div key={s.id} className="rounded-2xl border border-border">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
            <p className="text-sm font-medium">
              {i + 1}. {t(s.label)}
            </p>
            <Button variant="ghost" size="xs" disabled={disabled} onClick={() => onEdit(i)}>
              <HugeiconsIcon icon={PencilEdit02Icon} />
              {t(L("Edit", "Ubah"))}
            </Button>
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 px-4 py-3 text-sm sm:grid-cols-2">
            {s.fields.map((f) => {
              const shown = display(f, v.vals[f.id], lang)
              return (
                <div key={f.id} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{t(f.label)}</dt>
                  <dd className={cn("truncate", !shown && "text-muted-foreground")}>
                    {shown || (f.required ? <span className="text-destructive">{t(L("Missing", "Belum diisi"))}</span> : "—")}
                  </dd>
                </div>
              )
            })}
          </dl>
        </div>
      ))}
    </div>
  )
}

function WizardRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<WizardProps, WizardValue>) {
  const t = useT()
  const panel = useRef<HTMLDivElement>(null)
  const last = lastIndex(p)
  const step = Math.min(v.step, last)
  const onSummary = p.summaryStep && step === p.sections.length
  const current = onSummary ? null : p.sections[step]
  const formIssues = issues.filter((i) => i.fid !== "wizard-steps")
  const counts = issueCounts(p.sections, formIssues)
  const total = formIssues.length
  const inert = state !== "active"

  /* First failed Complete Task: open the first step with problems. */
  const prev = useRef(0)
  useEffect(() => {
    if (prev.current === 0 && total > 0) {
      const first = counts.findIndex((n) => n > 0)
      if (first >= 0 && first !== step) onChange({ ...v, step: first, stepIssues: [] })
    }
    prev.current = total
    // Only the jump from "no problems" to "some problems" matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  const focusFirstProblem = () =>
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus())

  const go = (i: number) => {
    onChange({ ...v, step: i, reached: Math.max(v.reached, i), stepIssues: [] })
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus())
  }
  const next = () => {
    if (!current) return
    if (p.validateOn === "next") {
      const found = sectionIssues(current, v.vals)
      if (found.length) {
        onChange({ ...v, stepIssues: found })
        focusFirstProblem()
        return
      }
    }
    go(step + 1)
  }
  const setVal = (fid: string, x: string) => {
    const vals = { ...v.vals, [fid]: x }
    // Re-check the open step live once Next has complained, so messages clear while typing.
    const stepIssues = v.stepIssues.length && current ? sectionIssues(current, vals) : []
    onChange({ ...v, vals, stepIssues })
  }

  /* Messages for the open step: from Next, or from a failed Complete Task. */
  const shown = current ? [...v.stepIssues, ...formIssues.filter((i) => current.fields.some((f) => fieldFid(f) === i.fid))] : []
  const uniq = shown.filter((i, k) => shown.findIndex((x) => x.fid === i.fid && x.msg.en === i.msg.en) === k)
  const stepsMsg = issues.find((i) => i.fid === "wizard-steps")
  const screens = p.sections.length + (p.summaryStep ? 1 : 0)
  const titleOf = (i: number) => (i === p.sections.length ? L("Review", "Tinjau") : p.sections[i].label)

  return (
    <div className="flex flex-col gap-4" role="group" aria-labelledby={`${id}-name`}>
      {/* The group's name: visible with "Show the name", otherwise only for screen readers. */}
      <p id={`${id}-name`} className={p.showLabel ? "text-sm font-medium" : "sr-only"}>
        {t(p.label)}
      </p>

      {p.progress === "steps" && !compact ? (
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label={t(L("Steps", "Langkah"))}>
          {Array.from({ length: screens }, (_, i) => {
            const done = i < step || (i <= v.reached && i !== step && i < p.sections.length && !counts[i])
            const can = !inert && p.jumpToVisited && i <= v.reached && i !== step && (p.allowBack || i > step)
            return (
              <li key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!can}
                  aria-current={i === step ? "step" : undefined}
                  onClick={() => go(i)}
                  className={cn(
                    "flex items-center gap-2 rounded-full py-1 pr-2.5 pl-1 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                    can && "hover:bg-muted",
                    !can && "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                      i === step ? "bg-foreground text-background" : done ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done && i !== step ? <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> : i + 1}
                  </span>
                  <span className={i === step ? "font-medium text-foreground" : "text-muted-foreground"}>{t(titleOf(i))}</span>
                  {i < p.sections.length && <IssueBadge n={counts[i]} />}
                </button>
                {i < screens - 1 && <span className="h-px w-4 bg-border" aria-hidden />}
              </li>
            )
          })}
        </ol>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">
              {t(L(`Step ${step + 1} of ${screens}`, `Langkah ${step + 1} dari ${screens}`))} ·{" "}
              <span className="font-medium text-foreground">{t(titleOf(step))}</span>
            </span>
            {total > 0 && <IssueBadge n={total} />}
          </div>
          <Progress value={((step + 1) / screens) * 100} className="h-1.5" aria-label={t(L("Progress", "Progres"))} />
        </div>
      )}

      <div ref={panel} className="flex flex-col gap-4" id={`${id}-input`} tabIndex={-1}>
        {current?.description && (current.description.en || current.description.id) && <p className="text-sm text-muted-foreground">{t(current.description)}</p>}
        {current ? (
          <SectionFields section={current} vals={v.vals} onVal={setVal} state={state} issues={uniq} compact={compact} idPrefix={`${id}-${current.id}`} />
        ) : (
          <Summary p={p} v={v} disabled={inert} onEdit={(i) => go(i)} />
        )}
      </div>

      {stepsMsg && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {t(stepsMsg.msg)}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <Button variant="outline" size="sm" disabled={inert || step === 0 || !p.allowBack} onClick={() => go(step - 1)}>
          <HugeiconsIcon icon={ArrowLeft01Icon} />
          {t(L("Back", "Kembali"))}
        </Button>
        {step < last ? (
          <Button size="sm" disabled={inert} onClick={next}>
            {t(L("Next", "Lanjut"))}
            <HugeiconsIcon icon={ArrowRight01Icon} />
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">{t(L("Last step — press Complete Task to send.", "Langkah terakhir — tekan Complete Task untuk mengirim."))}</span>
        )}
      </div>
    </div>
  )
}

function validate(p: WizardProps, v: WizardValue): Issue[] {
  const out = containerIssues(p.sections, v.vals)
  const last = lastIndex(p)
  if (v.step < last)
    out.push({
      fid: "wizard-steps",
      msg: L(
        `Go through every step before completing (you are on step ${v.step + 1} of ${last + 1})`,
        `Lalui semua langkah sebelum menyelesaikan (sekarang di langkah ${v.step + 1} dari ${last + 1})`,
      ),
    })
  return out
}

const STORY: Record<string, string> = {
  full_name: "Rizky Pratama",
  birth_date: "1998-03-14",
  department: "product",
  start_date: "2026-11-16",
}

export const wizard: ComponentDef<WizardProps, WizardValue> = {
  slug: "wizard",
  wave: 3,
  ui: "WIZARD",
  vk: "none",
  star: true,
  group: "layout",
  week: 5,
  icon: Stairs01Icon,
  label: L("Multi-step wizard", "Wizard bertahap"),
  title: L("Multi-step wizard", "Wizard bertahap"),
  blurb: L("One step at a time with Back / Next; each step is checked before moving on.", "Satu langkah per layar dengan Kembali / Lanjut; setiap langkah dicek sebelum lanjut."),

  defaults: () => ({
    label: L("New employee data", "Data karyawan baru"),
    name: "onboarding_wizard",
    sections: [
      section(
        "Personal data",
        "Data pribadi",
        [
          field("text", "full_name", "Full name", "Nama lengkap", { required: true }),
          field("date", "birth_date", "Date of birth", "Tanggal lahir", { required: true }),
          field("text", "nik", "NIK", "NIK", { required: true, placeholder: L("16 digits", "16 digit") }),
        ],
        L("As written on the ID card.", "Sesuai KTP."),
      ),
      section(
        "Employment",
        "Kepegawaian",
        [
          field("dropdown", "department", "Department", "Departemen", {
            required: true,
            options: [
              { v: "product", label: L("Product", "Produk") },
              { v: "finance", label: L("Finance", "Keuangan") },
              { v: "operations", label: L("Operations", "Operasional") },
            ],
          }),
          field("text", "position", "Position", "Jabatan", { required: true }),
          field("date", "start_date", "Start date", "Tanggal mulai", { required: true }),
        ],
        L("Filled in with your manager.", "Diisi bersama atasan."),
      ),
      section(
        "Equipment",
        "Perlengkapan",
        [
          field("dropdown", "laptop", "Laptop", "Laptop", {
            required: true,
            options: [
              { v: "macbook_air", label: L("MacBook Air 13", "MacBook Air 13") },
              { v: "thinkpad_t14", label: L("ThinkPad T14", "ThinkPad T14") },
            ],
          }),
          field("textarea", "equipment_note", "Other needs", "Kebutuhan lain"),
        ],
        L("IT prepares these before your first day.", "Tim TI menyiapkannya sebelum hari pertama."),
      ),
    ],
    validateOn: "next",
    allowBack: true,
    jumpToVisited: true,
    progress: "steps",
    summaryStep: true,
    showLabel: false,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(L("Name", "Nama"), { hint: L("Identifies the wizard in the builder; shown to the user only when “Show the name” is on.", "Identitas wizard di builder; tampil ke user hanya bila “Tampilkan nama” aktif.") }),
        F.key(L("Identity of the node. The fields inside keep their own keys.", "Identitas node. Field di dalamnya tetap memakai key masing-masing.")),
        {
          t: "custom",
          id: "sections",
          label: L("Steps", "Langkah"),
          render: (ctx) => (
            <SectionsEditor
              ctx={ctx}
              o={{
                noun: NOUN,
                min: 2,
                max: 8,
                withDescription: true,
                requiredHint: L("Checked when the user presses Next on this step, and again on Complete Task.", "Dicek saat user menekan Lanjut di langkah ini, dan lagi saat Complete Task."),
              }}
            />
          ),
          validate: (_v, x) => sectionsError(x.sections, NOUN, 2),
        },
        {
          t: "seg",
          k: "progress",
          label: L("Progress", "Progres"),
          options: [
            { v: "steps", label: L("Numbered steps", "Langkah bernomor") },
            { v: "bar", label: L("Progress bar", "Bilah progres") },
          ],
          hint: L("Phones always show the progress bar.", "Ponsel selalu menampilkan bilah progres."),
        },
        {
          t: "switch",
          k: "summaryStep",
          label: L("Review step at the end", "Langkah tinjauan di akhir"),
          hint: L("Lists every answer with an Edit link before Complete Task.", "Menampilkan semua jawaban dengan tautan Ubah sebelum Complete Task."),
        },
        { t: "switch", k: "allowBack", label: L("Allow going back", "Boleh kembali") },
        {
          t: "switch",
          k: "jumpToVisited",
          label: L("Jump to visited steps", "Lompat ke langkah yang sudah dilewati"),
          hint: L("Click a step in the step list to open it again.", "Klik langkah di daftar langkah untuk membukanya lagi."),
        },
        { t: "switch", k: "showLabel", label: L("Show the name above the steps", "Tampilkan nama di atas langkah") },
      ],
    },
    {
      tab: "validation",
      fields: [
        {
          t: "seg",
          k: "validateOn",
          label: L("Check each step", "Cek tiap langkah"),
          options: [
            { v: "next", label: L("On Next", "Saat Lanjut") },
            { v: "submit", label: L("Only on Complete Task", "Hanya saat Complete Task") },
          ],
          hint: L(
            "Either way, Complete Task checks every step again and works only on the last screen. See Wave 3 open decisions 1 and 3.",
            "Apa pun pilihannya, Complete Task mengecek semua langkah lagi dan hanya berlaku di layar terakhir. Lihat keputusan terbuka Gelombang 3 no. 1 dan 3.",
          ),
        },
        {
          t: "note",
          text: L("Required is set per field (open a step above).", "Wajib diatur per field (buka langkah di atas)."),
        },
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: () => false,
  bare: true,
  Canvas: WizardCanvas,
  canvasWarn: (p) => (sectionsError(p.sections, NOUN, 2) ? L("Check the steps", "Periksa langkah") : null),

  Runtime: WizardRuntime,
  initial: (p) => ({ vals: valsByKey(p.sections, STORY), step: 0, reached: 0, stepIssues: [] }),
  sample: (p) => ({
    vals: fillVals(p.sections, { ...STORY, nik: "3578011403980002", position: "Product designer", laptop: "macbook_air" }),
    step: 0,
    reached: lastIndex(p),
    stepIssues: [],
  }),
  validate,
  value: () => undefined,
  payloadEntries: (p, v) => entries(p.sections, v.vals),

  spec: (p) => ({
    ui_type: "WIZARD",
    value_kind: "none",
    name: p.name,
    label: p.label,
    config: {
      progress: p.progress,
      summary_step: p.summaryStep,
      allow_back: p.allowBack,
      jump_to_visited: p.jumpToVisited,
      validate_on: p.validateOn,
      complete_on_last_step: true,
      show_label: p.showLabel,
    },
    children: sectionsSpec(p.sections, "WIZARD_STEP"),
  }),
  savedAs: (p) =>
    L(
      `Nothing under \`${p.name}\` itself: each field keeps its own key (${allFields(p.sections).slice(0, 3).map((f) => `\`${f.name}\``).join(", ")}…). The current step is not saved.`,
      `Tidak ada nilai di \`${p.name}\` sendiri: setiap field memakai key masing-masing (${allFields(p.sections).slice(0, 3).map((f) => `\`${f.name}\``).join(", ")}…). Langkah yang sedang dibuka tidak disimpan.`,
    ),
  notes: [
    L(
      "★ Same container shape as Tabs: each step is a child node with its own `children`; the payload stays flat.",
      "★ Bentuk container sama dengan Tab: setiap langkah adalah node anak dengan `children` sendiri; payload tetap flat.",
    ),
    L(
      "Next checks only the open step (when “Check each step” = On Next). Complete Task checks every step again — values can change after going back.",
      "Lanjut hanya mengecek langkah yang terbuka (bila “Cek tiap langkah” = Saat Lanjut). Complete Task mengecek semua langkah lagi — nilai bisa berubah setelah kembali.",
    ),
    L(
      "Complete Task works only on the last screen (Wave 3 open decision 3). Before that it answers “Go through every step before completing”.",
      "Complete Task hanya berlaku di layar terakhir (keputusan terbuka Gelombang 3 no. 3). Sebelum itu muncul pesan “Lalui semua langkah sebelum menyelesaikan”.",
    ),
    L(
      "The open step and the furthest step reached are UI state: a draft reopens at step 1 with every value kept.",
      "Langkah yang terbuka dan langkah terjauh hanya state tampilan: draf dibuka lagi di langkah 1 dengan semua nilai tetap ada.",
    ),
    L("Phones show “Step 2 of 4” with a progress bar instead of the numbered list.", "Ponsel menampilkan “Langkah 2 dari 4” dengan bilah progres, bukan daftar bernomor."),
  ],
  story: {
    process: L("Employee onboarding", "Onboarding karyawan"),
    step: L("New employee data", "Data karyawan baru"),
    ref: "ONB-2026-0061",
    due: "2026-11-13",
    task: L("Onboarding: Rizky Pratama", "Onboarding: Rizky Pratama"),
  },
}
