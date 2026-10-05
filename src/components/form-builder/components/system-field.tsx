/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useId } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, InformationSquareIcon, ServerStack01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { L, tr, useLang, useT, type L10n, type Lang } from "../i18n"
import { F } from "../lib"
import type { ComponentDef, FieldState, RuntimeProps } from "../types"

/* System field — ui_type SYSTEM_FIELD, value_kind "none". Story: budget approval.
   Read-only values the engine already knows about the task and its process (request number,
   requester, dates…). The host resolves them when the form renders; the user never types them
   and they are never in the payload, the draft or history (Wave 4 open decision 8). */

type SysKey = "business_key" | "process_name" | "task_name" | "initiator" | "initiator_department" | "started_at" | "due_at" | "assignee"
type DateFormat = "date" | "date_time" | "relative"
type Layout = "inline" | "grid"

interface SystemFieldProps {
  label: L10n
  name: string
  /** Which values, 1–6; shown in the order of SYS_KEYS. */
  fields: SysKey[]
  dateFormat: DateFormat
  layout: Layout
  /** Copy button on the request number. */
  showCopy: boolean
  showLabel: boolean
}

type TaskId = "bud175" | "bud181"

/** Prototype context the values are read from. Not a field value: nothing is saved. */
interface SystemContext {
  task: TaskId
  /** Simulate a step without a due date. */
  noDue: boolean
}

/* ── what the host knows (mock) ─────────────────────────────────────────── */

const SYS: Record<SysKey, { label: L10n; date?: boolean; missing: L10n }> = {
  business_key: { label: L("Request number", "Nomor permintaan"), missing: L("Not numbered yet", "Belum diberi nomor") },
  process_name: { label: L("Process", "Proses"), missing: L("Not available", "Tidak tersedia") },
  task_name: { label: L("Step", "Langkah"), missing: L("Not available", "Tidak tersedia") },
  initiator: { label: L("Requester", "Pemohon"), missing: L("Started by the system", "Dimulai oleh sistem") },
  initiator_department: { label: L("Requester's department", "Departemen pemohon"), missing: L("No department on the profile", "Profil tanpa departemen") },
  started_at: { label: L("Submitted at", "Diajukan pada"), date: true, missing: L("Not submitted yet", "Belum diajukan") },
  due_at: { label: L("Due date", "Tenggat"), date: true, missing: L("This step has no due date", "Langkah ini tidak punya tenggat") },
  assignee: { label: L("Assignee", "Penerima tugas"), missing: L("Not claimed yet", "Belum diklaim") },
}
const SYS_KEYS = Object.keys(SYS) as SysKey[]

interface MockTask {
  business_key: string
  process_name: L10n
  task_name: L10n
  initiator: string
  initiator_department: L10n
  started_at: string
  due_at: string
  assignee: string
}

const PROCESS = L("Budget approval", "Persetujuan anggaran")
const STEP = L("Manager approval", "Persetujuan manajer")

const TASKS: Record<TaskId, MockTask> = {
  bud175: {
    business_key: "BUD-2026-0175",
    process_name: PROCESS,
    task_name: STEP,
    initiator: "Rizky Pratama",
    initiator_department: L("Marketing", "Pemasaran"),
    started_at: "2026-11-10T09:24:00+07:00",
    due_at: "2026-11-14T17:00:00+07:00",
    assignee: "Dewi Kartika",
  },
  bud181: {
    business_key: "BUD-2026-0181",
    process_name: PROCESS,
    task_name: STEP,
    initiator: "Rina Wulandari",
    initiator_department: L("Operations", "Operasional"),
    started_at: "2026-11-12T08:15:00+07:00",
    due_at: "2026-11-19T17:00:00+07:00",
    assignee: "Budi Santoso",
  },
}
const TASK_IDS = Object.keys(TASKS) as TaskId[]

/** When the prototype's form is opened; “relative” counts from here. */
const OPENED_AT = "2026-11-12T10:00:00+07:00"

/** Raw value as the host hands it over (ISO for dates), or null when there is none. */
function raw(key: SysKey, ctx: SystemContext): string | L10n | null {
  const task = TASKS[ctx.task]
  if (key === "due_at" && ctx.noDue) return null
  return task[key]
}

/* ── formatting (always WIB, whatever the browser's zone) ───────────────── */

