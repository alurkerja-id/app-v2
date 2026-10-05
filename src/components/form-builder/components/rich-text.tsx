/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { createElement, useMemo, type MouseEvent, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { InformationCircleIcon, Note01Icon, VariableIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { L, useT, type L10n } from "../i18n"
import { F } from "../lib"
import type { ComponentDef, FieldState, RuntimeProps } from "../types"

/* Rich text from variable — ui_type RICH_TEXT_VIEW, value_kind "none".
   Story: the requester revises a procurement request using the manager's notes. */

/* ── mock process variables (set by earlier steps) ──────────────────────── */

interface ProcessVar {
  step: L10n
  html: string
}

const VARS: Record<string, ProcessVar> = {
  manager_notes: {
    step: L("Manager review", "Review atasan"),
    html:
      "<h3>Revisi sebelum diproses</h3>" +
      "<p>Permintaan sudah saya cek. Mohon perbaiki <strong>dua hal</strong> ini:</p>" +
      "<ul><li>Kurangi laptop menjadi <strong>2 unit</strong>; staf ketiga baru bergabung Januari.</li>" +
      "<li>Lampirkan <strong>3 penawaran vendor</strong> untuk monitor.</li></ul>" +
      '<p>Batas revisi <strong>Jumat, 9 Oktober 2026</strong>. Panduan perbandingan vendor ada di <a href="https://intranet.perusahaan.co.id/wiki/pengadaan">wiki pengadaan</a>.</p>' +
      "<h4>Catatan anggaran</h4><p>Sisa anggaran perangkat tim desain Q4: <strong>Rp41.000.000</strong>. Dua laptop dan dua monitor masih masuk.</p>",
  },
  vendor_summary: {
    step: L("Procurement check", "Cek pengadaan"),
    html:
      "<h3>Ringkasan penawaran monitor</h3>" +
      "<ol><li><strong>CV Mitra Kantor</strong> — Rp2.450.000/unit, kirim 3 hari kerja</li>" +
      "<li><strong>PT Data Prima</strong> — Rp2.390.000/unit, kirim 7 hari kerja</li>" +
      "<li><strong>PT Meubel Nusantara</strong> — tidak menawarkan monitor</li></ol>" +
      "<p>Rekomendasi: <strong>CV Mitra Kantor</strong>, karena waktu kirim lebih cepat.</p>",
  },
  hr_feedback: { step: L("HR review (not reached yet)", "Review HR (belum sampai)"), html: "" },
}
const VAR_KEYS = Object.keys(VARS)

interface RichTextProps {
  label: L10n
  /** Key: identity of the node only — this component sends no value. */
  name: string
  source: string
  fallback: L10n
  scroll: boolean
  maxHeight: number | ""
}
/** Prototype only: which variables the simulation has emptied. Never submitted. */
interface RichTextValue {
  empty: Record<string, boolean>
}

const heightOf = (p: RichTextProps) => Number(p.maxHeight) || 220

/* ── sanitising: whitelist, then build React elements (never innerHTML) ─── */

/** Formatting the box may show. Anything else is unwrapped to its text. */
const ALLOWED = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "ul", "ol", "li", "strong", "b", "em", "i", "u", "s", "code", "pre", "blockquote", "a", "span", "small", "sub", "sup"])
/** Dropped together with their content: scripts, frames, styles, embeds, forms, media (no network calls). */
const DROPPED = new Set(["script", "style", "iframe", "frame", "frameset", "object", "embed", "noscript", "template", "link", "meta", "base", "svg", "math", "form", "input", "button", "textarea", "select", "img", "video", "audio", "source", "picture", "canvas"])
/** Only these link schemes survive; `javascript:` and `data:` do not. */
const SAFE_HREF = /^(https?:|mailto:)/i

