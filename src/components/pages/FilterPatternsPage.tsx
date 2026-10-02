import { useCallback, useMemo, useState } from "react"
import { addDays, subDays } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { FilterHorizontalIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DateRangePicker } from "@/components/dashboard/date-range-picker"
import { AddFilterMenu, FilterFacet, InlineFilterField, KIND_ICON } from "@/components/filters/typed-filter-controls"
import { presetRange, type DateRangeValue } from "@/lib/date-presets"
import { opts } from "@/lib/filters"
import { activeCount, isActive, KIND_LABEL, test, type TypedFilterDef, type TypedValue, type TypedValues } from "@/lib/typed-filters"
import { jitter, noise } from "@/lib/mock-series"

/* ────────────────────────────────────────────────────────────────────────
   Filter layout options, from explicit (everything visible) to clean (open
   what you need). Every option uses the same filters, the same editors and the
   same chip style — only the arrangement changes — so they compare fairly.
   Each is live against the same sample data.
──────────────────────────────────────────────────────────────────────── */

const DEFS: TypedFilterDef[] = [
  { id: "department", label: "Department", kind: "field", options: opts(["HR", "Finance", "IT", "Operations", "Sales"]), pinned: true },
  { id: "status", label: "Status", kind: "field", options: opts(["Draft", "In review", "Approved", "Rejected"]), pinned: true },
  { id: "requester", label: "Requester", kind: "text" },
  { id: "amount", label: "Amount", kind: "number", currency: true },
  { id: "due", label: "Due date", kind: "date" },
  { id: "submitted", label: "Submitted at", kind: "datetime" },
  { id: "urgent", label: "Urgent", kind: "boolean" },
]

/* ── Sample data: 48 requests over the last ~90 days ── */
const NAMES = ["Anita Hidayati", "Budi Santoso", "Citra Lestari", "Dewi Anggraini", "Eko Prasetyo", "Fajar Nugroho", "Gita Permata", "Hendra Wijaya"]
const TODAY = new Date()
const ROWS = Array.from({ length: 48 }, (_, i) => {
  const submitted = subDays(TODAY, Math.floor(noise("sub", i) * 90))
  submitted.setHours(8 + Math.floor(noise("h", i) * 9), Math.floor(noise("m", i) * 60))
  return {
    requester: NAMES[Math.floor(noise("n", i) * NAMES.length)],
    department: DEFS[0].options![Math.floor(noise("d", i) * 5)].value,
    status: DEFS[1].options![Math.floor(noise("s", i) * 4)].value,
    amount: Math.round(jitter(8_000_000, 0.9, "a", i) / 50_000) * 50_000,
    due: addDays(submitted, 3 + Math.floor(noise("due", i) * 18)),
    submitted,
    urgent: noise("u", i) < 0.25,
  }
})

function usePatternState() {
  const [range, setRange] = useState<DateRangeValue>(() => presetRange("Last 3 months", TODAY))
  const [preset, setPreset] = useState<string | null>("Last 3 months")
  const [values, setValues] = useState<TypedValues>({})
  const set = (id: string, v: TypedValue | undefined) => setValues((s) => ({ ...s, [id]: v }))
  const countFor = useCallback(
    (vals: TypedValues) =>
      ROWS.filter((r) => r.submitted >= range.from && r.submitted <= range.to && DEFS.every((d) => test(vals[d.id], r[d.id as keyof typeof r])))
        .length,
    [range],
  )
  const matched = useMemo(() => countFor(values), [countFor, values])
  const period = (
    <DateRangePicker
      value={range}
      preset={preset}
      today={TODAY}
      onChange={(r, p) => {
        setRange(r)
        setPreset(p)
      }}
    />
  )
  return { values, setValues, set, matched, countFor, period }
}

type PatternState = ReturnType<typeof usePatternState>

/** Same filters, ignoring inactive entries — for "has the draft changed?". */
const normValues = (v: TypedValues) => JSON.stringify(Object.fromEntries(Object.entries(v).filter(([, x]) => isActive(x))))

