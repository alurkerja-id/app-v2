import { useEffect, useId, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  ComputerIcon,
  FloppyDiskIcon,
  InformationCircleIcon,
  PencilEdit02Icon,
  Refresh01Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { EditElementDialog } from "./edit-element-dialog"
import { FieldShell, GhostInput } from "./field-shell"
import { L, useT, type L10n } from "./i18n"
import { reqMsg } from "./lib"
import { Palette } from "./palette"
import { VALUE_KINDS } from "./registry"
import { JsonBlock, Rich } from "./rich"
import type { AnyComponentDef, FieldState, Issue, StoryField } from "./types"

export type WorkbenchTab = "builder" | "runtime" | "data"

/* Edited props survive switching between components during the session. */
const propsCache = new Map<string, unknown>()

function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const on = () => setMatch(mql.matches)
    mql.addEventListener("change", on)
    return () => mql.removeEventListener("change", on)
  }, [query])
  return match
}

const storyInitial = (fields: StoryField[] = []) => Object.fromEntries(fields.map((f) => [f.name, f.value ?? ""]))

function storyIssues(fields: StoryField[], values: Record<string, string>): Issue[] {
  const out: Issue[] = []
  for (const f of fields) {
    const v = (values[f.name] ?? "").trim()
    const empty = f.type === "checkbox" ? v !== "true" : !v
    if (f.required && empty) out.push({ fid: `story-${f.name}`, msg: f.requiredMsg ?? reqMsg(f.label) })
    else if (v && f.validate) {
      const m = f.validate(v)
      if (m) out.push({ fid: `story-${f.name}`, msg: m })
    }
  }
  return out
}

const coerce = (f: StoryField, v: string) =>
  f.type === "number" ? (v.trim() === "" ? null : Number(v)) : f.type === "checkbox" ? v === "true" : v

/** Builder · Runtime · Data for one component. Owns its props and runtime value. */
export function Workbench({ def, tab, onPick, onTab }: { def: AnyComponentDef; tab: WorkbenchTab; onPick: (slug: string) => void; onTab: (tab: WorkbenchTab) => void }) {
  const [props, setPropsState] = useState<unknown>(() => propsCache.get(def.slug) ?? def.defaults())
  const setProps = (next: unknown) => {
    propsCache.set(def.slug, next)
    setPropsState(next)
  }
  const [value, setValue] = useState<unknown>(() => def.initial(props))
  const [fieldState, setFieldState] = useState<FieldState>("active")
  const story = def.story
  const storyFields = useMemo(() => [...(story.before ?? []), ...(story.after ?? [])], [story])
  const [storyVals, setStoryVals] = useState<Record<string, string>>(() => storyInitial(storyFields))
  const [attempted, setAttempted] = useState(false)
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const key: string = def.payloadKey ? def.payloadKey(props) : String((props as { name?: string }).name ?? def.slug)
  const payload = useMemo(() => {
    const o: Record<string, unknown> = {}
    for (const f of story.before ?? []) o[f.name] = coerce(f, storyVals[f.name] ?? "")
    if (def.payloadEntries) Object.assign(o, def.payloadEntries(props, value))
    else if (def.vk !== "none") o[key] = def.value(props, value)
    for (const f of story.after ?? []) o[f.name] = coerce(f, storyVals[f.name] ?? "")
    return o
  }, [def, props, value, storyVals, story, key])

  const issues: Issue[] = attempted ? [...(fieldState === "active" ? def.validate(props, value) : []), ...storyIssues(storyFields, storyVals)] : []

  /* Props changed in Edit Element: the runtime starts over, like re-opening the task. */
  const saveProps = (next: unknown) => {
    setProps(next)
    setValue(fieldState === "active" ? def.initial(next) : def.sample(next))
    setAttempted(false)
  }
  const changeState = (s: FieldState) => {
    setFieldState(s)
    setValue(s === "active" ? def.initial(props) : def.sample(props))
    setAttempted(false)
  }
  const reset = () => {
    setValue(fieldState === "active" ? def.initial(props) : def.sample(props))
    setStoryVals(storyInitial(storyFields))
    setAttempted(false)
    setSubmitted(null)
  }

  const t = useT()
  const complete = () => {
    setAttempted(true)
    const found = [...(fieldState === "active" ? def.validate(props, value) : []), ...storyIssues(storyFields, storyVals)]
    if (found.length) {
      // Containers: every child field is its own variable, so count them one by one.
      const fields = new Set(found.map((i) => (i.fid.startsWith("story-") || def.payloadEntries ? i.fid : "main"))).size
      toast.error(t(L(`${fields} field${fields === 1 ? "" : "s"} to fix`, `${fields} isian perlu diperbaiki`)), {
        description: t(found[0].msg),
      })
      requestAnimationFrame(() => document.querySelector("[data-has-issue='true']")?.scrollIntoView({ behavior: "smooth", block: "center" }))
      return
    }
    setSubmitted(payload)
    toast.success(t(L("Task completed", "Task selesai")), {
      description: t(L("Payload sent. Open the Data tab to see it.", "Payload terkirim. Buka tab Data untuk melihatnya.")),
      action: { label: t(L("Data tab", "Tab Data")), onClick: () => onTab("data") },
    })
  }

  return (
    <>
      {tab === "builder" && (
        <BuilderView def={def} props={props} onPick={onPick} onEdit={() => setEditOpen(true)} />
      )}
      {tab === "runtime" && (
        <RuntimeView
          def={def}
          props={props}
          value={value}
          setValue={setValue}
          fieldState={fieldState}
          changeState={changeState}
          storyVals={storyVals}
          setStoryVals={setStoryVals}
          issues={issues}
          liveValue={def.payloadEntries ? def.payloadEntries(props, value) : def.vk === "none" ? undefined : payload[key]}
          payloadKey={key}
          onReset={reset}
          onComplete={complete}
        />
      )}
      {tab === "data" && <DataView def={def} props={props} value={value} payload={payload} submitted={submitted} />}
      <EditElementDialog def={def} props={props} open={editOpen} onOpenChange={setEditOpen} onSave={saveProps} />
    </>
  )
}

