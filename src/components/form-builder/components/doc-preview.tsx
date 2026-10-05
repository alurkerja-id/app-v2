/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useEffect, useEffectEvent, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  Alert02Icon,
  ArrowDown01Icon,
  ArrowHorizontalIcon,
  ArrowUp01Icon,
  BookOpen01Icon,
  Delete02Icon,
  Doc01Icon,
  Download01Icon,
  FileEmpty01Icon,
  FileNotFoundIcon,
  FileViewIcon,
  FitToScreenIcon,
  InformationCircleIcon,
  Link01Icon,
  LinkSquare02Icon,
  MinusSignIcon,
  Pdf01Icon,
  PlusSignIcon,
  Refresh01Icon,
  Tick02Icon,
  Upload01Icon,
  VariableIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { L, useT, type L10n } from "../i18n"
import { F } from "../lib"
import type { ComponentDef, FieldState, Issue, RuntimeProps } from "../types"
import { A4_RATIO, A4_W, CONTRACT_PDF, PaperPage, SkeletonPage, UPLOADS, asDocx, fileFromUrl, sizeText, type MockDoc, type MockFile } from "./doc-preview-paper"

/* Document / PDF preview — ui_type DOC_PREVIEW, value_kind "none". Story: Legal reads the
   maintenance contract uploaded in an earlier step, then approves or asks for changes.
   No PDF library here: pages are drawn from mock text (see doc-preview-paper). */

type DocSource = "variable" | "upload" | "url"
type Fit = "width" | "page"

interface DocPreviewProps {
  label: L10n
  /** Key: identity of the node only — the preview sends no value. */
  name: string
  source: DocSource
  /** `file` process variable set by an earlier step. */
  variable: string
  /** Id of the file picked in the builder (UPLOADS); "" = none yet. */
  file: string
  url: string
  /** Viewer height; "" while the stepper is being edited. */
  heightPx: number | ""
  fit: Fit
  allowDownload: boolean
  allowNewTab: boolean
  requireRead: boolean
}

type DocSim = "pdf" | "slow" | "broken" | "word" | "empty"

/** Prototype state: the simulated file, a reload counter and the furthest page reached. Never submitted. */
interface DocPreviewValue {
  sim: DocSim
  load: number
  /** Highest page seen so far (1-based); 0 before the document has loaded. */
  furthest: number
}

/* ── mock sources ───────────────────────────────────────────────────────── */

interface FileVar {
  step: L10n
  file: MockFile | null
}

const VARS: Record<string, FileVar> = {
  contract_file: { step: L("Draft contract", "Susun draf kontrak"), file: CONTRACT_PDF },
  signed_contract: { step: L("Signing (not reached yet)", "Penandatanganan (belum sampai)"), file: null },
}
const VAR_KEYS = Object.keys(VARS)

const SIMS: { v: DocSim; label: L10n; desc: L10n; varOnly?: boolean }[] = [
  { v: "pdf", label: L("PDF"), desc: L("The PDF loads in about a second.", "PDF termuat dalam sekitar satu detik.") },
  { v: "slow", label: L("Slow", "Lambat"), desc: L("Slow connection: the PDF takes 4 seconds.", "Koneksi lambat: PDF butuh 4 detik.") },
  { v: "broken", label: L("Broken", "Rusak"), desc: L("The file can't be fetched (expired link, server down).", "Berkas tidak bisa diambil (tautan kedaluwarsa, server mati).") },
  { v: "word", label: L("Word file", "Berkas Word"), desc: L("The earlier step uploaded a .docx instead.", "Langkah sebelumnya mengunggah .docx."), varOnly: true },
  { v: "empty", label: L("Empty", "Kosong"), desc: L("Nothing uploaded yet.", "Belum ada yang diunggah."), varOnly: true },
]
const simsFor = (p: DocPreviewProps) => SIMS.filter((s) => !s.varOnly || p.source === "variable")

const LOAD_MS = 900
const SLOW_MS = 4000
const ZOOMS = [50, 67, 75, 90, 100, 110, 125, 150, 175, 200]

const heightOf = (p: DocPreviewProps) => Math.min(1000, Math.max(320, Number(p.heightPx) || 560))

function urlErr(v: unknown): L10n | null {
  const s = String(v ?? "").trim()
  if (!s) return L("Enter the link to the document", "Isi tautan dokumen")
  let u: URL
  try {
    u = new URL(s)
  } catch {
    return L("Enter a full link, e.g. https://dms.perusahaan.co.id/…", "Isi tautan lengkap, mis. https://dms.perusahaan.co.id/…")
  }
  return u.protocol === "https:" ? null : L("Use an https:// link", "Gunakan tautan https://")
}

/** The file the source points at. `null` = the variable is still empty; `undefined` = not set up. */
function sourceFile(p: DocPreviewProps): MockFile | null | undefined {
  if (p.source === "variable") return VARS[p.variable]?.file
  if (p.source === "upload") return UPLOADS.find((f) => f.id === p.file)
  return urlErr(p.url) ? undefined : fileFromUrl(p.url)
}

