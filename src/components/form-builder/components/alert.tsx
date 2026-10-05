/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useId } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  Alert02Icon,
  AlertCircleIcon,
  AlertDiamondIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  FilterIcon,
  InformationCircleIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { L, useT, type L10n } from "../i18n"
import { F } from "../lib"
import { Rich } from "../rich"
import type { ComponentDef, FieldState, RuntimeProps } from "../types"

/* Alert / callout — ui_type ALERT, value_kind "none". Story: the receipts rule on a business
   trip expense claim. The "Show when" condition reads a simulated process variable. */

type Tone = "info" | "success" | "warning" | "danger"
type Op = "equals" | "not_equals" | "empty" | "not_empty"

interface AlertProps {
  /** Name: builder identity only — users never see it. */
  label: L10n
  /** Key: identity of the node only — a callout sends no value. */
  name: string
  tone: Tone
  title: L10n
  body: L10n
  showIcon: boolean
  dismissible: boolean
  showWhen: boolean
  whenVariable: string
  whenOp: Op
  whenValue: string
}

/** Prototype only: the process variables this task opened with, and whether the user hid the callout. Never submitted. */
interface AlertValue {
  vars: Record<string, string>
  dismissed: boolean
}

/* ── mock process variables (set by earlier steps) ──────────────────────── */

interface ProcVar {
  v: string
  step: L10n
  value: string
  choices?: string[]
}

const VARS: ProcVar[] = [
  { v: "trip_type", step: L("Trip request", "Pengajuan perjalanan"), value: "domestic", choices: ["domestic", "international"] },
  { v: "destination_city", step: L("Trip request", "Pengajuan perjalanan"), value: "Surabaya" },
  { v: "total_claim", step: L("Receipt scan", "Pindai struk"), value: "1850000" },
  { v: "finance_note", step: L("Finance review (not reached yet)", "Review keuangan (belum sampai)"), value: "" },
]
const varOf = (k: string) => VARS.find((x) => x.v === k)

/* ── tones: theme tokens for info / danger, tinted emerald / amber for success / warning ── */

interface ToneStyle {
  icon: IconSvgElement
  label: L10n
  /** Box + icon colour (the icon inherits `currentColor`). */
  box: string
  title: string
  body: string
}

const TONES: Record<Tone, ToneStyle> = {
  info: {
    icon: InformationCircleIcon,
    label: L("Info", "Info"),
    box: "border-border bg-muted/40 text-primary dark:bg-muted/20",
    title: "text-foreground",
    body: "text-muted-foreground",
  },
  success: {
    icon: CheckmarkCircle02Icon,
    label: L("Success", "Berhasil"),
    box: "border-emerald-600/25 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/25 dark:text-emerald-400",
    title: "text-emerald-900 dark:text-emerald-200",
    body: "text-emerald-950/80 dark:text-emerald-100/80",
  },
  warning: {
    icon: Alert02Icon,
    label: L("Warning", "Peringatan"),
    box: "border-amber-600/30 bg-amber-500/10 text-amber-600 dark:border-amber-400/25 dark:text-amber-400",
    title: "text-amber-900 dark:text-amber-200",
    body: "text-amber-950/80 dark:text-amber-100/80",
  },
  danger: {
    icon: AlertDiamondIcon,
    label: L("Danger", "Bahaya"),
    box: "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/15",
    title: "text-destructive",
    body: "text-foreground/80",
  },
}
const TONE_KEYS = Object.keys(TONES) as Tone[]

const OPS: { v: Op; label: L10n }[] = [
  { v: "equals", label: L("equals", "sama dengan") },
  { v: "not_equals", label: L("does not equal", "tidak sama dengan") },
  { v: "empty", label: L("is empty", "kosong") },
  { v: "not_empty", label: L("is not empty", "tidak kosong") },
]

/* ── condition ──────────────────────────────────────────────────────────── */

const needsValue = (op: Op) => op === "equals" || op === "not_equals"

/** Values are compared as trimmed text, exactly. */
const TEST: Record<Op, (raw: string, want: string) => boolean> = {
  equals: (raw, want) => raw === want,
  not_equals: (raw, want) => raw !== want,
  empty: (raw) => raw === "",
  not_empty: (raw) => raw !== "",
}

const matches = (p: AlertProps, vars: Record<string, string>) => TEST[p.whenOp]((vars[p.whenVariable] ?? "").trim(), p.whenValue.trim())

