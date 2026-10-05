/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useId } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { ParagraphIcon, TextAlignCenterIcon, TextAlignLeftIcon, TextAlignRightIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { L, useT, type L10n } from "../i18n"
import { F } from "../lib"
import type { ComponentDef, FieldState, RuntimeProps } from "../types"

/* Paragraph — ui_type P, value_kind "none". Story: the policy note on a leave request form. */

type Size = "sm" | "md" | "lg"
type Align = "left" | "center" | "right"
type Tone = "default" | "muted"

interface ParagraphProps {
  /** Key: identity of the node only — a paragraph sends no value. */
  name: string
  text: L10n
  size: Size
  align: Align
  tone: Tone
}
type ParagraphValue = null

const SIZE: Record<Size, string> = { sm: "text-[13px]", md: "text-sm", lg: "text-base" }
const ALIGN: Record<Align, string> = { left: "text-left", center: "text-center", right: "text-right" }

/** The language that is empty ("id" first, like the prototype), or null. */
const missing = (p: ParagraphProps) => (!p.text.id.trim() ? "id" : !p.text.en.trim() ? "en" : null)

/** Plain text, line breaks kept. `t()` falls back to the other language when one side is empty. */
function Para({ p, state = "active" }: { p: ParagraphProps; state?: FieldState }) {
  const t = useT()
  return (
    <p
      aria-disabled={state === "disabled" || undefined}
      className={cn(
        "leading-relaxed text-pretty whitespace-pre-line",
        SIZE[p.size],
        ALIGN[p.align],
        p.tone === "muted" || state === "disabled" ? "text-muted-foreground" : "text-foreground",
        state === "disabled" && "opacity-70",
      )}
    >
      {t(p.text)}
    </p>
  )
}

/* ── Edit Element: align is an icon choice (left / center / right) ─────── */

const ALIGNS: { v: Align; icon: IconSvgElement; title: L10n }[] = [
  { v: "left", icon: TextAlignLeftIcon, title: L("Left", "Kiri") },
  { v: "center", icon: TextAlignCenterIcon, title: L("Center", "Tengah") },
  { v: "right", icon: TextAlignRightIcon, title: L("Right", "Kanan") },
]

function AlignField({ value, onChange }: { value: Align; onChange: (v: Align) => void }) {
  const t = useT()
  const labelId = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label id={labelId} className="text-sm font-medium">
        {t(L("Align", "Rata"))}
      </Label>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={value}
        aria-labelledby={labelId}
        onValueChange={(raw) => {
          const o = ALIGNS.find((x) => x.v === raw)
          if (o) onChange(o.v)
        }}
      >
        {ALIGNS.map((o) => (
          <ToggleGroupItem key={o.v} value={o.v} aria-label={t(o.title)} title={t(o.title)} className="px-3">
            <HugeiconsIcon icon={o.icon} />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

function ParagraphCanvas({ props: p }: { props: ParagraphProps }) {
  return <Para p={p} />
}

function ParagraphRuntime({ props: p, state }: RuntimeProps<ParagraphProps, ParagraphValue>) {
  return <Para p={p} state={state} />
}

export const paragraph: ComponentDef<ParagraphProps, ParagraphValue> = {
  slug: "paragraph",
  wave: 1,
  ui: "P",
  vk: "none",
  group: "display",
  week: 1,
  icon: ParagraphIcon,
  label: L("Paragraph", "Paragraf"),
  title: L("Paragraph", "Paragraf"),
  blurb: L("Static text written in English and Indonesian side by side.", "Teks statis yang ditulis dalam bahasa Inggris dan Indonesia berdampingan."),
  bare: true,

  defaults: () => ({
    name: "leave_notice",
    text: L(
      "Submit annual leave at least 3 working days before it starts. Your manager approves it first, then HR updates your leave balance.",
      "Ajukan cuti tahunan paling lambat 3 hari kerja sebelum tanggal mulai. Atasan menyetujui lebih dulu, lalu HR memperbarui saldo cuti Anda.",
    ),
    size: "md",
    align: "left",
    tone: "muted",
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.key(
          L(
            "Identity of the node. A paragraph sends no value, so this is not a process variable.",
            "Identitas node. Paragraf tidak mengirim nilai, jadi ini bukan variabel proses.",
          ),
        ),
      ],
    },
    {
      tab: "general",
      title: L("Content", "Isi"),
      fields: [
        {
          t: "i18n",
          k: "text",
          multi: true,
          rows: 5,
          label: L("Text", "Teks"),
          hint: L(
            "Plain text. Line breaks are kept. The app shows the language the user picked.",
            "Teks biasa. Baris baru dipertahankan. App menampilkan bahasa pilihan user.",
          ),
          validate: (v) => {
            const x = v as L10n
            return !x.en.trim() && !x.id.trim() ? L("Write the text in at least one language", "Tulis teksnya minimal dalam satu bahasa") : null
          },
        },
        /* One language empty is a warning, not an error: the helper falls back to the other one.
           (Indonesian empty is already flagged by the bilingual editor itself.) */
        {
          t: "note",
          tone: "warning",
          when: (p) => !p.text.en.trim() && Boolean(p.text.id.trim()),
          text: L("English is empty — EN users will see the Indonesian text", "Teks Inggris kosong — user EN akan melihat teks Indonesia"),
        },
      ],
    },
    {
      tab: "general",
      title: L("Style", "Gaya"),
      fields: [
        {
          t: "seg",
          k: "size",
          label: L("Size", "Ukuran"),
          options: [
            { v: "sm", label: L("Small", "Kecil") },
            { v: "md", label: L("Medium", "Sedang") },
            { v: "lg", label: L("Large", "Besar") },
          ],
        },
        { t: "custom", id: "align", render: ({ props, set }) => <AlignField value={props.align} onChange={(align) => set({ align })} /> },
        {
          t: "seg",
          k: "tone",
          label: L("Tone", "Nada warna"),
          options: [
            { v: "default", label: L("Default", "Biasa") },
            { v: "muted", label: L("Muted", "Redup") },
          ],
          hint: L("Muted suits helper notes; it still meets 4.5:1 contrast.", "Redup cocok untuk catatan bantuan; kontrasnya tetap 4.5:1."),
        },
      ],
    },
  ],
  fieldLabel: () => L("Paragraph", "Paragraf"),
  isRequired: () => false,
  Canvas: ParagraphCanvas,
  canvasWarn: (p) =>
    missing(p) === "id" ? L("Indonesian text missing", "Teks Indonesia kosong") : missing(p) === "en" ? L("English text missing", "Teks Inggris kosong") : null,

  Runtime: ParagraphRuntime,
  initial: () => null,
  sample: () => null,
  validate: () => [],
  value: () => null,

  spec: (p) => ({
    ui_type: "P",
    value_kind: "none",
    name: p.name,
    text: p.text,
    config: { size: p.size, align: p.align, tone: p.tone },
  }),
  savedAs: () => L("Nothing. The text lives in the form spec, not in the task.", "Tidak ada. Teksnya ada di spec form, bukan di task."),
  notes: [
    L(
      "`P` already exists in the renderer but renders `content` raw (`RenderFunction.tsx:12-19`), so a `{en,id}` object there crashes. The new node stores `text: {en,id}` and reads it through the language helper.",
      "`P` sudah ada di renderer tetapi merender `content` mentah (`RenderFunction.tsx:12-19`), jadi objek `{en,id}` di sana akan crash. Node baru menyimpan `text: {en,id}` dan membacanya lewat helper bahasa.",
    ),
    L("Old P nodes with a plain `content` string keep rendering as today (principle 5).", "Node P lama dengan `content` berupa string tetap dirender seperti sekarang (prinsip 5)."),
    L(
      "Plain text only. For formatted content from the process, use Rich text from variable.",
      "Hanya teks biasa. Untuk konten terformat dari proses, pakai Rich text from variable.",
    ),
    L(
      "If one language is empty the helper falls back to the other, and the builder warns about it.",
      "Kalau satu bahasa kosong, helper memakai bahasa lainnya, dan builder memberi peringatan.",
    ),
  ],
  story: {
    process: L("Leave request", "Izin cuti"),
    step: L("Employee request", "Pengajuan pegawai"),
    ref: "CUTI-2026-0391",
    due: "2026-10-07",
    task: L("Request annual leave", "Ajukan cuti tahunan"),
    after: [
      {
        name: "leave_type",
        label: L("Leave type", "Jenis cuti"),
        type: "select",
        required: true,
        value: "annual",
        options: [
          { v: "annual", label: L("Annual leave", "Cuti tahunan") },
          { v: "sick", label: L("Sick leave", "Cuti sakit") },
          { v: "important", label: L("Leave for important reasons", "Cuti alasan penting") },
        ],
      },
      {
        name: "start_date",
        label: L("First day of leave", "Hari pertama cuti"),
        type: "date",
        required: true,
        value: "",
        validate: (v) =>
          v && v < "2026-10-08"
            ? L("Pick 8 Oct 2026 or later (3 working days from today)", "Pilih 8 Okt 2026 atau setelahnya (3 hari kerja dari hari ini)")
            : null,
      },
      { name: "reason", label: L("Reason", "Alasan"), type: "textarea", value: "", rows: 2, placeholder: L("Optional for annual leave", "Opsional untuk cuti tahunan") },
    ],
  },
}
