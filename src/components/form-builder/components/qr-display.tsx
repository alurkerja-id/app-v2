/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useId, useMemo, useRef, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  Clock01Icon,
  Download04Icon,
  QrCodeIcon,
  QrCodeScanIcon,
  Refresh01Icon,
  SourceCodeIcon,
  TextIcon,
  Tick02Icon,
  VariableIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { L, useT, type L10n } from "../i18n"
import { F } from "../lib"
import { Rich } from "../rich"
import type { ComponentDef, DataExtra, FieldState, RuntimeProps } from "../types"
import { QUIET_ZONE, encodeQr, isDark, maxBytes, qrPath, utf8, type QrCode, type QrEcc } from "./qr-display-encode"

/* QR code display — ui_type QR_CODE, value_kind "none". Story: asset registration, step "Label the
   asset": the label printed here is what Barcode / QR scan (Wave 2) reads in the annual audit.
   The code is real and scannable, drawn by our own encoder (qr-display-encode.ts). */

type Source = "text" | "variable" | "template"
type Size = 128 | 192 | 256

interface QrProps {
  label: L10n
  /** Identity of the node only — a QR code sends no value. */
  name: string
  source: Source
  text: string
  variable: string
  /** Text with `{variable}` placeholders. */
  template: string
  size: Size
  ecc: QrEcc
  showText: boolean
  allowDownload: boolean
  caption: L10n
}

/** Prototype context: process variables set by earlier steps. Never submitted. */
interface QrValue {
  vars: Record<string, string>
}

/* ── mock process variables ─────────────────────────────────────────────── */

const REGISTER = L("Register the asset", "Daftarkan aset")
const VARS: Record<string, { value: string; step: L10n }> = {
  asset_tag: { value: "AST-2026-00418", step: REGISTER },
  asset_name: { value: "Laptop Dell Latitude 5440", step: REGISTER },
  serial_number: { value: "7XK2Q93", step: REGISTER },
  location: { value: "Gedung Utama · Lantai 3 — Ruang Merapi", step: L("Assign to a user", "Serahkan ke user") },
  warranty_ref: { value: "", step: L("Vendor confirms the warranty", "Vendor mengonfirmasi garansi") },
}
const VAR_KEYS = Object.keys(VARS)
const sampleVars = (): Record<string, string> => Object.fromEntries(VAR_KEYS.map((k) => [k, VARS[k].value]))

const AUDIT_FORMAT = "AST-####-#####"
const AUDIT_RE = /^AST-\d{4}-\d{5}$/

/* ── content ────────────────────────────────────────────────────────────── */

const PH_RE = /\{([a-z][a-z0-9_]*)\}/g
const placeholders = (tpl: string) => [...new Set([...tpl.matchAll(PH_RE)].map((m) => m[1]))]
const isLink = (s: string) => /^https?:\/\//i.test(s.trim())

/** What the code holds right now: text, missing variables, or nothing configured. */
type Content = { kind: "ok"; text: string } | { kind: "missing"; keys: string[] } | { kind: "none" }

function resolve(p: QrProps, vars: Record<string, string>): Content {
  if (p.source === "text") return p.text.trim() ? { kind: "ok", text: p.text } : { kind: "none" }
  if (p.source === "variable") {
    const v = vars[p.variable] ?? ""
    return v ? { kind: "ok", text: v } : { kind: "missing", keys: [p.variable] }
  }
  if (!p.template.trim() || !placeholders(p.template).length) return { kind: "none" }
  /* In a link the values are URL-encoded; elsewhere they go in as they are. */
  const link = isLink(p.template)
  const missing: string[] = []
  const text = p.template.replace(PH_RE, (_, k: string) => {
    const v = vars[k] ?? ""
    if (!v) missing.push(k)
    return link ? encodeURIComponent(v) : v
  })
  return missing.length ? { kind: "missing", keys: [...new Set(missing)] } : { kind: "ok", text }
}

/** An Edit Element problem: the full message, and a short one for the canvas badge. */
interface Problem {
  msg: L10n
  short: L10n
}

