/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import type { MouseEvent } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, ArrowRight02Icon, File01Icon, Link01Icon, LinkSquare02Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { L, useT, type L10n } from "../i18n"
import { F } from "../lib"
import type { ComponentDef, RuntimeProps } from "../types"

/* Link — ui_type LINK, value_kind "none". Story: travel policy link on a trip expense form. */

type LinkStyle = "text" | "button"

interface LinkProps {
  label: L10n
  /** Key: identity of the node only — a link sends no value. */
  name: string
  url: string
  newTab: boolean
  style: LinkStyle
}
type LinkValue = null

type UrlState = { bad: true } | { bad: false; host: string; http: boolean }

/** Must parse, use http(s) and have a dotted host name. */
function urlState(v: unknown): UrlState {
  try {
    const u = new URL(String(v ?? "").trim())
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) return { bad: true }
    return { bad: false, host: u.hostname, http: u.protocol === "http:" }
  } catch {
    return { bad: true }
  }
}

const isHttp = (p: LinkProps) => {
  const s = urlState(p.url)
  return !s.bad && s.http
}

/**
 * The link itself. `live` = runtime (clickable, focusable); otherwise a picture
 * of it for the canvas. An invalid URL never renders a broken link: the label
 * becomes plain text.
 */
function LinkView({ p, live, disabled }: { p: LinkProps; live: boolean; disabled?: boolean }) {
  const t = useT()
  const s = urlState(p.url)
  const label = t(p.label)

  if (s.bad) {
    return (
      <div className="flex flex-col gap-1">
        <span className={cn("inline-flex w-fit items-center gap-1.5 text-sm", disabled ? "text-muted-foreground" : "text-foreground/80")}>
          <HugeiconsIcon icon={Link01Icon} className="size-4 shrink-0" />
          {label}
        </span>
        {live && <p className="text-xs text-muted-foreground">{t(L("This link is unavailable.", "Tautan ini tidak tersedia."))}</p>}
      </div>
    )
  }

  const ext = <HugeiconsIcon icon={p.newTab ? LinkSquare02Icon : ArrowRight02Icon} className="size-4 shrink-0" data-icon="inline-end" />
  const textCls = "inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium"

  /* Disabled: muted, not focusable, not a link. Canvas: same look, no href. */
  if (!live || disabled) {
    return p.style === "button" ? (
      <span
        role={disabled ? "link" : undefined}
        aria-disabled={disabled || undefined}
        className={cn(
          "inline-flex h-8 w-fit items-center gap-1 rounded-4xl border border-border bg-background px-3 text-sm font-medium dark:bg-transparent",
          disabled && "cursor-not-allowed text-muted-foreground opacity-60",
        )}
      >
        <HugeiconsIcon icon={File01Icon} className="size-4 shrink-0" />
        {label}
        {ext}
      </span>
    ) : (
      <span
        role={disabled ? "link" : undefined}
        aria-disabled={disabled || undefined}
        className={cn(textCls, disabled ? "cursor-not-allowed text-muted-foreground" : "text-primary")}
      >
        {label}
        {ext}
      </span>
    )
  }

  /* Prototype: no navigation, a toast says where it would go. */
  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    toast.info(
      t(
        L(
          `Prototype: opens ${s.host}${p.newTab ? " in a new tab" : " in this tab"}`,
          `Prototipe: membuka ${s.host}${p.newTab ? " di tab baru" : " di tab ini"}`,
        ),
      ),
    )
  }
  const attrs = { href: p.url, onClick: open, ...(p.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {}) }

  return p.style === "button" ? (
    <Button variant="outline" size="sm" asChild className="w-fit">
      <a {...attrs}>
        <HugeiconsIcon icon={File01Icon} data-icon="inline-start" />
        {label}
        {ext}
      </a>
    </Button>
  ) : (
    <a
      {...attrs}
      className={cn(
        textCls,
        "text-primary underline-offset-[3px] outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/40",
      )}
    >
      {label}
      {ext}
    </a>
  )
}

function LinkCanvas({ props: p }: { props: LinkProps }) {
  const t = useT()
  const s = urlState(p.url)
  return (
    <div className="flex flex-col gap-1.5">
      <LinkView p={p} live={false} />
      {s.bad ? (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
          <HugeiconsIcon icon={Alert02Icon} className="mt-px size-4 shrink-0 text-amber-700 dark:text-amber-400" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <b className="font-semibold text-foreground">{t(L("This link won’t open", "Tautan ini tidak akan terbuka"))}</b>
            <span className="text-muted-foreground">{t(L("The URL is not valid. Fix it in Edit Element.", "URL tidak valid. Perbaiki di Edit Element."))}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {s.host}
          {p.newTab ? ` · ${t(L("opens in a new tab", "terbuka di tab baru"))}` : ""}
        </p>
      )}
    </div>
  )
}

function LinkRuntime({ props: p, state }: RuntimeProps<LinkProps, LinkValue>) {
  return <LinkView p={p} live disabled={state === "disabled"} />
}

