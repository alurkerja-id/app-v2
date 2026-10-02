import { format } from "date-fns"
import type { DateRangeValue } from "@/lib/date-presets"

export type ExportValue = string | number | Date | null | undefined

export interface ExportColumn<Row> {
  header: string
  value: (row: Row) => ExportValue
  /** Column width in characters. Defaults to a width fitted to the header. */
  width?: number
  /** Excel number format, e.g. "0.0" or "0%". */
  format?: string
}

/** What the card exports: a flat table, independent of how the card draws it. */
export interface ExportTable<Row> {
  columns: ExportColumn<Row>[]
  rows: Row[]
}

export interface ExportContext {
  dashboard: string
  period: DateRangeValue
  /** Human-readable active filters, e.g. ["Priority: P1, P2", "Category: Network"]. */
  filters: string[]
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function exportFileName(ctx: ExportContext, card: string) {
  const period = `${format(ctx.period.from, "yyyy-MM-dd")}_${format(ctx.period.to, "yyyy-MM-dd")}`
  return `${slug(ctx.dashboard)}_${slug(card)}_${period}.xlsx`
}

/**
 * Write one card's data to .xlsx and trigger the download.
 *
 * Sheet "Data" is a plain table (bold, frozen header) so it can be pivoted or
 * re-imported as-is. Sheet "Info" records where it came from — dashboard, card,
 * period and filters — because a file named only by its card is ambiguous once
 * it leaves the app.
 *
 * The writer is loaded on demand: it is only needed on click, so it stays out of
 * the initial bundle.
 */
export async function exportXlsx<Row>(ctx: ExportContext, card: string, table: ExportTable<Row>) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser")

  const header = table.columns.map((c) => ({ value: c.header, fontWeight: "bold" as const }))
  const body = table.rows.map((row) =>
    table.columns.map((c) => {
      const v = c.value(row)
      if (v == null || v === "") return null
      if (v instanceof Date) return { value: v, type: Date, format: c.format ?? "dd mmm yyyy" }
      if (typeof v === "number") return { value: v, type: Number, ...(c.format ? { format: c.format } : {}) }
      return { value: String(v), type: String }
    }),
  )

  const fmt = (d: Date) => format(d, "d MMM yyyy")
  const info = [
    [{ value: "Dashboard", fontWeight: "bold" as const }, ctx.dashboard],
    [{ value: "Card", fontWeight: "bold" as const }, card],
    [{ value: "Period", fontWeight: "bold" as const }, `${fmt(ctx.period.from)} – ${fmt(ctx.period.to)}`],
    [{ value: "Filters", fontWeight: "bold" as const }, ctx.filters.length ? ctx.filters.join("; ") : "None"],
    [{ value: "Exported", fontWeight: "bold" as const }, format(new Date(), "d MMM yyyy HH:mm")],
  ]

  await writeXlsxFile([
    {
      sheet: "Data",
      data: [header, ...body],
      columns: table.columns.map((c) => ({ width: c.width ?? Math.max(12, c.header.length + 4) })),
      stickyRowsCount: 1,
    },
    { sheet: "Info", data: info, columns: [{ width: 12 }, { width: 60 }] },
  ]).toFile(exportFileName(ctx, card))
}