const TZ = "Asia/Jakarta"
const DAY = 86_400_000
const WIB_OFFSET = 7 * 3_600_000
const locale = (lang: Lang) => (lang === "id" ? "id-ID" : "en-GB")

const fmtDate = (iso: string, lang: Lang) => new Intl.DateTimeFormat(locale(lang), { day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(new Date(iso))

const fmtDateTime = (iso: string, lang: Lang) =>
  `${new Intl.DateTimeFormat(locale(lang), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ }).format(new Date(iso))} WIB`

/** “2 days ago”, “in 7 hours”, “tomorrow”: whole calendar days in WIB, hours within the same day. */
function fmtRelative(iso: string, lang: Lang) {
  const at = Date.parse(iso)
  const now = Date.parse(OPENED_AT)
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: "auto" })
  const days = Math.floor((at + WIB_OFFSET) / DAY) - Math.floor((now + WIB_OFFSET) / DAY)
  if (days !== 0) return rtf.format(days, "day")
  const mins = Math.round((at - now) / 60_000)
  return Math.abs(mins) < 60 ? rtf.format(mins, "minute") : rtf.format(Math.round(mins / 60), "hour")
}

interface Shown {
  key: SysKey
  label: L10n
  /** Main text, or null for a missing value. */
  text: string | null
  /** Exact date beside a relative one. */
  sub?: string
  iso?: string
}

function shownValues(p: SystemFieldProps, ctx: SystemContext, lang: Lang): Shown[] {
  return SYS_KEYS.filter((k) => p.fields.includes(k)).map((key) => {
    const v = raw(key, ctx)
    const label = SYS[key].label
    if (v == null) return { key, label, text: null }
    if (typeof v !== "string") return { key, label, text: tr(lang, v) }
    if (!SYS[key].date) return { key, label, text: v }
    if (p.dateFormat === "date") return { key, label, text: fmtDate(v, lang), iso: v }
    if (p.dateFormat === "date_time") return { key, label, text: fmtDateTime(v, lang), iso: v }
    return { key, label, text: fmtRelative(v, lang), sub: fmtDate(v, lang), iso: v }
  })
}

/* ── the view (canvas and runtime) ──────────────────────────────────────── */