export const link: ComponentDef<LinkProps, LinkValue> = {
  slug: "link",
  wave: 1,
  ui: "LINK",
  vk: "none",
  group: "display",
  week: 1,
  icon: Link01Icon,
  label: L("Link", "Tautan"),
  title: L("Link", "Tautan"),
  blurb: L("A text link or button to a document, with the URL checked in the builder.", "Tautan teks atau tombol ke dokumen, URL-nya dicek di builder."),
  bare: true,

  defaults: () => ({
    label: L("Read the travel expense policy", "Baca kebijakan biaya perjalanan dinas"),
    name: "travel_policy_link",
    url: "https://intranet.perusahaan.co.id/kebijakan/perjalanan-dinas-2026.pdf",
    newTab: true,
    style: "text",
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.key(
          L(
            "Identity of the node. A link sends no value, so this is not a process variable.",
            "Identitas node. Tautan tidak mengirim nilai, jadi ini bukan variabel proses.",
          ),
        ),
        {
          t: "i18n",
          k: "label",
          label: L("Label", "Label"),
          validate: (v) => {
            const x = v as L10n
            return !x.en.trim() && !x.id.trim() ? L("Write a label", "Tulis label") : null
          },
        },
        {
          t: "url",
          k: "url",
          label: L("URL", "URL"),
          placeholder: "https://",
          validate: (v) =>
            urlState(v).bad ? L("Not a valid URL. Use a full address starting with https://", "URL tidak valid. Pakai alamat lengkap yang diawali https://") : null,
        },
        /* http works, so it is a soft warning that does not block Save Changes. */
        {
          t: "note",
          tone: "warning",
          when: isHttp,
          text: L(
            "Works, but https:// is safer — some browsers warn on http",
            "Bisa dipakai, tetapi https:// lebih aman — sebagian browser memberi peringatan untuk http",
          ),
        },
      ],
    },
    {
      tab: "general",
      title: L("Behaviour", "Perilaku"),
      fields: [
        { t: "switch", k: "newTab", label: L("Open in new tab", "Buka di tab baru"), hint: L("Keeps the half-filled form open.", "Form yang sedang diisi tetap terbuka.") },
        {
          t: "seg",
          k: "style",
          label: L("Style", "Gaya"),
          options: [
            { v: "text", label: L("Text link", "Tautan teks") },
            { v: "button", label: L("Button", "Tombol") },
          ],
          hint: L("The button uses the outline style so it never competes with Submit.", "Tombol memakai gaya outline agar tidak bersaing dengan Submit."),
        },
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: () => false,
  Canvas: LinkCanvas,
  canvasWarn: (p) => (urlState(p.url).bad ? L("URL is not valid", "URL tidak valid") : null),

  Runtime: LinkRuntime,
  initial: () => null,
  sample: () => null,
  validate: () => [],
  value: () => null,

  spec: (p) => ({
    ui_type: "LINK",
    value_kind: "none",
    name: p.name,
    label: p.label,
    config: { url: p.url, open_in_new_tab: p.newTab, style: p.style },
  }),
  savedAs: () => L("Nothing. The label and URL live in the form spec.", "Tidak ada. Label dan URL ada di spec form."),
  notes: [
    L(
      "`LINK` exists in the renderer but renders `content` raw, like P. The label moves to `{en,id}` and is read through the language helper.",
      "`LINK` sudah ada di renderer tetapi merender `content` mentah, seperti P. Labelnya pindah ke `{en,id}` dan dibaca lewat helper bahasa.",
    ),
    L(
      "Studio validates the URL: it must parse and use http(s). https is recommended; http shows a soft warning.",
      "Studio memvalidasi URL: harus valid dan memakai http(s). https disarankan; http memberi peringatan ringan.",
    ),
    L("Links that open a new tab get `rel=\"noopener noreferrer\"`.", "Tautan yang membuka tab baru diberi `rel=\"noopener noreferrer\"`."),
    L(
      "If a saved URL is invalid, the app shows the label as plain text instead of a broken link.",
      "Kalau URL tersimpan tidak valid, app menampilkan label sebagai teks biasa, bukan tautan rusak.",
    ),
  ],
  story: {
    process: L("Business trip report", "Laporan perjalanan dinas"),
    step: L("Expense claim", "Klaim biaya"),
    ref: "PD-2026-0217",
    due: "2026-10-09",
    task: L("Submit trip expenses", "Kirim biaya perjalanan"),
    after: [
      {
        name: "total_expense",
        label: L("Total expenses", "Total biaya"),
        type: "number",
        prefix: "Rp",
        required: true,
        value: "",
        placeholder: L("0", "0"),
        validate: (v) =>
          v !== "" && Number(v) > 10000000
            ? L("Claims above Rp10.000.000 need finance approval first", "Klaim di atas Rp10.000.000 perlu persetujuan keuangan dulu")
            : null,
      },
      {
        name: "policy_followed",
        label: L("I followed the travel expense policy.", "Saya sudah mengikuti kebijakan biaya perjalanan dinas."),
        type: "checkbox",
        required: true,
        value: "",
        requiredMsg: L("Confirm that you followed the policy", "Centang bahwa Anda mengikuti kebijakan"),
      },
    ],
  },
}