/** "trip_type = international" — for the canvas badge and the simulation card. */
function condText(p: AlertProps): L10n {
  const k = p.whenVariable
  const val = p.whenValue.trim()
  if (p.whenOp === "equals") return L(`${k} = ${val}`)
  if (p.whenOp === "not_equals") return L(`${k} ≠ ${val}`)
  return p.whenOp === "empty" ? L(`${k} is empty`, `${k} kosong`) : L(`${k} is not empty`, `${k} tidak kosong`)
}

/** Why the runtime hides the callout (shown in the prototype only). */
function hiddenWhy(p: AlertProps): L10n {
  const k = `\`${p.whenVariable}\``
  const val = p.whenValue.trim()
  switch (p.whenOp) {
    case "equals":
      return L(`Hidden: ${k} is not ${val}`, `Tersembunyi: ${k} bukan ${val}`)
    case "not_equals":
      return L(`Hidden: ${k} is ${val}`, `Tersembunyi: ${k} bernilai ${val}`)
    case "empty":
      return L(`Hidden: ${k} is not empty`, `Tersembunyi: ${k} tidak kosong`)
    case "not_empty":
      return L(`Hidden: ${k} is empty`, `Tersembunyi: ${k} kosong`)
  }
}

const filled = (x: L10n) => Boolean(x.en.trim() || x.id.trim())

/* ── the callout ────────────────────────────────────────────────────────── */

/**
 * `live` = runtime: `role="note"` (a static callout must not interrupt like `role="alert"`)
 * and a real dismiss button. Otherwise a picture of it for the canvas.
 */
function Callout({ p, live, state = "active", onDismiss }: { p: AlertProps; live: boolean; state?: FieldState; onDismiss?: () => void }) {
  const t = useT()
  const tone = TONES[p.tone]
  const disabled = state === "disabled"
  const canDismiss = live && state === "active" && Boolean(onDismiss)
  return (
    <Alert
      role={live ? "note" : undefined}
      aria-disabled={(live && disabled) || undefined}
      className={cn(tone.box, "has-data-[slot=alert-action]:pr-11", disabled && "opacity-60 saturate-50")}
    >
      {p.showIcon && <HugeiconsIcon icon={tone.icon} />}
      {filled(p.title) && <AlertTitle className={cn("text-sm font-semibold", tone.title)}>{t(p.title)}</AlertTitle>}
      <AlertDescription className={cn("text-sm leading-relaxed whitespace-pre-line", tone.body)}>
        <Rich text={p.body} />
      </AlertDescription>
      {p.dismissible &&
        (canDismiss ? (
          <AlertAction className="top-2 right-2">
            <Button variant="ghost" size="icon-xs" aria-label={t(L("Hide this note", "Sembunyikan catatan ini"))} onClick={onDismiss} className="text-current hover:bg-foreground/5 hover:text-current">
              <HugeiconsIcon icon={Cancel01Icon} />
            </Button>
          </AlertAction>
        ) : (
          !live && (
            <AlertAction className="top-2 right-2">
              <span aria-hidden className="flex size-6 items-center justify-center">
                <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
              </span>
            </AlertAction>
          )
        ))}
    </Alert>
  )
}

function AlertCanvas({ props: p }: { props: AlertProps }) {
  const t = useT()
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Callout p={p} live={false} />
      {(p.showWhen || p.dismissible) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {p.showWhen && (
            <Badge variant="secondary" className="gap-1 font-mono text-[10px]">
              <HugeiconsIcon icon={FilterIcon} />
              {t(L(`Shown when ${condText(p).en}`, `Tampil jika ${condText(p).id}`))}
            </Badge>
          )}
          {p.dismissible && (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <HugeiconsIcon icon={Cancel01Icon} />
              {t(L("User can hide it", "User bisa menyembunyikan"))}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

function AlertRuntime({ props: p, value: v, onChange, state, id }: RuntimeProps<AlertProps, AlertValue>) {
  const t = useT()

  if (p.showWhen && !matches(p, v.vars)) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
        <HugeiconsIcon icon={ViewOffSlashIcon} className="size-3.5 shrink-0" />
        <Rich text={hiddenWhy(p)} />
        <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
          {t(L("Prototype only — users see nothing", "Hanya prototipe — user tidak melihat apa pun"))}
        </Badge>
      </p>
    )
  }

  if (v.dismissed) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
        <HugeiconsIcon icon={ViewOffSlashIcon} className="size-3.5 shrink-0" />
        <span>{t(L("You hid this note. It comes back next time the task opens.", "Anda menyembunyikan catatan ini. Catatan muncul lagi saat task dibuka berikutnya."))}</span>
        <Button id={`${id}-restore`} variant="link" size="xs" className="h-auto px-0" onClick={() => onChange({ ...v, dismissed: false })}>
          {t(L("Reopen the task", "Buka ulang task"))}
        </Button>
      </div>
    )
  }

  return (
    <Callout
      p={p}
      live
      state={state}
      onDismiss={() => {
        onChange({ ...v, dismissed: true })
        /* The X disappears with the callout: keep keyboard focus nearby. */
        requestAnimationFrame(() => document.getElementById(`${id}-restore`)?.focus())
      }}
    />
  )
}