function tooLong(text: string, ecc: QrEcc): Problem | null {
  const n = utf8(text).length
  const max = maxBytes(ecc)
  return n > max
    ? {
        msg: L(`Too long for a QR code: ${n} bytes, level ${ecc} holds at most ${max}`, `Terlalu panjang untuk kode QR: ${n} byte, level ${ecc} maksimal ${max}`),
        short: L("Too long for a QR code", "Terlalu panjang untuk kode QR"),
      }
    : null
}

function textProblem(p: QrProps): Problem | null {
  if (!p.text.trim()) return { msg: L("Enter the text or link to encode", "Isi teks atau tautan yang akan dijadikan kode"), short: L("No content", "Belum ada isi") }
  return tooLong(p.text, p.ecc)
}

function templateProblem(p: QrProps): Problem | null {
  const tpl = p.template
  const short = L("Check the template", "Periksa templat")
  if (!tpl.trim()) return { msg: L("Enter a template, e.g. https://aset.javan.id/a/{asset_tag}", "Isi templat, mis. https://aset.javan.id/a/{asset_tag}"), short: L("No template", "Belum ada templat") }
  if (/[{}]/.test(tpl.replace(PH_RE, "")))
    return { msg: L("Write placeholders as {variable_key}: a lowercase key in braces", "Tulis placeholder sebagai {key_variabel}: key huruf kecil di dalam kurung kurawal"), short }
  const keys = placeholders(tpl)
  if (!keys.length) return { msg: L("Add at least one {variable}, or use Fixed text", "Tambahkan minimal satu {variabel}, atau pakai Teks tetap"), short }
  const unknown = keys.find((k) => !(k in VARS))
  if (unknown) return { msg: L(`Unknown variable {${unknown}}`, `Variabel {${unknown}} tidak dikenal`), short: L(`Unknown {${unknown}}`, `{${unknown}} tidak dikenal`) }
  const r = resolve(p, sampleVars())
  return r.kind === "ok" ? tooLong(r.text, p.ecc) : null
}

/** Edit Element problem with the content, or null. */
function contentProblem(p: QrProps): Problem | null {
  if (p.source === "text") return textProblem(p)
  if (p.source === "template") return templateProblem(p)
  return VARS[p.variable] ? null : { msg: L("Pick a process variable", "Pilih variabel proses"), short: L("No variable", "Belum ada variabel") }
}

/** Modules across, quiet zone included, and CSS pixels per module at a size. */
const geometry = (qr: QrCode, size: number) => {
  const n = qr.size + QUIET_ZONE * 2
  return { n, px: size / n }
}

/* ── drawing ────────────────────────────────────────────────────────────── */

/** Black on white with a 4-module quiet zone, also in dark mode: scanners need dark on light. */
function QrSvg({ qr, size, label }: { qr: QrCode; size: number; label: string }) {
  const { n } = geometry(qr, size)
  const d = useMemo(() => qrPath(qr), [qr])
  return (
    <svg
      viewBox={`0 0 ${n} ${n}`}
      width={size}
      height={size}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className="block h-auto max-w-full rounded-lg ring-1 ring-border"
    >
      <rect width={n} height={n} fill="#ffffff" />
      <path d={d} fill="#000000" />
    </svg>
  )
}

/** Empty / missing / too-long box, the size of the code. */
function StateBox({ size, children }: { size: number; children: ReactNode }) {
  return (
    <div
      style={{ minHeight: size, width: `max(${size}px, 15rem)` }}
      className="flex max-w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-5 text-center dark:bg-muted/15"
    >
      {children}
    </div>
  )
}

function MissingBox({ size, keys }: { size: number; keys: string[] }) {
  const t = useT()
  const steps = [...new Set(keys.map((k) => VARS[k]?.step).filter((s): s is L10n => Boolean(s)))]
  return (
    <StateBox size={size}>
      <HugeiconsIcon icon={Clock01Icon} className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{t(L("Not available yet", "Belum tersedia"))}</p>
      <p className="text-xs text-muted-foreground">
        <span className="font-mono">{keys.join(", ")}</span>{" "}
        {steps.length
          ? t(
              L(
                `${keys.length > 1 ? "are" : "is"} filled in step “${steps.map((s) => s.en).join("”, “")}”.`,
                `diisi di langkah “${steps.map((s) => s.id).join("”, “")}”.`,
              ),
            )
          : t(L(`${keys.length > 1 ? "have" : "has"} no value yet.`, "belum berisi nilai."))}
      </p>
    </StateBox>
  )
}

