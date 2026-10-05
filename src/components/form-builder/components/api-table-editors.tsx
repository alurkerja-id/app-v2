import { useId, useRef, useState, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  PlusSignIcon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { L, useT, type L10n } from "../i18n"
import { uid } from "../lib"
import { JsonBlock, Rich } from "../rich"
import {
  FORMAT_IDS,
  FORMATS,
  NOT_IN_RESPONSE,
  SOURCE_IDS,
  SOURCES,
  arrayPaths,
  check,
  get,
  guessFormat,
  humanize,
  isFormat,
  isSourceId,
  type ApiColumn,
  type ApiTableProps,
} from "./api-table-data"

/* Custom Edit Element editors for the API data table. Each one gets the draft props and
   `set` (a partial patch) from the dialog; nothing is mutated in place. */

type SetProps = (patch: Partial<ApiTableProps>) => void

/** Same layout as a regular Edit Element field: label, control, hint. */
function FieldRow({ label, htmlFor, hint, error, children }: { label: L10n; htmlFor?: string; hint?: L10n; error?: L10n | null; children: ReactNode }) {
  const t = useT()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {t(label)}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {t(error)}
        </p>
      ) : (
        hint && (
          <p className="text-xs text-muted-foreground">
            <Rich text={hint} />
          </p>
        )
      )}
    </div>
  )
}

/* ── Connection ─────────────────────────────────────────────────────────── */