/* ── Builder ─────────────────────────────────────────────────────────────── */

function GhostField({ f }: { f: StoryField }) {
  const t = useT()
  return (
    <div className="flex flex-col gap-1.5 opacity-70">
      <span className="text-xs text-muted-foreground">
        {t(f.label)}
        {f.required && <span className="text-destructive"> *</span>}
      </span>
      {f.type === "checkbox" ? (
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-4 rounded-[5px] shadow-[var(--input-depth)]" />
          {t(f.label)}
        </span>
      ) : f.type === "textarea" ? (
        <div className="h-16 rounded-2xl bg-[var(--input-surface)] shadow-[var(--input-depth)]" />
      ) : (
        <GhostInput select={f.type === "select"}>{f.value || t(f.placeholder)}</GhostInput>
      )}
    </div>
  )
}

function BuilderView({ def, props, onPick, onEdit }: { def: AnyComponentDef; props: unknown; onPick: (slug: string) => void; onEdit: () => void }) {
  const t = useT()
  const warn = def.canvasWarn?.(props)
  const required = def.isRequired(props)
  const name = String((props as { name?: string }).name ?? "")
  const Canvas = def.Canvas

  return (
    <div className="grid gap-5 lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <Card className="h-fit gap-3 p-3 lg:sticky lg:top-4">
        <p className="px-1 text-xs font-semibold text-foreground">{t(L("Palette", "Palette"))}</p>
        <Palette activeSlug={def.slug} onPick={onPick} />
      </Card>

      <div className="flex min-w-0 flex-col gap-4">
        <Card className="gap-0 overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{t(def.story.step)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {t(L("Form", "Form"))} · {t(def.story.process)}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={onEdit}>
              <HugeiconsIcon icon={PencilEdit02Icon} />
              {t(L("Edit element", "Edit elemen"))}
            </Button>
          </div>

          <div className="flex flex-col gap-4 bg-muted/30 p-4 sm:p-6 dark:bg-muted/10">
            {(def.story.before ?? []).map((f) => (
              <GhostField key={f.name} f={f} />
            ))}

            <div
              role="button"
              tabIndex={0}
              onClick={onEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onEdit()
                }
              }}
              aria-label={t(L(`Edit ${def.label.en}`, `Edit ${def.label.id}`))}
              className="group relative cursor-pointer rounded-2xl border border-dashed border-foreground/25 bg-card p-4 pt-6 shadow-sm transition-shadow outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <div className="absolute -top-2.5 left-3 flex items-center gap-1.5">
                <Badge className="gap-1 px-2 text-[10px]">
                  <HugeiconsIcon icon={def.icon} />
                  {t(def.label)}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {t(L("New", "Baru"))}
                </Badge>
                {warn && (
                  <Badge variant="destructive" className="gap-1 text-[10px]">
                    <HugeiconsIcon icon={Alert02Icon} />
                    {t(warn)}
                  </Badge>
                )}
              </div>
              <span className="absolute top-2 right-3 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {t(L("Click to edit", "Klik untuk edit"))}
              </span>
              {!def.bare ? (
                <p className="mb-2 text-xs text-muted-foreground">
                  {t(def.fieldLabel(props))}
                  {required && <span className="text-destructive"> *</span>}
                </p>
              ) : null}
              <div className="pointer-events-none">
                <Canvas props={props} />
              </div>
            </div>

            {(def.story.after ?? []).map((f) => (
              <GhostField key={f.name} f={f} />
            ))}
          </div>
        </Card>

        <Card className="gap-3 p-5">
          <p className="text-sm font-semibold">{t(L("In the form spec", "Di spec form"))}</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            {[
              { k: "ui_type", v: def.fft ? `${def.ui} · ${def.fft}` : def.ui },
              { k: "value_kind", v: def.valueKindOf?.(props) ?? def.vk },
              { k: t(L("Key", "Key")), v: name || "—" },
              { k: t(L("Required", "Wajib")), v: def.vk === "none" ? "—" : required ? t(L("Yes", "Ya")) : t(L("No", "Tidak")) },
            ].map((x) => (
              <div key={x.k} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{x.k}</dt>
                <dd className="truncate font-mono text-[13px]">{x.v}</dd>
              </div>
            ))}
          </dl>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <HugeiconsIcon icon={InformationCircleIcon} className="mt-px size-3.5 shrink-0" />
            {t(
              L(
                "Click the element to open Edit Element. Like Studio, changes apply on Save Changes.",
                "Klik elemen untuk membuka Edit Element. Seperti di Studio, perubahan berlaku saat Save Changes.",
              ),
            )}
          </p>
        </Card>
      </div>
    </div>
  )
}