function Clear({ s }: { s: PatternState }) {
  if (!activeCount(s.values)) return null
  return (
    <button type="button" onClick={() => s.setValues({})} className="h-9 px-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
      Clear
    </button>
  )
}

/* ── A · Panel — every filter labeled and visible ── */
function PanelPattern() {
  const s = usePatternState()
  // The panel is a form: fields edit a draft, one Apply commits them together.
  const [draft, setDraft] = useState<TypedValues>({})
  const dirty = normValues(draft) !== normValues(s.values)
  return (
    <Frame s={s}>
      <form
        className="space-y-3 rounded-3xl bg-muted/40 p-4"
        onSubmit={(e) => {
          e.preventDefault()
          s.setValues(draft)
        }}
      >
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Period</span>
          <div className="[&>button]:w-full">{s.period}</div>
        </div>
        {DEFS.map((d) => (
          <InlineFilterField key={d.id} def={d} value={draft[d.id]} onChange={(u) => setDraft((x) => ({ ...x, [d.id]: typeof u === "function" ? u(x[d.id]) : u }))} />
        ))}
      </div>
        <div className="flex items-center justify-end gap-2">
          {dirty && <span className="mr-auto text-xs text-muted-foreground">Changes not applied yet</span>}
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-full text-muted-foreground"
            disabled={!activeCount(draft) && !activeCount(s.values)}
            onClick={() => {
              setDraft({})
              s.setValues({})
            }}
          >
            Reset
          </Button>
          <Button type="submit" className="h-9 rounded-full px-5" disabled={!dirty}>
            Apply
          </Button>
        </div>
      </form>
    </Frame>
  )
}

/* ── B · Facet bar — every filter as a compact button ── */
function FacetPattern() {
  const s = usePatternState()
  return (
    <Frame s={s}>
      <div className="flex flex-wrap items-center gap-2">
        {s.period}
        {DEFS.map((d) => (
          <FilterFacet key={d.id} def={d} value={s.values[d.id]} onChange={(v) => s.set(d.id, v)} removable={false} />
        ))}
        <Clear s={s} />
      </div>
    </Frame>
  )
}

/* ── C · Pinned + on demand — key filters pinned, the rest behind "+ Filter" ── */
function PinnedPattern() {
  const s = usePatternState()
  const pinned = DEFS.filter((d) => d.pinned)
  const rest = DEFS.filter((d) => !d.pinned)
  return (
    <Frame s={s}>
      <div className="flex flex-wrap items-center gap-2">
        {s.period}
        {pinned.map((d) => (
          <FilterFacet key={d.id} def={d} value={s.values[d.id]} onChange={(v) => s.set(d.id, v)} removable={false} slot />
        ))}
        {rest
          .filter((d) => isActive(s.values[d.id]))
          .map((d) => (
            <FilterFacet key={d.id} def={d} value={s.values[d.id]} onChange={(v) => s.set(d.id, v)} />
          ))}
        <AddFilterMenu defs={rest.filter((d) => !isActive(s.values[d.id]))} values={s.values} onChange={s.set} />
        <Clear s={s} />
      </div>
    </Frame>
  )
}

