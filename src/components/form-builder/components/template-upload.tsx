/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Alert02Icon,
  AlertCircleIcon,
  Csv01Icon,
  Delete02Icon,
  Doc01Icon,
  Download01Icon,
  File01Icon,
  FileSyncIcon,
  Pdf01Icon,
  Tick02Icon,
  Upload01Icon,
  Xls01Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { L, useT, type L10n } from "../i18n"
import { F, uid } from "../lib"
import type { ComponentDef, FieldState, Issue, RuntimeProps } from "../types"

/* Template download + upload — ui_type TEMPLATE_UPLOAD, value_kind "file".
   Story: the employee downloads the expense template, fills it, uploads it back. */

const TYPES = [".xlsx", ".xls", ".docx", ".pdf", ".csv"]
const TEMPLATE_TYPES = [".xlsx", ".docx"]
const MIME: Record<string, string> = {
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pdf": "application/pdf",
  ".csv": "text/csv",
}
const ext = (n: string) => /\.[^.]+$/.exec(n.toLowerCase())?.[0] ?? ""

interface TplFile {
  name: string
  size: number
}
interface TemplateUploadProps {
  label: L10n
  name: string
  /** Saved with the form; the same file for every task. */
  template: TplFile | null
  accept: string[]
  /** MB per file; "" while the stepper is being edited. */
  maxSize: number | ""
  multiple: boolean
  required: boolean
}
interface UpFile {
  id: string
  name: string
  size: number
  type: string
  /** 0–100; the payload only lists files at 100. */
  progress: number
}
interface Rejected {
  name: string
  msg: L10n
}
interface TemplateUploadValue {
  /** Step 1 done (display only, not in the payload). */
  downloaded: boolean
  files: UpFile[]
  /** Files refused by the last pick or drop. */
  rejected: Rejected[]
}

const acceptText = (p: TemplateUploadProps) => p.accept.join(", ")
const maxMB = (p: TemplateUploadProps) => Number(p.maxSize) || 5

function bytesIn(n: number, loc: string) {
  if (n < 1024) return `${n} B`
  if (n < 1048576) return `${new Intl.NumberFormat(loc, { maximumFractionDigits: n < 10240 ? 1 : 0 }).format(n / 1024)} KB`
  return `${new Intl.NumberFormat(loc, { maximumFractionDigits: 1 }).format(n / 1048576)} MB`
}
/** "12.4 MB" / "12,4 MB". */
const bytes = (n: number) => L(bytesIn(n, "en-GB"), bytesIn(n, "id-ID"))

const rulesText = (p: TemplateUploadProps) =>
  L(
    `${acceptText(p)} · up to ${maxMB(p)} MB${p.multiple ? " · several files allowed" : ""}`,
    `${acceptText(p)} · maks. ${maxMB(p)} MB${p.multiple ? " · boleh beberapa berkas" : ""}`,
  )

/** Type and size checks, then the file joins the list at 0 % (the runtime drives the upload). */
function addFiles(p: TemplateUploadProps, v: TemplateUploadValue, list: { name: string; size: number; type?: string }[]): TemplateUploadValue {
  const rejected: Rejected[] = []
  let files = v.files
  for (const f of list) {
    const e = ext(f.name)
    if (!p.accept.includes(e)) {
      rejected.push({ name: f.name, msg: L(`File type not accepted. Use ${acceptText(p)}.`, `Tipe berkas tidak diterima. Gunakan ${acceptText(p)}.`) })
      continue
    }
    if (f.size > maxMB(p) * 1048576) {
      const b = bytes(f.size)
      rejected.push({ name: f.name, msg: L(`${b.en} is over the ${maxMB(p)} MB limit.`, `${b.id} melebihi batas ${maxMB(p)} MB.`) })
      continue
    }
    if (!p.multiple) files = []
    files = [...files, { id: uid("f"), name: f.name, size: f.size, type: MIME[e] || f.type || "application/octet-stream", progress: 0 }]
  }
  return { ...v, files, rejected }
}

/* ── shared bits ────────────────────────────────────────────────────────── */

function fileIcon(name: string): [IconSvgElement, string] {
  const e = ext(name)
  const sheet = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
  if (e === ".xlsx" || e === ".xls") return [Xls01Icon, sheet]
  if (e === ".csv") return [Csv01Icon, sheet]
  if (e === ".docx") return [Doc01Icon, "bg-primary/10 text-primary"]
  if (e === ".pdf") return [Pdf01Icon, "bg-muted text-muted-foreground"]
  return [File01Icon, "bg-muted text-muted-foreground"]
}