type View =
  | { kind: "pdf"; file: MockFile; doc: MockDoc }
  | { kind: "other"; file: MockFile }
  | { kind: "error"; file: MockFile }
  | { kind: "empty" }
  | { kind: "unset" }

/** What the runtime shows for a source and a simulated answer. */
function viewOf(p: DocPreviewProps, sim: DocSim): View {
  const f = sourceFile(p)
  if (f === undefined) return { kind: "unset" }
  const byVar = p.source === "variable"
  if (f === null || (byVar && sim === "empty")) return { kind: "empty" }
  const file = byVar && sim === "word" ? asDocx(f) : f
  if (sim === "broken") return { kind: "error", file }
  return file.doc ? { kind: "pdf", file, doc: file.doc } : { kind: "other", file }
}

/** "Contract" → "contract"; keeps acronyms such as "SOP" or "PKS". */
const lower = (s: string) => (/^\p{Lu}\p{Ll}/u.test(s) ? s[0].toLowerCase() + s.slice(1) : s)
const readMsg = (p: DocPreviewProps) =>
  L(
    `Read the ${lower(p.label.en)} to the last page before completing`,
    `Baca ${lower(p.label.id || p.label.en)} sampai halaman terakhir sebelum menyelesaikan`,
  )

const toastDownload = (name: string) => L(`Prototype: ${name} would download now`, `Prototipe: ${name} akan terunduh sekarang`)
const toastNewTab = (name: string) =>
  L(`Prototype: ${name} would open in a new tab through a short-lived link`, `Prototipe: ${name} akan terbuka di tab baru lewat tautan berumur pendek`)

/* ── shared bits ────────────────────────────────────────────────────────── */

function fileIcon(f: MockFile): [IconSvgElement, string] {
  return f.doc ? [Pdf01Icon, "bg-muted text-muted-foreground"] : [Doc01Icon, "bg-primary/10 text-primary"]
}

function FileName({ file, pages }: { file: MockFile; pages?: number }) {
  const t = useT()
  const [icon, tone] = fileIcon(file)
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", tone)}>
        <HugeiconsIcon icon={icon} className="size-4.5" />
      </span>
      <span className="min-w-0 leading-tight">
        <b className="block truncate text-[13px] font-medium" title={file.name}>
          {file.name}
        </b>
        <small className="text-xs text-muted-foreground">
          {t(sizeText(file.size))}
          {pages ? ` · ${t(L(`${pages} pages`, `${pages} halaman`))}` : ""}
        </small>
      </span>
    </div>
  )
}

function StateBox({ icon, title, text, bad, children }: { icon: IconSvgElement; title?: L10n; text: L10n; bad?: boolean; children?: ReactNode }) {
  const t = useT()
  return (
    <Empty className="gap-3 p-8">
      <EmptyHeader className="gap-1.5">
        <EmptyMedia variant="icon" className={cn(bad && "bg-destructive/10 text-destructive")}>
          <HugeiconsIcon icon={icon} />
        </EmptyMedia>
        {title && <EmptyTitle className="text-sm">{t(title)}</EmptyTitle>}
        <EmptyDescription className="text-xs">{t(text)}</EmptyDescription>
      </EmptyHeader>
      {children}
    </Empty>
  )
}

function Frame({ bad, off, children }: { bad?: boolean; off?: boolean; children: ReactNode }) {
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-2xl border border-border bg-card", bad && "border-destructive ring-3 ring-destructive/20", off && "opacity-60")}>
      {children}
    </div>
  )
}

/** A file type that can't be previewed: a card with Download only. */
function OtherFile({ p, file, off, still }: { p: DocPreviewProps; file: MockFile; off?: boolean; still?: boolean }) {
  const t = useT()
  const label = t(L("Download", "Unduh"))
  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <FileName file={file} />
        </div>
        {p.allowDownload &&
          (still ? (
            <span className={buttonVariants({ variant: "outline", size: "sm" })} aria-hidden>
              <HugeiconsIcon icon={Download01Icon} />
              {label}
            </span>
          ) : (
            <Button variant="outline" size="sm" disabled={off} onClick={() => toast.info(t(toastDownload(file.name)))}>
              <HugeiconsIcon icon={Download01Icon} />
              {label}
            </Button>
          ))}
      </div>
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <HugeiconsIcon icon={InformationCircleIcon} className="mt-px size-3.5 shrink-0" />
        <span>
          {t(L("Preview works for PDF and images", "Pratinjau tersedia untuk PDF dan gambar"))}
          {" — "}
          {t(
            p.allowDownload
              ? L("download the file to read it.", "unduh berkas untuk membacanya.")
              : L("and downloading is turned off, so ask the process admin for the file.", "dan unduhan dimatikan, jadi minta berkasnya ke admin proses."),
          )}
        </span>
      </p>
    </div>
  )
}