/* ── simulation controls (beside the runtime form) ──────────────────────── */

function AlertControls({ props: p, value: v, onChange }: { props: AlertProps; value: AlertValue; onChange: (next: AlertValue) => void; state: FieldState }) {
  const t = useT()
  const id = useId()
  const cur = varOf(p.whenVariable)
  const val = v.vars[p.whenVariable] ?? ""
  const setVar = (x: string) => onChange({ ...v, vars: { ...v.vars, [p.whenVariable]: x } })
  const shown = matches(p, v.vars)
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {t(
          L(
            "Saved by earlier steps and read when the task opens — not the fields in this form. Change it to see the callout appear or hide.",
            "Disimpan langkah sebelumnya dan dibaca saat task dibuka — bukan field di form ini. Ubah untuk melihat callout muncul atau tersembunyi.",
          ),
        )}
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-var`} className="font-mono text-xs">
          {p.whenVariable}
        </Label>
        {cur?.choices ? (
          <Select value={val || "_none"} onValueChange={(x) => setVar(x === "_none" ? "" : x)}>
            <SelectTrigger id={`${id}-var`} size="sm" className="w-full font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none" className="text-xs">
                {t(L("(empty)", "(kosong)"))}
              </SelectItem>
              {cur.choices.map((c) => (
                <SelectItem key={c} value={c} className="font-mono text-xs">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input id={`${id}-var`} value={val} placeholder={t(L("(empty)", "(kosong)"))} onChange={(e) => setVar(e.target.value)} className="h-8 font-mono text-xs" />
        )}
        {cur && <p className="text-xs text-muted-foreground">{t(L(`Set by: ${cur.step.en}`, `Diisi oleh: ${cur.step.id}`))}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant={shown ? "default" : "outline"} className="text-[10px]">
          {t(shown ? L("Shown", "Tampil") : L("Hidden", "Tersembunyi"))}
        </Badge>
        <span className="font-mono text-muted-foreground">{t(condText(p))}</span>
      </div>
      <dl className="flex flex-col gap-1 border-t border-border pt-3 font-mono text-xs">
        {VARS.filter((x) => x.v !== p.whenVariable).map((x) => (
          <div key={x.v} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{x.v}</dt>
            <dd className="truncate text-foreground">{x.value || t(L("(empty)", "(kosong)"))}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/* ── definition ─────────────────────────────────────────────────────────── */

const initial = (): AlertValue => ({ vars: Object.fromEntries(VARS.map((x) => [x.v, x.value])), dismissed: false })

/** Body longer than ~3 lines in a form column. */
const isLong = (p: AlertProps) => p.body.en.trim().length > 240 || p.body.en.trim().split("\n").length > 3

export const alert: ComponentDef<AlertProps, AlertValue> = {
  slug: "alert",
  wave: 3,
  ui: "ALERT",
  vk: "none",
  group: "display",
  week: 5,
  icon: AlertCircleIcon,
  label: L("Alert / callout", "Peringatan / callout"),
  title: L("Alert / callout", "Peringatan / callout"),
  blurb: L("A coloured note for instructions or warnings, in English and Indonesian.", "Catatan berwarna untuk instruksi atau peringatan, dalam bahasa Inggris dan Indonesia."),
  bare: true,

  defaults: () => ({
    label: L("Original receipts rule", "Aturan bukti asli"),
    name: "receipts_callout",
    tone: "warning",
    title: L("Keep the original receipts", "Simpan bukti asli"),
    body: L(
      "Receipts above **Rp1.000.000** need the original paper copy, sent to Finance within **7 days**.",
      "Struk di atas **Rp1.000.000** wajib disertai bukti kertas asli, dikirim ke Keuangan paling lambat **7 hari**.",
    ),
    showIcon: true,
    dismissible: false,
    showWhen: false,
    whenVariable: "trip_type",
    whenOp: "equals",
    whenValue: "international",
  }),
  schema: (p) => {
    const cur = varOf(p.whenVariable)
    return [
      {
        tab: "general",
        fields: [
          F.name(L("Name", "Nama"), {
            hint: L("Identifies the callout in the builder. Users don’t see it.", "Menandai callout di builder. User tidak melihatnya."),
          }),
          F.key(L("Identity of the node; a callout sends no value.", "Identitas node; callout tidak mengirim nilai.")),
        ],
      },
      {
        tab: "general",
        title: L("Message", "Pesan"),
        fields: [
          {
            t: "seg",
            k: "tone",
            label: L("Tone", "Nada"),
            options: TONE_KEYS.map((k) => ({ v: k, label: TONES[k].label })),
            hint: L("**Danger** only for problems that block the task.", "**Bahaya** hanya untuk masalah yang menghalangi task."),
          },
          { t: "i18n", k: "title", label: L("Title", "Judul"), hint: L("Optional. One short line.", "Opsional. Satu baris pendek.") },
          {
            t: "i18n",
            k: "body",
            multi: true,
            rows: 3,
            label: L("Message", "Pesan"),
            hint: L(
              "Keep it to 2–3 lines. Supports **bold** (two asterisks) and `code` (backticks).",
              "Cukup 2–3 baris. Mendukung **tebal** (dua bintang) dan `code` (backtick).",
            ),
            validate: (v) => (!(v as L10n).en.trim() ? L("Write the message in English", "Tulis pesan dalam bahasa Inggris") : null),
          },
          {
            t: "note",
            tone: "warning",
            when: isLong,
            text: L(
              "Long callouts get skipped. Keep it to 2–3 lines and link to the full rules instead.",
              "Callout panjang cenderung dilewati. Cukup 2–3 baris dan tautkan ke aturan lengkapnya.",
            ),
          },
        ],
      },
      {
        tab: "general",
        title: L("Display", "Tampilan"),
        fields: [
          { t: "switch", k: "showIcon", label: L("Show icon", "Tampilkan ikon"), hint: L("The icon follows the tone.", "Ikon mengikuti nada.") },
          {
            t: "switch",
            k: "dismissible",
            label: L("User can hide it", "User bisa menyembunyikan"),
            hint: L(
              "User can hide it; it comes back next time the task opens — nothing is saved",
              "User bisa menyembunyikannya; muncul lagi saat task dibuka berikutnya — tidak ada yang disimpan",
            ),
          },
        ],
      },
      {
        tab: "logic",
        title: L("Show when", "Tampilkan jika"),
        fields: [
          {
            t: "switch",
            k: "showWhen",
            label: L("Show only when a process variable matches", "Tampilkan hanya jika variabel proses cocok"),
            hint: L("Off: the callout is always shown.", "Mati: callout selalu tampil."),
          },
          {
            t: "select",
            k: "whenVariable",
            label: L("Process variable", "Variabel proses"),
            when: (o) => o.showWhen,
            options: VARS.map((x) => ({
              v: x.v,
              label: L(`${x.v} — ${x.step.en}${x.value ? "" : " · empty"}`, `${x.v} — ${x.step.id}${x.value ? "" : " · kosong"}`),
            })),
            hint: L("Same variable picker as the other Logic settings.", "Pemilih variabel yang sama dengan pengaturan Logika lainnya."),
          },
          {
            t: "select",
            k: "whenOp",
            label: L("Condition", "Kondisi"),
            when: (o) => o.showWhen,
            options: OPS.map((o) => ({ v: o.v, label: o.label })),
          },
          {
            t: "text",
            k: "whenValue",
            label: L("Value", "Nilai"),
            mono: true,
            when: (o) => o.showWhen && needsValue(o.whenOp),
            hint: cur?.choices
              ? L(`Values of \`${cur.v}\`: ${cur.choices.map((c) => `\`${c}\``).join(", ")}.`, `Nilai \`${cur.v}\`: ${cur.choices.map((c) => `\`${c}\``).join(", ")}.`)
              : L("Compared as text, exactly.", "Dibandingkan sebagai teks, persis."),
            validate: (v, o) => (needsValue(o.whenOp) && !String(v ?? "").trim() ? L("Enter the value to compare", "Isi nilai pembanding") : null),
          },
        ],
      },
      {
        tab: "validation",
        fields: [
          {
            t: "note",
            text: L(
              "Display only — nothing to validate. Field errors belong under their own field, not in a callout.",
              "Hanya tampilan — tidak ada yang divalidasi. Pesan error milik field-nya sendiri, bukan callout.",
            ),
          },
        ],
      },
    ]
  },
  fieldLabel: (p) => p.label,
  isRequired: () => false,
  Canvas: AlertCanvas,
  canvasWarn: (p) =>
    !p.body.en.trim()
      ? L("Message is empty", "Pesan kosong")
      : !p.body.id.trim() || (p.title.en.trim() && !p.title.id.trim())
        ? L("Indonesian text missing", "Teks Indonesia kosong")
        : null,

  Runtime: AlertRuntime,
  Controls: AlertControls,
  hasControls: (p) => p.showWhen,
  controlsTitle: L("Process variable", "Variabel proses"),
  initial,
  sample: initial,
  validate: () => [],
  value: () => null,

  spec: (p) => ({
    ui_type: "ALERT",
    value_kind: "none",
    name: p.name,
    label: p.label,
    config: {
      tone: p.tone,
      title: filled(p.title) ? p.title : null,
      body: p.body,
      show_icon: p.showIcon,
      dismissible: p.dismissible,
      show_when: p.showWhen ? { variable: p.whenVariable, operator: p.whenOp, value: needsValue(p.whenOp) ? p.whenValue.trim() : null } : null,
    },
  }),
  savedAs: () => L("Nothing. The text lives in the form spec, and hiding the callout is not saved.", "Tidak ada. Teksnya ada di spec form, dan menyembunyikan callout tidak disimpan."),
  notes: [
    L(
      "Tones: **Info** for instructions, **Success** to confirm something went through, **Warning** for things to check before submitting, **Danger** only for problems that block the task.",
      "Nada: **Info** untuk instruksi, **Berhasil** untuk konfirmasi, **Peringatan** untuk hal yang perlu dicek sebelum submit, **Bahaya** hanya untuk masalah yang menghalangi task.",
    ),
    L(
      "Not a replacement for field validation messages: an error belongs under the field it is about, where it is announced with the field.",
      "Bukan pengganti pesan validasi field: error milik field yang bersangkutan, di bawahnya, dan dibacakan bersama field itu.",
    ),
    L(
      "Rendered with `role=\"note\"`, not `role=\"alert\"`: a static callout must not interrupt screen readers when the task opens.",
      "Dirender dengan `role=\"note\"`, bukan `role=\"alert\"`: callout statis tidak boleh menyela pembaca layar saat task dibuka.",
    ),
    L(
      "**Show when** uses the same process-variable picker as the other Logic settings. The value is read when the task opens and compared as text.",
      "**Tampilkan jika** memakai pemilih variabel proses yang sama dengan pengaturan Logika lainnya. Nilainya dibaca saat task dibuka dan dibandingkan sebagai teks.",
    ),
    L(
      "Dismissal is not saved: a hidden callout comes back the next time the task opens.",
      "Menyembunyikan tidak disimpan: callout yang disembunyikan muncul lagi saat task dibuka berikutnya.",
    ),
    L(
      "Keep the body short (2–3 lines). Only the mini markup is supported — **bold** (two asterisks) and `code` (backticks); no HTML or links.",
      "Isi tetap pendek (2–3 baris). Hanya markup mini yang didukung — **tebal** (dua bintang) dan `code` (backtick); tanpa HTML atau tautan.",
    ),
  ],
  story: {
    process: L("Business trip report", "Laporan perjalanan dinas"),
    step: L("Expense claim", "Klaim biaya"),
    ref: "PD-2026-0233",
    due: "2026-11-12",
    task: L("Submit expenses: Surabaya visit", "Kirim biaya: kunjungan Surabaya"),
    before: [
      {
        name: "trip_category",
        label: L("Trip type", "Jenis perjalanan"),
        type: "select",
        required: true,
        value: "",
        options: [
          { v: "domestic", label: L("Domestic", "Dalam negeri") },
          { v: "international", label: L("International", "Luar negeri") },
        ],
      },
    ],
    after: [
      { name: "total_expense", label: L("Total expenses", "Total biaya"), type: "number", prefix: "Rp", required: true, value: "", placeholder: L("0", "0") },
      {
        name: "expense_notes",
        label: L("Notes", "Catatan"),
        type: "textarea",
        rows: 3,
        value: "",
        placeholder: L("Optional — e.g. the taxi receipt for 14 Nov is lost", "Opsional — mis. struk taksi 14 Nov hilang"),
      },
    ],
  },
}