function TooLongBox({ size, msg }: { size: number; msg: L10n }) {
  const t = useT()
  return (
    <StateBox size={size}>
      <HugeiconsIcon icon={Alert02Icon} className="size-6 text-amber-600 dark:text-amber-400" />
      <p className="text-sm font-medium text-foreground">{t(L("Can’t draw the code", "Kode tidak bisa dibuat"))}</p>
      <p className="text-xs text-muted-foreground">{t(msg)}</p>
    </StateBox>
  )
}

/** Code plus the encoded text under it, as wide as the code. */
function CodeBlock({ qr, text, p }: { qr: QrCode; text: string; p: QrProps }) {
  const t = useT()
  return (
    <div style={{ width: p.size }} className="flex max-w-full flex-col items-center gap-1.5">
      <QrSvg qr={qr} size={p.size} label={t(L(`QR code: ${text}`, `Kode QR: ${text}`))} />
      {p.showText && <p className="w-full text-center font-mono text-xs text-foreground [overflow-wrap:anywhere]">{text}</p>}
    </div>
  )
}

/* ── download (PNG from a canvas) ───────────────────────────────────────── */

function downloadPng(qr: QrCode, fileName: string, done: (ok: boolean) => void) {
  const n = qr.size + QUIET_ZONE * 2
  const scale = Math.max(8, Math.ceil(1024 / n))
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = n * scale
  const ctx = canvas.getContext("2d")
  if (!ctx) return done(false)
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "#000000"
  for (let y = 0; y < qr.size; y++)
    for (let x = 0; x < qr.size; x++) if (isDark(qr, x, y)) ctx.fillRect((x + QUIET_ZONE) * scale, (y + QUIET_ZONE) * scale, scale, scale)
  canvas.toBlob((blob) => {
    if (!blob) return done(false)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    done(true)
  }, "image/png")
}

/** A tag such as AST-2026-00418 names the file; anything else uses the key. */
const fileNameFor = (p: QrProps, text: string) => `${/^[A-Za-z0-9._-]{1,40}$/.test(text) ? text : p.name || "qr-code"}.png`

/* ── canvas ─────────────────────────────────────────────────────────────── */

function SourceLine({ p }: { p: QrProps }) {
  const t = useT()
  const icon = p.source === "text" ? TextIcon : p.source === "variable" ? VariableIcon : SourceCodeIcon
  const what = p.source === "text" ? p.text : p.source === "variable" ? p.variable : p.template
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <HugeiconsIcon icon={icon} className="size-3.5 shrink-0" />
      <span className="min-w-0 truncate font-mono">{what || t(L("No content", "Belum ada isi"))}</span>
      <Badge variant="secondary" className="text-[10px]">
        {t(L(`Level ${p.ecc}`))}
      </Badge>
      <Badge variant="secondary" className="text-[10px]">
        {p.size} px
      </Badge>
    </div>
  )
}

function QrCanvas({ props: p }: { props: QrProps }) {
  const t = useT()
  const c = resolve(p, sampleVars())
  const err = contentProblem(p)?.msg
  const qr = c.kind === "ok" && !err ? encodeQr(c.text, p.ecc) : null
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      {qr && c.kind === "ok" ? (
        <CodeBlock qr={qr} text={c.text} p={p} />
      ) : c.kind === "missing" && !err ? (
        <MissingBox size={p.size} keys={c.keys} />
      ) : (
        <StateBox size={p.size}>
          <HugeiconsIcon icon={QrCodeIcon} className="size-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{t(err ?? L("Set the content in Edit Element.", "Atur isinya di Edit Element."))}</p>
        </StateBox>
      )}
      <SourceLine p={p} />
    </div>
  )
}

/* ── runtime ────────────────────────────────────────────────────────────── */