/** Builder: where the file comes from. */
function SourceLine({ p }: { p: DocPreviewProps }) {
  const t = useT()
  let host = ""
  try {
    host = new URL(p.url).hostname
  } catch {
    host = p.url
  }
  const [icon, text]: [IconSvgElement, ReactNode] =
    p.source === "variable"
      ? [VariableIcon, <>{t(L("From ", "Dari "))}<span className="font-mono">{p.variable}</span></>]
      : p.source === "upload"
        ? [Upload01Icon, t(L("Fixed file, saved with the form", "Berkas tetap, disimpan bersama form"))]
        : [Link01Icon, <span className="font-mono">{host || "—"}</span>]
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <HugeiconsIcon icon={icon} className="size-3.5 shrink-0" />
      <span className="min-w-0 truncate">{text}</span>
      {p.requireRead && (
        <Badge variant="secondary" className="text-[10px]">
          {t(L("Must read to the end", "Wajib dibaca sampai akhir"))}
        </Badge>
      )}
    </div>
  )
}

/* ── builder ────────────────────────────────────────────────────────────── */

function DocPreviewCanvas({ props: p }: { props: DocPreviewProps }) {
  const view = viewOf(p, "pdf")
  const h = Math.round(heightOf(p) / 2)
  /* Container units: the page follows the canvas width without measuring it. */
  const width = p.fit === "page" ? `min(100cqw - 2rem, ${Math.round((h - 32) / A4_RATIO)}px)` : "calc(100cqw - 2rem)"
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {view.kind === "pdf" ? (
        <Frame>
          <div className="flex items-center gap-3 border-b border-border px-2.5 py-2">
            <div className="min-w-0 flex-1">
              <FileName file={view.file} pages={view.doc.pages.length} />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">1 / {view.doc.pages.length}</span>
            <HugeiconsIcon icon={p.fit === "page" ? FitToScreenIcon : ArrowHorizontalIcon} className="size-4 text-muted-foreground" />
            {p.allowDownload && <HugeiconsIcon icon={Download01Icon} className="size-4 text-muted-foreground" />}
            {p.allowNewTab && <HugeiconsIcon icon={LinkSquare02Icon} className="size-4 text-muted-foreground" />}
          </div>
          <div className="@container overflow-hidden bg-muted dark:bg-muted/40" style={{ height: h }}>
            <div className="flex justify-center p-4">
              <PaperPage doc={view.doc} n={1} width={width} />
            </div>
          </div>
        </Frame>
      ) : view.kind === "other" ? (
        <Frame>
          <OtherFile p={p} file={view.file} still />
        </Frame>
      ) : view.kind === "empty" ? (
        <Frame>
          <StateBox icon={FileEmpty01Icon} text={L("No document yet — it is uploaded in an earlier step.", "Belum ada dokumen — diunggah di langkah sebelumnya.")} />
        </Frame>
      ) : (
        <Frame>
          <StateBox bad icon={Alert02Icon} text={L("Choose the document in Edit Element.", "Pilih dokumennya di Edit Element.")} />
        </Frame>
      )}
      <SourceLine p={p} />
    </div>
  )
}