/* ── Runtime ─────────────────────────────────────────────────────────────── */

const THEMES = [
  "from-blue-600 to-indigo-700",
  "from-emerald-600 to-teal-700",
  "from-amber-500 to-orange-600",
  "from-violet-600 to-purple-700",
  "from-rose-600 to-pink-700",
  "from-cyan-600 to-sky-700",
]
const themeFor = (s: string) => THEMES[[...s].reduce((n, ch) => n + ch.charCodeAt(0), 0) % THEMES.length]
const initials = (s: string) =>
  s
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

function StoryInput({ f, value, onChange, issues }: { f: StoryField; value: string; onChange: (v: string) => void; issues: Issue[] }) {
  const t = useT()
  const id = useId()
  const bad = issues.length > 0 || undefined
  if (f.type === "checkbox") {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm">
          <Checkbox id={id} checked={value === "true"} aria-invalid={bad} onCheckedChange={(c) => onChange(c === true ? "true" : "")} className="mt-0.5" />
          <span>
            {t(f.label)}
            {f.required && <span className="text-destructive"> *</span>}
          </span>
        </label>
        {issues.map((i) => (
          <p key={i.fid} role="alert" className="text-xs font-medium text-destructive">
            {t(i.msg)}
          </p>
        ))}
      </div>
    )
  }
  return (
    <FieldShell label={f.label} required={f.required} htmlFor={id} issues={issues} hint={f.hint}>
      {f.type === "textarea" ? (
        <Textarea id={id} rows={f.rows ?? 3} value={value} placeholder={t(f.placeholder)} aria-invalid={bad} onChange={(e) => onChange(e.target.value)} className="resize-none" />
      ) : f.type === "select" ? (
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger id={id} className="w-full" aria-invalid={bad}>
            <SelectValue placeholder={t(L("Select…", "Pilih…"))} />
          </SelectTrigger>
          <SelectContent>
            {(f.options ?? []).map((o) => (
              <SelectItem key={o.v} value={o.v}>
                {t(o.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : f.prefix ? (
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>{f.prefix}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id={id}
            type={f.type === "number" ? "number" : "text"}
            inputMode={f.type === "number" ? "numeric" : undefined}
            value={value}
            placeholder={t(f.placeholder)}
            aria-invalid={bad}
            onChange={(e) => onChange(e.target.value)}
          />
        </InputGroup>
      ) : (
        <Input
          id={id}
          type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
          value={value}
          placeholder={t(f.placeholder)}
          aria-invalid={bad}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </FieldShell>
  )
}

function TaskForm({
  def,
  props,
  value,
  setValue,
  fieldState,
  storyVals,
  setStoryVals,
  issues,
  compact,
  onComplete,
}: {
  def: AnyComponentDef
  props: unknown
  value: unknown
  setValue: (v: unknown) => void
  fieldState: FieldState
  storyVals: Record<string, string>
  setStoryVals: (v: Record<string, string>) => void
  issues: Issue[]
  compact: boolean
  onComplete: () => void
}) {
  const t = useT()
  const id = useId().replace(/:/g, "")
  const s = def.story
  const theme = themeFor(s.process.en)
  const Runtime = def.Runtime
  const own = issues.filter((i) => !i.fid.startsWith("story-"))
  const storyField = (f: StoryField) => {
    const fi = issues.filter((i) => i.fid === `story-${f.name}`)
    return (
      <div key={f.name} className="px-5 py-4 sm:px-6" data-has-issue={fi.length > 0 || undefined}>
        <StoryInput f={f} value={storyVals[f.name] ?? ""} issues={fi} onChange={(v) => setStoryVals({ ...storyVals, [f.name]: v })} />
      </div>
    )
  }
  const showLabel = !def.bare

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
      <div className={cn("relative overflow-hidden bg-gradient-to-br text-white", theme)}>
        <div className="pointer-events-none absolute -top-8 -right-8 size-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute top-16 -right-4 size-24 rounded-full bg-white/10" />
        <div className={cn("relative", compact ? "px-4 py-4" : "px-6 py-5")}>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-xs font-bold backdrop-blur-sm">{initials(s.process.en)}</span>
            <span className="truncate text-sm font-medium text-white/80">{t(s.process)}</span>
          </div>
          <div className="mb-3 flex items-baseline gap-2">
            <h2 className={cn("font-heading leading-snug font-semibold", compact ? "text-base" : "text-lg")}>{t(s.task)}</h2>
            <span className="shrink-0 font-mono text-xs text-white/50">#{s.ref}</span>
          </div>
          <div className={cn("flex gap-6", compact ? "flex-col gap-3" : "items-end")}>
            <div className="flex flex-1 flex-wrap gap-5">
              {[
                { k: L("Step", "Langkah"), v: t(s.step) },
                { k: L("Due Date", "Tenggat"), v: s.due },
                { k: L("Assignee", "Penerima tugas"), v: t(L("You", "Anda")) },
              ].map((x) => (
                <div key={x.k.en}>
                  <p className="mb-0.5 text-[11px] text-white/60">{t(x.k)}</p>
                  <p className="text-sm font-semibold">{x.v}</p>
                </div>
              ))}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={() => toast.success(t(L("Draft saved", "Draf disimpan")))}
              >
                <HugeiconsIcon icon={FloppyDiskIcon} className="size-3.5" />
                {t(L("Save Draft", "Simpan Draf"))}
              </Button>
              <Button size="sm" onClick={onComplete} className="bg-white font-semibold text-foreground shadow-sm hover:bg-white/90 dark:bg-white dark:text-zinc-900 dark:hover:bg-white/90">
                {t(L("Complete Task", "Selesaikan Task"))}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {(s.before ?? []).map(storyField)}
        <div className="px-5 py-4 sm:px-6" data-has-issue={own.length > 0 || undefined} data-component-slot={def.slug}>
          {showLabel ? (
            <FieldShell label={def.fieldLabel(props)} required={def.isRequired(props)} labelId={`${id}-label`} htmlFor={`${id}-input`} issues={own}>
              <Runtime props={props} value={value} onChange={setValue} state={fieldState} issues={own} compact={compact} id={id} />
            </FieldShell>
          ) : (
            <Runtime props={props} value={value} onChange={setValue} state={fieldState} issues={own} compact={compact} id={id} />
          )}
        </div>
        {(s.after ?? []).map(storyField)}
      </div>
    </div>
  )
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[390px] max-w-full rounded-[2.75rem] border-[10px] border-zinc-900 bg-background shadow-xl dark:border-zinc-700">
      <div className="relative">
        <div className="absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-zinc-900 dark:bg-zinc-700" aria-hidden />
      </div>
      <div className="h-[720px] overflow-y-auto rounded-[2.1rem] pt-9 [&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none">{children}</div>
    </div>
  )
}

function RuntimeView({
  def,
  props,
  value,
  setValue,
  fieldState,
  changeState,
  storyVals,
  setStoryVals,
  issues,
  liveValue,
  payloadKey,
  onReset,
  onComplete,
}: {
  def: AnyComponentDef
  props: unknown
  value: unknown
  setValue: (v: unknown) => void
  fieldState: FieldState
  changeState: (s: FieldState) => void
  storyVals: Record<string, string>
  setStoryVals: (v: Record<string, string>) => void
  issues: Issue[]
  liveValue: unknown
  payloadKey: string
  onReset: () => void
  onComplete: () => void
}) {
  const t = useT()
  const narrow = useMedia("(max-width: 639px)")
  const [device, setDevice] = useState<"desktop" | "phone">("desktop")
  const phone = def.devices && device === "phone"
  const Controls = def.Controls
  const Aside = def.Aside
  const form = (
    <TaskForm
      def={def}
      props={props}
      value={value}
      setValue={setValue}
      fieldState={fieldState}
      storyVals={storyVals}
      setStoryVals={setStoryVals}
      issues={issues}
      compact={Boolean(phone) || narrow}
      onComplete={onComplete}
    />
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">{t(L("Field state", "Kondisi field"))}</Label>
          <ToggleGroup type="single" variant="outline" size="sm" value={fieldState} onValueChange={(v) => v && changeState(v as FieldState)}>
            {(
              [
                ["active", L("Active", "Aktif")],
                ["readonly", L("Read-only", "Baca-saja")],
                ["disabled", L("Disabled", "Nonaktif")],
              ] as [FieldState, L10n][]
            ).map(([v, l]) => (
              <ToggleGroupItem key={v} value={v} className="px-3 text-xs">
                {t(l)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        {def.devices && !narrow && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">{t(L("Preview", "Pratinjau"))}</Label>
            <ToggleGroup type="single" variant="outline" size="sm" value={device} onValueChange={(v) => v && setDevice(v as "desktop" | "phone")}>
              <ToggleGroupItem value="desktop" className="px-3 text-xs" aria-label="Desktop">
                <HugeiconsIcon icon={ComputerIcon} />
                {t(L("Desktop", "Desktop"))}
              </ToggleGroupItem>
              <ToggleGroupItem value="phone" className="px-3 text-xs" aria-label="Phone">
                <HugeiconsIcon icon={SmartPhone01Icon} />
                {t(L("Phone", "Ponsel"))}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={onReset} className="ml-auto">
          <HugeiconsIcon icon={Refresh01Icon} />
          {t(L("Reset form", "Atur ulang form"))}
        </Button>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">{phone ? <PhoneFrame>{form}</PhoneFrame> : form}</div>
        <div className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-4">
          {Controls && (def.hasControls?.(props) ?? true) && (
            <Card className="gap-3 border-dashed p-4">
              <p className="text-xs font-semibold text-foreground">
                {t(L("Prototype · simulate", "Prototipe · simulasi"))}
                {def.controlsTitle && ` ${t(def.controlsTitle).toLowerCase()}`}
              </p>
              <Controls props={props} value={value} onChange={setValue} state={fieldState} />
            </Card>
          )}
          {Aside && <Aside props={props} value={value} />}
          {def.payloadEntries ? (
            <JsonBlock
              title={L("Live values", "Nilai saat ini")}
              sub={L("Child fields · one process variable each", "Field anak · masing-masing satu variabel proses")}
              value={liveValue}
              maxHeight="22rem"
            />
          ) : def.vk !== "none" ? (
            <JsonBlock
              title={L("Live value", "Nilai saat ini")}
              sub={`${payloadKey} · value_kind ${def.valueKindOf?.(props) ?? def.vk}`}
              value={liveValue}
              maxHeight="22rem"
            />
          ) : (
            <Card className="gap-1 p-4">
              <p className="text-xs font-semibold">{t(L("No value", "Tanpa nilai"))}</p>
              <p className="text-xs text-muted-foreground">
                <Rich text={L("`value_kind: \"none\"` — this component adds no key to the payload.", "`value_kind: \"none\"` — komponen ini tidak menambah key di payload.")} />
              </p>
            </Card>
          )}
          {fieldState !== "active" && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <HugeiconsIcon icon={InformationCircleIcon} className="mt-px size-3.5 shrink-0" />
              {t(
                fieldState === "readonly"
                  ? L("Read-only: the value is shown and selectable, and is still submitted.", "Baca-saja: nilai tampil dan bisa dipilih, tetap ikut terkirim.")
                  : L("Disabled: unavailable, muted, not editable.", "Nonaktif: tidak tersedia, teks redup, tidak bisa diubah."),
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Data ────────────────────────────────────────────────────────────────── */

function DataView({
  def,
  props,
  value,
  payload,
  submitted,
}: {
  def: AnyComponentDef
  props: unknown
  value: unknown
  payload: Record<string, unknown>
  submitted: Record<string, unknown> | null
}) {
  const t = useT()
  const vk = VALUE_KINDS[def.valueKindOf?.(props) ?? def.vk]
  return (
    <div className="flex flex-col gap-5">
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <JsonBlock title={L("Node spec", "Node spec")} sub={L("Saved by Studio in the form spec", "Disimpan Studio di spec form")} value={def.spec(props)} />
        <JsonBlock
          title={L("Payload", "Payload")}
          sub={submitted ? L("Sent by the last Complete Task", "Terkirim saat Complete Task terakhir") : L("Live — sent on Complete Task", "Langsung — dikirim saat Complete Task")}
          value={submitted ?? payload}
        />
      </div>
      {def.dataExtra?.(props, value).map((x) => <JsonBlock key={x.title.en} title={x.title} sub={x.sub} value={x.json} />)}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card className="gap-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{t(L("How the value is saved", "Cara nilai disimpan"))}</p>
            <Badge variant="outline" className="font-mono text-[10px]">
              value_kind: {def.valueKindOf?.(props) ?? def.vk}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            <Rich text={def.savedAs(props)} />
          </p>
          {vk && (
            <p className="text-xs text-muted-foreground">
              {t(vk.shape)} · <code className="font-mono">{vk.example}</code>
            </p>
          )}
        </Card>
        <Card className="gap-3 p-5">
          <p className="text-sm font-semibold">{t(L("Notes for developers", "Catatan untuk developer"))}</p>
          {def.notes.length ? (
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-sm text-muted-foreground marker:text-muted-foreground/60">
              {def.notes.map((n) => (
                <li key={n.en}>
                  <Rich text={n} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </Card>
      </div>
    </div>
  )
}