const hasCaption = (p: QrProps) => Boolean(p.caption.en.trim() || p.caption.id.trim())

function QrRuntime({ props: p, value: v, state, id }: RuntimeProps<QrProps, QrValue>) {
  const t = useT()
  const disabled = state === "disabled"
  const c = resolve(p, v.vars)
  const text = c.kind === "ok" ? c.text : ""
  const qr = useMemo(() => (text ? encodeQr(text, p.ecc) : null), [text, p.ecc])
  const long = text && !qr ? tooLong(text, p.ecc)?.msg : null

  let body: ReactNode
  if (c.kind === "missing") body = <MissingBox size={p.size} keys={c.keys} />
  else if (qr) body = <CodeBlock qr={qr} text={text} p={p} />
  else if (long) body = <TooLongBox size={p.size} msg={long} />
  else
    body = (
      <StateBox size={p.size}>
        <HugeiconsIcon icon={QrCodeIcon} className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t(L("No content for the code yet.", "Belum ada isi untuk kode ini."))}</p>
      </StateBox>
    )

  const download = () => {
    if (!qr) return
    const file = fileNameFor(p, text)
    downloadPng(qr, file, (ok) =>
      ok ? toast.success(t(L(`Downloaded ${file}`, `${file} diunduh`))) : toast.error(t(L("Couldn’t create the PNG", "PNG gagal dibuat"))),
    )
  }

  return (
    <figure aria-labelledby={`${id}-label`} aria-disabled={disabled || undefined} className={cn("m-0 flex min-w-0 flex-col items-start gap-2.5", disabled && "opacity-60")}>
      {body}
      {hasCaption(p) && <figcaption className="max-w-prose text-xs text-pretty text-muted-foreground">{t(p.caption)}</figcaption>}
      {p.allowDownload && (
        <Button variant="outline" size="sm" disabled={disabled || !qr} onClick={download}>
          <HugeiconsIcon icon={Download04Icon} />
          {t(L("Download PNG", "Unduh PNG"))}
        </Button>
      )}
    </figure>
  )
}

/* ── simulation: the process variables the code is made from ───────────── */

function usedVars(p: QrProps): string[] {
  if (p.source === "variable") return [p.variable]
  if (p.source === "template") return placeholders(p.template).filter((k) => k in VARS)
  return []
}

function QrControls({ props: p, value: v, onChange }: { props: QrProps; value: QrValue; onChange: (next: QrValue) => void; state: FieldState }) {
  const t = useT()
  const id = useId()
  const keys = usedVars(p)
  const set = (patch: Record<string, string>) => onChange({ vars: { ...v.vars, ...patch } })
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {t(L("Values set by earlier steps. Empty one to see “Not available yet”.", "Nilai dari langkah sebelumnya. Kosongkan untuk melihat “Belum tersedia”."))}
      </p>
      {keys.map((k) => (
        <div key={k} className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-${k}`} className="flex-wrap gap-x-1.5 gap-y-1 text-xs leading-snug">
            <span className="font-mono font-semibold">{k}</span>
            <span className="font-normal text-muted-foreground">· {t(VARS[k].step)}</span>
          </Label>
          <Input
            id={`${id}-${k}`}
            value={v.vars[k] ?? ""}
            spellCheck={false}
            placeholder={t(L("Empty — not set yet", "Kosong — belum diisi"))}
            onChange={(e) => set({ [k]: e.target.value })}
            className="h-8 font-mono text-xs"
          />
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => set(Object.fromEntries(keys.map((k) => [k, ""])))}>
          <HugeiconsIcon icon={Clock01Icon} />
          {t(L("Not set yet", "Belum diisi"))}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onChange({ vars: sampleVars() })}>
          <HugeiconsIcon icon={Refresh01Icon} />
          {t(L("Sample values", "Nilai contoh"))}
        </Button>
      </div>
    </div>
  )
}

/* ── context: the audit that scans this label later ─────────────────────── */

function QrAside({ props: p, value: v }: { props: QrProps; value: QrValue }) {
  const t = useT()
  const c = resolve(p, v.vars)
  const fits = c.kind === "ok" && AUDIT_RE.test(c.text)
  return (
    <Card className="gap-2.5 p-4">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={QrCodeScanIcon} className="size-4 text-muted-foreground" />
        <p className="text-xs font-semibold">{t(L("Read later by Barcode / QR scan", "Dibaca nanti oleh Pindai barcode / QR"))}</p>
      </div>
      <p className="text-xs text-muted-foreground">
        <Rich
          text={L(
            `The annual asset audit scans this label into \`asset_tag\`, expecting \`${AUDIT_FORMAT}\`.`,
            `Audit aset tahunan memindai label ini ke \`asset_tag\` dengan format \`${AUDIT_FORMAT}\`.`,
          )}
        />
      </p>
      {c.kind === "ok" && (
        <p className={cn("flex items-start gap-1.5 text-xs", fits ? "text-foreground" : "text-amber-700 dark:text-amber-400")}>
          <HugeiconsIcon icon={fits ? Tick02Icon : Alert02Icon} className={cn("mt-px size-3.5 shrink-0", fits && "text-primary")} />
          <Rich
            text={
              fits
                ? L("This code holds the plain tag, so the audit accepts it.", "Kode ini berisi tag polos, jadi audit menerimanya.")
                : L(
                    "This code doesn’t match the audit format, so the audit would reject it. Use the `asset_tag` variable for audited labels.",
                    "Kode ini tidak sesuai format audit, jadi audit akan menolaknya. Pakai variabel `asset_tag` untuk label yang diaudit.",
                  )
            }
          />
        </p>
      )}
    </Card>
  )
}