/* ── D · Filters button + side sheet — full form on demand, chips show state ── */
function SheetPattern() {
  const s = usePatternState()
  const n = activeCount(s.values)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<TypedValues>({})
  const dirty = normValues(draft) !== normValues(s.values)
  return (
    <Frame s={s}>
      <div className="flex flex-wrap items-center gap-2">
        {s.period}
        <Sheet
          open={open}
          onOpenChange={(o) => {
            setOpen(o)
            if (o) setDraft(s.values) // start from what's applied; closing discards
          }}
        >
          <SheetTrigger asChild>
            <Button variant="outline" className="h-9 gap-1.5 rounded-full">
              <HugeiconsIcon icon={FilterHorizontalIcon} className="size-4" />
              Filters
              {n > 0 && <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">{n}</span>}
            </Button>
          </SheetTrigger>
          <SheetContent className="gap-0">
            <form
              className="flex h-full flex-col"
              onSubmit={(e) => {
                e.preventDefault()
                s.setValues(draft)
                setOpen(false)
              }}
            >
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Nothing changes until you apply.</SheetDescription>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
                {DEFS.map((d) => (
                  <InlineFilterField key={d.id} def={d} value={draft[d.id]} onChange={(u) => setDraft((x) => ({ ...x, [d.id]: typeof u === "function" ? u(x[d.id]) : u }))} />
                ))}
              </div>
              <SheetFooter className="flex-row items-center justify-between border-t border-border">
                <Button type="button" variant="ghost" className="rounded-full" onClick={() => setDraft({})} disabled={!activeCount(draft)}>
                  Clear all
                </Button>
                {/* Preview the outcome before committing to it. */}
                <Button type="submit" className="rounded-full px-5" disabled={!dirty}>
                  Show {s.countFor(draft)} results
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
        {DEFS.filter((d) => isActive(s.values[d.id])).map((d) => (
          <FilterFacet key={d.id} def={d} value={s.values[d.id]} onChange={(v) => s.set(d.id, v)} />
        ))}
        <Clear s={s} />
      </div>
    </Frame>
  )
}

/* ── E · On demand only — nothing until you add it ── */
function OnDemandPattern() {
  const s = usePatternState()
  return (
    <Frame s={s}>
      <div className="flex flex-wrap items-center gap-2">
        {s.period}
        {DEFS.filter((d) => isActive(s.values[d.id])).map((d) => (
          <FilterFacet key={d.id} def={d} value={s.values[d.id]} onChange={(v) => s.set(d.id, v)} />
        ))}
        <AddFilterMenu defs={DEFS.filter((d) => !isActive(s.values[d.id]))} values={s.values} onChange={s.set} />
        <Clear s={s} />
      </div>
    </Frame>
  )
}

/* ── Page ── */

const PATTERNS = [
  {
    key: "A",
    title: "Filter panel",
    tag: "All visible",
    best: "Search-first pages where filtering is the main task, with up to ~6 filters.",
    cost: "Always takes a block of height; grows with every filter added.",
    Pattern: PanelPattern,
  },
  {
    key: "B",
    title: "Facet bar",
    tag: "All visible, compact",
    best: "3–5 filters that are all used often.",
    cost: "Wraps to a second, uneven line past ~5 filters.",
    Pattern: FacetPattern,
  },
  {
    key: "C",
    title: "Pinned + Filter",
    tag: "Key filters visible",
    best: "Most dashboards: 2–3 everyday filters plus an open-ended list of custom ones.",
    cost: "Someone has to choose what's pinned (a per-filter setting).",
    Pattern: PinnedPattern,
    recommended: true,
  },
  {
    key: "D",
    title: "Filters button + sheet",
    tag: "Form on demand",
    best: "Many filters, filled in together; and small screens.",
    cost: "Hides which filters exist until opened — chips are needed to show what's set.",
    Pattern: SheetPattern,
  },
  {
    key: "E",
    title: "Add as needed",
    tag: "Cleanest",
    best: "Occasional filtering, power users, very long filter lists.",
    cost: "Nothing is discoverable — every filter costs two clicks.",
    Pattern: OnDemandPattern,
  },
]

type Pattern = (typeof PATTERNS)[number]
const SHORTLIST = ["C", "E"]

function PatternSection({ p }: { p: Pattern }) {
  const { key, title, tag, best, cost, Pattern: Live } = p
  const recommended = "recommended" in p && p.recommended
  return (
    <section id={`pattern-${key}`} className="scroll-mt-20 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
            recommended ? "bg-primary text-primary-foreground" : "bg-muted",
          )}
        >
          {key}
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground">— {tag}</span>
        {recommended && <Badge className="ml-1">Recommended</Badge>}
      </div>
      <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <p>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">Best for </span>
          <span className="text-muted-foreground">{best}</span>
        </p>
        <p>
          <span className="font-medium text-amber-600 dark:text-amber-400">Trade-off </span>
          <span className="text-muted-foreground">{cost}</span>
        </p>
      </div>
      <Live />
    </section>
  )
}

