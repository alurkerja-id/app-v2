/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { DashboardSquare02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { GhostInput } from "../field-shell"
import { L, useT, type L10n } from "../i18n"
import { F } from "../lib"
import type { ComponentDef, Issue, RuntimeProps } from "../types"
import { asSection, CardFieldsEditor } from "./card-editor"
import { containerIssues, entries, field, fieldFid, fillVals, sectionsError, valsByKey, type Vals } from "./container-model"
import { IssueBadge, SectionFields } from "./container-ui"
import { childSpec, type ChildField } from "./repeater-model"

/* Card / fieldset — ui_type CARD, value_kind "none" (container). Story: purchase request, delivery address.
   One group of fields under a heading. Shaping §4f, like Row / Column: the fields are the card's own
   `children` (no tab / section level), and each keeps its own key, so the payload is flat. Inside, the
   card reuses the containers' helpers by treating itself as one section that never reaches the spec. */

type CardStyle = "card" | "fieldset" | "plain"

interface CardProps {
  label: L10n
  name: string
  /** One or two lines under the title; optional. */
  description: L10n
  style: CardStyle
  /** Desktop only; phones always use one column. */
  columns: 1 | 2
  showLabel: boolean
  fields: ChildField[]
}

/** Raw input per child field id. */
type CardValue = Vals

const NOUN = L("Card", "Kartu")

const hasText = (s: L10n) => Boolean(s.en.trim() || s.id.trim())

const sectionOf = (p: CardProps) => asSection(p.label.en.trim() ? p.label : NOUN, p.fields)

/** First problem with the card's fields (blocks Save Changes), or null. Same rules and messages as Tabs / Accordion. */
const fieldsError = (p: CardProps) => sectionsError([sectionOf(p)], NOUN, 1)

const issueCount = (p: CardProps, issues: Issue[]) => issues.filter((i) => p.fields.some((f) => fieldFid(f) === i.fid)).length

/* ── canvas ─────────────────────────────────────────────────────────────── */

function GhostFields({ p }: { p: CardProps }) {
  const t = useT()
  const two = p.columns === 2
  return (
    <div className={cn("grid gap-3", two ? "grid-cols-2" : "grid-cols-1")}>
      {p.fields.slice(0, 6).map((f) => (
        <div key={f.id} className={cn("flex min-w-0 flex-col gap-1", two && f.kind === "textarea" && "col-span-2")}>
          <span className="truncate text-[11px] text-muted-foreground">
            {t(f.label)}
            {f.required && <span className="text-destructive"> *</span>}
          </span>
          <GhostInput select={f.kind === "dropdown"} className={cn(f.kind === "textarea" && "h-14 items-start py-2")} />
        </div>
      ))}
    </div>
  )
}

function CardCanvas({ props: p }: { props: CardProps }) {
  const t = useT()
  const desc = hasText(p.description) && <p className="text-xs text-muted-foreground">{t(p.description)}</p>
  const title = p.showLabel && <p className="text-sm font-semibold">{t(p.label)}</p>
  const more = p.fields.length > 6 && (
    <p className="text-xs text-muted-foreground">{t(L(`+ ${p.fields.length - 6} more fields`, `+ ${p.fields.length - 6} field lagi`))}</p>
  )
  if (p.style === "fieldset")
    return (
      <div className={cn("relative rounded-2xl border border-border px-4 pb-4", p.showLabel ? "pt-5" : "pt-4")}>
        {p.showLabel && <p className="absolute -top-2.5 left-3 bg-card px-1.5 text-sm leading-5 font-semibold">{t(p.label)}</p>}
        <div className="flex flex-col gap-3">
          {desc}
          <GhostFields p={p} />
          {more}
        </div>
      </div>
    )
  if (p.style === "plain")
    return (
      <div className="flex flex-col gap-3">
        {(title || desc) && (
          <div className="flex flex-col gap-0.5 border-b border-border pb-2">
            {title}
            {desc}
          </div>
        )}
        <GhostFields p={p} />
        {more}
      </div>
    )
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      {(title || desc) && (
        <div className="flex flex-col gap-0.5 border-b border-border bg-muted/40 px-4 py-3 dark:bg-muted/20">
          {title}
          {desc}
        </div>
      )}
      <div className="flex flex-col gap-3 p-4">
        <GhostFields p={p} />
        {more}
      </div>
    </div>
  )
}

