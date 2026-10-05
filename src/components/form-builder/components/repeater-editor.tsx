/* eslint-disable react-refresh/only-export-components -- Edit Element helpers: exports the child-field editors and their rules */
import { useId, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, ArrowDown01Icon, ArrowRight01Icon, ArrowUp01Icon, Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { L, useT, type L10n } from "../i18n"
import { KEY_RE, snake, uid } from "../lib"
import { PropertyEditor } from "../property-editor"
import { Rich } from "../rich"
import { fieldError, isVisible } from "../schema"
import type { CustomCtx, PropSection } from "../types"
import { KIND_ORDER, KINDS, normalizeChild, pair, type ChildField, type ChildKind, type ChildOption, type RepeaterProps } from "./repeater-model"

/* ── child field: Edit Element content (shaping: "Edit Element untuk field anak") ── */

const keyErr = (v: unknown, c: ChildField, p: RepeaterProps): L10n | null => {
  const s = String(v ?? "")
  if (!s) return L("A key is required", "Key wajib diisi")
  if (!KEY_RE.test(s)) return L("Use lowercase letters, numbers and _ and start with a letter", "Pakai huruf kecil, angka, dan _ serta diawali huruf")
  if (p.fields.some((x) => x.id !== c.id && x.name === s))
    return L("Another field in this Repeater uses this key", "Field lain di Repeater ini sudah memakai key ini")
  return null
}

export function childSections(c: ChildField, p: RepeaterProps): PropSection<ChildField>[] {
  return [
    {
      tab: "general",
      title: L("Field", "Field"),
      fields: [
        {
          t: "i18n",
          k: "label",
          label: L("Name", "Nama"),
          validate: (v) => (!(v as L10n).en.trim() ? L("Enter the English name", "Isi nama bahasa Inggris") : null),
        },
        {
          t: "text",
          k: "name",
          label: L("Key in each row", "Key di tiap baris"),
          mono: true,
          hint: L(`Saved in every row object, e.g. \`${p.name}[0].${c.name}\`.`, `Disimpan di tiap objek baris, mis. \`${p.name}[0].${c.name}\`.`),
          validate: (v, x) => keyErr(v, x, p),
        },
        { t: "select", k: "kind", label: L("Type", "Tipe"), options: KIND_ORDER.map((k) => ({ v: k, label: KINDS[k].label })) },
        { t: "i18n", k: "placeholder", label: L("Placeholder", "Placeholder"), when: (x) => x.kind === "text" || x.kind === "textarea" },
        {
          t: "seg",
          k: "currency",
          label: L("Format", "Format"),
          when: (x) => x.kind === "number",
          options: [
            { v: "false", label: L("Plain number", "Angka biasa") },
            { v: "true", label: L("Rupiah", "Rupiah") },
          ],
          set: (x, v) => ({ ...x, currency: v === "true" }),
        },
        { t: "number", k: "min", label: L("Minimum value", "Nilai minimum"), min: 0, max: 1000000000, when: (x) => x.kind === "number" },
        {
          t: "list",
          k: "options",
          label: L("Options", "Opsi"),
          when: (x) => x.kind === "dropdown",
          keyField: "v",
          min: 1,
          addLabel: L("Add option", "Tambah opsi"),
          newItem: (n): ChildOption => ({ v: `option_${n + 1}`, label: L(`Option ${n + 1}`, `Opsi ${n + 1}`) }),
          hint: L("The saved value is taken from the English label.", "Nilai yang disimpan diambil dari label bahasa Inggris."),
        },
      ],
    },
    {
      tab: "general",
      title: L("Validation", "Validasi"),
      fields: [
        {
          t: "switch",
          k: "required",
          label: L("Required in every row", "Wajib di setiap baris"),
          hint: L("Checked per row, e.g. “Row 2: Qty is required”.", "Dicek per baris, mis. “Baris 2: Jumlah wajib diisi”."),
        },
      ],
    },
  ]
}

/** First problem in a child field's settings, or null. */
export function childError(c: ChildField, p: RepeaterProps): L10n | null {
  for (const s of childSections(c, p))
    for (const f of s.fields) {
      if (!isVisible(f, c)) continue
      const e = fieldError(f, c)
      if (e) return e
    }
  return null
}

/** Message under "Fields in each row" (also blocks Save Changes). */
export function fieldsError(p: RepeaterProps): L10n | null {
  if (!p.fields.length) return L("A Repeater needs at least one field", "Repeater butuh minimal satu field")
  for (const c of p.fields) {
    const e = childError(c, p)
    if (e) return L(`${c.label.en || c.name}: ${e.en}`, `${c.label.id || c.label.en || c.name}: ${e.id}`)
  }
  return null
}

/* ── "Fields in each row": list, add (type picker), reorder, remove, edit ── */

export function FieldsEditor({ ctx }: { ctx: CustomCtx<RepeaterProps> }) {
  const t = useT()
  const base = useId()
  const list = useRef<HTMLOListElement>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const p = ctx.props
  const fields = p.fields
  const single = fields.length <= 1

  const setFields = (next: ChildField[]) => ctx.set({ fields: next })
  /** Focus the first selector that matches (in priority order, not DOM order). */
  const focusLater = (...selectors: string[]) =>
    requestAnimationFrame(() => {
      for (const sel of selectors) {
        const el = list.current?.querySelector<HTMLElement>(sel)
        if (el) return el.focus()
      }
    })
  /** Set when "Add field" picks a kind: focus goes to the new field, not back to the menu button. */
  const added = useRef<string | null>(null)

  const update = (next: ChildField) => setFields(fields.map((x) => (x.id === next.id ? normalizeChild(next) : x)))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= fields.length) return
    const next = fields.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    setFields(next)
    const f = fields[i]
    focusLater(`[data-move="${dir}"][data-id="${f.id}"]:not(:disabled)`, `[data-pick="${f.id}"]`)
  }
  const remove = (f: ChildField) => {
    if (single) return
    setFields(fields.filter((x) => x.id !== f.id))
    if (openId === f.id) setOpenId(null)
    toast.info(t(L(`${f.label.en} removed`, `${f.label.id} dihapus`)))
  }
  const add = (kind: ChildKind) => {
    const label = { ...KINDS[kind].label }
    const stem = snake(label.en)
    let name = stem
    for (let n = 2; fields.some((x) => x.name === name); n++) name = `${stem}_${n}`
    const f = normalizeChild({ id: uid("c"), kind, name, label, required: false })
    setFields([...fields, f])
    setOpenId(f.id)
    added.current = f.id
    toast.success(t(L(`${label.en} added to the Repeater`, `${label.id} ditambahkan ke Repeater`)))
  }

  return (
    <div className="flex flex-col gap-2.5">
      <ol ref={list} className="flex flex-col gap-2">
        {fields.map((f, i) => {
          const open = openId === f.id
          const err = childError(f, p)
          const panel = `${base}-child-${f.id}`
          return (
            <li
              key={f.id}
              className={cn(
                "rounded-2xl border bg-card transition-shadow",
                err ? "border-destructive/50" : open ? "border-foreground/20 shadow-sm" : "border-border",
              )}
            >
              <div className="flex items-center gap-1 p-1.5">
                <button
                  type="button"
                  data-pick={f.id}
                  aria-expanded={open}
                  aria-controls={panel}
                  aria-invalid={err ? true : undefined}
                  onClick={() => setOpenId(open ? null : f.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1.5 py-1 text-left outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")}
                  />
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <HugeiconsIcon icon={KINDS[f.kind].icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {t(f.label) || "—"}
                      {f.required && <span className="text-destructive"> *</span>}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      <span className="font-mono text-[11px]">{f.name || "—"}</span> · {t(KINDS[f.kind].label)}
                      {f.kind === "number" && f.currency ? " Rp" : ""}
                    </span>
                  </span>
                  {err && <HugeiconsIcon icon={Alert02Icon} className="size-4 shrink-0 text-destructive" aria-label={t(err)} />}
                </button>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    data-move={-1}
                    data-id={f.id}
                    aria-label={t(L(`Move ${f.label.en} up`, `Naikkan ${f.label.id}`))}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <HugeiconsIcon icon={ArrowUp01Icon} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    data-move={1}
                    data-id={f.id}
                    aria-label={t(L(`Move ${f.label.en} down`, `Turunkan ${f.label.id}`))}
                    disabled={i === fields.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <HugeiconsIcon icon={ArrowDown01Icon} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={t(L(`Remove ${f.label.en}`, `Hapus ${f.label.id}`))}
                    disabled={single}
                    onClick={() => remove(f)}
                    className="hover:text-destructive"
                  >
                    <HugeiconsIcon icon={Delete02Icon} />
                  </Button>
                </div>
              </div>

              {open && (
                <div id={panel} className="flex flex-col gap-5 border-t border-border px-4 pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">
                    {t(KINDS[f.kind].label)} · {t(L("field in each row", "field di tiap baris"))}
                  </p>
                  <PropertyEditor sections={childSections(f, p)} props={f} onChange={update} tab="general" />
                  <div>
                    <Button variant="destructive" size="sm" disabled={single} onClick={() => remove(f)}>
                      <HugeiconsIcon icon={Delete02Icon} />
                      {t(L("Remove this field", "Hapus field ini"))}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <HugeiconsIcon icon={PlusSignIcon} />
              {t(L("Add field", "Tambah field"))}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            onCloseAutoFocus={(e) => {
              if (!added.current) return
              e.preventDefault()
              focusLater(`[data-pick="${added.current}"]`)
              added.current = null
            }}
          >
            {KIND_ORDER.map((k) => (
              <DropdownMenuItem key={k} onSelect={() => add(k)}>
                <HugeiconsIcon icon={KINDS[k].icon} />
                {t(KINDS[k].label)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {single && <span className="text-xs text-muted-foreground">{t(L("A Repeater needs at least one field", "Repeater butuh minimal satu field"))}</span>}
      </div>
    </div>
  )
}

/* ── Row subtotal: a switch that only turns on with one plain Number + one Rupiah Number ── */

export function SubtotalSwitch({ ctx }: { ctx: CustomCtx<RepeaterProps> }) {
  const t = useT()
  const htmlId = useId()
  const p = ctx.props
  const pr = pair(p)
  const hint = pr
    ? L(`${pr[0].label.en} × ${pr[1].label.en}, read-only, not saved`, `${pr[0].label.id} × ${pr[1].label.id}, baca-saja, tidak disimpan`)
    : L("Needs one plain Number field and one Rupiah Number field", "Butuh satu field Angka biasa dan satu field Angka Rupiah")
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Label htmlFor={htmlId} className={cn("text-sm font-medium", !pr && "text-muted-foreground")}>
          {t(L("Row subtotal", "Subtotal per baris"))}
        </Label>
        <p className="text-xs text-muted-foreground">
          <Rich text={hint} />
        </p>
      </div>
      <Switch id={htmlId} checked={p.subtotal && pr != null} disabled={!pr} onCheckedChange={(c) => ctx.set({ subtotal: c })} />
    </div>
  )
}