const TAG_CLASS: Record<string, string> = {
  h1: "mb-1.5 text-base font-semibold text-foreground",
  h2: "mb-1.5 text-[15px] font-semibold text-foreground",
  h3: "mb-1.5 text-[15px] font-semibold text-foreground",
  h4: "mt-2.5 mb-1 text-sm font-semibold text-foreground",
  h5: "mt-2 mb-1 text-sm font-semibold text-foreground",
  h6: "mt-2 mb-1 text-sm font-semibold text-foreground",
  p: "mb-2 last:mb-0",
  ul: "mb-2 list-disc pl-5 last:mb-0 [&>li+li]:mt-0.5",
  ol: "mb-2 list-decimal pl-5 last:mb-0 [&>li+li]:mt-0.5",
  strong: "font-semibold text-foreground",
  b: "font-semibold text-foreground",
  code: "rounded-md bg-muted px-1 py-px font-mono text-[0.85em]",
  pre: "mb-2 overflow-x-auto rounded-xl bg-muted p-3 font-mono text-xs last:mb-0",
  blockquote: "mb-2 border-l-2 border-border pl-3 text-muted-foreground last:mb-0",
  hr: "my-3 border-border",
  a: "text-primary underline underline-offset-[3px]",
}

/**
 * Parses the variable's HTML in an inert document (no scripts run, nothing is
 * fetched), keeps whitelisted tags only, strips every attribute except a safe
 * `href`, and gives links `target="_blank" rel="noopener noreferrer"`.
 */
function sanitize(html: string, opts: { onLink?: (e: MouseEvent<HTMLAnchorElement>) => void; inert?: boolean } = {}): ReactNode[] {
  if (!html.trim() || typeof DOMParser === "undefined") return []
  const doc = new DOMParser().parseFromString(html, "text/html")
  let key = 0
  const walk = (nodes: NodeListOf<ChildNode>): ReactNode[] => {
    const out: ReactNode[] = []
    nodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        out.push(n.textContent ?? "")
        return
      }
      if (n.nodeType !== Node.ELEMENT_NODE) return // comments, processing instructions
      const el = n as Element
      const tag = el.tagName.toLowerCase()
      if (DROPPED.has(tag)) return
      const children = walk(el.childNodes)
      if (!ALLOWED.has(tag)) {
        out.push(...children)
        return
      }
      const props: Record<string, unknown> = { key: key++, className: TAG_CLASS[tag] }
      if (tag === "a") {
        const href = el.getAttribute("href")?.trim() ?? ""
        if (!SAFE_HREF.test(href)) {
          out.push(...children)
          return
        }
        Object.assign(props, { href, target: "_blank", rel: "noopener noreferrer", onClick: opts.onLink, tabIndex: opts.inert ? -1 : undefined })
      }
      out.push(createElement(tag, props, ...(tag === "br" || tag === "hr" ? [] : children)))
    })
    return out
  }
  return walk(doc.body.childNodes)
}

/** The bordered box: sanitized content, or the fallback when the variable is empty. */
function RichBox({
  p,
  html,
  live,
  state = "active",
  id,
}: {
  p: RichTextProps
  html: string
  live: boolean
  state?: FieldState
  id?: string
}) {
  const t = useT()
  const disabled = state === "disabled"
  const nodes = useMemo(() => {
    /* Prototype: links show where they would go instead of navigating. */
    const onLink = live
      ? (e: MouseEvent<HTMLAnchorElement>) => {
          e.preventDefault()
          if (disabled) return
          let host = ""
          try {
            host = new URL(e.currentTarget.href).hostname
          } catch {
            host = e.currentTarget.href
          }
          toast.info(t(L(`Prototype: opens ${host} in a new tab`, `Prototipe: membuka ${host} di tab baru`)))
        }
      : undefined
    return sanitize(html, { onLink, inert: !live || disabled })
  }, [html, live, disabled, t])

  return (
    <div className="flex flex-col gap-1.5">
      <div
        id={live ? `${id}-input` : undefined}
        role={live ? "region" : undefined}
        aria-labelledby={live ? `${id}-label` : undefined}
        aria-disabled={live && disabled ? true : undefined}
        tabIndex={live && !disabled ? 0 : undefined}
        className={cn(
          "rounded-2xl border border-border bg-muted/40 px-4 py-3.5 text-sm leading-relaxed text-foreground outline-none dark:bg-muted/20",
          p.scroll && "overflow-y-auto",
          live && "focus-visible:ring-3 focus-visible:ring-ring/40",
          disabled && "text-muted-foreground opacity-70 [&_a]:pointer-events-none [&_a]:text-muted-foreground",
        )}
        style={p.scroll ? { maxHeight: heightOf(p) } : undefined}
      >
        {nodes.length ? (
          nodes
        ) : (
          <p className="flex items-center gap-2 text-muted-foreground">
            <HugeiconsIcon icon={InformationCircleIcon} className="size-4 shrink-0" />
            {t(p.fallback)}
          </p>
        )}
      </div>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <HugeiconsIcon icon={VariableIcon} className="size-3.5 shrink-0" />
        {t(L("Read-only · from ", "Baca-saja · dari "))}
        <span className="font-mono">{p.source}</span>
      </span>
    </div>
  )
}

