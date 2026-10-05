/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { GridTableIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { L, useT, type L10n } from "../i18n"
import { F, snake, uniqueErr } from "../lib"
import type { ComponentDef, Issue, RuntimeProps } from "../types"

/* Matrix ★ — ui_type MATRIX, value_kind "json" (object keyed by row). Story: office services survey. */

interface MatrixRow {
  key: string
  label: L10n
  [k: string]: unknown
}
interface MatrixCol {
  value: string
  label: L10n
  [k: string]: unknown
}
interface MatrixProps {
  label: L10n
  name: string
  rows: MatrixRow[]
  columns: MatrixCol[]
  answer: "single" | "multiple"
  required: boolean
  rule: "all" | "min"
  minRows: number
}
/** Answer per row key: a column value (single) or a list of them (multiple). */
type MatrixValue = Record<string, string | string[] | undefined>

const row = (en: string, id: string): MatrixRow => ({ key: snake(en), label: L(en, id) })
const col = (en: string, id: string): MatrixCol => ({ value: snake(en), label: L(en, id) })
const multi = (p: MatrixProps) => p.answer === "multiple"

const answered = (p: MatrixProps, v: MatrixValue, r: MatrixRow) => {
  const x = v[r.key]
  return multi(p) ? Array.isArray(x) && x.length > 0 : typeof x === "string"
}

function MatrixCanvas({ props: p }: { props: MatrixProps }) {
  const t = useT()
  return (
    <div className="flex flex-col gap-1.5">
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-3 py-2" />
              {p.columns.map((c) => (
                <th key={c.value} className="px-2 py-2 text-center font-medium text-muted-foreground">
                  {t(c.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {p.rows.map((r) => (
              <tr key={r.key} className="border-t border-border">
                <td className="px-3 py-2 text-foreground">{t(r.label)}</td>
                {p.columns.map((c) => (
                  <td key={c.value} className="px-2 py-2 text-center">
                    <span className={cn("inline-block size-4 border border-border bg-[var(--input-surface)] shadow-[var(--input-depth)]", multi(p) ? "rounded-[5px]" : "rounded-full")} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        {t(multi(p) ? L("Several answers per row", "Boleh beberapa jawaban per baris") : L("One answer per row", "Satu jawaban per baris"))}
      </p>
    </div>
  )
}

function MatrixRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<MatrixProps, MatrixValue>) {
  const t = useT()
  const bad = (r: MatrixRow) => issues.some((i) => i.fid === `row-${r.key}`)
  const disabled = state === "disabled"
  const live = state === "active"
  const done = p.rows.filter((r) => answered(p, v, r)).length

  const setSingle = (r: MatrixRow, c: string) => live && onChange({ ...v, [r.key]: c })
  const toggle = (r: MatrixRow, c: string, on: boolean) => {
    if (!live) return
    const cur = Array.isArray(v[r.key]) ? (v[r.key] as string[]) : []
    const next = on ? [...cur, c] : cur.filter((x) => x !== c)
    // keep column order, not click order
    onChange({ ...v, [r.key]: p.columns.map((x) => x.value).filter((x) => next.includes(x)) })
  }

  const control = (r: MatrixRow, c: MatrixCol, withText: boolean) => {
    const label = `${t(r.label)}: ${t(c.label)}`
    if (multi(p)) {
      const on = Array.isArray(v[r.key]) && (v[r.key] as string[]).includes(c.value)
      return (
        <label className={cn("flex items-center gap-2", withText ? "py-1" : "justify-center", live && "cursor-pointer")}>
          <Checkbox checked={on} disabled={disabled} aria-label={withText ? undefined : label} onCheckedChange={(x) => toggle(r, c.value, x === true)} />
          {withText && <span className="text-sm">{t(c.label)}</span>}
        </label>
      )
    }
    return (
      <label className={cn("flex items-center gap-2", withText ? "py-1" : "justify-center", live && "cursor-pointer")}>
        <RadioGroupItem value={c.value} disabled={disabled} aria-label={withText ? undefined : label} />
        {withText && <span className="text-sm">{t(c.label)}</span>}
      </label>
    )
  }

  const cols = `minmax(9rem, 1.6fr) repeat(${p.columns.length}, minmax(4.75rem, 1fr))`
  const rowGroup = (r: MatrixRow, children: React.ReactNode, className?: string, style?: React.CSSProperties) =>
    multi(p) ? (
      <div key={r.key} role="group" aria-label={t(r.label)} className={className} style={style}>
        {children}
      </div>
    ) : (
      <RadioGroup
        key={r.key}
        style={style}
        value={typeof v[r.key] === "string" ? (v[r.key] as string) : ""}
        onValueChange={(c) => setSingle(r, c)}
        disabled={disabled}
        aria-label={t(r.label)}
        className={className}
      >
        {children}
      </RadioGroup>
    )

  return (
    <div className="flex flex-col gap-2" aria-labelledby={`${id}-label`} role="group">
      {compact ? (
        <div className="flex flex-col gap-2">
          {p.rows.map((r) => (
            <fieldset key={r.key} className={cn("rounded-2xl border border-border px-4 py-3", bad(r) && "border-destructive/60 bg-destructive/5")}>
              <legend className="sr-only">{t(r.label)}</legend>
              <p className="mb-1 text-sm font-medium">{t(r.label)}</p>
              {rowGroup(
                r,
                p.columns.map((c) => <div key={c.value}>{control(r, c, true)}</div>),
                "gap-0",
              )}
            </fieldset>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          {/* Grid instead of <table>: each row is one radiogroup, which a <tr> cannot hold. */}
          <div className="min-w-fit text-sm">
            <div className="grid items-end bg-muted/50" style={{ gridTemplateColumns: cols }} aria-hidden>
              <span className="px-3 py-2.5" />
              {p.columns.map((c) => (
                <span key={c.value} className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground">
                  {t(c.label)}
                </span>
              ))}
            </div>
            {p.rows.map((r) =>
              rowGroup(
                r,
                <>
                  <span className={cn("px-3 py-2.5", bad(r) && "text-destructive")}>{t(r.label)}</span>
                  {p.columns.map((c) => (
                    <span key={c.value} className="flex justify-center px-2 py-2.5">
                      {control(r, c, false)}
                    </span>
                  ))}
                </>,
                cn("grid items-center gap-0 border-t border-border", bad(r) && "bg-destructive/5"),
                { gridTemplateColumns: cols },
              ),
            )}
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {t(L(`${done} of ${p.rows.length} rows answered`, `${done} dari ${p.rows.length} baris dijawab`))}
      </p>
    </div>
  )
}

function validate(p: MatrixProps, v: MatrixValue): Issue[] {
  if (!p.required) return []
  const missing = p.rows.filter((r) => !answered(p, v, r))
  if (p.rule === "min") {
    const need = Math.min(p.rows.length, Number(p.minRows) || 1)
    const done = p.rows.length - missing.length
    return done >= need
      ? []
      : [{ fid: `row-${missing[0].key}`, msg: L(`Answer at least ${need} rows (${done} answered)`, `Jawab minimal ${need} baris (${done} terjawab)`) }]
  }
  return missing.map((r) => ({ fid: `row-${r.key}`, msg: L(`${r.label.en}: pick an answer`, `${r.label.id}: pilih jawaban`) }))
}

export const matrix: ComponentDef<MatrixProps, MatrixValue> = {
  slug: "matrix",
  wave: 2,
  ui: "MATRIX",
  vk: "json",
  star: true,
  group: "survey",
  week: 3,
  icon: GridTableIcon,
  label: L("Matrix", "Matriks"),
  title: L("Matrix question", "Matriks pertanyaan"),
  blurb: L(
    "Several statements share one answer scale. Saved as one object keyed by row.",
    "Beberapa pernyataan memakai satu skala jawaban. Disimpan sebagai satu objek berkunci baris.",
  ),

  defaults: () => ({
    label: L("How satisfied are you with these office services?", "Seberapa puas Anda dengan layanan kantor berikut?"),
    name: "office_services",
    rows: [
      row("Room cleanliness", "Kebersihan ruangan"),
      row("Stationery supply", "Ketersediaan alat tulis"),
      row("Helpdesk response time", "Kecepatan respon helpdesk"),
      row("Canteen food", "Makanan kantin"),
    ],
    columns: [
      col("Very dissatisfied", "Sangat tidak puas"),
      col("Dissatisfied", "Tidak puas"),
      col("Neutral", "Netral"),
      col("Satisfied", "Puas"),
      col("Very satisfied", "Sangat puas"),
    ],
    answer: "single",
    required: true,
    rule: "all",
    minRows: 3,
  }),
  schema: (p) => [
    {
      tab: "general",
      fields: [
        F.name(L("Name (the question)", "Nama (pertanyaannya)"), { multi: true }),
        F.key(),
        {
          t: "list",
          k: "rows",
          label: L("Rows (statements)", "Baris (pernyataan)"),
          keyField: "key",
          min: 1,
          max: 15,
          addLabel: L("Add row", "Tambah baris"),
          newItem: (n) => row(`Statement ${n + 1}`, `Pernyataan ${n + 1}`),
          hint: L(
            "The small text is the row key saved in the data. It follows the English label until the form is published.",
            "Teks kecil adalah key baris yang disimpan di data. Mengikuti label bahasa Inggris sampai form dirilis.",
          ),
        },
        {
          t: "list",
          k: "columns",
          label: L("Columns (answer scale)", "Kolom (skala jawaban)"),
          keyField: "value",
          min: 2,
          max: 7,
          addLabel: L("Add column", "Tambah kolom"),
          newItem: (n) => col(`Option ${n + 1}`, `Opsi ${n + 1}`),
        },
        {
          t: "seg",
          k: "answer",
          label: L("Answers per row", "Jawaban per baris"),
          options: [
            { v: "single", label: L("One", "Satu") },
            { v: "multiple", label: L("Several", "Beberapa") },
          ],
        },
      ],
    },
    {
      tab: "validation",
      fields: [
        F.required(),
        {
          t: "seg",
          k: "rule",
          label: L("Rows that must be answered", "Baris yang wajib dijawab"),
          when: (x) => x.required,
          options: [
            { v: "all", label: L("Every row", "Semua baris") },
            { v: "min", label: L("At least…", "Minimal…") },
          ],
        },
        {
          t: "number",
          k: "minRows",
          label: L("Minimum rows answered", "Minimal baris dijawab"),
          min: 1,
          max: 15,
          when: (x) => x.required && x.rule === "min",
          validate: (v) => (Number(v) > p.rows.length ? L("More than the number of rows", "Melebihi jumlah baris") : null),
        },
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: MatrixCanvas,
  canvasWarn: (p) => (uniqueErr(p.rows, "key") || uniqueErr(p.columns, "value") ? L("Duplicate keys", "Key ganda") : null),

  Runtime: MatrixRuntime,
  initial: () => ({}),
  sample: (p) => Object.fromEntries(p.rows.map((r, i) => [r.key, multi(p) ? [p.columns[Math.min(i + 2, p.columns.length - 1)].value] : p.columns[Math.min(i + 2, p.columns.length - 1)].value])),
  validate,
  value: (p, v) => Object.fromEntries(p.rows.map((r) => [r.key, multi(p) ? (Array.isArray(v[r.key]) ? v[r.key] : []) : typeof v[r.key] === "string" ? v[r.key] : null])),

  spec: (p) => ({
    ui_type: "MATRIX",
    value_kind: "json",
    name: p.name,
    label: p.label,
    required: p.required,
    config: {
      rows: p.rows.map((r) => ({ key: r.key, label: r.label })),
      columns: p.columns.map((c) => ({ value: c.value, label: c.label })),
      answer: p.answer,
      required_rows: p.rule === "min" ? { min: Number(p.minRows) } : "all",
    },
  }),
  savedAs: (p) =>
    L(
      `One JSON object in \`${p.name}\`: every row key, with the chosen column value${multi(p) ? "s (array)" : ""} or \`null\`.`,
      `Satu objek JSON di \`${p.name}\`: setiap key baris, berisi nilai kolom yang dipilih${multi(p) ? " (array)" : ""} atau \`null\`.`,
    ),
  notes: [
    L(
      "★ Like Repeater, this is a data-shape decision: one variable, an object keyed by row, **every row present** (null when unanswered).",
      "★ Seperti Repeater, ini keputusan bentuk data: satu variabel, objek berkunci baris, **semua baris ada** (null bila tidak dijawab).",
    ),
    L(
      "The camunda validator must check rows inside the object instead of treating row keys as top-level variables.",
      "Validator camunda harus mengecek baris di dalam objek, bukan menganggap key baris sebagai variabel tingkat atas.",
    ),
    L("Row keys must stay stable after a form is published; renaming the label must not change the key.", "Key baris harus tetap setelah form dirilis; mengganti label tidak boleh mengubah key."),
    L("History shows the value as a two-column table: statement → answer label.", "History menampilkan nilai sebagai tabel dua kolom: pernyataan → label jawaban."),
    L("Below 640 px each row becomes a card with the options stacked.", "Di bawah 640 px setiap baris menjadi kartu dengan pilihan bertumpuk."),
  ],
  story: {
    process: L("Office services survey", "Survei layanan kantor"),
    step: L("Employee response", "Jawaban karyawan"),
    ref: "OFS-2026-10",
    due: "2026-10-20",
    task: L("Office services survey, October 2026", "Survei layanan kantor, Oktober 2026"),
    after: [{ name: "suggestion", label: L("Suggestions for the office team", "Saran untuk tim kantor"), type: "textarea", placeholder: L("Optional", "Opsional"), rows: 2 }],
  },
}