/** Registered connections, with the full endpoint as hint. Switching moves the root path to a list the new response has. */
export function SourceField({ p, set }: { p: ApiTableProps; set: SetProps }) {
  const t = useT()
  const id = useId()
  const src = SOURCES[p.source] ?? SOURCES.okr
  const pick = (v: string) => {
    if (!isSourceId(v)) return
    const resp = SOURCES[v].resp
    const lists = arrayPaths(resp)
    const rootPath = !Array.isArray(get(resp, p.rootPath)) && lists.length ? lists[0] : p.rootPath
    set({ source: v, rootPath })
  }
  return (
    <FieldRow label={L("Connection", "Koneksi")} htmlFor={id} hint={L(`\`GET ${src.host}${src.path}\``)}>
      <Select value={p.source} onValueChange={pick}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SOURCE_IDS.map((k) => (
            <SelectItem key={k} value={k}>
              {t(SOURCES[k].label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldRow>
  )
}

/* ── Root path: live check ──────────────────────────────────────────────── */

const box = "flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-xs"

/** "14 rows found at data.items" — or "No list at …" with buttons for the lists the response does have. */
export function RootCheck({ p, set }: { p: ApiTableProps; set: SetProps }) {
  const t = useT()
  const [showSample, setShowSample] = useState(false)
  const c = check(p)

  if (c.ok) {
    return (
      <div className="flex flex-col gap-2" role="status" aria-live="polite">
        <div className={cn(box, "border-emerald-500/30 bg-emerald-500/5")}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="mt-px size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-sm font-medium text-foreground">{t(L(`${c.rows.length} rows found at ${p.rootPath}`, `${c.rows.length} baris ditemukan di ${p.rootPath}`))}</p>
            <p className="text-muted-foreground">
              {t(L("Fields: ", "Field: "))}
              <span className="font-mono break-words text-foreground/80">{c.fields.join(", ") || "—"}</span>
            </p>
            <Button variant="link" size="xs" className="h-auto w-fit px-0" aria-expanded={showSample} onClick={() => setShowSample((s) => !s)}>
              {t(showSample ? L("Hide first row", "Sembunyikan baris pertama") : L("Show first row of the response", "Lihat baris pertama respons"))}
            </Button>
          </div>
        </div>
        {showSample && <JsonBlock value={c.rows[0]} maxHeight="14rem" />}
      </div>
    )
  }

  if (c.kind === "url") {
    return (
      <div className={cn(box, "border-destructive/30 bg-destructive/5")} role="status" aria-live="polite">
        <HugeiconsIcon icon={AlertCircleIcon} className="mt-px size-4 shrink-0 text-destructive" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-medium text-foreground">{t(L("Can’t call this URL", "URL ini tidak bisa dipanggil"))}</p>
          <p className="text-muted-foreground">{t(L("Fix the URL above first.", "Perbaiki URL di atas dulu."))}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(box, "border-destructive/30 bg-destructive/5")} role="status" aria-live="polite">
      <HugeiconsIcon icon={AlertCircleIcon} className="mt-px size-4 shrink-0 text-destructive" />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{t(L(`No list at “${p.rootPath}”`, `Tidak ada daftar di “${p.rootPath}”`))}</p>
        {c.lists.length ? (
          <>
            <p className="text-muted-foreground">{t(L("Lists in this response:", "Daftar di respons ini:"))}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {c.lists.map((path) => (
                <Button
                  key={path}
                  variant="link"
                  size="xs"
                  className="h-auto px-0 font-mono"
                  onClick={() => {
                    set({ rootPath: path })
                    toast.success(t(L(`Root path set to ${path}`, `Root path diubah ke ${path}`)))
                  }}
                >
                  {t(L("Use ", "Pakai "))}
                  {path}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">{t(L("The response has no list at all.", "Respons tidak berisi daftar."))}</p>
        )}
      </div>
    </div>
  )
}

/* ── Columns ────────────────────────────────────────────────────────────── */

const sampleOf = (v: unknown) => (v === undefined ? "" : String(v).slice(0, 26))

/**
 * Columns list: open a column to edit its Title (EN / ID), Field (picked from the response,
 * with a sample value from the first row) and Format. Add, reorder, remove, fill from response.
 */
export function ColumnsEditor({ p, set }: { p: ApiTableProps; set: SetProps }) {
  const t = useT()
  const [open, setOpen] = useState<string | null>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const c = check(p)
  const fields = c.ok ? c.fields : []
  const n = p.columns.length

  const setColumns = (columns: ApiColumn[]) => set({ columns })
  const patch = (id: string, next: Partial<ApiColumn>) => setColumns(p.columns.map((k) => (k.id === id ? { ...k, ...next } : k)))

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= n) return
    const next = p.columns.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    setColumns(next)
    // Keep focus on the arrow that was pressed (or its sibling once the column hits an end).
    const id = p.columns[i].id
    requestAnimationFrame(() => {
      const root = listRef.current
      if (!root) return
      const same = root.querySelector<HTMLButtonElement>(`[data-col="${id}"][data-move="${dir}"]:not(:disabled)`)
      ;(same ?? root.querySelector<HTMLButtonElement>(`[data-col="${id}"][data-move="${-dir}"]`))?.focus()
    })
  }

  const newColumn = (f: string): ApiColumn => ({
    id: uid("k"),
    title: L(humanize(f), humanize(f)),
    field: f,
    format: c.ok ? guessFormat(f, get(c.rows[0], f)) : "text",
  })

  const add = () => {
    if (!fields.length) return
    const used = p.columns.map((k) => k.field)
    const k = newColumn(fields.find((x) => !used.includes(x)) ?? fields[0])
    setColumns([...p.columns, k])
    setOpen(k.id)
  }

  const fill = () => {
    if (!fields.length) return
    setColumns(
      fields
        .filter((f) => f !== "id" && !/\.id$/.test(f))
        .slice(0, 5)
        .map(newColumn),
    )
    setOpen(null)
    toast.info(t(L("Columns filled from the response — rename the titles", "Kolom diisi dari respons — ganti judulnya")))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">{t(L("Open a column to edit its title, field and format.", "Buka kolom untuk mengubah judul, field, dan formatnya."))}</p>
      <ol ref={listRef} className="flex flex-col gap-2">
        {p.columns.map((k, i) => {
          const missing = c.ok && !fields.includes(k.field)
          const isOpen = open === k.id
          const panelId = `col-panel-${k.id}`
          return (
            <li key={k.id} className={cn("rounded-2xl border border-border transition-colors", isOpen && "bg-muted/30", missing && "border-destructive/40")}>
              <div className="flex items-center gap-1 py-1.5 pr-1.5 pl-1.5">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : k.id)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1.5 py-1 text-left outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <HugeiconsIcon icon={FORMATS[k.format].icon} className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{t(k.title) || "—"}</span>
                    {missing ? (
                      <span className="flex min-w-0 items-center gap-1 text-xs text-destructive">
                        <HugeiconsIcon icon={Alert02Icon} className="size-3 shrink-0" />
                        <span className="truncate">
                          <span className="font-mono">{k.field}</span> · {t(NOT_IN_RESPONSE)}
                        </span>
                      </span>
                    ) : (
                      <span className="truncate text-xs text-muted-foreground">
                        <span className="font-mono">{k.field}</span> · {t(FORMATS[k.format].label)}
                      </span>
                    )}
                  </span>
                  <HugeiconsIcon icon={ArrowDown01Icon} className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </button>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button variant="ghost" size="icon-xs" data-col={k.id} data-move={-1} aria-label={t(L("Move left", "Geser ke kiri"))} disabled={i === 0} onClick={() => move(i, -1)}>
                    <HugeiconsIcon icon={ArrowUp01Icon} />
                  </Button>
                  <Button variant="ghost" size="icon-xs" data-col={k.id} data-move={1} aria-label={t(L("Move right", "Geser ke kanan"))} disabled={i === n - 1} onClick={() => move(i, 1)}>
                    <HugeiconsIcon icon={ArrowDown01Icon} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={t(L(`Remove column ${k.title.en}`, `Hapus kolom ${k.title.id || k.title.en}`))}
                    disabled={n === 1}
                    onClick={() => {
                      setColumns(p.columns.filter((x) => x.id !== k.id))
                      if (isOpen) setOpen(null)
                    }}
                    className="hover:text-destructive"
                  >
                    <HugeiconsIcon icon={Delete02Icon} />
                  </Button>
                </div>
              </div>
              {isOpen && (
                <div id={panelId} className="border-t border-border px-4 py-4">
                  <ColumnFields col={k} fields={fields} rows={c.ok ? c.rows : null} onPatch={(next) => patch(k.id, next)} />
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" disabled={!fields.length} onClick={add}>
          <HugeiconsIcon icon={PlusSignIcon} />
          {t(L("Add column", "Tambah kolom"))}
        </Button>
        <Button variant="ghost" size="sm" disabled={!fields.length} onClick={fill}>
          <HugeiconsIcon icon={Refresh01Icon} />
          {t(L("Fill from response", "Isi dari respons"))}
        </Button>
      </div>
      {!c.ok && (
        <p className="text-xs text-muted-foreground">
          {t(L("Fix the data source first to pick fields from the response.", "Perbaiki sumber data dulu untuk memilih field dari respons."))}
        </p>
      )}
    </div>
  )
}

/** Edit Element for one column: Title (EN / ID), Field, Format. */
function ColumnFields({
  col,
  fields,
  rows,
  onPatch,
}: {
  col: ApiColumn
  fields: string[]
  rows: Record<string, unknown>[] | null
  onPatch: (next: Partial<ApiColumn>) => void
}) {
  const t = useT()
  const id = useId()
  const known = fields.includes(col.field)
  const options = known || !col.field ? fields : [col.field, ...fields]
  const first = rows?.[0]

  return (
    <div className="flex flex-col gap-4">
      <FieldRow label={L("Title", "Judul")} htmlFor={`${id}-title`}>
        <div className="flex flex-col gap-2">
          {(["en", "id"] as const).map((side) => (
            <InputGroup key={side}>
              <InputGroupAddon>
                <span className="w-5 text-[10px] font-semibold tracking-wider">{side.toUpperCase()}</span>
              </InputGroupAddon>
              <InputGroupInput
                id={side === "en" ? `${id}-title` : undefined}
                aria-label={side === "id" ? `${t(L("Title", "Judul"))} (Bahasa Indonesia)` : undefined}
                value={col.title[side]}
                onChange={(e) => onPatch({ title: { ...col.title, [side]: e.target.value } })}
              />
            </InputGroup>
          ))}
        </div>
      </FieldRow>

      <FieldRow
        label={L("Field", "Field")}
        htmlFor={`${id}-field`}
        hint={L("The sample value comes from the first row of the response.", "Contoh nilai diambil dari baris pertama respons.")}
        error={rows && !known ? L("Not in the response — pick another field", "Tidak ada di respons — pilih field lain") : null}
      >
        <Select value={col.field || undefined} onValueChange={(field) => onPatch({ field })} disabled={!options.length}>
          <SelectTrigger id={`${id}-field`} className="w-full" aria-invalid={(rows && !known) || undefined}>
            <SelectValue placeholder={t(L("Pick a field", "Pilih field"))} />
          </SelectTrigger>
          <SelectContent>
            {options.map((f) => {
              const inResp = fields.includes(f)
              const sample = inResp && first ? sampleOf(get(first, f)) : ""
              return (
                <SelectItem key={f} value={f}>
                  <span className="font-mono text-[13px]">{f}</span>
                  {inResp ? (
                    sample && <span className="truncate font-normal text-muted-foreground">— {sample}</span>
                  ) : (
                    <span className="font-normal text-muted-foreground">({t(NOT_IN_RESPONSE)})</span>
                  )}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </FieldRow>

      <FieldRow label={L("Format", "Format")} htmlFor={`${id}-format`}>
        <Select value={col.format} onValueChange={(v) => isFormat(v) && onPatch({ format: v })}>
          <SelectTrigger id={`${id}-format`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMAT_IDS.map((f) => (
              <SelectItem key={f} value={f}>
                <HugeiconsIcon icon={FORMATS[f].icon} />
                {t(FORMATS[f].label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>
    </div>
  )
}