const htmlOf = (p: RichTextProps, v?: RichTextValue) => (v?.empty[p.source] ? "" : (VARS[p.source]?.html ?? ""))

function RichTextCanvas({ props: p }: { props: RichTextProps }) {
  return <RichBox p={p} html={htmlOf(p)} live={false} />
}

function RichTextRuntime({ props: p, value, state, id }: RuntimeProps<RichTextProps, RichTextValue>) {
  return <RichBox p={p} html={htmlOf(p, value)} live state={state} id={id} />
}

/** Side card: the process variables earlier steps set. Empty one to see the fallback. */
function ProcessVariables({ props: p, value, onChange }: { props: RichTextProps; value: RichTextValue; onChange: (next: RichTextValue) => void }) {
  const t = useT()
  const emptied = value?.empty ?? {}
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold">{t(L("Process variables", "Variabel proses"))}</p>
        <p className="text-xs text-muted-foreground">
          {t(L("Set by earlier steps. Empty one to see the fallback.", "Diisi langkah sebelumnya. Kosongkan untuk melihat teks cadangan."))}
        </p>
      </div>
      {VAR_KEYS.map((k) => {
        const has = Boolean(VARS[k].html)
        const empty = !has || Boolean(emptied[k])
        return (
          <div key={k} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-mono text-xs">{k}</span>
                {k === p.source && <Badge className="text-[10px]">{t(L("shown", "ditampilkan"))}</Badge>}
              </div>
              <p className="truncate text-xs text-muted-foreground">{t(VARS[k].step)}</p>
            </div>
            {has ? (
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                aria-label={k}
                value={empty ? "0" : "1"}
                onValueChange={(v) => v && onChange({ empty: { ...emptied, [k]: v === "0" } })}
              >
                <ToggleGroupItem value="1" className="px-2.5 text-xs">
                  {t(L("Filled", "Terisi"))}
                </ToggleGroupItem>
                <ToggleGroupItem value="0" className="px-2.5 text-xs">
                  {t(L("Empty", "Kosong"))}
                </ToggleGroupItem>
              </ToggleGroup>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                {t(L("empty", "kosong"))}
              </Badge>
            )}
          </div>
        )
      })}
    </div>
  )
}

