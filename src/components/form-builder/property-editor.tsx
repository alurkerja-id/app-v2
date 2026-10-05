import { useId } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
  InformationCircleIcon,
  MinusSignIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { L, useLang, useT, type L10n } from "./i18n"
import { snake } from "./lib"
import { Rich } from "./rich"
import { fieldError, isVisible, valueOf } from "./schema"
import type { EditorTab, ListItem, PropField, PropSection } from "./types"

/**
 * Edit Element content for one tab. Every field has a typed editor (switch,
 * stepper, choice, list…) — never a textbox holding a raw key name.
 */
export function PropertyEditor<P extends object>({
  sections,
  props,
  onChange,
  tab,
}: {
  sections: PropSection<P>[]
  props: P
  onChange: (next: P) => void
  tab: EditorTab
}) {
  const t = useT()
  const list = sections.filter((s) => s.tab === tab && s.fields.some((f) => isVisible(f, props)))
  if (!list.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        {t(
          tab === "logic"
            ? L("No logic settings for this component.", "Tidak ada pengaturan logika untuk komponen ini.")
            : L("Nothing to set on this tab.", "Tidak ada yang perlu diatur di tab ini."),
        )}
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-7">
      {list.map((s, si) => (
        <section key={si} className="flex flex-col gap-5">
          {s.title && (
            <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{t(s.title)}</h3>
          )}
          {s.fields
            .filter((f) => isVisible(f, props))
            .map((f, fi) => (
              <PropFieldView key={"k" in f ? f.k : f.t === "custom" ? f.id : `note-${fi}`} field={f} props={props} onChange={onChange} />
            ))}
        </section>
      ))}
    </div>
  )
}

