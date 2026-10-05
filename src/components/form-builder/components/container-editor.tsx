/* eslint-disable react-refresh/only-export-components -- Edit Element helpers for the containers: editors and their rules */
import { useId, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, ArrowDown01Icon, ArrowRight01Icon, ArrowUp01Icon, Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { L, useT, type L10n } from "../i18n"
import { snake, uid } from "../lib"
import { PropertyEditor } from "../property-editor"
import { fieldError, isVisible } from "../schema"
import type { CustomCtx, PropSection } from "../types"
import { allFields, childKeyError, type Section } from "./container-model"
import { KIND_ORDER, KINDS, normalizeChild, type ChildField, type ChildKind, type ChildOption } from "./repeater-model"

/* ── one child field: Edit Element content ───────────────────────────────── */

export function childSections(sections: Section[], requiredHint: L10n): PropSection<ChildField>[] {
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
          label: L("Key", "Key"),
          mono: true,
          hint: L("Process variable. Unique across the whole form, not only this container.", "Variabel proses. Unik di seluruh form, bukan hanya di container ini."),
          validate: (_v, x) => childKeyError(x, sections),
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
      fields: [{ t: "switch", k: "required", label: L("Required", "Wajib diisi"), hint: requiredHint }],
    },
  ]
}

function childError(c: ChildField, sections: Section[], hint: L10n): L10n | null {
  for (const s of childSections(sections, hint))
    for (const f of s.fields) {
      if (!isVisible(f, c)) continue
      const e = fieldError(f, c)
      if (e) return e
    }
  return null
}

/* ── fields of one section: list, add (type picker), reorder, remove, edit ── */