function SystemView({
  p,
  ctx,
  state,
  compact,
  id,
  live,
}: {
  p: SystemFieldProps
  ctx: SystemContext
  state: FieldState
  compact: boolean
  id: string
  /** Runtime: real copy button. Canvas: a static picture of it. */
  live: boolean
}) {
  const t = useT()
  const { lang } = useLang()
  const rows = shownValues(p, ctx, lang)
  const off = state === "disabled"

  const copy = (text: string) => {
    const done = () => toast.success(t(L(`Request number ${text} copied`, `Nomor permintaan ${text} disalin`)))
    const fail = () => toast.error(t(L("Couldn't copy. Select the number and copy it by hand.", "Gagal menyalin. Pilih nomornya lalu salin manual.")))
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, fail)
    else fail()
  }

  const valueOf = (r: Shown) => {
    if (r.text == null)
      return (
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
          <span aria-hidden>—</span>
          <span className="sr-only">{t(L("Empty", "Kosong"))}:</span>
          <span className="text-xs font-normal text-muted-foreground">{t(SYS[r.key].missing)}</span>
        </span>
      )
    const copyBtn =
      r.key === "business_key" && p.showCopy ? (
        live ? (
          <Button
            variant="ghost"
            size="icon-xs"
            id={`${id}-input`}
            disabled={off}
            aria-label={t(L(`Copy request number ${r.text}`, `Salin nomor permintaan ${r.text}`))}
            onClick={() => copy(r.text ?? "")}
            className="-my-1 text-muted-foreground"
          >
            <HugeiconsIcon icon={Copy01Icon} />
          </Button>
        ) : (
          <HugeiconsIcon icon={Copy01Icon} className="size-3 shrink-0 text-muted-foreground" />
        )
      ) : null
    return (
      <span className="flex min-w-0 flex-wrap items-center gap-x-1.5">
        {r.iso ? (
          <time dateTime={r.iso} className="[overflow-wrap:anywhere]">
            {r.text}
          </time>
        ) : (
          <span className={cn("[overflow-wrap:anywhere]", r.key === "business_key" && "font-mono text-[13px]")}>{r.text}</span>
        )}
        {r.sub && <span className="text-xs font-normal text-muted-foreground">· {r.sub}</span>}
        {copyBtn}
      </span>
    )
  }

  return (
    <div
      role="group"
      aria-labelledby={`${id}-name`}
      aria-describedby={`${id}-sys`}
      className={cn("flex min-w-0 flex-col gap-2.5", off && "opacity-60 select-none")}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p id={`${id}-name`} className={p.showLabel ? "min-w-0 text-sm font-medium" : "sr-only"}>
          {t(p.label)}
        </p>
        <Badge variant="secondary" className="gap-1 text-[10px]" aria-hidden>
          <HugeiconsIcon icon={ServerStack01Icon} />
          {t(L("System", "Sistem"))}
        </Badge>
        <span id={`${id}-sys`} className="sr-only">
          {t(L("Filled in by the system from the task. Not editable.", "Diisi sistem dari task. Tidak bisa diubah."))}
        </span>
      </div>

      {p.layout === "inline" ? (
        <dl className="flex flex-col gap-1.5 text-sm">
          {rows.map((r) => (
            <div key={r.key} className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <dt className="text-muted-foreground">{t(r.label)}:</dt>
              <dd className="min-w-0 font-medium">{valueOf(r)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <dl className={cn("grid gap-2.5", compact ? "grid-cols-1" : "grid-cols-2")}>
          {rows.map((r) => (
            <div key={r.key} className="flex min-w-0 flex-col gap-0.5 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 dark:bg-muted/20">
              <dt className="text-xs text-muted-foreground">{t(r.label)}</dt>
              <dd className="min-h-6 min-w-0 text-sm font-medium">{valueOf(r)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

const CANVAS_CTX: SystemContext = { task: "bud175", noDue: false }

function SystemCanvas({ props: p }: { props: SystemFieldProps }) {
  const id = useId().replace(/:/g, "")
  return <SystemView p={p} ctx={CANVAS_CTX} state="active" compact={false} id={id} live={false} />
}

function SystemRuntime({ props: p, value: ctx, state, compact, id }: RuntimeProps<SystemFieldProps, SystemContext>) {
  return <SystemView p={p} ctx={ctx} state={state} compact={compact} id={id} live />
}

/* ── simulation and context card ────────────────────────────────────────── */

function SystemControls({ value: ctx, onChange }: { props: SystemFieldProps; value: SystemContext; onChange: (next: SystemContext) => void }) {
  const t = useT()
  const { lang } = useLang()
  const id = useId()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span id={`${id}-task`} className="text-xs font-semibold text-foreground">
          {t(L("Open task", "Task yang dibuka"))}
        </span>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={1}
          value={ctx.task}
          aria-labelledby={`${id}-task`}
          onValueChange={(x) => {
            const k = TASK_IDS.find((v) => v === x)
            if (k) onChange({ ...ctx, task: k })
          }}
          className="w-full flex-col items-stretch"
        >
          {TASK_IDS.map((k) => (
            <ToggleGroupItem key={k} value={k} className="h-auto justify-start px-3 py-1.5 text-left text-xs">
              <span className="font-mono">{TASKS[k].business_key}</span> · {TASKS[k].initiator} · {t(TASKS[k].initiator_department)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <Separator />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor={`${id}-nodue`} className="text-xs font-semibold">
            {t(L("Step without a due date", "Langkah tanpa tenggat"))}
          </Label>
          <p className="text-xs text-muted-foreground">{t(L("The due date shows “—” with a reason.", "Tenggat tampil “—” beserta alasannya."))}</p>
        </div>
        <Switch id={`${id}-nodue`} checked={ctx.noDue} onCheckedChange={(c) => onChange({ ...ctx, noDue: c })} />
      </div>
      <p className="text-xs text-muted-foreground">
        {t(L("Form opened at", "Form dibuka pada"))} {fmtDateTime(OPENED_AT, lang)} · {t(L("“Relative” counts from here.", "“Relatif” dihitung dari sini."))}
      </p>
    </div>
  )
}

/** What the host hands over for this task: every allowed value, raw, and which ones the field shows. */
function SystemAside({ props: p, value: ctx }: { props: SystemFieldProps; value: SystemContext }) {
  const t = useT()
  return (
    <Card className="gap-3 p-4">
      <div>
        <p className="text-xs font-semibold">{t(L("Task metadata", "Metadata task"))}</p>
        <p className="text-xs text-muted-foreground">{t(L("Resolved by the host when the form renders", "Diambil host saat form dirender"))}</p>
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs">
        {SYS_KEYS.map((k) => {
          const v = raw(k, ctx)
          const used = p.fields.includes(k)
          return (
            <div key={k} className="contents">
              <dt className={cn("font-mono", used ? "text-foreground" : "text-muted-foreground")}>{k}</dt>
              <dd className="flex min-w-0 items-start justify-between gap-2">
                <span className="min-w-0 font-mono text-muted-foreground [overflow-wrap:anywhere]">{v == null ? "null" : typeof v === "string" ? v : t(v)}</span>
                {used && (
                  <Badge variant="outline" className="text-[10px]">
                    {t(L("shown", "tampil"))}
                  </Badge>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <HugeiconsIcon icon={InformationSquareIcon} className="mt-px size-3.5 shrink-0" />
        {t(
          L(
            "Requester email and phone are not offered (personal data). Wave 4 open decision 8.",
            "Email dan telepon pemohon tidak ditawarkan (data pribadi). Keputusan terbuka Gelombang 4 no. 8.",
          ),
        )}
      </p>
    </Card>
  )
}

/* ── definition ─────────────────────────────────────────────────────────── */

const hasDate = (p: SystemFieldProps) => p.fields.includes("started_at") || p.fields.includes("due_at")

export const systemField: ComponentDef<SystemFieldProps, SystemContext> = {
  slug: "system-field",
  wave: 4,
  ui: "SYSTEM_FIELD",
  vk: "none",
  group: "data",
  week: 6,
  icon: InformationSquareIcon,
  label: L("System field", "Field sistem"),
  title: L("System field", "Field sistem"),
  blurb: L("Read-only values from the task: request number, requester, dates.", "Nilai read-only dari task: nomor permintaan, pemohon, tanggal."),

  defaults: () => ({
    label: L("Request details", "Detail permintaan"),
    name: "request_info",
    fields: ["business_key", "initiator", "initiator_department", "started_at", "due_at", "assignee"],
    dateFormat: "date_time",
    layout: "grid",
    showCopy: true,
    showLabel: true,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(L("Heading", "Judul"), {
          hint: L("Shown above the values when “Show the heading” is on.", "Tampil di atas nilai bila “Tampilkan judul” aktif."),
        }),
        F.key(L("Identity of the node. Nothing is saved under it.", "Identitas node. Tidak ada nilai yang disimpan di key ini.")),
        {
          t: "chips",
          k: "fields",
          label: L("Values to show", "Nilai yang ditampilkan"),
          options: SYS_KEYS.map((k) => ({ v: k, label: SYS[k].label })),
          hint: L(
            "1–6 values, always in this order. Requester email and phone are not offered (Wave 4 open decision 8).",
            "1–6 nilai, selalu dengan urutan ini. Email dan telepon pemohon tidak ditawarkan (keputusan terbuka Gelombang 4 no. 8).",
          ),
          validate: (v) => {
            const n = Array.isArray(v) ? v.length : 0
            return n === 0 ? L("Pick at least one value", "Pilih minimal satu nilai") : n > 6 ? L(`Pick up to 6 values (now ${n})`, `Pilih maksimal 6 nilai (sekarang ${n})`) : null
          },
        },
        {
          t: "seg",
          k: "dateFormat",
          label: L("Dates", "Format tanggal"),
          when: hasDate,
          options: [
            { v: "date", label: L("Date", "Tanggal") },
            { v: "date_time", label: L("Date and time", "Tanggal dan jam") },
            { v: "relative", label: L("Relative", "Relatif") },
          ],
          hint: L(
            "Times are WIB. Relative counts from when the form opens (“in 2 days”) and keeps the date beside it.",
            "Jam dalam WIB. Relatif dihitung dari saat form dibuka (“dalam 2 hari”) dan tanggalnya tetap tampil di sampingnya.",
          ),
        },
        {
          t: "seg",
          k: "layout",
          label: L("Layout", "Tata letak"),
          options: [
            { v: "inline", label: L("One per line", "Satu per baris") },
            { v: "grid", label: L("Grid of boxes", "Kotak 2 kolom") },
          ],
          hint: L("Grid: two columns on desktop, one on phones.", "Kotak: dua kolom di desktop, satu kolom di ponsel."),
        },
        {
          t: "switch",
          k: "showCopy",
          label: L("Copy button on the request number", "Tombol salin di nomor permintaan"),
          when: (p) => p.fields.includes("business_key"),
        },
        { t: "switch", k: "showLabel", label: L("Show the heading", "Tampilkan judul") },
      ],
    },
    {
      tab: "validation",
      fields: [
        {
          t: "note",
          text: L(
            "Nothing to check: the user can't change these values and they are **not sent** on Complete Task.",
            "Tidak ada yang dicek: user tidak bisa mengubah nilai ini dan nilainya **tidak dikirim** saat Complete Task.",
          ),
        },
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: () => false,
  bare: true,
  devices: true,
  Canvas: SystemCanvas,

  Runtime: SystemRuntime,
  Controls: SystemControls,
  controlsTitle: L("Task", "Task"),
  Aside: SystemAside,
  initial: () => ({ task: "bud175", noDue: false }),
  sample: () => ({ task: "bud181", noDue: false }),
  validate: () => [],
  value: () => undefined,

  spec: (p) => ({
    ui_type: "SYSTEM_FIELD",
    value_kind: "none",
    name: p.name,
    label: p.label,
    config: {
      fields: SYS_KEYS.filter((k) => p.fields.includes(k)),
      date_format: p.dateFormat,
      layout: p.layout,
      show_copy: p.showCopy,
      show_label: p.showLabel,
    },
  }),
  savedAs: (p) =>
    L(
      `Nothing: \`${p.name}\` is only the node's identity. The values are read from the task and its process each time the form renders, and are not in the payload, the draft or history.`,
      `Tidak ada: \`${p.name}\` hanya identitas node. Nilainya dibaca dari task dan prosesnya setiap kali form dirender, dan tidak masuk payload, draf, maupun history.`,
    ),
  notes: [
    L(
      "Resolved by the host at render time from task / process metadata (`business_key`, process and task name, initiator and their department, start time, due date, assignee). The spec only lists which values to show.",
      "Diambil host saat render dari metadata task / proses (`business_key`, nama proses dan task, pemohon dan departemennya, waktu mulai, tenggat, penerima tugas). Spec hanya mencatat nilai mana yang ditampilkan.",
    ),
    L(
      "Not in the payload, the draft or history (Wave 4 open decision 8). To keep a value in the process, use a Hidden field (Current user / Process variable) instead.",
      "Tidak masuk payload, draf, maupun history (keputusan terbuka Gelombang 4 no. 8). Untuk menyimpan nilai ke proses, pakai Hidden field (Current user / Process variable).",
    ),
    L(
      "Only the 8 values listed are offered; no requester email or phone (personal data). The list is Wave 4 open decision 8.",
      "Hanya 8 nilai ini yang ditawarkan; tanpa email atau telepon pemohon (data pribadi). Daftarnya adalah keputusan terbuka Gelombang 4 no. 8.",
    ),
    L(
      "Dates are shown in WIB (Asia/Jakarta), whatever the browser's zone. `relative` counts from when the form opens and keeps the date beside it.",
      "Tanggal ditampilkan dalam WIB (Asia/Jakarta), apa pun zona browser. `relative` dihitung dari saat form dibuka dan tanggalnya tetap tampil di sampingnya.",
    ),
    L(
      "A missing value (e.g. a step with no due date) shows “—” with a short reason, never an empty box.",
      "Nilai yang tidak ada (mis. langkah tanpa tenggat) tampil “—” dengan alasan singkat, tidak pernah kotak kosong.",
    ),
  ],
  story: {
    process: PROCESS,
    step: STEP,
    ref: "BUD-2026-0175",
    due: "2026-11-14",
    task: L("Budget: Q1 2027 digital campaign", "Anggaran: kampanye digital Q1 2027"),
    after: [
      {
        name: "decision",
        label: L("Decision", "Keputusan"),
        type: "select",
        required: true,
        options: [
          { v: "approve", label: L("Approve", "Setujui") },
          { v: "revise", label: L("Send back for revision", "Kembalikan untuk revisi") },
          { v: "reject", label: L("Reject", "Tolak") },
        ],
      },
      {
        name: "decision_note",
        label: L("Note", "Catatan"),
        type: "textarea",
        rows: 3,
        placeholder: L("e.g. Approved; keep the influencer fee under Rp 40 million.", "mis. Disetujui; biaya influencer maksimal Rp 40 juta."),
      },
    ],
  },
}