function PropFieldView<P extends object>({ field: f, props, onChange }: { field: PropField<P>; props: P; onChange: (next: P) => void }) {
  const t = useT()
  const { lang } = useLang()
  const id = useId()

  if (f.t === "note") {
    return (
      <Alert className={cn(f.tone === "warning" && "border-amber-500/30 bg-amber-500/5")}>
        <HugeiconsIcon icon={f.tone === "warning" ? Alert02Icon : InformationCircleIcon} />
        <AlertDescription>
          <Rich text={f.text} />
        </AlertDescription>
      </Alert>
    )
  }

  const set = (patch: Partial<P>) => onChange({ ...props, ...patch })
  const setValue = (v: unknown) => set({ [(f as { k: string }).k]: v } as Partial<P>)
  const value = valueOf(f, props)
  const error = fieldError(f, props)
  const invalid = error ? true : undefined

  if (f.t === "custom") {
    return (
      <div className="flex flex-col gap-1.5">
        {f.render({ props, set, lang })}
        {error && <FieldMsg error={error} />}
      </div>
    )
  }

  if (f.t === "switch") {
    return (
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Label htmlFor={id} className="text-sm font-medium">
            {t(f.label)}
          </Label>
          {f.hint && (
            <p className="text-xs text-muted-foreground">
              <Rich text={f.hint} />
            </p>
          )}
          {error && <FieldMsg error={error} />}
        </div>
        <Switch id={id} checked={Boolean(value)} onCheckedChange={(c) => setValue(c)} />
      </div>
    )
  }

  let control: React.ReactNode = null
  let extra: React.ReactNode = null

  switch (f.t) {
    case "i18n": {
      const v = (value as L10n | undefined) ?? { en: "", id: "" }
      const sides: ("en" | "id")[] = ["en", "id"]
      control = (
        <div className="flex flex-col gap-2">
          {sides.map((side) =>
            f.multi ? (
              <InputGroup key={side}>
                <InputGroupAddon align="block-start" className="pb-0 text-[10px] font-semibold tracking-wider uppercase">
                  {side === "en" ? "English" : "Bahasa Indonesia"}
                </InputGroupAddon>
                <InputGroupTextarea
                  id={side === "en" ? id : undefined}
                  rows={f.rows ?? 3}
                  value={v[side]}
                  aria-invalid={side === "en" ? invalid : undefined}
                  onChange={(e) => setValue({ ...v, [side]: e.target.value })}
                  className="min-h-0 resize-y"
                />
              </InputGroup>
            ) : (
              <InputGroup key={side}>
                <InputGroupAddon>
                  <span className="w-5 text-[10px] font-semibold tracking-wider">{side.toUpperCase()}</span>
                </InputGroupAddon>
                <InputGroupInput
                  id={side === "en" ? id : undefined}
                  value={v[side]}
                  aria-invalid={side === "en" ? invalid : undefined}
                  aria-label={side === "en" ? undefined : `${t(f.label)} (Bahasa Indonesia)`}
                  onChange={(e) => setValue({ ...v, [side]: e.target.value })}
                />
              </InputGroup>
            ),
          )}
        </div>
      )
      if (v.en.trim() && !v.id.trim())
        extra = (
          <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
            <HugeiconsIcon icon={Alert02Icon} className="size-3.5" />
            {t(L("Indonesian is empty — users will see the English text.", "Bahasa Indonesia kosong — user akan melihat teks bahasa Inggris."))}
          </p>
        )
      break
    }
    case "text":
      control = (
        <Input
          id={id}
          value={String(value ?? "")}
          placeholder={t(f.placeholder)}
          aria-invalid={invalid}
          className={cn(f.mono && "font-mono text-[13px]")}
          spellCheck={f.mono ? false : undefined}
          onChange={(e) => setValue(e.target.value)}
        />
      )
      break
    case "url":
      control = (
        <Input
          id={id}
          type="url"
          inputMode="url"
          value={String(value ?? "")}
          placeholder={f.placeholder}
          aria-invalid={invalid}
          className="font-mono text-[13px]"
          spellCheck={false}
          onChange={(e) => setValue(e.target.value.trim())}
        />
      )
      break
    case "date":
      control = <Input id={id} type="date" value={String(value ?? "")} aria-invalid={invalid} className="w-48" onChange={(e) => setValue(e.target.value)} />
      break
    case "number": {
      const step = f.step ?? 1
      const empty = value === "" || value == null
      const n = empty ? null : Number(value)
      const clamp = (x: number) => Math.min(f.max ?? Infinity, Math.max(f.min ?? -Infinity, x))
      const bump = (dir: 1 | -1) => setValue(clamp(+((n ?? f.min ?? 0) + dir * step).toFixed(4)))
      control = (
        <InputGroup className="w-44">
          <InputGroupInput
            id={id}
            type="number"
            inputMode="decimal"
            value={empty ? "" : String(value)}
            min={f.min}
            max={f.max}
            step={step}
            aria-invalid={invalid}
            className="tabular-nums"
            onChange={(e) => {
              const s = e.target.value
              if (s === "") setValue("")
              else if (!Number.isNaN(Number(s))) setValue(Number(s))
            }}
          />
          {f.suffix && (
            <InputGroupAddon align="inline-end">
              <InputGroupText>{f.suffix}</InputGroupText>
            </InputGroupAddon>
          )}
          <InputGroupAddon align="inline-end" className="gap-0.5">
            <InputGroupButton size="icon-xs" aria-label={t(L("Decrease", "Kurangi"))} disabled={n != null && f.min != null && n <= f.min} onClick={() => bump(-1)}>
              <HugeiconsIcon icon={MinusSignIcon} />
            </InputGroupButton>
            <InputGroupButton size="icon-xs" aria-label={t(L("Increase", "Tambah"))} disabled={n != null && f.max != null && n >= f.max} onClick={() => bump(1)}>
              <HugeiconsIcon icon={PlusSignIcon} />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      )
      break
    }
    case "select":
      // Radix Select cannot hold "" — an empty option travels as "_none".
      control = (
        <Select value={String(value ?? "") || "_none"} onValueChange={(v) => setValue(v === "_none" ? "" : v)}>
          <SelectTrigger id={id} className="w-full" aria-invalid={invalid}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {f.options.map((o) => (
              <SelectItem key={o.v || "_none"} value={o.v || "_none"}>
                {t(o.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
      break
    case "seg":
      control = (
        <ToggleGroup
          id={id}
          type="single"
          variant="outline"
          size="sm"
          value={String(value)}
          onValueChange={(raw) => {
            if (!raw) return
            const opt = f.options.find((o) => String(o.v) === raw)
            if (!opt) return
            if (f.set) onChange(f.set(props, opt.v))
            else setValue(opt.v)
          }}
          className="flex-wrap"
        >
          {f.options.map((o) => (
            <ToggleGroupItem key={String(o.v)} value={String(o.v)} className="px-3 text-xs">
              {t(o.label)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )
      break
    case "chips": {
      const arr = Array.isArray(value) ? (value as string[]) : []
      control = (
        <ToggleGroup
          id={id}
          type="multiple"
          variant="outline"
          size="sm"
          spacing={1}
          value={arr}
          onValueChange={(next) => setValue(f.options.map((o) => o.v).filter((v) => next.includes(v)))}
          className="flex-wrap"
        >
          {f.options.map((o) => (
            <ToggleGroupItem key={o.v} value={o.v} className="px-3 text-xs">
              {t(o.label)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )
      break
    }
    case "list":
      control = <ListEditor field={f} items={(value as ListItem[] | undefined) ?? []} onItems={(items) => setValue(items)} labelId={id} />
      break
  }

  return (
    <div className="flex flex-col gap-1.5">
      {f.label && (
        <Label htmlFor={f.t === "list" ? undefined : id} id={f.t === "list" ? id : undefined} className="text-sm font-medium">
          {t(f.label)}
        </Label>
      )}
      {control}
      {extra}
      {error ? (
        <FieldMsg error={error} />
      ) : (
        f.hint && (
          <p className="text-xs text-muted-foreground">
            <Rich text={f.hint} />
          </p>
        )
      )}
    </div>
  )
}

function FieldMsg({ error }: { error: L10n }) {
  const t = useT()
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {t(error)}
    </p>
  )
}

/* ── list editor ───────────────────────────────────────────────────────── */

type ListField<P> = Extract<PropField<P>, { t: "list" }>

function ListEditor<P>({
  field: f,
  items,
  onItems,
  labelId,
}: {
  field: ListField<P>
  items: ListItem[]
  onItems: (items: ListItem[]) => void
  labelId: string
}) {
  const t = useT()
  const bilingual = f.i18n !== false
  const fixed = Boolean(f.fixed)
  const canRemove = !fixed && items.length > (f.min ?? 0)
  const canAdd = !fixed && items.length < (f.max ?? 99)

  const update = (i: number, patch: Partial<ListItem>) => onItems(items.map((it, j) => (j === i ? { ...it, ...patch } : it)))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = items.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onItems(next)
  }
  const add = () => {
    const n = items.length
    const base: ListItem = f.newItem?.(n) ?? (bilingual ? { label: L(`Option ${n + 1}`, `Opsi ${n + 1}`) } : { text: "" })
    if (f.keyField && base[f.keyField] == null && base.label) base[f.keyField] = snake(base.label.en)
    onItems([...items, base])
  }

  return (
    <div className="flex flex-col gap-2" role="group" aria-labelledby={labelId}>
      {bilingual && items.length > 0 && (
        <div className={cn("grid gap-2 px-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase", fixed ? "grid-cols-2" : "grid-cols-[1fr_1fr_5.25rem]")}>
          <span>EN</span>
          <span>ID</span>
        </div>
      )}
      <ol className="flex flex-col gap-2">
        {items.map((it, i) => {
          const label = it.label ?? { en: "", id: "" }
          const key = f.keyField ? String(it[f.keyField] ?? "") : ""
          return (
            <li key={i} className="flex flex-col gap-1">
              <div className={cn("grid items-center gap-2", bilingual ? (fixed ? "grid-cols-2" : "grid-cols-[1fr_1fr_5.25rem]") : fixed ? "grid-cols-1" : "grid-cols-[1fr_5.25rem]")}>
                {bilingual ? (
                  <>
                    <Input
                      value={label.en}
                      aria-label={`${t(f.label)} ${i + 1} (English)`}
                      aria-invalid={!label.en.trim() || undefined}
                      onChange={(e) =>
                        update(i, { label: { ...label, en: e.target.value }, ...(f.keyField ? { [f.keyField]: snake(e.target.value) } : {}) })
                      }
                    />
                    <Input
                      value={label.id}
                      aria-label={`${t(f.label)} ${i + 1} (Bahasa Indonesia)`}
                      onChange={(e) => update(i, { label: { ...label, id: e.target.value } })}
                    />
                  </>
                ) : (
                  <Input value={it.text ?? ""} aria-label={`${t(f.label)} ${i + 1}`} onChange={(e) => update(i, { text: e.target.value })} />
                )}
                {!fixed && (
                  <div className="flex items-center justify-end gap-0.5">
                    <Button variant="ghost" size="icon-xs" aria-label={t(L("Move up", "Naikkan"))} disabled={i === 0} onClick={() => move(i, -1)}>
                      <HugeiconsIcon icon={ArrowUp01Icon} />
                    </Button>
                    <Button variant="ghost" size="icon-xs" aria-label={t(L("Move down", "Turunkan"))} disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                      <HugeiconsIcon icon={ArrowDown01Icon} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={t(L("Remove", "Hapus"))}
                      disabled={!canRemove}
                      onClick={() => onItems(items.filter((_, j) => j !== i))}
                      className="hover:text-destructive"
                    >
                      <HugeiconsIcon icon={Delete02Icon} />
                    </Button>
                  </div>
                )}
              </div>
              {f.keyField && (
                <span className="px-1 font-mono text-[11px] text-muted-foreground" title={t(L("Saved key", "Key yang disimpan"))}>
                  {key || "—"}
                </span>
              )}
            </li>
          )
        })}
      </ol>
      {!fixed && (
        <div>
          <Button variant="ghost" size="sm" disabled={!canAdd} onClick={add}>
            <HugeiconsIcon icon={PlusSignIcon} />
            {t(f.addLabel ?? L("Add", "Tambah"))}
          </Button>
        </div>
      )}
    </div>
  )
}
