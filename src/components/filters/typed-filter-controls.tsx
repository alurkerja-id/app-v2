import { useState } from "react"
import { endOfDay, format, startOfDay } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  Calendar03Icon,
  Cancel01Icon,
  CheckListIcon,
  Clock01Icon,
  HashtagIcon,
  PlusSignIcon,
  TextIcon,
  Tick02Icon,
  ToggleOnIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { dateTriggerClass } from "@/components/dashboard/date-range-picker"
import { ApplyFooter } from "@/components/filters/apply-footer"
import {
  isActive,
  KIND_LABEL,
  summarize,
  type FilterKind,
  type NumberOp,
  type TypedFilterDef,
  type TypedValue,
  type TypedValues,
} from "@/lib/typed-filters"

/* ────────────────────────────────────────────────────────────────────────
   Building blocks shared by every filter layout, so the layouts differ only in
   arrangement, never in how a filter looks or behaves.

   Visual language (identical in every layout):
     dashed outline  = a filter you can set, currently empty
     filled pill     = a filter that is set — "Label: value" + ×
     depth field     = the period (and panel inputs), same as any form input
──────────────────────────────────────────────────────────────────────── */

export const KIND_ICON: Record<FilterKind, typeof TextIcon> = {
  text: TextIcon,
  number: HashtagIcon,
  date: Calendar03Icon,
  datetime: Clock01Icon,
  boolean: ToggleOnIcon,
  field: CheckListIcon,
}

const pill = "inline-flex h-9 max-w-full items-center rounded-full text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"

/* ── Editors: one per kind, used inside popovers, the sheet and the panel ── */

/**
 * A value or an updater, like React's SetStateAction. The checklist toggles with
 * an updater: computing the next list from the last-rendered props dropped all
 * but the final click when several landed before a re-render.
 */