function FieldList({
  fields,
  sections,
  onFields,
  requiredHint,
  sectionName,
}: {
  fields: ChildField[]
  sections: Section[]
  onFields: (next: ChildField[]) => void
  requiredHint: L10n
  sectionName: L10n
}) {
  const t = useT()
  const base = useId()
  const [openId, setOpenId] = useState<string | null>(null)
  const single = fields.length <= 1

  const update = (next: ChildField) => onFields(fields.map((x) => (x.id === next.id ? normalizeChild(next) : x)))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= fields.length) return
    const next = fields.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onFields(next)
  }
  const add = (kind: ChildKind) => {
    const label = { ...KINDS[kind].label }
    const stem = snake(label.en)
    const taken = new Set(allFields(sections).map((x) => x.name))
    let name = stem
    for (let n = 2; taken.has(name); n++) name = `${stem}_${n}`
    const f = normalizeChild({ id: uid("c"), kind, name, label, required: false })
    onFields([...fields, f])
    setOpenId(f.id)
    toast.success(t(L(`${label.en} added to ${sectionName.en}`, `${label.id} ditambahkan ke ${sectionName.id}`)))
  }

  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col gap-1.5">
        {fields.map((f, i) => {
          const open = openId === f.id
          const err = childError(f, sections, requiredHint)
          const panel = `${base}-f-${f.id}`
          return (
            <li key={f.id} className={cn("rounded-xl border bg-background", err ? "border-destructive/50" : "border-border")}>
              <div className="flex items-center gap-1 p-1">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panel}
                  aria-invalid={err ? true : undefined}
                  onClick={() => setOpenId(open ? null : f.id)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1.5 py-1 text-left outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <HugeiconsIcon icon={KINDS[f.kind].icon} className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">
                      {t(f.label) || "—"}
                      {f.required && <span className="text-destructive"> *</span>}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-muted-foreground">{f.name || "—"}</span>
                  </span>
                  {err && <HugeiconsIcon icon={Alert02Icon} className="size-4 shrink-0 text-destructive" aria-label={t(err)} />}
                </button>
                <Button variant="ghost" size="icon-xs" aria-label={t(L(`Move ${f.label.en} up`, `Naikkan ${f.label.id}`))} disabled={i === 0} onClick={() => move(i, -1)}>
                  <HugeiconsIcon icon={ArrowUp01Icon} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
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
                  onClick={() => onFields(fields.filter((x) => x.id !== f.id))}
                  className="hover:text-destructive"
                >
                  <HugeiconsIcon icon={Delete02Icon} />
                </Button>
              </div>
              {open && (
                <div id={panel} className="flex flex-col gap-5 border-t border-border px-3.5 py-4">
                  <PropertyEditor sections={childSections(sections, requiredHint)} props={f} onChange={update} tab="general" />
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <HugeiconsIcon icon={PlusSignIcon} />
              {t(L("Add field", "Tambah field"))}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {KIND_ORDER.map((k) => (
              <DropdownMenuItem key={k} onSelect={() => add(k)}>
                <HugeiconsIcon icon={KINDS[k].icon} />
                {t(KINDS[k].label)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

/* ── the sections themselves: tabs / sections / steps ───────────────────── */

export interface SectionsEditorOptions {
  /** "Tab", "Section", "Step". */
  noun: L10n
  min: number
  max: number
  /** Wizard steps carry a one-line description. */
  withDescription?: boolean
  /** Hint under each child field's Required switch. */
  requiredHint: L10n
}

export function SectionsEditor<P extends { sections: Section[] }>({ ctx, o }: { ctx: CustomCtx<P>; o: SectionsEditorOptions }) {
  const t = useT()
  const base = useId()
  const sections = ctx.props.sections
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id ?? null)
  const setSections = (next: Section[]) => ctx.set({ sections: next } as Partial<P>)
  const update = (id: string, patch: Partial<Section>) => setSections(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= sections.length) return
    const next = sections.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    setSections(next)
  }
  const add = () => {
    const n = sections.length + 1
    const taken = new Set(allFields(sections).map((x) => x.name))
    let name = `field_${n}`
    for (let k = 2; taken.has(name); k++) name = `field_${n}_${k}`
    const s: Section = {
      id: uid("s"),
      key: snake(`${o.noun.en} ${n}`),
      label: L(`${o.noun.en} ${n}`, `${o.noun.id} ${n}`),
      ...(o.withDescription ? { description: L("", "") } : {}),
      fields: [normalizeChild({ id: uid("c"), kind: "text", name, label: L("Text", "Teks"), required: false })],
    }
    setSections([...sections, s])
    setOpenId(s.id)
  }
  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col gap-2">
        {sections.map((s, i) => {
          const open = openId === s.id
          const panel = `${base}-s-${s.id}`
          return (
            <li key={s.id} className={cn("rounded-2xl border bg-card", open ? "border-foreground/20 shadow-sm" : "border-border")}>
              <div className="flex items-center gap-1 p-1.5">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panel}
                  onClick={() => setOpenId(open ? null : s.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1.5 py-1 text-left outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{t(s.label) || "—"}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      <span className="font-mono text-[11px]">{s.key}</span> ·{" "}
                      {t(L(`${s.fields.length} field${s.fields.length === 1 ? "" : "s"}`, `${s.fields.length} field`))}
                    </span>
                  </span>
                </button>
                <Button variant="ghost" size="icon-xs" aria-label={t(L(`Move ${s.label.en} up`, `Naikkan ${s.label.id}`))} disabled={i === 0} onClick={() => move(i, -1)}>
                  <HugeiconsIcon icon={ArrowUp01Icon} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t(L(`Move ${s.label.en} down`, `Turunkan ${s.label.id}`))}
                  disabled={i === sections.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <HugeiconsIcon icon={ArrowDown01Icon} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t(L(`Remove ${s.label.en}`, `Hapus ${s.label.id}`))}
                  disabled={sections.length <= o.min}
                  onClick={() => {
                    setSections(sections.filter((x) => x.id !== s.id))
                    toast.info(t(L(`${s.label.en} removed with its fields`, `${s.label.id} dihapus beserta field-nya`)))
                  }}
                  className="hover:text-destructive"
                >
                  <HugeiconsIcon icon={Delete02Icon} />
                </Button>
              </div>

              {open && (
                <div id={panel} className="flex flex-col gap-4 border-t border-border px-4 py-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">{t(L(`${o.noun.en} name`, `Nama ${o.noun.id.toLowerCase()}`))}</Label>
                    {(["en", "id"] as const).map((side) => (
                      <InputGroup key={side}>
                        <InputGroupAddon>
                          <span className="w-5 text-[10px] font-semibold tracking-wider">{side.toUpperCase()}</span>
                        </InputGroupAddon>
                        <InputGroupInput
                          value={s.label[side]}
                          aria-label={`${t(o.noun)} ${i + 1} (${side === "en" ? "English" : "Bahasa Indonesia"})`}
                          onChange={(e) =>
                            update(s.id, {
                              label: { ...s.label, [side]: e.target.value },
                              ...(side === "en" ? { key: snake(e.target.value) } : {}),
                            })
                          }
                        />
                      </InputGroup>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      {t(L("Key", "Key"))}: <span className="font-mono">{s.key}</span>
                    </p>
                  </div>
                  {o.withDescription && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-medium">{t(L("Short description", "Deskripsi singkat"))}</Label>
                      {(["en", "id"] as const).map((side) => (
                        <InputGroup key={side}>
                          <InputGroupAddon>
                            <span className="w-5 text-[10px] font-semibold tracking-wider">{side.toUpperCase()}</span>
                          </InputGroupAddon>
                          <InputGroupInput
                            value={s.description?.[side] ?? ""}
                            aria-label={`${t(L("Short description", "Deskripsi singkat"))} (${side === "en" ? "English" : "Bahasa Indonesia"})`}
                            onChange={(e) => update(s.id, { description: { ...(s.description ?? L("", "")), [side]: e.target.value } })}
                          />
                        </InputGroup>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">{t(L("Fields", "Field"))}</Label>
                    <FieldList
                      fields={s.fields}
                      sections={sections}
                      sectionName={s.label}
                      requiredHint={o.requiredHint}
                      onFields={(fields) => update(s.id, { fields })}
                    />
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" disabled={sections.length >= o.max} onClick={add}>
          <HugeiconsIcon icon={PlusSignIcon} />
          {t(L(`Add ${o.noun.en.toLowerCase()}`, `Tambah ${o.noun.id.toLowerCase()}`))}
        </Button>
        <span className="text-xs text-muted-foreground">
          {t(L(`${o.min}–${o.max} ${o.noun.en.toLowerCase()}s`, `${o.min}–${o.max} ${o.noun.id.toLowerCase()}`))}
        </span>
      </div>
    </div>
  )
}