/** Edit Element: the fixed file (prototype: pick one of the mock files). */
function FilePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const t = useT()
  const cur = UPLOADS.find((f) => f.id === value)
  return (
    <div className="flex flex-col gap-2">
      {cur && (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card py-2 pr-2 pl-2.5">
          <div className="min-w-0 flex-1">
            <FileName file={cur} pages={cur.doc?.pages.length} />
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t(L("Remove file", "Hapus berkas"))}
            onClick={() => onChange("")}
            className="text-muted-foreground hover:text-destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} />
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t(L("Prototype: pick a file to “upload”.", "Prototipe: pilih berkas untuk “diunggah”."))}</p>
      <div className="flex flex-wrap gap-1.5">
        {UPLOADS.map((f) => (
          <Button
            key={f.id}
            variant="outline"
            size="xs"
            aria-pressed={f.id === value}
            onClick={() => onChange(f.id)}
            className={cn("max-w-full", f.id === value && "border-primary/40 bg-primary/5 text-foreground")}
          >
            <HugeiconsIcon icon={fileIcon(f)[0]} />
            <span className="truncate">{f.name}</span>
          </Button>
        ))}
      </div>
      {cur && !cur.doc && (
        <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <HugeiconsIcon icon={Alert02Icon} className="size-3.5 shrink-0" />
          {t(L("Word files can't be previewed; users only get a Download button.", "Berkas Word tidak bisa dipratinjau; user hanya mendapat tombol Unduh."))}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {t(L("Saved with the form, so every task shows the same file.", "Disimpan bersama form, jadi setiap task menampilkan berkas yang sama."))}
      </p>
    </div>
  )
}

/* ── runtime viewer ─────────────────────────────────────────────────────── */

/** A fit mode, or a fixed zoom in percent. */
type Zoom = Fit | number

function pageWidth(zoom: Zoom, box: { w: number; h: number }, pad: number) {
  if (!box.w) return 0
  if (typeof zoom === "number") return Math.round((A4_W * zoom) / 100)
  const availW = Math.max(120, box.w - pad * 2)
  if (zoom === "width") return Math.floor(availW)
  return Math.floor(Math.min(availW, Math.max(120, box.h - pad * 2) / A4_RATIO))
}

function ToolButton({ label, icon, onClick, disabled }: { label: string; icon: IconSvgElement; onClick: () => void; disabled?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} disabled={disabled} onClick={onClick}>
          <HugeiconsIcon icon={icon} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

interface ViewerProps {
  p: DocPreviewProps
  v: DocPreviewValue
  onChange: (next: DocPreviewValue) => void
  state: FieldState
  bad: boolean
  compact: boolean
  id: string
  file: MockFile
  /** null while a file that will fail is still "loading". */
  doc: MockDoc | null
  loading: boolean
}

function PdfViewer({ p, v, onChange, state, bad, compact, id, file, doc, loading }: ViewerProps) {
  const t = useT()
  const scroller = useRef<HTMLDivElement>(null)
  /** Scroll position as a share of the content height, kept when the zoom changes. */
  const frac = useRef(0)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState<Zoom>(p.fit)
  const [page, setPage] = useState(1)
  const total = doc?.pages.length ?? 0
  const live = state === "active"
  const off = state === "disabled"
  const pad = compact ? 12 : 20
  const pageW = pageWidth(zoom, box, pad)
  const pct = Math.round((pageW / A4_W) * 100)
  const ready = !loading && doc != null && pageW > 0

  /* The scroll area's inner size drives "fit width" / "fit page". */
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const next = { w: el.clientWidth, h: el.clientHeight }
      setBox((b) => (b.w === next.w && b.h === next.h ? b : next))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /**
   * Current page = the page taking most of the viewport (ties → the earlier one).
   * Reaching the bottom counts as reaching the last page; the furthest page goes into
   * the value for "must read to the end".
   */
  const track = () => {
    const el = scroller.current
    if (!el || !ready) return
    const pages = el.querySelectorAll<HTMLElement>("[data-page]")
    if (!pages.length) return
    const top = el.scrollTop
    const bottom = top + el.clientHeight
    frac.current = el.scrollHeight ? top / el.scrollHeight : 0
    let cur = 1
    let best = -1
    pages.forEach((pg) => {
      const seen = Math.min(bottom, pg.offsetTop + pg.offsetHeight) - Math.max(top, pg.offsetTop)
      if (seen > best + 1) {
        best = seen
        cur = Number(pg.dataset.page) || 1
      }
    })
    setPage(cur)
    const reached = bottom >= el.scrollHeight - 4 ? total : cur
    if (live && reached > v.furthest) onChange({ ...v, furthest: reached })
  }
  const trackLater = useEffectEvent(track)

  /* Measure once when the pages appear, the zoom changes or the value is reset (Reset form):
     none of these fires a scroll event. */
  useEffect(() => {
    if (!ready) return
    const raf = requestAnimationFrame(() => trackLater())
    return () => cancelAnimationFrame(raf)
  }, [ready, pageW, v.furthest])

  /* Zooming keeps the same place in the document in view. */
  useLayoutEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = frac.current * el.scrollHeight
  }, [pageW])

  const smooth = (): ScrollBehavior => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth")
  const goTo = (n: number) => {
    const el = scroller.current
    const pg = el?.querySelector<HTMLElement>(`[data-page="${n}"]`)
    if (el && pg) el.scrollTo({ top: pg.offsetTop - pad, behavior: smooth() })
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!ready || (e.key !== "PageDown" && e.key !== "PageUp")) return
    e.preventDefault()
    const dir = e.key === "PageDown" ? 1 : -1
    const target = page + dir
    // Past the first / last page: scroll within it, like the browser would.
    if (target < 1 || target > total) e.currentTarget.scrollBy({ top: dir * e.currentTarget.clientHeight * 0.9, behavior: smooth() })
    else goTo(target)
  }
  const zoomIn = () => {
    const z = ZOOMS.find((x) => x > pct)
    if (z) setZoom(z)
  }
  const zoomOut = () => {
    const z = [...ZOOMS].reverse().find((x) => x < pct)
    if (z) setZoom(z)
  }

  const fitItems: [Fit, IconSvgElement, L10n][] = [
    ["width", ArrowHorizontalIcon, L("Fit width", "Pas lebar")],
    ["page", FitToScreenIcon, L("Fit page", "Pas halaman")],
  ]

  return (
    <div className={cn("flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card", bad && "border-destructive ring-3 ring-destructive/20", off && "opacity-60")}>
      <div
        role="group"
        aria-label={t(L("Document controls", "Kontrol dokumen"))}
        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border px-2.5 py-2"
      >
        <div className={cn("min-w-0 flex-1", compact ? "basis-full" : "basis-48")}>
          <FileName file={file} pages={ready ? total : undefined} />
        </div>
        {!ready ? (
          <span role="status" className="flex h-8 items-center gap-2 px-1 text-xs text-muted-foreground">
            <Spinner aria-hidden className="size-3.5" />
            {t(L("Loading document…", "Memuat dokumen…"))}
          </span>
        ) : (
          <>
            <div className="flex items-center">
              <ToolButton label={t(L("Previous page", "Halaman sebelumnya"))} icon={ArrowUp01Icon} disabled={page <= 1} onClick={() => goTo(page - 1)} />
              <span className="min-w-11 text-center text-xs tabular-nums">
                <span className="sr-only">{t(L("Page", "Halaman"))} </span>
                {page} / {total}
              </span>
              <ToolButton label={t(L("Next page", "Halaman berikutnya"))} icon={ArrowDown01Icon} disabled={page >= total} onClick={() => goTo(page + 1)} />
            </div>
            <div className="flex items-center">
              <ToolButton label={t(L("Zoom out", "Perkecil"))} icon={MinusSignIcon} disabled={pct <= ZOOMS[0]} onClick={zoomOut} />
              <span className="w-11 text-center text-xs tabular-nums" aria-live="polite">
                {pct}%
              </span>
              <ToolButton label={t(L("Zoom in", "Perbesar"))} icon={PlusSignIcon} disabled={pct >= ZOOMS[ZOOMS.length - 1]} onClick={zoomIn} />
              <ToggleGroup
                type="single"
                size="sm"
                value={typeof zoom === "string" ? zoom : ""}
                onValueChange={(x) => (x === "width" || x === "page") && setZoom(x)}
                aria-label={t(L("Fit", "Pas"))}
                className="ml-1"
              >
                {fitItems.map(([k, icon, label]) => (
                  <Tooltip key={k}>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value={k} aria-label={t(label)} className="px-2">
                        <HugeiconsIcon icon={icon} />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>{t(label)}</TooltipContent>
                  </Tooltip>
                ))}
              </ToggleGroup>
            </div>
          </>
        )}
        {(p.allowDownload || p.allowNewTab) && (
          <div className={cn("flex items-center", (compact || !ready) && "ml-auto")}>
            {p.allowDownload && (
              <ToolButton label={t(L("Download", "Unduh"))} icon={Download01Icon} disabled={off} onClick={() => toast.info(t(toastDownload(file.name)))} />
            )}
            {p.allowNewTab && (
              <ToolButton
                label={t(L("Open in a new tab", "Buka di tab baru"))}
                icon={LinkSquare02Icon}
                disabled={off || !ready}
                onClick={() => toast.info(t(toastNewTab(file.name)))}
              />
            )}
          </div>
        )}
      </div>
      <div
        ref={scroller}
        id={`${id}-input`}
        role="region"
        aria-labelledby={`${id}-label`}
        aria-busy={!ready || undefined}
        aria-invalid={bad || undefined}
        tabIndex={0}
        onScroll={ready ? track : undefined}
        onKeyDown={onKey}
        className="relative overflow-auto bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-inset dark:bg-muted/40"
        style={{ height: compact ? "70vh" : heightOf(p) }}
      >
        <div className="flex flex-col items-center" style={{ width: "max-content", minWidth: "100%", padding: pad, gap: Math.round(pad * 0.8) }}>
          {pageW > 0 &&
            (ready && doc
              ? doc.pages.map((_, i) => <PaperPage key={i} doc={doc} n={i + 1} width={`${pageW}px`} />)
              : [1, 2].map((i) => <SkeletonPage key={i} width={`${pageW}px`} />))}
        </div>
      </div>
    </div>
  )
}

function DocPreviewRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<DocPreviewProps, DocPreviewValue>) {
  const t = useT()
  const view = viewOf(p, v.sim)
  const loads = view.kind === "pdf" || view.kind === "error"
  /* Every change to the file or the simulation (and Retry / Reload) fetches again. */
  const reqKey = JSON.stringify([p.source, p.variable, p.file, p.url, v.sim, v.load])
  const delay = v.sim === "slow" ? SLOW_MS : LOAD_MS
  const [doneKey, setDoneKey] = useState<string | null>(null)
  useEffect(() => {
    if (!loads) return
    const timer = window.setTimeout(() => setDoneKey(reqKey), delay)
    return () => window.clearTimeout(timer)
  }, [reqKey, delay, loads])
  const loading = loads && doneKey !== reqKey
  const bad = issues.length > 0
  const off = state === "disabled"

  if (view.kind === "pdf" || (view.kind === "error" && loading)) {
    const n = view.kind === "pdf" ? view.doc.pages.length : 0
    const done = n > 0 && v.furthest >= n
    return (
      <div className="flex min-w-0 flex-col gap-1.5">
        <PdfViewer
          key={`${reqKey}|${p.fit}`}
          p={p}
          v={v}
          onChange={onChange}
          state={state}
          bad={bad}
          compact={compact}
          id={id}
          file={view.file}
          doc={view.kind === "pdf" ? view.doc : null}
          loading={loading}
        />
        {p.requireRead && state === "active" && n > 0 && !loading && (
          <p className={cn("flex items-center gap-1.5 text-xs", done ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}>
            <HugeiconsIcon icon={done ? Tick02Icon : BookOpen01Icon} className="size-3.5 shrink-0" />
            {t(
              done
                ? L("You reached the last page.", "Anda sudah sampai halaman terakhir.")
                : L(
                    `Scroll to page ${n} before Complete Task · furthest so far: page ${Math.max(1, v.furthest)}`,
                    `Gulir sampai halaman ${n} sebelum Selesaikan Task · terjauh: halaman ${Math.max(1, v.furthest)}`,
                  ),
            )}
          </p>
        )}
      </div>
    )
  }

  if (view.kind === "error") {
    return (
      <Frame bad={bad} off={off}>
        <div role="alert">
          <StateBox
            bad
            icon={FileNotFoundIcon}
            title={L("Couldn't load the document", "Dokumen gagal dimuat")}
            text={L(
              "The link may have expired or the file server didn't answer. Your other answers are kept.",
              "Tautan mungkin kedaluwarsa atau server berkas tidak menjawab. Isian Anda yang lain tetap tersimpan.",
            )}
          >
            <Button variant="outline" size="sm" disabled={off} onClick={() => onChange({ sim: "pdf", load: v.load + 1, furthest: 0 })}>
              <HugeiconsIcon icon={Refresh01Icon} />
              {t(L("Retry", "Coba lagi"))}
            </Button>
          </StateBox>
        </div>
      </Frame>
    )
  }

  if (view.kind === "other") {
    return (
      <Frame bad={bad} off={off}>
        <OtherFile p={p} file={view.file} off={off} />
      </Frame>
    )
  }

  return (
    <Frame off={off}>
      {view.kind === "empty" ? (
        <StateBox icon={FileEmpty01Icon} text={L("No document yet — it is uploaded in an earlier step.", "Belum ada dokumen — diunggah di langkah sebelumnya.")} />
      ) : (
        <StateBox icon={Alert02Icon} text={L("The form owner hasn't set the document yet.", "Pemilik form belum mengatur dokumennya.")} />
      )}
    </Frame>
  )
}

/* ── simulation controls ────────────────────────────────────────────────── */

function DocPreviewControls({ props: p, value: v, onChange }: { props: DocPreviewProps; value: DocPreviewValue; onChange: (next: DocPreviewValue) => void }) {
  const t = useT()
  const id = useId()
  const sims = simsFor(p)
  const cur = sims.find((s) => s.v === v.sim) ?? sims[0]
  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-sim`} className="text-xs text-muted-foreground">
        {p.source === "variable" ? (
          <>
            {t(L("What ", "Isi "))}
            <span className="font-mono">{p.variable}</span>
            {t(L(" holds", ""))}
          </>
        ) : (
          t(L("What the file server returns", "Jawaban server berkas"))
        )}
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={1}
        value={v.sim}
        aria-labelledby={`${id}-sim`}
        onValueChange={(x) => {
          const s = sims.find((o) => o.v === x)
          if (s) onChange({ sim: s.v, load: v.load + 1, furthest: 0 })
        }}
        className="flex-wrap"
      >
        {sims.map((s) => (
          <ToggleGroupItem key={s.v} value={s.v} className="px-3 text-xs">
            {t(s.label)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-xs text-muted-foreground">{t(cur.desc)}</p>
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => onChange({ ...v, load: v.load + 1, furthest: 0 })}>
        <HugeiconsIcon icon={Refresh01Icon} />
        {t(L("Reload", "Muat ulang"))}
      </Button>
    </div>
  )
}

/* ── definition ─────────────────────────────────────────────────────────── */

function validate(p: DocPreviewProps, v: DocPreviewValue): Issue[] {
  if (!p.requireRead) return []
  const view = viewOf(p, v.sim)
  // Nothing to read (empty, or a type that can't be previewed) never blocks; a failed load does — Retry is right there.
  const unread = (view.kind === "pdf" && v.furthest < view.doc.pages.length) || view.kind === "error"
  return unread ? [{ fid: "doc-read", msg: readMsg(p) }] : []
}

const initial = (): DocPreviewValue => ({ sim: "pdf", load: 0, furthest: 0 })

export const docPreview: ComponentDef<DocPreviewProps, DocPreviewValue> = {
  slug: "doc-preview",
  wave: 3,
  ui: "DOC_PREVIEW",
  vk: "none",
  group: "display",
  week: 5,
  icon: FileViewIcon,
  label: L("Document / PDF preview", "Pratinjau dokumen / PDF"),
  title: L("Document / PDF preview", "Pratinjau dokumen / PDF"),
  blurb: L("Read a PDF or image inside the task, without downloading it first.", "Membaca PDF atau gambar di dalam task, tanpa mengunduh dulu."),

  defaults: () => ({
    label: L("Contract", "Kontrak"),
    name: "contract_preview",
    source: "variable",
    variable: "contract_file",
    file: UPLOADS[0].id,
    url: "https://dms.perusahaan.co.id/files/CTR-2026-0098.pdf",
    heightPx: 560,
    fit: "width",
    allowDownload: true,
    allowNewTab: true,
    requireRead: true,
  }),
  schema: (p) => [
    {
      tab: "general",
      fields: [
        F.name(),
        F.key(
          L(
            "Identity of the node. The preview sends no value, so nothing is saved under this key.",
            "Identitas node. Pratinjau tidak mengirim nilai, jadi tidak ada yang tersimpan di key ini.",
          ),
        ),
      ],
    },
    {
      tab: "general",
      title: L("Document", "Dokumen"),
      fields: [
        {
          t: "seg",
          k: "source",
          label: L("Show the file from", "Tampilkan berkas dari"),
          options: [
            { v: "variable", label: L("Variable", "Variabel") },
            { v: "upload", label: L("Fixed file", "Berkas tetap") },
            { v: "url", label: L("Link", "Tautan") },
          ],
        },
        {
          t: "select",
          k: "variable",
          label: L("File variable", "Variabel berkas"),
          when: (o) => o.source === "variable",
          options: VAR_KEYS.map((k) => ({
            v: k,
            label: L(`${k} — ${VARS[k].step.en}${VARS[k].file ? "" : " · empty"}`, `${k} — ${VARS[k].step.id}${VARS[k].file ? "" : " · kosong"}`),
          })),
          hint: L("`file` variables set by earlier steps, e.g. the uploaded contract.", "Variabel `file` yang diisi langkah sebelumnya, mis. kontrak yang diunggah."),
        },
        {
          t: "custom",
          id: "file",
          label: L("File", "Berkas"),
          when: (o) => o.source === "upload",
          render: ({ props, set }) => <FilePicker value={props.file} onChange={(file) => set({ file })} />,
          validate: (_, o) => (UPLOADS.some((f) => f.id === o.file) ? null : L("Pick the file to show", "Pilih berkas yang ditampilkan")),
        },
        {
          t: "url",
          k: "url",
          label: L("Link", "Tautan"),
          placeholder: "https://dms.perusahaan.co.id/files/…",
          when: (o) => o.source === "url",
          validate: (v) => urlErr(v),
          hint: L(
            "Only `https://`. Prototype: any link shows the sample contract; a link to a `.docx` or `.xlsx` shows the download card.",
            "Hanya `https://`. Prototipe: tautan apa pun menampilkan contoh kontrak; tautan ke `.docx` atau `.xlsx` menampilkan kartu unduh.",
          ),
        },
      ],
    },
    {
      tab: "general",
      title: L("Viewer", "Penampil"),
      fields: [
        {
          t: "number",
          k: "heightPx",
          label: L("Height", "Tinggi"),
          min: 320,
          max: 1000,
          step: 20,
          suffix: "px",
          validate: (v) => {
            const n = Number(v)
            return v === "" || v == null || Number.isNaN(n) || n < 320 || n > 1000 ? L("Use 320–1000 px", "Gunakan 320–1000 px") : null
          },
          hint: L("Pages scroll inside this height. On phones the viewer takes about 70% of the screen.", "Halaman bergulir di dalam tinggi ini. Di ponsel penampil memakai sekitar 70% layar."),
        },
        {
          t: "seg",
          k: "fit",
          label: L("Initial zoom", "Zoom awal"),
          options: [
            { v: "width", label: L("Fit width", "Pas lebar") },
            { v: "page", label: L("Whole page", "Satu halaman penuh") },
          ],
          hint: L("Users can still zoom from 50% to 200%.", "User tetap bisa zoom 50% sampai 200%."),
        },
        {
          t: "switch",
          k: "allowDownload",
          label: L("Allow download", "Boleh diunduh"),
          hint: L(
            "Off: the file can only be read inside the task — and a file that can't be previewed can't be opened at all.",
            "Nonaktif: berkas hanya bisa dibaca di dalam task — dan berkas yang tidak bisa dipratinjau tidak bisa dibuka sama sekali.",
          ),
        },
        {
          t: "switch",
          k: "allowNewTab",
          label: L("Allow opening in a new tab", "Boleh dibuka di tab baru"),
          hint: L("Opens the browser's own viewer through a short-lived link.", "Membuka penampil bawaan browser lewat tautan berumur pendek."),
        },
      ],
    },
    {
      tab: "validation",
      fields: [
        {
          t: "switch",
          k: "requireRead",
          label: L("Must reach the last page before Complete Task", "Harus sampai halaman terakhir sebelum Selesaikan Task"),
          hint: L(
            `Message: “${readMsg(p).en}”. Skipped when there is no document or it can't be previewed.`,
            `Pesan: “${readMsg(p).id}”. Dilewati bila belum ada dokumen atau berkas tidak bisa dipratinjau.`,
          ),
        },
        {
          t: "note",
          text: L(
            "Reaching the last page is a UX guard, not proof that the document was read.",
            "Sampai halaman terakhir adalah pengaman UX, bukan bukti dokumen sudah dibaca.",
          ),
        },
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.requireRead,
  Canvas: DocPreviewCanvas,
  canvasWarn: (p) => {
    const f = sourceFile(p)
    if (f === undefined) return p.source === "url" ? L("The link is not valid", "Tautan tidak valid") : L("No file chosen", "Belum ada berkas")
    if (f && !f.doc && !p.allowDownload) return L("Can't be previewed or downloaded", "Tidak bisa dipratinjau atau diunduh")
    return null
  },

  Runtime: DocPreviewRuntime,
  Controls: DocPreviewControls,
  hasControls: (p) => sourceFile(p) != null,
  controlsTitle: L("Document", "Dokumen"),
  devices: true,
  initial,
  sample: initial,
  validate,
  value: () => undefined,

  spec: (p) => {
    const f = UPLOADS.find((x) => x.id === p.file)
    return {
      ui_type: "DOC_PREVIEW",
      value_kind: "none",
      name: p.name,
      label: p.label,
      required: p.requireRead,
      config: {
        source:
          p.source === "variable"
            ? { type: "variable", variable: p.variable }
            : p.source === "upload"
              ? { type: "upload", file: f ? { file_id: f.id, file_name: f.name, mime: f.mime, size: f.size } : null }
              : { type: "url", url: p.url },
        height_px: Number(p.heightPx),
        fit: p.fit,
        allow_download: p.allowDownload,
        allow_new_tab: p.allowNewTab,
        require_read_to_end: p.requireRead,
      },
    }
  },
  savedAs: (p) =>
    p.requireRead
      ? L(
          "Nothing. The furthest page reached is checked on Complete Task, then dropped.",
          "Tidak ada. Halaman terjauh yang dicapai dicek saat Selesaikan Task, lalu dibuang.",
        )
      : L("Nothing. The viewer only reads the file.", "Tidak ada. Penampil hanya membaca berkas."),
  notes: [
    L(
      "Rendering library and file access are **Wave 3 open decision 4**: e.g. `pdf.js` in the browser, with the file fetched through a short-lived signed URL issued under the task user's permission.",
      "Library render dan akses berkas adalah **keputusan terbuka Gelombang 3 no. 4**: mis. `pdf.js` di browser, dengan berkas diambil lewat signed URL berumur pendek yang diterbitkan atas izin user task.",
    ),
    L(
      "Only PDF and images (`.png`, `.jpg`, `.webp`) preview. Other types, e.g. `.docx`, show a file card with Download only.",
      "Hanya PDF dan gambar (`.png`, `.jpg`, `.webp`) yang bisa dipratinjau. Tipe lain, mis. `.docx`, tampil sebagai kartu berkas dengan Unduh saja.",
    ),
    L(
      "Nothing is saved: with `value_kind: \"none\"` submit, draft and history skip it.",
      "Tidak ada yang disimpan: dengan `value_kind: \"none\"` submit, draft, dan history melewatinya.",
    ),
    L(
      "“Read to the end” (`require_read_to_end`) is a UX guard, not proof of reading: it only checks that the viewer reached the last page before Complete Task.",
      "“Dibaca sampai akhir” (`require_read_to_end`) adalah pengaman UX, bukan bukti membaca: hanya mengecek penampil sudah sampai halaman terakhir sebelum Selesaikan Task.",
    ),
    L(
      "Pages stay white in dark mode, like paper; the toolbar and the area around the pages follow the theme.",
      "Halaman tetap putih di mode gelap, seperti kertas; toolbar dan area di sekitar halaman mengikuti tema.",
    ),
    L(
      "Keyboard: PageUp / PageDown move one page in the viewer. Read-only and disabled can still be read; disabled blocks download and new tab.",
      "Keyboard: PageUp / PageDown pindah satu halaman di penampil. Baca-saja dan nonaktif tetap bisa dibaca; nonaktif memblokir unduh dan tab baru.",
    ),
  ],
  story: {
    process: L("Contract approval", "Persetujuan kontrak"),
    step: L("Legal review", "Review legal"),
    ref: "CTR-2026-0098",
    due: "2026-11-11",
    task: L("Review: maintenance contract with CV Mitra Kantor", "Review: kontrak perawatan dengan CV Mitra Kantor"),
    after: [
      {
        name: "legal_decision",
        label: L("Decision", "Keputusan"),
        type: "select",
        required: true,
        value: "",
        options: [
          { v: "approve", label: L("Approve", "Setujui") },
          { v: "request_changes", label: L("Request changes", "Minta perubahan") },
          { v: "reject", label: L("Reject", "Tolak") },
        ],
      },
      {
        name: "legal_note",
        label: L("Review note", "Catatan review"),
        type: "textarea",
        required: true,
        value: "",
        rows: 3,
        placeholder: L(
          "e.g. Article 6: the 5% penalty cap is fine; Article 9 needs a 30-day notice.",
          "mis. Pasal 6: batas denda 5% sudah sesuai; Pasal 9 perlu pemberitahuan 30 hari.",
        ),
      },
    ],
  },
}