export type ValueUpdate = TypedValue | undefined | ((prev: TypedValue | undefined) => TypedValue | undefined)

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T | null
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn("inline-flex h-9 items-center rounded-full bg-muted p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "h-7 flex-1 rounded-full px-3 text-sm whitespace-nowrap transition-colors",
            value === o.value ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function TextEditor({ value, onChange }: { value?: TypedValue; onChange: (v: TypedValue | undefined) => void }) {
  const v = value?.kind === "text" ? value : { kind: "text" as const, op: "contains" as const, text: "" }
  return (
    <div className="flex flex-col gap-2">
      <Segmented
        value={v.op}
        options={[
          { value: "contains", label: "Contains" },
          { value: "is", label: "Is exactly" },
        ]}
        onChange={(op) => onChange({ ...v, op })}
      />
      <Input autoFocus value={v.text} placeholder="Type a value…" onChange={(e) => onChange({ ...v, text: e.target.value })} />
    </div>
  )
}

const OPS: { value: NumberOp; label: string }[] = [
  { value: "gte", label: "≥  at least" },
  { value: "lte", label: "≤  at most" },
  { value: "eq", label: "=  equals" },
  { value: "between", label: "between" },
]

function NumberEditor({ value, onChange }: { value?: TypedValue; onChange: (v: TypedValue | undefined) => void }) {
  const v = value?.kind === "number" ? value : { kind: "number" as const, op: "gte" as NumberOp }
  const parse = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(/\D/g, "")))
  return (
    <div className="flex flex-col gap-2">
      <NativeSelect className="w-full" value={v.op} onChange={(e) => onChange({ ...v, op: e.target.value as NumberOp })}>
        {OPS.map((o) => (
          <NativeSelectOption key={o.value} value={o.value}>
            {o.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <div className="flex items-center gap-2">
        <Input autoFocus inputMode="numeric" placeholder={v.op === "between" ? "Min" : "Value"} value={v.a ?? ""} onChange={(e) => onChange({ ...v, a: parse(e.target.value) })} />
        {v.op === "between" && (
          <>
            <span className="text-muted-foreground">–</span>
            <Input inputMode="numeric" placeholder="Max" value={v.b ?? ""} onChange={(e) => onChange({ ...v, b: parse(e.target.value) })} />
          </>
        )}
      </div>
    </div>
  )
}

/** First click picks a day (a valid one-day filter); the second extends it to a range. */
function DateEditor({ kind, value, onChange }: { kind: "date" | "datetime"; value?: TypedValue; onChange: (v: TypedValue | undefined) => void }) {
  const v = value?.kind === kind ? value : undefined
  const [anchor, setAnchor] = useState<Date | null>(null)
  const [fromTime, setFromTime] = useState(v?.from ? format(v.from, "HH:mm") : "00:00")
  const [toTime, setToTime] = useState(v?.to ? format(v.to, "HH:mm") : "23:59")

  const withTime = (d: Date, t: string) => {
    const [h, m] = t.split(":").map(Number)
    const x = new Date(d)
    x.setHours(h || 0, m || 0, 0, 0)
    return x
  }
  const emit = (from: Date, to: Date) =>
    onChange(
      kind === "datetime"
        ? { kind, from: withTime(from, fromTime), to: withTime(to, toTime) }
        : { kind, from: startOfDay(from), to: endOfDay(to) },
    )

  return (
    <div className="flex flex-col gap-2">
      <Calendar
        mode="range"
        className="p-0"
        defaultMonth={v?.from}
        selected={v?.from ? { from: v.from, to: v.to } : undefined}
        onSelect={(_r, day) => {
          if (!anchor) {
            setAnchor(day)
            emit(day, day)
            return
          }
          const [a, b] = day < anchor ? [day, anchor] : [anchor, day]
          setAnchor(null)
          emit(a, b)
        }}
      />
      {kind === "datetime" && (
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            From
            <Input type="time" value={fromTime} onChange={(e) => { setFromTime(e.target.value); if (v?.from) onChange({ ...v, from: withTime(v.from, e.target.value) }) }} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            To
            <Input type="time" value={toTime} onChange={(e) => { setToTime(e.target.value); if (v?.to) onChange({ ...v, to: withTime(v.to, e.target.value) }) }} />
          </label>
        </div>
      )}
    </div>
  )
}

function BooleanEditor({ value, onChange }: { value?: TypedValue; onChange: (v: TypedValue | undefined) => void }) {
  const cur = value?.kind === "boolean" ? (value.value ? "yes" : "no") : "any"
  return (
    <Segmented
      className="w-full"
      value={cur}
      options={[
        { value: "any", label: "Any" },
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ]}
      onChange={(x) => onChange(x === "any" ? undefined : { kind: "boolean", value: x === "yes" })}
    />
  )
}

function FieldEditor({ def, value, onChange }: { def: TypedFilterDef; value?: TypedValue; onChange: (u: ValueUpdate) => void }) {
  const sel = value?.kind === "field" ? value.values : []
  const toggle = (x: string) =>
    onChange((prev) => {
      const cur = prev?.kind === "field" ? prev.values : []
      const next = cur.includes(x) ? cur.filter((y) => y !== x) : [...cur, x]
      return next.length ? { kind: "field", values: next } : undefined
    })
  const options = def.options ?? []
  return (
    <Command className="bg-transparent">
      {options.length > 7 && <CommandInput placeholder={`Search ${def.label.toLowerCase()}…`} />}
      <CommandList>
        <CommandEmpty>No match.</CommandEmpty>
        <CommandGroup className="p-0">
          {options.map((o) => {
            const on = sel.includes(o.value)
            return (
              <CommandItem key={o.value} value={`${o.label} ${o.value}`} onSelect={() => toggle(o.value)}>
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {on && <HugeiconsIcon icon={Tick02Icon} className="size-3" strokeWidth={3} />}
                </span>
                <span className="truncate">{o.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export function FilterEditor({ def, value, onChange }: { def: TypedFilterDef; value?: TypedValue; onChange: (u: ValueUpdate) => void }) {
  switch (def.kind) {
    case "text":
      return <TextEditor value={value} onChange={onChange} />
    case "number":
      return <NumberEditor value={value} onChange={onChange} />
    case "date":
    case "datetime":
      return <DateEditor kind={def.kind} value={value} onChange={onChange} />
    case "boolean":
      return <BooleanEditor value={value} onChange={onChange} />
    case "field":
      return <FieldEditor def={def} value={value} onChange={onChange} />
  }
}

/** Editor width per kind — calendars need room, a Yes/No toggle doesn't. */
export const editorWidth = (k: FilterKind) => (k === "date" || k === "datetime" ? "w-auto" : k === "field" ? "w-60" : "w-72")

/** Inactive values (empty text, no number…) all mean "no filter". */
const norm = (v: TypedValue | undefined) => (isActive(v) ? v : undefined)
const same = (a: TypedValue | undefined, b: TypedValue | undefined) => JSON.stringify(norm(a)) === JSON.stringify(norm(b))

/**
 * Popover editor: works on a draft, applied with Apply or Enter. Remounts each
 * time the popover opens, so the draft always starts from the applied value.
 */
function EditorForm({
  def,
  value,
  onApply,
  onBack,
}: {
  def: TypedFilterDef
  value?: TypedValue
  onApply: (v: TypedValue | undefined) => void
  onBack?: () => void
}) {
  const [draft, setDraft] = useState<TypedValue | undefined>(value)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!same(draft, value)) onApply(norm(draft))
      }}
    >
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
        {onBack ? (
          <button type="button" onClick={onBack} className="-ml-1 flex items-center gap-1 rounded-md px-1 hover:text-foreground">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
            {def.label}
          </button>
        ) : (
          <span>{def.label}</span>
        )}
        <span className="ml-auto text-[10px] tracking-wider uppercase">{KIND_LABEL[def.kind]}</span>
      </div>
      <div className={cn(def.kind === "field" ? "p-1" : "p-3")}>
        <FilterEditor def={def} value={draft} onChange={setDraft} />
      </div>
      <ApplyFooter onClear={() => setDraft(undefined)} clearDisabled={!isActive(draft)} applyDisabled={same(draft, value)} />
    </form>
  )
}

/* ── Facet: one filter in the bar. Dashed when empty, a filled chip when set. ── */

export function FilterFacet({
  def,
  value,
  onChange,
  removable = true,
  slot = false,
}: {
  def: TypedFilterDef
  value?: TypedValue
  onChange: (v: TypedValue | undefined) => void
  /** Show × when set. Off for pinned facets, which clear back to their dashed state. */
  removable?: boolean
  /**
   * Fixed-width slot for pinned facets: the same width empty and set, value
   * truncated inside, the × taking the chevron's place. Setting a pinned filter
   * then never shifts the controls to its right (a free-width chip grew
   * ~50px and pushed everything over).
   */
  slot?: boolean
}) {
  const [open, setOpen] = useState(false)
  const set = isActive(value)
  const summary = set ? summarize(def, value) : ""
  return (
    <div
      title={set ? `${def.label}: ${summary}` : undefined}
      className={cn(
        pill,
        slot ? "w-52 shrink-0" : "max-w-72",
        set ? "bg-secondary ring-1 ring-border/70 ring-inset" : "border border-dashed border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
        (set || slot) && "pr-1",
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-full min-w-0 items-center gap-1 rounded-full pl-3.5 outline-none",
              slot ? "flex-1" : set ? "pr-1" : "pr-3.5",
            )}
          >
            <span className={cn("shrink-0", set && "text-muted-foreground")}>
              {def.label}
              {set && ":"}
            </span>
            {set && <span className="truncate font-medium">{summary}</span>}
            {!set && !slot && <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 shrink-0" />}
            {!set && slot && (
              // Same 28px box, same spot as the × that replaces it — and inside
              // the trigger, so the arrow itself opens the editor.
              <span className="ml-auto flex size-7 shrink-0 items-center justify-center">
                <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5" />
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className={cn("p-0", editorWidth(def.kind))} align="start">
          <EditorForm
            def={def}
            value={value}
            onApply={(v) => {
              onChange(v)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {set && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          aria-label={removable ? `Remove ${def.label} filter` : `Clear ${def.label}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
        </button>
      )}
    </div>
  )
}

/* ── "+ Filter": choose a field (with its kind), then edit it in place ── */

export function AddFilterMenu({
  defs,
  values,
  onChange,
  label = "Filter",
}: {
  defs: TypedFilterDef[]
  values: TypedValues
  onChange: (id: string, v: TypedValue | undefined) => void
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [field, setField] = useState<TypedFilterDef | null>(null)
  if (!defs.length) return null
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setField(null)
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(pill, "gap-1.5 border border-dashed border-border px-3.5 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground")}
        >
          <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", field ? editorWidth(field.kind) : "w-60")} align="start">
        {field ? (
          <EditorForm
            def={field}
            value={values[field.id]}
            onBack={() => setField(null)}
            onApply={(v) => {
              onChange(field.id, v)
              setOpen(false)
              setField(null)
            }}
          />
        ) : (
          <Command>
            {defs.length > 6 && <CommandInput placeholder="Filter by…" />}
            <CommandList>
              <CommandEmpty>No filters.</CommandEmpty>
              <CommandGroup>
                {defs.map((d) => (
                  <CommandItem key={d.id} value={d.label} onSelect={() => setField(d)}>
                    <HugeiconsIcon icon={KIND_ICON[d.kind]} className="size-4 text-muted-foreground" />
                    {d.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )
}

/* ── Labeled field for the explicit panel / sheet: the editor inline where it
   fits on one line, behind a field-style trigger where it doesn't. ── */

export function InlineFilterField({ def, value, onChange }: { def: TypedFilterDef; value?: TypedValue; onChange: (u: ValueUpdate) => void }) {
  const [open, setOpen] = useState(false)
  const label = <span className="text-xs font-medium text-muted-foreground">{def.label}</span>

  if (def.kind === "boolean") {
    return (
      <div className="flex min-w-0 flex-col gap-1.5">
        {label}
        <FilterEditor def={def} value={value} onChange={onChange} />
      </div>
    )
  }
  if (def.kind === "text") {
    const v = value?.kind === "text" ? value : undefined
    return (
      <div className="flex min-w-0 flex-col gap-1.5">
        {label}
        <Input placeholder="Contains…" value={v?.text ?? ""} onChange={(e) => onChange({ kind: "text", op: "contains", text: e.target.value })} />
      </div>
    )
  }
  if (def.kind === "number") {
    const v = value?.kind === "number" ? value : { kind: "number" as const, op: "gte" as NumberOp }
    const parse = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(/\D/g, "")))
    return (
      <div className="flex min-w-0 flex-col gap-1.5">
        {label}
        <div className="flex gap-1.5">
          <NativeSelect className="w-[4.5rem] shrink-0" value={v.op} onChange={(e) => onChange({ ...v, op: e.target.value as NumberOp })}>
            <NativeSelectOption value="gte">≥</NativeSelectOption>
            <NativeSelectOption value="lte">≤</NativeSelectOption>
            <NativeSelectOption value="eq">=</NativeSelectOption>
          </NativeSelect>
          <Input inputMode="numeric" placeholder="Any" value={v.a ?? ""} onChange={(e) => onChange({ ...v, a: parse(e.target.value) })} />
        </div>
      </div>
    )
  }
  // date, datetime, field → trigger + popover editor
  const set = isActive(value)
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {label}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className={cn(dateTriggerClass, "w-full")}>
            <span className={cn("truncate", !set && "text-muted-foreground")}>{set ? summarize(def, value) : def.kind === "field" ? "Any" : "Any date"}</span>
            <HugeiconsIcon icon={def.kind === "field" ? ArrowDown01Icon : KIND_ICON[def.kind]} className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className={cn("p-0", editorWidth(def.kind))} align="start">
          {/* Inside the panel / sheet, which own the draft and the single Apply —
              so this edits straight into that draft. */}
          <div className="flex items-center border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
            {def.label}
            <span className="ml-auto text-[10px] tracking-wider uppercase">{KIND_LABEL[def.kind]}</span>
          </div>
          <div className={cn(def.kind === "field" ? "p-1" : "p-3")}>
            <FilterEditor def={def} value={value} onChange={onChange} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