/* ── runtime ────────────────────────────────────────────────────────────── */

function CardRuntime({ props: p, value: vals, onChange, state, issues, compact, id }: RuntimeProps<CardProps, CardValue>) {
  const t = useT()
  const n = issueCount(p, issues)
  const titleId = `${id}-name`
  const descId = `${id}-desc`
  const withDesc = hasText(p.description)
  const head = p.showLabel || withDesc

  const body = (
    /* SectionFields lays out two columns; "1 column" narrows it on desktop too (phones are always one column). */
    <div className={cn(p.columns === 1 && "[&>div]:grid-cols-1")}>
      <SectionFields
        section={sectionOf(p)}
        vals={vals}
        onVal={(fid, x) => onChange({ ...vals, [fid]: x })}
        state={state}
        issues={issues}
        compact={compact}
        idPrefix={id}
      />
    </div>
  )

  /* The count repeats what the messages under the fields already say, so screen readers skip it. */
  const badge = n > 0 && (
    <span aria-hidden className="flex" title={t(L(`${n} problem${n === 1 ? "" : "s"}`, `${n} masalah`))}>
      <IssueBadge n={n} />
    </span>
  )
  const title = (
    <span className={cn("flex min-w-0 items-center gap-2", !p.showLabel && "sr-only")}>
      <span className="min-w-0 text-sm font-semibold [overflow-wrap:anywhere]">{t(p.label)}</span>
      {badge}
    </span>
  )
  const desc = withDesc && (
    <p id={descId} className="text-xs text-muted-foreground">
      {t(p.description)}
    </p>
  )
  const described = withDesc ? descId : undefined

  if (p.style === "fieldset")
    return (
      <fieldset
        aria-describedby={described}
        className={cn(
          "min-w-0 rounded-2xl border px-4 pb-4 sm:px-5 sm:pb-5",
          p.showLabel ? "pt-2" : "pt-4",
          n > 0 ? "border-destructive/50" : "border-border",
        )}
      >
        {/* The legend sits on the border line; hidden visually (not for screen readers) without “Show the title”. */}
        <legend className={cn(p.showLabel ? "-ml-1.5 max-w-full px-1.5" : "sr-only")}>{title}</legend>
        <div className="flex flex-col gap-4">
          {desc}
          {body}
        </div>
      </fieldset>
    )

  const heading = <h3 id={titleId}>{title}</h3>

  if (p.style === "plain")
    return (
      <div role="group" aria-labelledby={titleId} aria-describedby={described} className="flex min-w-0 flex-col gap-4">
        {head ? (
          <div className={cn("flex flex-col gap-0.5 border-b pb-2.5", n > 0 ? "border-destructive/50" : "border-border")}>
            {heading}
            {desc}
          </div>
        ) : (
          heading
        )}
        {body}
      </div>
    )

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      aria-describedby={described}
      className={cn("min-w-0 overflow-hidden rounded-2xl border bg-card shadow-xs", n > 0 ? "border-destructive/50" : "border-border")}
    >
      {head ? (
        <div className="flex flex-col gap-0.5 border-b border-border bg-muted/40 px-4 py-3 sm:px-5 dark:bg-muted/20">
          {heading}
          {desc}
        </div>
      ) : (
        heading
      )}
      <div className="p-4 sm:p-5">{body}</div>
    </div>
  )
}

/* ── definition ─────────────────────────────────────────────────────────── */

const SAMPLE: Record<string, string> = {
  recipient: "Dewi Kartika",
  recipient_phone: "0812 3456 7890",
  building: "head_office",
  floor: "3",
  delivery_notes: "Titipkan di resepsionis lantai 3 bila saya sedang rapat.",
}

const keysText = (p: CardProps) =>
  p.fields
    .slice(0, 3)
    .map((f) => `\`${f.name}\``)
    .join(", ") + (p.fields.length > 3 ? "…" : "")