/* ── Edit Element: text and template editors ────────────────────────────── */

function ContentEditor({ p, set, mode }: { p: QrProps; set: (patch: Partial<QrProps>) => void; mode: "text" | "template" }) {
  const t = useT()
  const id = useId()
  const ref = useRef<HTMLTextAreaElement>(null)
  const value = mode === "text" ? p.text : p.template
  const err = (mode === "text" ? textProblem(p) : templateProblem(p))?.msg
  const c = resolve(p, sampleVars())
  const qr = !err && c.kind === "ok" ? encodeQr(c.text, p.ecc) : null
  const write = (next: string) => set(mode === "text" ? { text: next } : { template: next })

  const insert = (key: string) => {
    const el = ref.current
    const token = `{${key}}`
    const at = el ? el.selectionStart : value.length
    const end = el ? el.selectionEnd : value.length
    write(value.slice(0, at) + token + value.slice(end))
    window.requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(at + token.length, at + token.length)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        ref={ref}
        id={id}
        rows={2}
        value={value}
        spellCheck={false}
        aria-invalid={err ? true : undefined}
        aria-label={t(mode === "text" ? L("Text or link", "Teks atau tautan") : L("Template", "Templat"))}
        placeholder={mode === "text" ? "https://…" : "https://aset.javan.id/a/{asset_tag}"}
        onChange={(e) => write(e.target.value)}
        className="min-h-0 font-mono text-[13px]"
      />
      {mode === "template" && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{t(L("Insert", "Sisipkan"))}</span>
          {VAR_KEYS.map((k) => (
            <Button key={k} type="button" variant="outline" size="xs" className="font-mono" onClick={() => insert(k)}>
              {`{${k}}`}
            </Button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        <Rich
          text={
            mode === "text"
              ? L("A link or any text, up to a few hundred characters. Line breaks are kept.", "Tautan atau teks apa pun, sampai beberapa ratus karakter. Baris baru tetap terbawa.")
              : L(
                  "Each `{variable}` is replaced when the task opens. In a link (`https://…`) the values are URL-encoded.",
                  "Setiap `{variabel}` diganti saat task dibuka. Di dalam tautan (`https://…`) nilainya di-encode untuk URL.",
                )
          }
        />
      </p>
      {qr && c.kind === "ok" && (
        <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
          {mode === "template" && <span className="font-mono text-foreground">{c.text}</span>}
          {mode === "template" && " · "}
          {t(L(`${qr.bytes} bytes → version ${qr.version}, ${qr.size} × ${qr.size} modules`, `${qr.bytes} byte → versi ${qr.version}, ${qr.size} × ${qr.size} modul`))}
        </p>
      )}
    </div>
  )
}

/** Version and pixels per module for the sample content; warns when the code gets too dense. */
function densityNote(p: QrProps): { text: L10n; tone: "info" | "warning" } | null {
  if (contentProblem(p)) return null
  const c = resolve(p, sampleVars())
  const qr = c.kind === "ok" ? encodeQr(c.text, p.ecc) : null
  if (!qr) return null
  const px = Math.round(geometry(qr, p.size).px * 10) / 10
  const base = L(
    `With the sample content: version ${qr.version}, ${qr.size} × ${qr.size} modules, ${px} px per module.`,
    `Dengan isi contoh: versi ${qr.version}, ${qr.size} × ${qr.size} modul, ${px} px per modul.`,
  )
  if (px >= 3) return { text: base, tone: "info" }
  return {
    tone: "warning",
    text: L(
      `${base.en} Too dense to scan reliably: pick a larger size, a lower level or shorter content.`,
      `${base.id} Terlalu rapat untuk dipindai dengan andal: pilih ukuran lebih besar, level lebih rendah, atau isi yang lebih pendek.`,
    ),
  }
}

/* ── definition ─────────────────────────────────────────────────────────── */

const SIZES: Size[] = [128, 192, 256]
const ECCS: { v: QrEcc; pct: string }[] = [
  { v: "L", pct: "7%" },
  { v: "M", pct: "15%" },
  { v: "Q", pct: "25%" },
  { v: "H", pct: "30%" },
]

function contentSpec(p: QrProps) {
  if (p.source === "text") return { type: "text", text: p.text }
  if (p.source === "variable") return { type: "variable", variable: p.variable }
  return { type: "template", template: p.template }
}

const context = (): QrValue => ({ vars: sampleVars() })

export const qrDisplay: ComponentDef<QrProps, QrValue> = {
  slug: "qr-display",
  wave: 4,
  ui: "QR_CODE",
  vk: "none",
  group: "display",
  week: 6,
  icon: QrCodeIcon,
  label: L("QR code display", "Tampilan kode QR"),
  title: L("QR code display", "Tampilan kode QR"),
  blurb: L(
    "Shows a scannable QR code made from text, a process variable or a template, ready to print.",
    "Menampilkan kode QR yang bisa dipindai dari teks, variabel proses, atau templat, siap dicetak.",
  ),

  defaults: () => ({
    label: L("Asset label", "Label aset"),
    name: "asset_label_qr",
    source: "variable",
    text: "https://aset.javan.id/a/AST-2026-00418",
    variable: "asset_tag",
    template: "https://aset.javan.id/a/{asset_tag}",
    size: 192,
    ecc: "M",
    showText: true,
    allowDownload: true,
    caption: L("Print it on a 50 × 30 mm label and stick it under the laptop.", "Cetak di label 50 × 30 mm lalu tempel di bagian bawah laptop."),
  }),
  schema: (p) => {
    const density = densityNote(p)
    return [
      {
        tab: "general",
        fields: [
          F.name(L("Name", "Nama"), { hint: L("Shown above the code.", "Tampil di atas kode.") }),
          F.key(L("Identity of the node; a QR code sends no value.", "Identitas node; kode QR tidak mengirim nilai.")),
        ],
      },
      {
        tab: "general",
        title: L("Content", "Isi kode"),
        fields: [
          {
            t: "seg",
            k: "source",
            label: L("Source", "Sumber"),
            options: [
              { v: "text", label: L("Fixed text", "Teks tetap") },
              { v: "variable", label: L("Process variable", "Variabel proses") },
              { v: "template", label: L("Template", "Templat") },
            ],
          },
          {
            t: "custom",
            id: "text",
            label: L("Text or link", "Teks atau tautan"),
            when: (o) => o.source === "text",
            render: ({ props, set }) => <ContentEditor p={props} set={set} mode="text" />,
            validate: (_, o) => (o.source === "text" ? (textProblem(o)?.msg ?? null) : null),
          },
          {
            t: "select",
            k: "variable",
            label: L("Process variable", "Variabel proses"),
            when: (o) => o.source === "variable",
            options: VAR_KEYS.map((k) => {
              const { value, step } = VARS[k]
              return { v: k, label: L(`${k} — ${step.en} · ${value || "empty"}`, `${k} — ${step.id} · ${value || "kosong"}`) }
            }),
            hint: L(
              "Read when the task opens. If it is still empty, the user sees “Not available yet”.",
              "Dibaca saat task dibuka. Bila masih kosong, user melihat “Belum tersedia”.",
            ),
          },
          {
            t: "custom",
            id: "template",
            label: L("Template", "Templat"),
            when: (o) => o.source === "template",
            render: ({ props, set }) => <ContentEditor p={props} set={set} mode="template" />,
            validate: (_, o) => (o.source === "template" ? (templateProblem(o)?.msg ?? null) : null),
          },
        ],
      },
      {
        tab: "general",
        title: L("Display", "Tampilan"),
        fields: [
          {
            t: "seg",
            k: "size",
            label: L("Size", "Ukuran"),
            options: SIZES.map((s, i) => ({ v: s, label: L(`${"SML"[i]} · ${s} px`) })),
            hint: L("Width of the code with its white margin, on screen. Never wider than the form.", "Lebar kode beserta margin putihnya di layar. Tidak pernah melebihi lebar form."),
          },
          {
            t: "seg",
            k: "ecc",
            label: L("Error correction", "Koreksi kesalahan"),
            options: ECCS.map((e) => ({ v: e.v, label: L(`${e.v} · ${e.pct}`) })),
            hint: L(
              "How much of the code can be damaged and still scan. **Q** or **H** for printed labels that get scratched; higher levels make the code denser.",
              "Seberapa banyak bagian kode boleh rusak dan tetap terbaca. **Q** atau **H** untuk label cetak yang mudah tergores; level lebih tinggi membuat kode lebih rapat.",
            ),
          },
          ...(density ? [{ t: "note" as const, tone: density.tone, text: density.text }] : []),
          { t: "switch", k: "showText", label: L("Show the text under the code", "Tampilkan teks di bawah kode"), hint: L("For people who can’t scan it.", "Untuk yang tidak bisa memindainya.") },
          {
            t: "switch",
            k: "allowDownload",
            label: L("Allow download", "Boleh diunduh"),
            hint: L("A **Download PNG** button (about 1024 px, sharp for printing).", "Tombol **Unduh PNG** (sekitar 1024 px, tajam untuk dicetak)."),
          },
          { t: "i18n", k: "caption", label: L("Caption", "Keterangan"), hint: L("Optional. Shown under the code.", "Opsional. Tampil di bawah kode.") },
        ],
      },
      { tab: "validation", fields: [{ t: "note", text: L("Display only — nothing to validate.", "Hanya tampilan — tidak ada yang divalidasi.") }] },
    ]
  },
  fieldLabel: (p) => p.label,
  isRequired: () => false,
  Canvas: QrCanvas,
  canvasWarn: (p) => contentProblem(p)?.short ?? null,

  Runtime: QrRuntime,
  Controls: QrControls,
  hasControls: (p) => p.source !== "text",
  controlsTitle: L("Process variables", "Variabel proses"),
  Aside: QrAside,
  initial: context,
  sample: context,
  validate: () => [],
  value: () => null,

  spec: (p) => ({
    ui_type: "QR_CODE",
    value_kind: "none",
    name: p.name,
    label: p.label,
    config: {
      content: contentSpec(p),
      size_px: p.size,
      ecc: p.ecc,
      show_text: p.showText,
      allow_download: p.allowDownload,
      caption: hasCaption(p) ? p.caption : null,
    },
  }),
  savedAs: () =>
    L(
      "Nothing. The code is drawn in the browser from the spec and the process variables each time the task opens.",
      "Tidak ada. Kode digambar di browser dari spec dan variabel proses setiap kali task dibuka.",
    ),
  notes: [
    L(
      "The code is generated in the browser by our own encoder (`qr-display-encode.ts`: byte mode UTF-8, versions 1–40, levels L / M / Q / H, all 8 masks with penalty scoring). No library and no external service, so the content never leaves the app.",
      "Kode dibuat di browser oleh encoder sendiri (`qr-display-encode.ts`: mode byte UTF-8, versi 1–40, level L / M / Q / H, 8 mask dengan skor penalti). Tanpa library dan tanpa layanan luar, jadi isinya tidak pernah keluar dari aplikasi.",
    ),
    L(
      `The label printed here is what **Barcode / QR scan** (Wave 2) reads in the asset audit, which expects \`${AUDIT_FORMAT}\`. Keep audited labels on the plain \`asset_tag\`; a link template such as \`https://aset.javan.id/a/{asset_tag}\` opens the asset page from any phone camera but fails that format.`,
      `Label yang dicetak di sini dibaca **Pindai barcode / QR** (Gelombang 2) saat audit aset, dengan format \`${AUDIT_FORMAT}\`. Untuk label yang diaudit, pakai \`asset_tag\` polos; templat tautan seperti \`https://aset.javan.id/a/{asset_tag}\` membuka halaman aset dari kamera ponsel mana pun, tetapi tidak lolos format itu.`,
    ),
    L(
      "Variables are read when the task opens. An empty variable shows “Not available yet” — never a code made from a half-filled template. In a link template the values are URL-encoded.",
      "Variabel dibaca saat task dibuka. Variabel kosong menampilkan “Belum tersedia” — tidak pernah kode dari templat yang setengah terisi. Di templat tautan, nilainya di-encode untuk URL.",
    ),
    L(
      "Always black on white with a 4-module quiet zone, also in dark mode: scanners need dark modules on a light background. Shown as SVG at the chosen size; **Download PNG** draws about 1024 px on a canvas with whole pixels per module, sharp for printing.",
      "Selalu hitam di atas putih dengan quiet zone 4 modul, juga di mode gelap: pemindai butuh modul gelap di latar terang. Tampil sebagai SVG pada ukuran yang dipilih; **Unduh PNG** menggambar sekitar 1024 px di canvas dengan piksel utuh per modul, tajam untuk dicetak.",
    ),
    L(
      "Sends no value (`value_kind: \"none\"`): nothing in the payload, draft or history. Only the spec is stored.",
      "Tidak mengirim nilai (`value_kind: \"none\"`): tidak ada di payload, draf, maupun history. Hanya spec yang disimpan.",
    ),
  ],
  dataExtra: (p, r): DataExtra[] => {
    const c = resolve(p, r.vars)
    const qr = c.kind === "ok" ? encodeQr(c.text, p.ecc) : null
    return [
      {
        title: L("Encoded content", "Isi kode"),
        sub: L("Computed in the browser when the task opens · not saved", "Dihitung di browser saat task dibuka · tidak disimpan"),
        json:
          c.kind === "ok"
            ? { text: c.text, bytes: utf8(c.text).length, version: qr?.version ?? null, modules: qr?.size ?? null, ecc: p.ecc, mask: qr?.mask ?? null }
            : { text: null, missing: c.kind === "missing" ? c.keys : [], ecc: p.ecc },
      },
    ]
  },
  story: {
    process: L("Asset registration", "Registrasi aset"),
    step: L("Label the asset", "Pasang label aset"),
    ref: "AST-2026-00418",
    due: "2026-11-16",
    task: L("Label the new laptop for Dewi Kartika", "Pasang label laptop baru untuk Dewi Kartika"),
    after: [
      {
        name: "label_attached",
        label: L("Label printed and attached", "Label sudah dicetak dan ditempel"),
        type: "checkbox",
        required: true,
        value: "",
        requiredMsg: L("Print and attach the label first", "Cetak dan tempel labelnya dulu"),
      },
      {
        name: "location",
        label: L("Location", "Lokasi"),
        type: "text",
        value: "",
        placeholder: L("e.g. Gedung Utama · Lantai 3 — Ruang Merapi", "mis. Gedung Utama · Lantai 3 — Ruang Merapi"),
      },
    ],
  },
}
