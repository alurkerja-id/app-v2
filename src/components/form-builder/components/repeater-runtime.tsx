import { useEffect, useLayoutEffect, useRef, type ComponentProps, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Copy01Icon, Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { L, useLang, useT, type L10n } from "../i18n"
import { ctl, rupiah } from "../lib"
import type { FieldState, RuntimeProps } from "../types"
import {
  cardsFor,
  cellFid,
  display,
  filled,
  fmtNum,
  half,
  maxEff,
  minEff,
  mkRow,
  num,
  pair,
  rowSub,
  showSub,
  total,
  type ChildField,
  type RepeaterProps,
  type RepeaterRow,
  type RepeaterValue,
} from "./repeater-model"

/* Repeater runtime: a table on desktop, one collapsible card per row on phones
   (or always, when Show rows as = Cards). */

/** Rupiah input: digits only, grouped as you type, caret kept after the same digit. */
function MoneyInput({ digits, onDigits, className, ...rest }: Omit<ComponentProps<"input">, "value" | "onChange"> & { digits: string; onDigits: (d: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const caret = useRef<number | null>(null)
  const shown = digits ? Number(digits).toLocaleString("id-ID") : ""
  useLayoutEffect(() => {
    const el = ref.current
    const want = caret.current
    caret.current = null
    if (!el || want == null || document.activeElement !== el) return
    let pos = 0
    for (let seen = 0; pos < el.value.length && seen < want; pos++) if (/\d/.test(el.value[pos])) seen++
    el.setSelectionRange(pos, pos)
  }, [shown])
  return (
    <div className="relative min-w-0">
      <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
        Rp
      </span>
      <Input
        {...rest}
        ref={ref}
        inputMode="numeric"
        autoComplete="off"
        value={shown}
        onChange={(e) => {
          const el = e.target
          caret.current = (el.value.slice(0, el.selectionStart ?? el.value.length).match(/\d/g) ?? []).length
          onDigits(el.value.replace(/\D/g, ""))
        }}
        className={cn("pl-9 tabular-nums", className)}
      />
    </div>
  )
}

/** One child control in a cell (table) or a card. */
/** One child field control (also used by the Tabs, Accordion and Wizard containers). */
export function CellControl({
  f,
  value,
  onValue,
  state,
  domId,
  cell,
  ariaLabel,
  invalid,
  card,
  big,
}: {
  f: ChildField
  value: string
  onValue: (v: string) => void
  state: FieldState
  domId: string
  /** `rowId:fieldId`, used to move focus. */
  cell: string
  ariaLabel: string
  invalid: boolean
  card: boolean
  /** Phone: 44 px controls with 16 px text (no zoom on iOS). */
  big: boolean
}) {
  const t = useT()
  const common = { id: domId, "data-cell": cell, "aria-label": ariaLabel, "aria-invalid": invalid || undefined }
  const size = big ? "h-11 text-base" : undefined

  switch (f.kind) {
    case "number":
      return f.currency ? (
        <MoneyInput {...common} {...ctl(state)} digits={value} onDigits={onValue} className={size} />
      ) : (
        <Input
          {...common}
          {...ctl(state)}
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => onValue(e.target.value.replace(/\D/g, ""))}
          className={cn("tabular-nums", !card && "text-right", size)}
        />
      )
    case "textarea":
      return (
        <Textarea
          {...common}
          {...ctl(state)}
          rows={card ? 2 : 1}
          value={value}
          placeholder={t(f.placeholder)}
          onChange={(e) => onValue(e.target.value)}
          className={cn(card ? "min-h-16" : big ? "min-h-11 py-2.5" : "min-h-9 py-2", big && "text-base")}
        />
      )
    case "date":
      return <Input {...common} {...ctl(state)} type="date" value={value} onChange={(e) => onValue(e.target.value)} className={size} />
    case "dropdown": {
      // A select has no read-only mode: show the chosen label in a read-only input instead.
      if (state === "readonly") {
        const label = f.options?.find((o) => o.v === value)?.label
        return <Input {...common} readOnly value={label ? t(label) : value} className={size} />
      }
      return (
        <NativeSelect
          {...common}
          disabled={state === "disabled"}
          value={value}
          onChange={(e) => onValue(e.target.value)}
          className={cn("w-full", big && "[&_select]:h-11 [&_select]:text-base")}
        >
          <NativeSelectOption value="">{t(L("Select…", "Pilih…"))}</NativeSelectOption>
          {(f.options ?? []).map((o) => (
            <NativeSelectOption key={o.v} value={o.v}>
              {t(o.label)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      )
    }
    default:
      return (
        <Input
          {...common}
          {...ctl(state)}
          autoComplete="off"
          value={value}
          placeholder={t(f.placeholder)}
          onChange={(e) => onValue(e.target.value)}
          className={size}
        />
      )
  }
}

/** Disabled buttons get no pointer events, so the reason sits on a wrapper. */
function Why({ reason, children }: { reason: string | null; children: ReactNode }) {
  return reason ? (
    <span title={reason} className="inline-flex">
      {children}
    </span>
  ) : (
    <>{children}</>
  )
}

const ColLabel = ({ f }: { f: ChildField }) => {
  const t = useT()
  return (
    <>
      {t(f.label)}
      {f.required && (
        <span className="text-destructive" aria-hidden>
          {" "}
          *
        </span>
      )}
    </>
  )
}

/** Column widths, like the prototype's `.c-<kind>`. */
const colWidth = (f: ChildField) =>
  f.kind === "number" ? (f.currency ? "min-w-36" : "w-24 min-w-20") : f.kind === "text" || f.kind === "textarea" ? "min-w-40" : "min-w-36"

export function RepeaterRuntime({ props: p, value, onChange, state, issues, compact, id }: RuntimeProps<RepeaterProps, RepeaterValue>) {
  const t = useT()
  const { lang } = useLang()
  const root = useRef<HTMLDivElement>(null)
  /* The Undo action of a toast runs later; it must see the rows as they are then. */
  const latest = useRef(value)
  useEffect(() => {
    latest.current = value
  })

  const live = state === "active"
  const disabled = state === "disabled"
  const readonly = state === "readonly"
  const rows = value.rows
  const n = rows.length
  const min = minEff(p)
  const max = maxEff(p)
  const atMax = n >= max
  const canDel = n > min
  const sub = showSub(p)
  const pr = pair(p)
  const cards = cardsFor(p, compact)
  const fields = p.fields

  const issueFor = (fid: string): L10n | null => issues.find((i) => i.fid === fid)?.msg ?? null
  const rowKey = (r: RepeaterRow) =>
    issues
      .filter((i) => i.fid.startsWith(`rp-${r.id}-`))
      .map((i) => i.fid)
      .join("|")
  /** Collapsed cards re-open when their own issues change (e.g. on Complete Task). */
  const isOpen = (r: RepeaterRow) => !(r.id in value.collapsed) || (rowKey(r) !== "" && value.collapsed[r.id] !== rowKey(r))

  const focusLater = (selector: string) =>
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`${selector}:not(:disabled)`)?.focus())
  const firstCell = (r: RepeaterRow) => (fields[0] ? `[data-cell="${r.id}:${fields[0].id}"]` : `[data-rp="add"]`)
  /** The first cell of the first row is the main control (`${id}-input`, labelled by the field label). */
  const domId = (ri: number, r: RepeaterRow, fi: number, f: ChildField) => (ri === 0 && fi === 0 ? `${id}-input` : `${id}-${r.id}-${f.id}`)
  const cellLabel = (n1: number, f: ChildField) => t(L(`Row ${n1}, ${f.label.en}`, `Baris ${n1}, ${f.label.id}`))
  const maxMsg = L(`Maximum of ${max} rows reached`, `Batas ${max} baris tercapai`)
  const minMsg = L(`At least ${min} row required`, `Minimal ${min} baris`)

  /* ── actions ── */
  const setCell = (r: RepeaterRow, f: ChildField, v: string) => {
    if (!live) return
    onChange({ ...value, rows: rows.map((x) => (x.id === r.id ? { ...x, v: { ...x.v, [f.id]: v } } : x)) })
  }
  const add = () => {
    if (!live || atMax) return
    const r = mkRow()
    onChange({ ...value, rows: [...rows, r], removed: null })
    focusLater(firstCell(r))
  }
  const duplicate = (i: number) => {
    if (!live || atMax) return
    const c = mkRow(rows[i].v)
    const next = rows.slice()
    next.splice(i + 1, 0, c)
    onChange({ ...value, rows: next, removed: null })
    focusLater(firstCell(c))
    toast.info(t(L(`Row ${i + 1} duplicated as row ${i + 2}`, `Baris ${i + 1} diduplikat jadi baris ${i + 2}`)))
  }
  const restore = (row: RepeaterRow, index: number, focusToggle: boolean) => {
    const cur = latest.current
    if (cur.rows.some((x) => x.id === row.id)) return
    if (cur.rows.length >= max) {
      toast.error(t(maxMsg))
      return
    }
    const next = cur.rows.slice()
    next.splice(Math.min(index, next.length), 0, row)
    const collapsed = { ...cur.collapsed }
    delete collapsed[row.id]
    onChange({ ...cur, rows: next, collapsed, removed: null })
    focusLater(focusToggle ? `[data-toggle="${row.id}"]` : firstCell(row))
  }
  const remove = (i: number) => {
    if (!live || !canDel) return
    const row = rows[i]
    const next = rows.filter((_, j) => j !== i)
    if (cards) {
      // Cards: an inline Undo right where the card was (prototype).
      onChange({ ...value, rows: next, removed: { row, index: i } })
      focusLater(`[data-rp="undo"]`)
      return
    }
    onChange({ ...value, rows: next, removed: null })
    requestAnimationFrame(() =>
      (root.current?.querySelector<HTMLElement>(`[data-rp="add"]:not(:disabled)`) ?? root.current?.querySelector<HTMLElement>(`[data-rp="del"]:not(:disabled)`))?.focus(),
    )
    toast.info(t(L(`Row ${i + 1} removed`, `Baris ${i + 1} dihapus`)), {
      action: { label: t(L("Undo", "Urungkan")), onClick: () => restore(row, i, false) },
    })
  }
  const toggle = (r: RepeaterRow) => {
    const collapsed = { ...value.collapsed }
    if (isOpen(r)) collapsed[r.id] = rowKey(r)
    else delete collapsed[r.id]
    onChange({ ...value, collapsed })
  }
  const allOpen = rows.every(isOpen)
  const toggleAll = () => onChange({ ...value, collapsed: allOpen ? Object.fromEntries(rows.map((r) => [r.id, rowKey(r)])) : {} })

  const addInvalid = issueFor("rp-add") != null || undefined
  const delInvalid = (r: RepeaterRow) => issueFor(`rp-del-${r.id}`) != null || undefined

  /* ── shared bits ── */
  const toolbar = (
    <div className="flex min-h-6 items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground tabular-nums">{t(L(`${n} of ${max} rows`, `${n} dari ${max} baris`))}</span>
      {cards && n > 1 && !disabled && (
        <Button variant="link" size="xs" className="h-auto px-0" onClick={toggleAll}>
          {t(allOpen ? L("Collapse all", "Ciutkan semua") : L("Expand all", "Buka semua"))}
        </Button>
      )}
    </div>
  )

  /* ── table ── */
  if (!cards) {
    const actions = !readonly
    return (
      <div ref={root} role="group" aria-labelledby={`${id}-label`} className="flex min-w-0 flex-col gap-2.5">
        {toolbar}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-10 w-10 px-2 text-center text-xs text-muted-foreground">#</TableHead>
                {fields.map((f) => (
                  <TableHead key={f.id} className={cn("h-10 px-2 text-xs text-muted-foreground", colWidth(f), f.kind === "number" && !f.currency && "text-right")}>
                    <ColLabel f={f} />
                  </TableHead>
                ))}
                {sub && <TableHead className="h-10 px-3 text-right text-xs text-muted-foreground">{t(L("Subtotal", "Subtotal"))}</TableHead>}
                {actions && (
                  <TableHead className="h-10 w-12 px-2">
                    <span className="sr-only">{t(L("Actions", "Aksi"))}</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => {
                const s = rowSub(p, r)
                return (
                  <TableRow key={r.id} className="hover:bg-transparent">
                    <TableCell className={cn("w-10 px-2 pb-2 text-center align-top text-muted-foreground tabular-nums", compact ? "pt-5" : "pt-4")}>{i + 1}</TableCell>
                    {fields.map((f, fi) => (
                      <TableCell key={f.id} className={cn("px-1.5 py-2 align-top whitespace-normal", colWidth(f))}>
                        <CellControl
                          f={f}
                          value={r.v[f.id] ?? ""}
                          onValue={(v) => setCell(r, f, v)}
                          state={state}
                          domId={domId(i, r, fi, f)}
                          cell={`${r.id}:${f.id}`}
                          ariaLabel={cellLabel(i + 1, f)}
                          invalid={issueFor(cellFid(r, f)) != null}
                          card={false}
                          big={compact}
                        />
                      </TableCell>
                    ))}
                    {sub && (
                      <TableCell className={cn("px-3 pb-2 text-right align-top tabular-nums", compact ? "pt-5" : "pt-4", disabled && "text-muted-foreground")}>
                        {s == null ? <span className="text-muted-foreground">—</span> : rupiah(s)}
                      </TableCell>
                    )}
                    {actions && (
                      <TableCell className={cn("px-2 pb-2 text-center align-top", compact ? "pt-3.5" : "pt-2.5")}>
                        <Why reason={live && !canDel ? t(minMsg) : null}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            data-rp="del"
                            disabled={!live || !canDel}
                            aria-invalid={delInvalid(r)}
                            aria-label={t(L(`Remove row ${i + 1}`, `Hapus baris ${i + 1}`))}
                            onClick={() => remove(i)}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <HugeiconsIcon icon={Delete02Icon} />
                          </Button>
                        </Why>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
              {n === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={fields.length + (sub ? 1 : 0) + (actions ? 2 : 1)} className="py-5 text-center text-sm text-muted-foreground">
                    {t(L("No rows yet.", "Belum ada baris."))}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {(actions || sub) && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {actions && (
                <Button variant="outline" size="sm" data-rp="add" disabled={!live || atMax} aria-invalid={addInvalid} onClick={add}>
                  <HugeiconsIcon icon={PlusSignIcon} />
                  {t(p.addLabel)}
                </Button>
              )}
              {live && atMax && <span className="text-xs text-muted-foreground">{t(maxMsg)}</span>}
            </div>
            {sub && (
              <p className="flex items-baseline gap-2 text-sm text-muted-foreground">
                {t(L("Total", "Total"))}
                <b className={cn("text-base font-semibold tabular-nums", disabled ? "text-muted-foreground" : "text-foreground")}>{rupiah(total(p, rows))}</b>
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  /* ── cards ── */
  const titleF = fields.find((f) => f.kind === "text") ?? fields[0]
  return (
    <div ref={root} role="group" aria-labelledby={`${id}-label`} className="flex min-w-0 flex-col gap-2.5">
      {toolbar}
      {n > 0 ? (
        <ol className="flex flex-col gap-2.5" aria-labelledby={`${id}-label`}>
          {rows.map((r, i) => {
            const open = isOpen(r)
            const errs = fields.filter((f) => issueFor(cellFid(r, f))).length
            const nFilled = fields.filter((f) => filled(r.v[f.id])).length
            const done = fields.every((f) => !f.required || filled(r.v[f.id]))
            const title = titleF ? display(titleF, r.v[titleF.id], lang) : ""
            const s = rowSub(p, r)
            const calc = s != null && pr ? `${fmtNum(num(r.v[pr[0].id]) ?? 0, lang)} × ${rupiah(num(r.v[pr[1].id]) ?? 0)}` : ""
            const summary = calc || t(L(`${nFilled} of ${fields.length} fields filled`, `${nFilled} dari ${fields.length} field terisi`))
            const bodyId = `${id}-card-${r.id}`
            return (
              <li key={r.id} className={cn("rounded-2xl border bg-card shadow-xs", errs ? "border-destructive/60" : "border-border")}>
                <button
                  type="button"
                  data-toggle={r.id}
                  aria-expanded={open}
                  aria-controls={bodyId}
                  disabled={disabled}
                  onClick={() => toggle(r)}
                  className={cn(
                    "flex min-h-15 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:hover:bg-transparent",
                    open && "rounded-b-none border-b border-border",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                      errs
                        ? "bg-destructive/10 text-destructive"
                        : done && !disabled
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    <span className="sr-only">{t(L("Row ", "Baris "))}</span>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span
                      className={cn(
                        "block font-semibold break-words",
                        compact ? "text-[15px]" : "text-sm",
                        !title || disabled ? "font-medium text-muted-foreground" : "text-foreground",
                      )}
                    >
                      {title || t(L("Not filled yet", "Belum diisi"))}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">{summary}</span>
                  </span>
                  {(errs > 0 || sub) && (
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {errs > 0 ? (
                        <Badge variant="destructive">{t(L(`${errs} to fix`, `${errs} perlu diperbaiki`))}</Badge>
                      ) : (
                        <span className={cn("text-sm font-semibold whitespace-nowrap tabular-nums", s == null || disabled ? "font-medium text-muted-foreground" : "text-foreground")}>
                          {s == null ? "—" : rupiah(s)}
                        </span>
                      )}
                    </span>
                  )}
                  <HugeiconsIcon icon={ArrowDown01Icon} className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
                </button>

                <div id={bodyId} hidden={!open} className="flex flex-col gap-3.5 p-3.5">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
                    {fields.map((f, fi) => {
                      const err = issueFor(cellFid(r, f))
                      const did = domId(i, r, fi, f)
                      return (
                        <div key={f.id} className={cn("flex min-w-0 flex-col gap-1.5", !half(f, compact) && "col-span-2")}>
                          <Label htmlFor={did} className="text-xs text-muted-foreground">
                            <span>
                              <ColLabel f={f} />
                            </span>
                          </Label>
                          <CellControl
                            f={f}
                            value={r.v[f.id] ?? ""}
                            onValue={(v) => setCell(r, f, v)}
                            state={state}
                            domId={did}
                            cell={`${r.id}:${f.id}`}
                            ariaLabel={cellLabel(i + 1, f)}
                            invalid={err != null}
                            card
                            big={compact}
                          />
                          {err && <p className="text-xs font-medium text-destructive">{t(err)}</p>}
                        </div>
                      )
                    })}
                  </div>
                  {sub && (
                    <div className="flex items-baseline justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
                      <span>
                        {t(L("Subtotal", "Subtotal"))}
                        {calc ? ` · ${calc}` : ""}
                      </span>
                      <b className={cn("font-semibold whitespace-nowrap tabular-nums", disabled ? "text-muted-foreground" : "text-foreground")}>{s == null ? "—" : rupiah(s)}</b>
                    </div>
                  )}
                  {!readonly && (
                    <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
                      <Why reason={live && atMax ? t(maxMsg) : null}>
                        <Button variant="ghost" size={compact ? "lg" : "sm"} disabled={!live || atMax} onClick={() => duplicate(i)} className={cn(compact && "h-11")}>
                          <HugeiconsIcon icon={Copy01Icon} />
                          {t(L("Duplicate", "Duplikat"))}
                        </Button>
                      </Why>
                      <Why reason={live && !canDel ? t(minMsg) : null}>
                        <Button
                          variant="ghost"
                          size={compact ? "lg" : "sm"}
                          data-rp="del"
                          disabled={!live || !canDel}
                          aria-invalid={delInvalid(r)}
                          aria-label={t(L(`Remove row ${i + 1}`, `Hapus baris ${i + 1}`))}
                          onClick={() => remove(i)}
                          className={cn("text-destructive hover:bg-destructive/10 hover:text-destructive", compact && "h-11")}
                        >
                          <HugeiconsIcon icon={Delete02Icon} />
                          {t(L("Remove", "Hapus"))}
                        </Button>
                      </Why>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">{t(L("No rows yet. Add the first one below.", "Belum ada baris. Tambahkan yang pertama di bawah."))}</p>
      )}

      {live && value.removed && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-2xl bg-foreground py-1.5 pr-1.5 pl-4 text-sm text-background">
          <span>{t(L(`Row ${value.removed.index + 1} removed`, `Baris ${value.removed.index + 1} dihapus`))}</span>
          <button
            type="button"
            data-rp="undo"
            onClick={() => value.removed && restore(value.removed.row, value.removed.index, true)}
            className="h-8 rounded-full px-3 font-semibold outline-none hover:bg-background/15 focus-visible:ring-3 focus-visible:ring-background/40"
          >
            {t(L("Undo", "Urungkan"))}
          </button>
        </div>
      )}

      {!readonly && (
        <Button
          variant="outline"
          data-rp="add"
          disabled={!live || atMax}
          aria-invalid={addInvalid}
          onClick={add}
          className="h-12 w-full rounded-2xl border-2 border-dashed text-sm text-primary hover:border-primary/40"
        >
          <HugeiconsIcon icon={PlusSignIcon} />
          {t(p.addLabel)}
        </Button>
      )}
      {live && atMax && <p className="-mt-1 text-center text-xs text-muted-foreground">{t(maxMsg)}</p>}

      {sub && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-3.5 py-3 text-sm text-muted-foreground">
          <span>{t(L(`Total · ${n} ${n === 1 ? "row" : "rows"}`, `Total · ${n} baris`))}</span>
          <b className={cn("text-base font-semibold whitespace-nowrap tabular-nums", disabled ? "text-muted-foreground" : "text-foreground")}>{rupiah(total(p, rows))}</b>
        </div>
      )}
    </div>
  )
}