const STYLE_HINT: Record<CardStyle, L10n> = {
  card: L("A surface with a header strip; the strongest grouping.", "Bidang dengan strip judul; pengelompokan paling tegas."),
  fieldset: L("A thin border with the title sitting on the line, like a paper form.", "Garis tipis dengan judul di atas garis, seperti form kertas."),
  plain: L("Title and a divider only, no border; for light grouping.", "Hanya judul dan garis pemisah, tanpa bingkai; untuk pengelompokan ringan."),
}

export const card: ComponentDef<CardProps, CardValue> = {
  slug: "card",
  wave: 4,
  ui: "CARD",
  vk: "none",
  group: "layout",
  week: 6,
  icon: DashboardSquare02Icon,
  label: L("Card / fieldset", "Kartu / fieldset"),
  title: L("Card / fieldset", "Kartu / fieldset"),
  blurb: L("Groups fields under one heading, as a card or a fieldset.", "Mengelompokkan field di bawah satu judul, sebagai kartu atau fieldset."),

  defaults: () => ({
    label: L("Delivery address", "Alamat pengiriman"),
    name: "delivery_address",
    description: L("Where the goods go. The courier calls the recipient on arrival.", "Tujuan pengiriman barang. Kurir menelepon penerima saat tiba."),
    style: "card",
    columns: 2,
    showLabel: true,
    fields: [
      field("text", "recipient", "Recipient", "Nama penerima", { required: true, placeholder: L("Who receives the goods", "Siapa yang menerima barang") }),
      field("text", "recipient_phone", "Phone", "Nomor telepon", { required: true, placeholder: L("e.g. 0812 3456 7890", "mis. 0812 3456 7890") }),
      field("dropdown", "building", "Building", "Gedung", {
        required: true,
        options: [
          { v: "head_office", label: L("Head office, Sudirman", "Kantor pusat, Sudirman") },
          { v: "annex", label: L("Annex, Kuningan", "Gedung annex, Kuningan") },
          { v: "warehouse_cikarang", label: L("Warehouse, Cikarang", "Gudang Cikarang") },
        ],
      }),
      field("number", "floor", "Floor", "Lantai", { required: true }),
      field("textarea", "delivery_notes", "Notes for the courier", "Catatan untuk kurir", {
        placeholder: L("e.g. Leave it at reception if I'm in a meeting", "mis. Titipkan di resepsionis bila saya sedang rapat"),
      }),
    ],
  }),
  schema: (p) => [
    {
      tab: "general",
      fields: [
        F.name(L("Title", "Judul"), {
          hint: L("Heading of the group. With “Show the title” off it is still read out by screen readers.", "Judul kelompok. Bila “Tampilkan judul” mati, tetap dibacakan pembaca layar."),
        }),
        F.key(L("Identity of the node. The fields inside keep their own keys.", "Identitas node. Field di dalamnya tetap memakai key masing-masing.")),
        {
          t: "i18n",
          k: "description",
          label: L("Description", "Deskripsi"),
          multi: true,
          rows: 2,
          hint: L("Optional. One or two lines under the title.", "Opsional. Satu atau dua baris di bawah judul."),
        },
        {
          t: "custom",
          id: "fields",
          label: L("Fields", "Field"),
          render: (ctx) => (
            <CardFieldsEditor
              fields={ctx.props.fields}
              onFields={(fields) => ctx.set({ fields })}
              cardName={ctx.props.label}
              requiredHint={L("Checked on Complete Task; the message shows under the field.", "Dicek saat Complete Task; pesannya tampil di bawah field.")}
            />
          ),
          validate: (_v, x) => fieldsError(x),
        },
        {
          t: "seg",
          k: "style",
          label: L("Style", "Gaya"),
          hint: STYLE_HINT[p.style],
          options: [
            { v: "card", label: L("Card", "Kartu") },
            { v: "fieldset", label: L("Fieldset", "Fieldset") },
            { v: "plain", label: L("Plain", "Polos") },
          ],
        },
        {
          t: "seg",
          k: "columns",
          label: L("Columns", "Kolom"),
          hint: L("On desktop. Phones always use one column, and a Textarea always takes the full width.", "Di desktop. Ponsel selalu satu kolom, dan Teks panjang selalu selebar kartu."),
          options: [
            { v: 1, label: L("1 column", "1 kolom") },
            { v: 2, label: L("2 columns", "2 kolom") },
          ],
        },
        { t: "switch", k: "showLabel", label: L("Show the title", "Tampilkan judul") },
      ],
    },
    {
      tab: "validation",
      fields: [
        {
          t: "note",
          text: L(
            "Required is set **per field** (open a field above). The card adds no rule of its own: each field shows its own message, and the card's title gets a red count.",
            "Wajib diatur **per field** (buka field di atas). Kartu tidak punya aturan sendiri: setiap field menampilkan pesannya sendiri, dan judul kartu diberi angka merah.",
          ),
        },
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: () => false,
  bare: true,
  devices: true,
  Canvas: CardCanvas,
  canvasWarn: (p) => (fieldsError(p) ? L("Check the fields", "Periksa field") : null),

  Runtime: CardRuntime,
  initial: (p) => valsByKey([sectionOf(p)], {}),
  sample: (p) => fillVals([sectionOf(p)], SAMPLE),
  validate: (p, v) => containerIssues([sectionOf(p)], v),
  value: () => undefined,
  payloadEntries: (p, v) => entries([sectionOf(p)], v),

  spec: (p) => ({
    ui_type: "CARD",
    value_kind: "none",
    name: p.name,
    label: p.label,
    config: {
      style: p.style,
      columns: p.columns,
      description: hasText(p.description) ? p.description : null,
      show_label: p.showLabel,
    },
    children: p.fields.map(childSpec),
  }),
  savedAs: (p) =>
    L(
      `Nothing under \`${p.name}\` itself: each field inside keeps its own key (${keysText(p)}), as if the card were not there.`,
      `Tidak ada nilai di \`${p.name}\` sendiri: setiap field di dalamnya memakai key masing-masing (${keysText(p)}), seolah kartu tidak ada.`,
    ),
  notes: [
    L(
      "Shaping §4f, like Row / Column: the fields are the card's own `children`, with **no section level** (unlike Tabs / Accordion). Readers that already walk `children` handle it without a new branch.",
      "Shaping §4f, seperti Row / Column: field adalah `children` milik kartu itu sendiri, **tanpa tingkat bagian** (beda dengan Tab / Akordeon). Pembaca yang sudah menelusuri `children` menanganinya tanpa cabang baru.",
    ),
    L(
      "Keys are unique across the whole form, not per card; the payload stays flat and Camunda sees ordinary variables.",
      "Key unik di seluruh form, bukan per kartu; payload tetap flat dan Camunda melihat variabel biasa.",
    ),
    L(
      "`style` is presentation only. `fieldset` renders a real `<fieldset>` with `<legend>`; `card` and `plain` are a `role=\"group\"` named by the title, so screen readers announce it even when the title is hidden.",
      "`style` hanya tampilan. `fieldset` merender `<fieldset>` dan `<legend>` sungguhan; `card` dan `plain` berupa `role=\"group\"` yang dinamai judulnya, jadi pembaca layar tetap menyebutnya walau judul disembunyikan.",
    ),
    L(
      "`columns: 2` applies on desktop only. Phones always use one column, and a Textarea always takes the full width.",
      "`columns: 2` hanya berlaku di desktop. Ponsel selalu satu kolom, dan Teks panjang selalu selebar kartu.",
    ),
    L(
      "Use a card for a group that always stays visible (an address, a contact person). For long or mostly optional groups use Accordion; for several peer groups, Tabs.",
      "Pakai kartu untuk kelompok yang selalu terlihat (alamat, narahubung). Untuk kelompok panjang atau sebagian besar opsional pakai Akordeon; untuk beberapa kelompok setara, Tab.",
    ),
  ],
  story: {
    process: L("Purchase request", "Permintaan pembelian"),
    step: L("Requester details", "Data pemohon"),
    ref: "PR-2026-0391",
    due: "2026-11-13",
    task: L("Purchase request: 2 ergonomic chairs", "Permintaan pembelian: 2 kursi ergonomis"),
    before: [
      {
        name: "items_summary",
        label: L("What are you buying?", "Apa yang dibeli?"),
        type: "text",
        required: true,
        value: "2 kursi kerja ergonomis",
      },
    ],
    after: [{ name: "needed_by", label: L("Needed by", "Dibutuhkan paling lambat"), type: "date", required: true }],
  },
}
