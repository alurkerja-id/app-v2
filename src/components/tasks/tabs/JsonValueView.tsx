import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon, CodeIcon, GridTableIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface JsonValueViewProps {
  value: string
}

type Row = Record<string, unknown>

function tryParse(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

function isArrayOfObjects(v: unknown): v is Row[] {
  return Array.isArray(v) && v.length > 0 && v.every((r) => r !== null && typeof r === "object" && !Array.isArray(r))
}

type Primitive = string | number | boolean

function isArrayOfPrimitives(v: unknown): v is Primitive[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((r) => typeof r === "string" || typeof r === "number" || typeof r === "boolean")
  )
}

// Columns we know how to format nicely; anything else falls back to plain text.
const KNOWN_COLUMNS = ["name", "project_name", "label_name", "due_on", "completion_pct", "created_by", "is_overdue", "is_completed"]

function formatDate(v: unknown): string {
  if (typeof v !== "string" || !v) return "-"
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

function TaskArrayTable({ rows }: { rows: Row[] }) {
  const columns = KNOWN_COLUMNS.filter((c) => rows.some((r) => r[c] !== undefined && r[c] !== ""))

  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border/60 bg-muted/50">
            {columns.includes("name") && <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Task</th>}
            {columns.includes("project_name") && <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Project</th>}
            {columns.includes("label_name") && <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Label</th>}
            {columns.includes("due_on") && <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Due</th>}
            {columns.includes("completion_pct") && <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Progress</th>}
            {columns.includes("created_by") && <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Created By</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const overdue = Boolean(r.is_overdue) && !r.is_completed
            return (
              <tr key={(r.id as string | number) ?? i} className="border-b border-border/40 last:border-0">
                {columns.includes("name") && (
                  <td className="px-2 py-1.5 font-medium text-foreground align-top">
                    <span className={cn(Boolean(r.is_completed) && "text-muted-foreground line-through")}>
                      {String(r.name ?? "-")}
                    </span>
                  </td>
                )}
                {columns.includes("project_name") && (
                  <td className="px-2 py-1.5 text-muted-foreground align-top">{String(r.project_name ?? "-")}</td>
                )}
                {columns.includes("label_name") && (
                  <td className="px-2 py-1.5 align-top">
                    {r.label_name ? (
                      <Badge
                        variant="secondary"
                        className="font-normal text-[10px] px-1.5 py-0"
                        style={
                          r.label_color
                            ? { backgroundColor: `${r.label_color}33`, color: String(r.label_color) }
                            : undefined
                        }
                      >
                        {String(r.label_name)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                )}
                {columns.includes("due_on") && (
                  <td className="px-2 py-1.5 align-top">
                    <span className={cn(overdue ? "flex items-center gap-1 font-medium text-red-500" : "text-foreground")}>
                      {overdue && <HugeiconsIcon icon={Alert01Icon} className="size-3 shrink-0" />}
                      {formatDate(r.due_on)}
                    </span>
                  </td>
                )}
                {columns.includes("completion_pct") && (
                  <td className="px-2 py-1.5 align-top">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Number(r.completion_pct) || 0}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground">{Number(r.completion_pct) || 0}%</span>
                    </div>
                  </td>
                )}
                {columns.includes("created_by") && (
                  <td className="px-2 py-1.5 text-muted-foreground align-top">{String(r.created_by ?? "-")}</td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const HTML_TAG_RE = /^\s*<([a-z][a-z0-9]*)\b[^>]*>/i

function isHtmlString(v: string): boolean {
  return HTML_TAG_RE.test(v)
}

// Minimal denylist sanitizer for admin-authored rich-text field values
// (form/instruction copy defined by process designers, not end-user input).
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "")
}

function PrimitiveArrayChips({ items }: { items: Primitive[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((v, i) => (
        <Badge key={`${v}-${i}`} variant="secondary" className="font-normal text-[10px] px-1.5 py-0">
          {String(v)}
        </Badge>
      ))}
    </div>
  )
}

/**
 * Renders a field value that may be a JSON string.
 * - Array of flat objects (e.g. lists of related tasks) → formatted table.
 * - Array of primitives (e.g. checkbox selections) → chip list.
 * - Everything else falls back to plain text / pretty-printed JSON.
 * A raw-JSON toggle is available whenever a formatted view is used.
 */
export function JsonValueView({ value }: JsonValueViewProps) {
  const [showRaw, setShowRaw] = useState(false)
  const parsed = tryParse(value)

  if (parsed === undefined) {
    if (isHtmlString(value)) {
      return (
        <div
          className="text-[11px] font-medium text-foreground break-words [&_p]:leading-relaxed [&_p+p]:mt-1.5"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
        />
      )
    }
    // Not JSON at all — render as before.
    return <span className="text-[11px] font-medium text-foreground break-words">{value}</span>
  }

  const asTable = isArrayOfObjects(parsed)
  const asChips = !asTable && isArrayOfPrimitives(parsed)
  const hasFormattedView = asTable || asChips
  const pretty = JSON.stringify(parsed, null, 2)

  return (
    <div className="flex flex-col gap-1.5">
      {hasFormattedView && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowRaw((s) => !s)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <HugeiconsIcon icon={showRaw ? GridTableIcon : CodeIcon} className="size-3" />
            {showRaw ? "Formatted" : "Raw JSON"}
          </button>
        </div>
      )}
      {hasFormattedView && !showRaw ? (
        asTable ? (
          <TaskArrayTable rows={parsed} />
        ) : (
          <PrimitiveArrayChips items={parsed as Primitive[]} />
        )
      ) : (
        <pre className="overflow-x-auto rounded-lg bg-muted p-2 font-mono text-[10px] leading-relaxed">{pretty}</pre>
      )}
    </div>
  )
}
