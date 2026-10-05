/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Copy01Icon, Delete02Icon, PlusSignIcon, RowInsertIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { GhostInput } from "../field-shell"
import { L, useT, type L10n } from "../i18n"
import { F, rupiah } from "../lib"
import type { ComponentDef } from "../types"
import { FieldsEditor, fieldsError, SubtotalSwitch } from "./repeater-editor"
import {
  childSpec,
  half,
  initialValue,
  maxEff,
  minEff,
  pair,
  rowsValue,
  sampleValue,
  showSub,
  validate,
  type ChildField,
  type RepeaterProps,
  type RepeaterValue,
} from "./repeater-model"
import { RepeaterHistory } from "./repeater-history"
import { RepeaterRuntime } from "./repeater-runtime"

/* Repeater ★ — ui_type REPEATER, value_kind "list". Story: a procurement request
   returned by the manager; the requester revises the item rows. */

/* ── canvas (static preview: one sample row) ─────────────────────────────── */

function Ghost({ f, className }: { f: ChildField; className?: string }) {
  const t = useT()
  if (f.kind === "number") return <GhostInput className={cn("justify-end tabular-nums", className)}>{f.currency ? rupiah(0) : "0"}</GhostInput>
  if (f.kind === "date") return <GhostInput className={className}>dd/mm/yyyy</GhostInput>
  if (f.kind === "dropdown")
    return (
      <GhostInput select className={className}>
        {t(L("Select…", "Pilih…"))}
      </GhostInput>
    )
  return <GhostInput className={className}>{t(f.placeholder) || " "}</GhostInput>
}

function ColLabel({ f }: { f: ChildField }) {
  const t = useT()
  return (
    <>
      {t(f.label)}
      {f.required && <span className="text-destructive"> *</span>}
    </>
  )
}

const rangeText = (p: RepeaterProps) => L(`${minEff(p)}–${maxEff(p)} rows`, `${minEff(p)}–${maxEff(p)} baris`)