export function FilterPatternsPage() {
  return (
    <div className="mx-auto max-w-screen-xl space-y-8 p-4 sm:p-6">
      <header className="space-y-3">
        <div>
          <h1 className="text-xl font-bold">Filter Patterns</h1>
          <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">
            Five ways to lay out dashboard filters, from explicit to clean. All use the same filters, editors and chip style, and are live against
            the same sample of {ROWS.length} requests — try them.
          </p>
        </div>

        {/* Spectrum */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="shrink-0">Explicit</span>
          <div className="relative flex flex-1 items-center justify-between">
            <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
            {PATTERNS.map((p) => (
              <a
                key={p.key}
                href={`#pattern-${p.key}`}
                onClick={() => {
                  // A, B, D live in the collapsed section — open it so the jump lands.
                  if (!SHORTLIST.includes(p.key)) (document.getElementById("other-options") as HTMLDetailsElement | null)?.setAttribute("open", "")
                }}
                className={cn(
                  "relative flex size-7 items-center justify-center rounded-full text-xs font-semibold ring-4 ring-background transition-colors",
                  p.recommended
                    ? "bg-primary text-primary-foreground"
                    : SHORTLIST.includes(p.key)
                      ? "bg-foreground/15 text-foreground hover:bg-foreground/20"
                      : "bg-muted text-muted-foreground/60 hover:bg-foreground/10",
                )}
              >
                {p.key}
              </a>
            ))}
          </div>
          <span className="shrink-0">Clean</span>
        </div>

        {/* Kinds legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span>Filter kinds in this sample:</span>
          {DEFS.map((d) => (
            <span key={d.id} className="inline-flex items-center gap-1">
              <HugeiconsIcon icon={KIND_ICON[d.kind]} className="size-3.5" />
              {d.label} <span className="opacity-60">· {KIND_LABEL[d.kind]}</span>
            </span>
          ))}
        </div>
      </header>

      {/* The shortlist */}
      <div className="rounded-3xl bg-muted/50 p-4 text-sm sm:p-5">
        <p className="font-semibold">Shortlist: C vs E</p>
        <p className="mt-1 max-w-4xl text-muted-foreground">
          They are the same component. <b className="font-medium text-foreground">E is C with nothing pinned.</b> So the real decision is per
          dashboard: which filters, if any, deserve a permanent slot? Pin the 1–3 that most people use on most visits; leave the bar empty
          (E) when there is no clear favourite. Pinned slots have a fixed width, so setting one never moves the rest of the bar.
        </p>
      </div>

      {PATTERNS.filter((p) => SHORTLIST.includes(p.key)).map((p) => (
        <PatternSection key={p.key} p={p} />
      ))}

      <details id="other-options" className="group rounded-3xl border border-border/70 p-4 sm:p-5">
        <summary className="cursor-pointer list-none text-sm font-medium text-muted-foreground select-none hover:text-foreground">
          <span className="mr-1.5 inline-block transition-transform group-open:rotate-90">›</span>
          Other options considered — A, B, D
        </summary>
        <div className="mt-5 space-y-8">
          {PATTERNS.filter((p) => !SHORTLIST.includes(p.key)).map((p) => (
            <PatternSection key={p.key} p={p} />
          ))}
        </div>
      </details>
    </div>
  )
}

/** Mock dashboard top: the filter layout + a live result line. */
function Frame({ s, children }: { s: PatternState; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-4xl bg-card p-4 shadow-md ring-1 ring-foreground/5 sm:p-5 dark:ring-foreground/10">
      {children}
      <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <b className="text-sm text-foreground tabular-nums">{s.matched}</b> of {ROWS.length} requests match
        {activeCount(s.values) > 0 && ` · ${activeCount(s.values)} filter${activeCount(s.values) === 1 ? "" : "s"} applied`}
      </p>
    </div>
  )
}