function FileRow({ name, size, children }: { name: string; size: number; children?: ReactNode }) {
  const t = useT()
  const [icon, tone] = fileIcon(name)
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card py-2 pr-2 pl-2.5">
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", tone)}>
        <HugeiconsIcon icon={icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1 leading-snug">
        <b className="block text-[13px] font-medium [overflow-wrap:anywhere]">{name}</b>
        <small className="text-xs text-muted-foreground">{t(bytes(size))}</small>
      </span>
      {children}
    </div>
  )
}

function Step({ n, done, title, sub, compact, children }: { n: number; done?: boolean; title: L10n; sub?: L10n; compact?: boolean; children: ReactNode }) {
  const t = useT()
  return (
    <li className={cn("flex gap-3 border-t border-border py-3.5 first:border-t-0", compact ? "px-3" : "px-4")}>
      <span
        className={cn(
          "grid size-6.5 shrink-0 place-items-center rounded-full text-xs font-semibold",
          done ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground",
        )}
      >
        {done ? <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> : n}
        {done && <span className="sr-only">{t(L(`Step ${n} done`, `Langkah ${n} selesai`))}</span>}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <p className="text-sm leading-[26px] font-semibold">{t(title)}</p>
          {sub && <p className="text-xs text-muted-foreground">{t(sub)}</p>}
        </div>
        {children}
      </div>
    </li>
  )
}

const STEP1 = L("Download the template", "Unduh template")
const STEP2 = L("Upload the completed file", "Unggah berkas yang sudah diisi")
const DROP = L("Drag the file here or ", "Seret berkas ke sini atau ")
const BROWSE = L("browse", "pilih berkas")
const dropClass =
  "flex w-full flex-col items-center gap-1 rounded-2xl border-[1.5px] border-dashed border-border bg-card px-4 py-5 text-center text-[13px] text-muted-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40"

function DropFace({ rules }: { rules?: L10n }) {
  const t = useT()
  return (
    <>
      <span className="mb-1 grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground">
        <HugeiconsIcon icon={Upload01Icon} className="size-5" />
      </span>
      <span>
        {t(DROP)}
        <u className="text-primary underline-offset-3">{t(BROWSE)}</u>
      </span>
      {rules && <small className="text-xs text-muted-foreground">{t(rules)}</small>}
    </>
  )
}

/* ── builder ────────────────────────────────────────────────────────────── */

function TemplateUploadCanvas({ props: p }: { props: TemplateUploadProps }) {
  const t = useT()
  return (
    <ol className="flex flex-col rounded-2xl border border-border bg-background">
      <Step n={1} title={STEP1}>
        {p.template ? (
          <FileRow name={p.template.name} size={p.template.size}>
            <span className={buttonVariants({ variant: "outline", size: "sm" })} aria-hidden>
              <HugeiconsIcon icon={Download01Icon} />
              {t(L("Download", "Unduh"))}
            </span>
          </FileRow>
        ) : (
          <Alert className="border-amber-500/30 bg-amber-500/5">
            <HugeiconsIcon icon={Alert02Icon} />
            <AlertTitle>{t(L("No template file yet", "Belum ada berkas template"))}</AlertTitle>
            <AlertDescription>{t(L("Upload one in Edit Element.", "Unggah di Edit Element."))}</AlertDescription>
          </Alert>
        )}
      </Step>
      <Step n={2} title={STEP2}>
        <div className={dropClass}>
          <DropFace rules={rulesText(p)} />
        </div>
      </Step>
    </ol>
  )
}