export const richText: ComponentDef<RichTextProps, RichTextValue> = {
  slug: "rich-text",
  wave: 1,
  ui: "RICH_TEXT_VIEW",
  vk: "none",
  group: "display",
  week: 2,
  icon: Note01Icon,
  label: L("Rich text from variable", "Teks kaya dari variabel"),
  title: L("Rich text from variable", "Teks kaya dari variabel"),
  blurb: L("Shows formatted HTML from a process variable, read-only.", "Menampilkan HTML terformat dari variabel proses, baca-saja."),

  defaults: () => ({
    label: L("Manager notes", "Catatan atasan"),
    name: "manager_notes_view",
    source: "manager_notes",
    fallback: L("Your manager left no notes for this step.", "Atasan tidak meninggalkan catatan untuk langkah ini."),
    scroll: true,
    maxHeight: 220,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(),
        F.key(
          L(
            "Identity of the node. This component sends no value, so this is not a process variable.",
            "Identitas node. Komponen ini tidak mengirim nilai, jadi ini bukan variabel proses.",
          ),
        ),
      ],
    },
    {
      tab: "general",
      title: L("Content", "Isi"),
      fields: [
        {
          t: "select",
          k: "source",
          label: L("Source variable", "Variabel sumber"),
          options: VAR_KEYS.map((k) => ({
            v: k,
            label: L(`${k} — ${VARS[k].step.en}${VARS[k].html ? "" : " · empty"}`, `${k} — ${VARS[k].step.id}${VARS[k].html ? "" : " · kosong"}`),
          })),
          hint: L("Process variables that hold HTML, with the step that sets them.", "Variabel proses berisi HTML, beserta langkah yang mengisinya."),
        },
        {
          t: "i18n",
          k: "fallback",
          multi: true,
          rows: 2,
          label: L("Fallback text", "Teks cadangan"),
          hint: L("Shown when the variable is empty.", "Ditampilkan saat variabel kosong."),
        },
      ],
    },
    {
      tab: "general",
      title: L("Size", "Ukuran"),
      fields: [
        {
          t: "switch",
          k: "scroll",
          label: L("Limit height and scroll", "Batasi tinggi dan gulir"),
          hint: L("Long notes scroll inside the box instead of pushing the form down.", "Catatan panjang bergulir di dalam kotak, bukan mendorong form ke bawah."),
        },
        {
          t: "number",
          k: "maxHeight",
          label: L("Max height", "Tinggi maksimal"),
          min: 120,
          max: 600,
          step: 20,
          suffix: "px",
          when: (p) => p.scroll,
          validate: (v) => {
            const n = Number(v)
            return v === "" || v == null || Number.isNaN(n) || n < 120 || n > 600 ? L("Use 120–600 px", "Gunakan 120–600 px") : null
          },
        },
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: () => false,
  Canvas: RichTextCanvas,

  Runtime: RichTextRuntime,
  initial: () => ({ empty: {} }),
  sample: () => ({ empty: {} }),
  validate: () => [],
  value: () => null,
  Controls: ProcessVariables,

  spec: (p) => ({
    ui_type: "RICH_TEXT_VIEW",
    value_kind: "none",
    name: p.name,
    label: p.label,
    config: { source_variable: p.source, fallback_text: p.fallback, max_height: p.scroll ? Number(p.maxHeight) : null },
  }),
  savedAs: (p) =>
    L(`Nothing. It reads \`${p.source}\` and never writes it back.`, `Tidak ada. Komponen membaca \`${p.source}\` dan tidak pernah menulisnya kembali.`),
  notes: [
    L(
      "Replaces 4 MFE uses of “show formatted notes from an earlier step” (shaping §7).",
      "Menggantikan 4 pemakaian MFE “tampilkan catatan terformat dari langkah sebelumnya” (shaping §7).",
    ),
    L(
      "Sanitize the HTML before rendering: no `script`, `iframe`, inline event handlers or `style`; links get `rel=\"noopener\"`.",
      "Sanitasi HTML sebelum dirender: tanpa `script`, `iframe`, event handler inline, atau `style`; tautan diberi `rel=\"noopener\"`.",
    ),
    L(
      "The content shows as written; it is not translated. Only the label and fallback follow EN/ID.",
      "Isinya tampil apa adanya; tidak diterjemahkan. Hanya label dan teks cadangan yang mengikuti EN/ID.",
    ),
    L(
      "With `value_kind: \"none\"` it is skipped by submit, draft and bulk complete.",
      "Dengan `value_kind: \"none\"` komponen ini dilewati submit, draft, dan bulk complete.",
    ),
  ],
  story: {
    process: L("Procurement request", "Pengadaan barang"),
    step: L("Revise request", "Revisi permintaan"),
    ref: "PR-2026-0147",
    due: "2026-10-09",
    task: L("Revise procurement request", "Revisi permintaan pengadaan"),
    after: [
      {
        name: "revision_response",
        label: L("What did you change?", "Apa yang Anda ubah?"),
        type: "textarea",
        required: true,
        value: "",
        rows: 3,
        placeholder: L("e.g. Laptops reduced to 2; three monitor quotes attached.", "mis. Laptop dikurangi jadi 2; tiga penawaran monitor terlampir."),
      },
    ],
  },
}