function RepeaterCanvas({ props: p }: { props: RepeaterProps }) {
  const t = useT()
  const sub = showSub(p)
  const pr = pair(p)

  if (p.layout === "cards") {
    return (
      <div className="flex flex-col gap-2.5">
        <p className="text-xs text-muted-foreground tabular-nums">{t(rangeText(p))}</p>
        <div className="rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center gap-3 border-b border-border px-3 py-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">1</span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-sm font-medium text-muted-foreground">{t(L("Not filled yet", "Belum diisi"))}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {t(L(`0 of ${p.fields.length} fields filled`, `0 dari ${p.fields.length} field terisi`))}
              </span>
            </span>
            {sub && <span className="text-sm font-medium text-muted-foreground tabular-nums">{rupiah(0)}</span>}
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 shrink-0 rotate-180 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-3 p-3.5">
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              {p.fields.map((f) => (
                <div key={f.id} className={cn("flex min-w-0 flex-col gap-1.5", !half(f, false) && "col-span-2")}>
                  <span className="text-xs text-muted-foreground">
                    <ColLabel f={f} />
                  </span>
                  <Ghost f={f} />
                </div>
              ))}
            </div>
            {sub && pr && (
              <div className="flex items-baseline justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <span>
                  {t(L("Subtotal", "Subtotal"))} · {t(pr[0].label)} × {t(pr[1].label)}
                </span>
                <b className="text-sm font-semibold text-foreground tabular-nums">{rupiah(0)}</b>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-2.5 text-xs text-muted-foreground" aria-hidden>
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Copy01Icon} className="size-3.5" />
                {t(L("Duplicate", "Duplikat"))}
              </span>
              <span className="flex items-center gap-1.5 text-destructive">
                <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                {t(L("Remove", "Hapus"))}
              </span>
            </div>
          </div>
        </div>
        <span
          aria-hidden
          className="flex h-11 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm font-medium text-primary"
        >
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          {t(p.addLabel)}
        </span>
        {sub && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
            <span>{t(L("Total · 1 row", "Total · 1 baris"))}</span>
            <b className="font-semibold text-foreground tabular-nums">{rupiah(0)}</b>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="w-9 px-2 py-2 text-center font-medium text-muted-foreground">#</th>
              {p.fields.map((f) => (
                <th
                  key={f.id}
                  className={cn("px-2 py-2 text-left font-medium whitespace-nowrap text-muted-foreground", f.kind === "number" && !f.currency && "text-right")}
                >
                  <ColLabel f={f} />
                </th>
              ))}
              {sub && <th className="px-3 py-2 text-right font-medium whitespace-nowrap text-muted-foreground">{t(L("Subtotal", "Subtotal"))}</th>}
              <th className="w-10 px-2 py-2">
                <span className="sr-only">{t(L("Actions", "Aksi"))}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-2 py-2 text-center text-muted-foreground tabular-nums">1</td>
              {p.fields.map((f) => (
                <td key={f.id} className={cn("px-1.5 py-2", f.kind === "number" && !f.currency ? "min-w-20" : "min-w-32")}>
                  <Ghost f={f} className="h-8 text-xs" />
                </td>
              ))}
              {sub && <td className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground tabular-nums">{rupiah(0)}</td>}
              <td className="px-2 py-2 text-center">
                <HugeiconsIcon icon={Delete02Icon} className="mx-auto size-4 text-muted-foreground" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden className={buttonVariants({ variant: "outline", size: "sm" })}>
            <HugeiconsIcon icon={PlusSignIcon} />
            {t(p.addLabel)}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">{t(rangeText(p))}</span>
        </div>
        {sub && (
          <span className="flex items-baseline gap-2 text-sm text-muted-foreground">
            {t(L("Total", "Total"))}
            <b className="font-semibold text-foreground tabular-nums">{rupiah(0)}</b>
          </span>
        )}
      </div>
    </div>
  )
}

/* ── definition ──────────────────────────────────────────────────────────── */

const wholeFrom = (v: unknown, from: number) => v === "" || v == null || !Number.isInteger(Number(v)) || Number(v) < from

export const repeater: ComponentDef<RepeaterProps, RepeaterValue> = {
  slug: "repeater",
  wave: 1,
  ui: "REPEATER",
  vk: "list",
  star: true,
  group: "data",
  week: 2,
  icon: RowInsertIcon,
  label: L("Repeater", "Baris berulang"),
  title: L("Repeater", "Baris berulang"),
  blurb: L("Rows of child fields the user can add and remove. Saved as one JSON list.", "Baris berisi field anak yang bisa ditambah dan dihapus. Disimpan sebagai satu daftar JSON."),

  defaults: () => ({
    label: L("Items to purchase", "Barang yang dibeli"),
    name: "items",
    required: true,
    minRows: 1,
    maxRows: 5,
    addLabel: L("Add row", "Tambah baris"),
    subtotal: true,
    layout: "table",
    mobileLayout: "cards",
    fields: [
      { id: "c1", kind: "text", name: "item_name", label: L("Item name", "Nama barang"), required: true, placeholder: L("e.g. Laptop", "mis. Laptop") },
      { id: "c2", kind: "number", name: "qty", label: L("Qty", "Jumlah"), required: true, min: 1, currency: false },
      { id: "c3", kind: "number", name: "unit_price", label: L("Unit price", "Harga satuan"), required: true, min: 0, currency: true },
      { id: "c4", kind: "textarea", name: "note", label: L("Note", "Catatan"), required: false, placeholder: L("Optional", "Opsional") },
    ],
  }),
  schema: (p) => {
    const atLeast = Math.max(1, Number(p.minRows) || 0)
    return [
      {
        tab: "general",
        fields: [F.name(), F.key(L("One process variable holds the whole list of rows.", "Satu variabel proses menyimpan seluruh daftar baris."))],
      },
      {
        tab: "general",
        title: L("Fields in each row", "Field di setiap baris"),
        fields: [{ t: "custom", id: "fields", render: (ctx) => <FieldsEditor ctx={ctx} />, validate: (_, x) => fieldsError(x) }],
      },
      {
        tab: "general",
        title: L("Rows", "Baris"),
        fields: [
          { t: "i18n", k: "addLabel", label: L("Add-button label", "Label tombol tambah") },
          { t: "custom", id: "subtotal", render: (ctx) => <SubtotalSwitch ctx={ctx} /> },
        ],
      },
      {
        tab: "general",
        title: L("Layout", "Tata letak"),
        fields: [
          {
            t: "seg",
            k: "layout",
            label: L("Show rows as", "Tampilkan baris sebagai"),
            options: [
              { v: "table", label: L("Table", "Tabel") },
              { v: "cards", label: L("Cards", "Kartu") },
            ],
            hint: L("Table suits many short rows. Cards suit long text fields.", "Tabel cocok untuk banyak baris pendek. Kartu cocok untuk field teks panjang."),
          },
          {
            t: "seg",
            k: "mobileLayout",
            label: L("On phones", "Di ponsel"),
            when: (x) => x.layout === "table",
            options: [
              { v: "cards", label: L("Cards", "Kartu") },
              { v: "table", label: L("Keep table", "Tetap tabel") },
            ],
            hint: L(
              "Below 640 px wide. A table there needs sideways scrolling; cards stack each row.",
              "Di bawah lebar 640 px. Tabel di sana harus digeser ke samping; kartu menumpuk tiap baris.",
            ),
          },
        ],
      },
      {
        tab: "validation",
        fields: [
          F.required(L(`The user must fill at least ${atLeast} row${atLeast > 1 ? "s" : ""}.`, `User wajib mengisi minimal ${atLeast} baris.`)),
          {
            t: "number",
            k: "minRows",
            label: L("Min rows", "Minimal baris"),
            min: 0,
            max: 20,
            allowEmpty: true,
            validate: (v) => (wholeFrom(v, 0) ? L("Enter a whole number from 0", "Isi bilangan bulat mulai 0") : null),
          },
          {
            t: "number",
            k: "maxRows",
            label: L("Max rows", "Maksimal baris"),
            min: 1,
            max: 50,
            allowEmpty: true,
            validate: (v, x) =>
              wholeFrom(v, 1)
                ? L("Enter a whole number from 1", "Isi bilangan bulat mulai 1")
                : x.minRows !== "" && Number(v) < Number(x.minRows)
                  ? L("Max rows can’t be lower than Min rows", "Maksimal baris tidak boleh kurang dari minimal baris")
                  : null,
          },
        ],
      },
    ]
  },
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: RepeaterCanvas,
  canvasWarn: (p): L10n | null => (Number(p.maxRows) < Number(p.minRows) ? L("Max rows < Min rows", "Maks < min baris") : null),

  Runtime: RepeaterRuntime,
  devices: true,
  Aside: RepeaterHistory,
  initial: initialValue,
  sample: sampleValue,
  validate,
  value: rowsValue,

  spec: (p) => {
    const pr = pair(p)
    return {
      ui_type: "REPEATER",
      value_kind: "list",
      name: p.name,
      label: p.label,
      required: p.required,
      config: {
        min_rows: p.minRows,
        max_rows: p.maxRows,
        add_button_label: p.addLabel,
        layout: p.layout,
        mobile_layout: p.layout === "cards" ? "cards" : p.mobileLayout,
        row_subtotal: showSub(p) && pr ? { multiply: pr.map((f) => f.name), saved: false } : null,
      },
      children: p.fields.map(childSpec),
    }
  },
  savedAs: (p) =>
    L(
      `One JSON variable \`${p.name}\`: an array with one object per row. Keys inside apply per row.`,
      `Satu variabel JSON \`${p.name}\`: array berisi satu objek per baris. Key di dalamnya berlaku per baris.`,
    ),
  notes: [
    L(
      "Saved as **one JSON variable** holding a list of objects (shaping decision 6). Field names inside are per row, not top-level variables.",
      "Disimpan sebagai **satu variabel JSON** berisi daftar objek (keputusan shaping 6). Nama field di dalamnya berlaku per baris, bukan variabel tingkat atas.",
    ),
    L(
      "The Camunda validator (`FormConstraintValidator.java:312-380`) checks every `name` in the spec as a top-level variable. It must skip `children` of a REPEATER and validate them per row.",
      "Validator camunda (`FormConstraintValidator.java:312-380`) mengecek setiap `name` di spec sebagai variabel tingkat atas. Ia harus melewati `children` milik REPEATER dan memvalidasinya per baris.",
    ),
    L(
      'History, draft and bulk complete must read `value_kind: "list"`. If one layer misses it, rows are lost or rejected without a clear message.',
      'History, draft, dan bulk complete harus membaca `value_kind: "list"`. Kalau satu lapisan terlewat, isian baris hilang atau ditolak tanpa pesan jelas.',
    ),
    L(
      "There is no `useFieldArray` anywhere yet; this is the first field whose value is a list of objects.",
      "Belum ada `useFieldArray` di mana pun; ini field pertama yang nilainya daftar objek.",
    ),
    L("The row subtotal is computed in the browser for display and is not saved.", "Subtotal per baris dihitung di browser untuk tampilan dan tidak disimpan."),
    L(
      'Below 640 px, `mobile_layout: "cards"` shows one card per row: a one-line summary when collapsed, inputs at least 44 px tall with 16 px text (no zoom on iOS), duplicate and remove, and an inline Undo after removing.',
      'Di bawah 640 px, `mobile_layout: "cards"` menampilkan satu kartu per baris: ringkasan satu baris saat diciutkan, input minimal setinggi 44 px dengan teks 16 px (tidak zoom di iOS), duplikat dan hapus, serta Urungkan setelah menghapus.',
    ),
  ],
  story: {
    process: L("Procurement request", "Pengadaan barang"),
    step: L("Revise request", "Revisi permintaan"),
    ref: "PR-2026-0147",
    due: "2026-10-09",
    task: L("Revise procurement request", "Revisi permintaan pengadaan"),
    before: [
      {
        name: "purpose",
        label: L("Purpose", "Keperluan"),
        type: "text",
        required: true,
        value: "Perangkat kerja staf baru tim desain",
        placeholder: L("What is this purchase for?", "Untuk apa pembelian ini?"),
      },
    ],
  },
}