/** Edit Element: the template file itself (.xlsx / .docx), with Replace and Remove. */
function TemplatePicker({ template, onChange }: { template: TplFile | null; onChange: (next: TplFile | null) => void }) {
  const t = useT()
  const labelId = useId()
  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    noKeyboard: true,
    onDrop: (accepted, rejections) => {
      const f = accepted[0] ?? rejections[0]?.file
      if (!f) return
      if (!TEMPLATE_TYPES.includes(ext(f.name))) {
        toast.error(t(L("The template must be .xlsx or .docx", "Template harus .xlsx atau .docx")))
        return
      }
      onChange({ name: f.name, size: f.size })
      toast.success(t(L("Template replaced", "Template diganti")))
    },
  })
  return (
    <div {...getRootProps({ role: "group", "aria-labelledby": labelId, className: "flex flex-col gap-1.5" })}>
      <input {...getInputProps({ accept: TEMPLATE_TYPES.join(",") })} />
      <Label id={labelId} className="text-sm font-medium">
        {t(L("Template file", "Berkas template"))}
      </Label>
      {template ? (
        <FileRow name={template.name} size={template.size}>
          <Button variant="ghost" size="xs" onClick={open}>
            {t(L("Replace", "Ganti"))}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t(L("Remove template", "Hapus template"))}
            onClick={() => onChange(null)}
            className="text-muted-foreground hover:text-destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} />
          </Button>
        </FileRow>
      ) : (
        <>
          <button type="button" onClick={open} className={cn(dropClass, "cursor-pointer hover:border-primary/50 hover:bg-muted/40", isDragActive && "border-primary bg-primary/5")}>
            <span className="mb-1 grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground">
              <HugeiconsIcon icon={Upload01Icon} className="size-5" />
            </span>
            <span>{t(L("Upload a .xlsx or .docx template", "Unggah template .xlsx atau .docx"))}</span>
          </button>
          {/* A warning, not a blocker: the form may be saved without one (the canvas node then warns). */}
          <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
            <HugeiconsIcon icon={Alert02Icon} className="size-3.5" />
            {t(L("Users need a template to download", "User butuh template untuk diunduh"))}
          </p>
        </>
      )}
      <p className="text-xs text-muted-foreground">
        {t(L("Saved with the form, so every task gets the same template.", "Disimpan bersama form, jadi setiap task mendapat template yang sama."))}
      </p>
    </div>
  )
}

/* ── runtime ────────────────────────────────────────────────────────────── */

function TemplateUploadRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<TemplateUploadProps, TemplateUploadValue>) {
  const t = useT()
  const listRef = useRef<HTMLUListElement>(null)
  const live = state === "active"
  const bad = issues.length > 0
  const uploading = v.files.some((f) => f.progress < 100)
  const done = v.files.length > 0 && !uploading

  /* Simulated upload: every running file moves 20–35 % every 160 ms. */
  const tick = useEffectEvent(() => {
    onChange({
      ...v,
      files: v.files.map((f) => (f.progress < 100 ? { ...f, progress: Math.min(100, f.progress + 20 + Math.round(Math.random() * 15)) } : f)),
    })
  })
  useEffect(() => {
    if (!uploading) return
    const timer = window.setInterval(() => tick(), 160)
    return () => window.clearInterval(timer)
  }, [uploading])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    // Our own checks give the per-file messages, so nothing is filtered here.
    onDrop: (accepted, rejections) => onChange(addFiles(p, v, [...accepted, ...rejections.map((r) => r.file)])),
    multiple: p.multiple,
    disabled: !live,
  })

  const download = () => {
    if (!p.template) return
    if (live) onChange({ ...v, downloaded: true })
    toast.info(t(L(`Prototype: ${p.template.name} would download now`, `Prototipe: ${p.template.name} akan terunduh sekarang`)))
  }
  const remove = (fid: string) => {
    onChange({ ...v, files: v.files.filter((f) => f.id !== fid) })
    requestAnimationFrame(() => (document.getElementById(`${id}-input`) ?? listRef.current?.querySelector<HTMLElement>("[data-remove]"))?.focus())
  }
  const showDrop = live ? p.multiple || !v.files.length : !v.files.length

  return (
    <ol role="group" aria-labelledby={`${id}-label`} className="flex flex-col rounded-2xl border border-border bg-background">
      <Step n={1} done={v.downloaded} title={STEP1} sub={L("Fill it in on your computer, then come back for step 2.", "Isi di komputer Anda, lalu kembali untuk langkah 2.")} compact={compact}>
        {p.template ? (
          <FileRow name={p.template.name} size={p.template.size}>
            <Button variant="outline" size="sm" disabled={state === "disabled"} onClick={download}>
              <HugeiconsIcon icon={Download01Icon} />
              {t(L("Download", "Unduh"))}
            </Button>
          </FileRow>
        ) : (
          <p className="text-xs text-muted-foreground">{t(L("The form owner has not added a template yet.", "Pemilik form belum menambahkan template."))}</p>
        )}
      </Step>
      <Step n={2} done={done} title={STEP2} sub={rulesText(p)} compact={compact}>
        {showDrop && (
          <div
            {...getRootProps({
              id: `${id}-input`,
              role: "button",
              "aria-invalid": bad || undefined,
              "aria-disabled": !live || undefined,
              className: cn(
                dropClass,
                live
                  ? "cursor-pointer hover:border-primary/50 hover:bg-muted/40"
                  : state === "disabled"
                    ? "cursor-not-allowed bg-muted opacity-60"
                    : "cursor-default bg-muted",
                isDragActive && "border-primary bg-primary/5",
                bad && "border-destructive",
              ),
            })}
          >
            <input {...getInputProps({ accept: p.accept.join(",") })} />
            <DropFace />
          </div>
        )}
        {v.files.length > 0 && (
          <ul ref={listRef} aria-label={t(L("Uploaded files", "Berkas terunggah"))} className="flex flex-col gap-1.5">
            {v.files.map((f) => (
              <li key={f.id} className="flex flex-col gap-1.5">
                <FileRow name={f.name} size={f.size}>
                  {f.progress < 100 ? (
                    <span className="text-xs text-muted-foreground tabular-nums">{f.progress}%</span>
                  ) : (
                    <>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        <HugeiconsIcon icon={Tick02Icon} />
                        {t(L("Uploaded", "Terunggah"))}
                      </Badge>
                      {live && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          data-remove
                          aria-label={`${t(L("Remove ", "Hapus "))}${f.name}`}
                          onClick={() => remove(f.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <HugeiconsIcon icon={Delete02Icon} />
                        </Button>
                      )}
                    </>
                  )}
                </FileRow>
                {f.progress < 100 && <Progress value={f.progress} aria-label={f.name} className="h-1" />}
              </li>
            ))}
          </ul>
        )}
        {v.rejected.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {v.rejected.map((r, i) => (
              <Alert key={`${r.name}-${i}`} variant="destructive">
                <HugeiconsIcon icon={AlertCircleIcon} />
                <AlertTitle className="[overflow-wrap:anywhere]">{r.name}</AlertTitle>
                <AlertDescription>{t(r.msg)}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </Step>
    </ol>
  )
}

function validate(p: TemplateUploadProps, v: TemplateUploadValue): Issue[] {
  if (v.files.some((f) => f.progress < 100)) return [{ fid: "drop", msg: L("Wait until the upload finishes", "Tunggu sampai unggahan selesai") }]
  if (p.required && !v.files.length)
    return [{ fid: "drop", msg: L(`Upload the completed ${p.label.en.toLowerCase()}`, `Unggah ${p.label.id.toLowerCase()} yang sudah diisi`) }]
  return []
}

/* Prototype samples (were inline in the vanilla runtime): a valid file, a wrong type, a file over the limit. */
const SAMPLES = [
  { name: "Laporan Biaya - Rina - Surabaya.xlsx", size: 48230, label: L("Valid .xlsx", ".xlsx valid") },
  { name: "Nota hotel Surabaya.pdf", size: 220400, label: L("Wrong type", "Tipe salah") },
  { name: "Laporan + foto nota.xlsx", size: 13002342, label: L("Too large", "Terlalu besar") },
]

function SampleFiles({
  props: p,
  value: v,
  onChange,
  state,
}: {
  props: TemplateUploadProps
  value: TemplateUploadValue
  onChange: (next: TemplateUploadValue) => void
  state: FieldState
}) {
  const t = useT()
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">{t(L("Prototype samples:", "Contoh prototipe:"))}</p>
      <div className="flex flex-wrap gap-1.5">
        {SAMPLES.map((s) => (
          <Button key={s.name} variant="outline" size="xs" disabled={state !== "active"} onClick={() => onChange(addFiles(p, v, [s]))}>
            {t(s.label)}
          </Button>
        ))}
      </div>
    </div>
  )
}

export const templateUpload: ComponentDef<TemplateUploadProps, TemplateUploadValue> = {
  slug: "template-upload",
  wave: 1,
  ui: "TEMPLATE_UPLOAD",
  vk: "file",
  group: "field",
  week: 2,
  icon: FileSyncIcon,
  label: L("Template download + upload", "Unduh template + unggah"),
  title: L("Template download + upload", "Unduh template + unggah balik"),
  blurb: L("Step 1: download the template. Step 2: upload the completed file.", "Langkah 1: unduh template. Langkah 2: unggah berkas yang sudah diisi."),

  defaults: () => ({
    label: L("Trip expense report", "Laporan biaya perjalanan"),
    name: "expense_report",
    template: { name: "Template Laporan Biaya Perjalanan Dinas 2026.xlsx", size: 24576 },
    accept: [".xlsx", ".xls"],
    maxSize: 5,
    multiple: true,
    required: true,
  }),
  schema: () => [
    { tab: "general", fields: [F.name(), F.key()] },
    {
      tab: "general",
      title: L("Step 1 · Template", "Langkah 1 · Template"),
      fields: [{ t: "custom", id: "template", render: ({ props, set }) => <TemplatePicker template={props.template} onChange={(template) => set({ template })} /> }],
    },
    {
      tab: "general",
      title: L("Step 2 · Upload rules", "Langkah 2 · Aturan unggah"),
      fields: [
        {
          t: "chips",
          k: "accept",
          label: L("Accepted types", "Tipe yang diterima"),
          options: TYPES.map((x) => ({ v: x, label: L(x) })),
          validate: (v) => (!Array.isArray(v) || !v.length ? L("Pick at least one type", "Pilih minimal satu tipe") : null),
        },
        {
          t: "number",
          k: "maxSize",
          label: L("Max size per file", "Ukuran maksimal per berkas"),
          min: 1,
          max: 50,
          suffix: "MB",
          allowEmpty: true,
          validate: (v) => {
            const x = Number(v)
            return v === "" || Number.isNaN(x) || x < 1 || x > 50 ? L("Use 1–50 MB", "Gunakan 1–50 MB") : null
          },
        },
        { t: "switch", k: "multiple", label: L("Allow several files", "Boleh beberapa berkas"), hint: L("e.g. the report plus a signed scan.", "mis. laporan beserta hasil pindaian bertanda tangan.") },
      ],
    },
    { tab: "validation", fields: [F.required(L("At least one file must finish uploading.", "Minimal satu berkas selesai terunggah."))] },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: TemplateUploadCanvas,
  canvasWarn: (p) => (!p.template ? L("No template file", "Belum ada template") : null),

  Runtime: TemplateUploadRuntime,
  initial: () => ({ downloaded: false, files: [], rejected: [] }),
  sample: () => ({
    downloaded: true,
    files: [{ id: "f_sample", name: "Laporan Biaya - Rina - Surabaya.xlsx", size: 48230, type: MIME[".xlsx"], progress: 100 }],
    rejected: [],
  }),
  validate,
  value: (p, v) => {
    const list = v.files.filter((f) => f.progress >= 100).map((f) => ({ file_name: f.name, mime: f.type, size: f.size }))
    return p.multiple ? list : (list[0] ?? null)
  },
  Controls: SampleFiles,

  spec: (p) => ({
    ui_type: "TEMPLATE_UPLOAD",
    value_kind: "file",
    name: p.name,
    label: p.label,
    required: p.required,
    config: {
      template: p.template ? { file_name: p.template.name, size: p.template.size } : null,
      accepted_types: p.accept,
      max_size_mb: Number(p.maxSize),
      multiple: p.multiple,
    },
  }),
  savedAs: (p) =>
    L(
      `${p.multiple ? "A list of files" : "One file"} in \`${p.name}\`. The template itself stays in the form spec.`,
      `${p.multiple ? "Daftar berkas" : "Satu berkas"} di \`${p.name}\`. Templatenya sendiri tetap di spec form.`,
    ),
  notes: [
    L("Replaces 4 MFE uses of “download a template, upload it back” (shaping §7).", "Menggantikan 4 pemakaian MFE “unduh template, unggah balik” (shaping §7)."),
    L(
      "Uses the existing File Upload pipeline; File Upload already has `multiple_file`, so “several files” maps onto it.",
      "Memakai jalur File Upload yang ada; File Upload sudah punya `multiple_file`, jadi “beberapa berkas” memakai opsi itu.",
    ),
    L("Type and size are checked in the browser and again on the server.", "Tipe dan ukuran dicek di browser dan dicek ulang di server."),
    L(
      "Submit waits for running uploads; the payload only lists finished files.",
      "Submit menunggu unggahan yang sedang berjalan; payload hanya berisi berkas yang sudah selesai.",
    ),
    L("Allow several files on → an array of files; off → one object or `null`.", "Multiple aktif → array berkas; nonaktif → satu objek atau `null`."),
  ],
  story: {
    process: L("Business trip report", "Laporan perjalanan dinas"),
    step: L("Expense report", "Laporan biaya"),
    ref: "PD-2026-0217",
    due: "2026-10-09",
    task: L("Upload trip expense report", "Unggah laporan biaya perjalanan"),
    after: [
      {
        name: "total_claim",
        label: L("Total claimed", "Total klaim"),
        type: "number",
        prefix: "Rp",
        required: true,
        value: "3875000",
        hint: L("Must match the total in the uploaded file.", "Harus sama dengan total di berkas yang diunggah."),
      },
    ],
  },
}
