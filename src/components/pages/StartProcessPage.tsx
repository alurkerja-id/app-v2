import { useCallback, useRef, useState, useEffect } from "react"
import { useTheme } from "@/components/theme-provider"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import { useDropzone } from "react-dropzone"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon, Calendar01Icon } from "@hugeicons/core-free-icons"
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import type { DateRange } from "react-day-picker"

/* ────────────────────────────────────────────────────────────────────────
   Form-component showcase for the AlurKerja form-builder revamp.
   Every input is shown twice: LEFT = active/interactive, RIGHT = disabled
   (displays a value, no interaction). Fully light/dark theme aware.
   This is a visual spec for the programmer — no data wiring.
──────────────────────────────────────────────────────────────────────── */

const SELECT_OPTIONS = [
  { value: "service", label: "Service Agreement" },
  { value: "nda", label: "Non-Disclosure Agreement" },
  { value: "employment", label: "Employment Contract" },
  { value: "lease", label: "Lease Agreement" },
]

const COMPANIES = [
  "Acme Corporation", "Globex International", "Initech Solutions",
  "Umbrella Ventures", "Stark Industries", "Wayne Enterprises",
]


/* Live regional data (mock.alurkerja.com) for the remote-select + cascade demos.
   states (province) → cities → districts, each → { data: [{ code, name }] } */
const REGION_API = "https://mock.alurkerja.com/api"
type Region = { code: string; name: string }

async function fetchRegions(path: string): Promise<Region[]> {
  const res = await fetch(`${REGION_API}${path}`)
  if (!res.ok) throw new Error(String(res.status))
  const json = await res.json()
  return (json.data ?? []).map((r: { code: string; name: string }) => ({ code: r.code, name: r.name }))
}

function useRegions(path: string | null) {
  const [data, setData] = useState<Region[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!path) { setData([]); return }
    let alive = true
    setLoading(true)
    setError(false)
    fetchRegions(path)
      .then((d) => alive && setData(d))
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [path])
  return { data, loading, error }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const YEARS = Array.from({ length: 60 }, (_, i) => 2035 - i)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

// Luma-style trigger (matches Input/NativeSelect: rounded-3xl pill, bg-input/50).
const dateTriggerClass =
  "flex h-9 items-center justify-between gap-2 rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-left text-sm transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"

/* ── Layout primitives ───────────────────────────────────────────────── */

function ShowField({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: (disabled: boolean) => React.ReactNode
}) {
  return (
    <div className="border-b border-border/60 py-5 last:border-0">
      <p className="mb-2.5 text-sm font-medium text-foreground">
        {title}
        {hint && <span className="ml-1.5 font-normal text-muted-foreground">— {hint}</span>}
      </p>
      <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
        <div className="min-w-0">{children(false)}</div>
        <div className="min-w-0">{children(true)}</div>
      </div>
    </div>
  )
}

function Section({ id, title, visible = true, children }: { id: string; title: string; visible?: boolean; children: React.ReactNode }) {
  if (!visible) return null
  return (
    <section className="mb-8">
      <h2 id={id} className="mb-1 scroll-mt-20 text-base font-semibold text-foreground">{title}</h2>
      <Card className="px-4 py-1 sm:px-6">{children}</Card>
    </section>
  )
}

/* a faded read-only box that just shows a value (for composite widgets) */
function ReadOnlyBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-9 items-center rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm text-muted-foreground opacity-70",
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ── Stateful demo widgets ───────────────────────────────────────────── */

function SwitchDemo({ disabled }: { disabled: boolean }) {
  const [on, setOn] = useState(true)
  return (
    <div className="flex items-center gap-2">
      <Switch checked={on} onCheckedChange={setOn} disabled={disabled} id={`sw-${disabled}`} />
      <Label htmlFor={`sw-${disabled}`} className={cn(disabled && "text-muted-foreground")}>
        Email notifications
      </Label>
    </div>
  )
}

function ToggleGroupDemo({ disabled }: { disabled: boolean }) {
  return (
    <ToggleGroup type="single" defaultValue="medium" disabled={disabled} variant="outline">
      <ToggleGroupItem value="low">Low</ToggleGroupItem>
      <ToggleGroupItem value="medium">Medium</ToggleGroupItem>
      <ToggleGroupItem value="high">High</ToggleGroupItem>
    </ToggleGroup>
  )
}

function CheckboxGroupDemo({ disabled }: { disabled: boolean }) {
  const items = [
    { id: "terms", label: "Accept terms", def: true },
    { id: "marketing", label: "Marketing emails", def: false },
    { id: "newsletter", label: "Weekly newsletter", def: true },
  ]
  return (
    <div className="flex flex-col gap-2">
      {items.map((it) => (
        <Label key={it.id} className={cn("flex items-center gap-2 font-normal", disabled && "text-muted-foreground")}>
          <Checkbox defaultChecked={it.def} disabled={disabled} /> {it.label}
        </Label>
      ))}
    </div>
  )
}

function SliderDemo({ disabled }: { disabled: boolean }) {
  const [v, setV] = useState([60])
  return (
    <div className="pt-2">
      <Slider value={v} onValueChange={setV} max={100} step={1} disabled={disabled} />
      <p className="mt-1.5 text-xs text-muted-foreground">{v[0]}%</p>
    </div>
  )
}

function ComboboxDemo({ disabled }: { disabled: boolean }) {
  if (disabled) return <ReadOnlyBox>Acme Corporation</ReadOnlyBox>
  return (
    <Combobox>
      <ComboboxInput placeholder="Search company…" showTrigger showClear className="w-full" />
      <ComboboxContent>
        <ComboboxList>
          {COMPANIES.map((c) => (
            <ComboboxItem key={c} value={c}>{c}</ComboboxItem>
          ))}
        </ComboboxList>
        <ComboboxEmpty>No companies found</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  )
}

// Email with leading icon + live client-side validation (error state).
function EmailValidatedDemo({ disabled }: { disabled: boolean }) {
  const [v, setV] = useState("anita@javan.co.id")
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const showError = v.length > 0 && !valid
  return (
    <div>
      <div className="relative">
        <HugeiconsIcon icon={Mail01Icon} className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="email"
          value={v}
          onChange={(e) => setV(e.target.value)}
          disabled={disabled}
          aria-invalid={showError}
          placeholder="name@company.com"
          className={cn("pl-9", showError && "border-destructive focus-visible:ring-destructive/30")}
        />
      </div>
      {showError && <p className="mt-1 text-xs text-destructive">Enter a valid email address</p>}
    </div>
  )
}

// Single remote select — fetches provinces live from the mock API.
function RemoteSelectDemo({ disabled }: { disabled: boolean }) {
  const { data, loading, error } = useRegions(disabled ? null : "/states")
  if (disabled) return <ReadOnlyBox>DKI JAKARTA</ReadOnlyBox>
  return (
    <div>
      <NativeSelect className="w-full" disabled={loading} defaultValue="">
        <NativeSelectOption value="" disabled>{loading ? "Loading provinces…" : "Select province"}</NativeSelectOption>
        {data.map((r) => <NativeSelectOption key={r.code} value={r.code}>{r.name}</NativeSelectOption>)}
      </NativeSelect>
      {error && <p className="mt-1 text-xs text-destructive">Failed to load — check connection.</p>}
    </div>
  )
}

// Remote select that loads nothing until the user types — debounced query.
function SearchRemoteDemo({ disabled }: { disabled: boolean }) {
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Region[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const q = value.trim().toLowerCase()
    if (!q) { setResults([]); setLoading(false); return }
    let alive = true
    setLoading(true)
    const t = setTimeout(() => {
      fetchRegions("/states")
        .then((d) => alive && setResults(d.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 8)))
        .catch(() => alive && setResults([]))
        .finally(() => alive && setLoading(false))
    }, 300)
    return () => { alive = false; clearTimeout(t) }
  }, [value])

  if (disabled) return <ReadOnlyBox>SUMATERA UTARA</ReadOnlyBox>
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => { setValue(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Type to search province…"
      />
      {open && value.trim() && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
          {loading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No results</p>
          ) : (
            <div className="max-h-48 overflow-auto py-1">
              {results.map((r) => (
                <button
                  key={r.code}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setValue(r.name); setOpen(false) }}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Cascade — province → city → district, each fetched on parent change.
// Dropdowns are left-aligned (flex), not justified to equal columns.
function CascadeDemo({ disabled }: { disabled: boolean }) {
  const [prov, setProv] = useState("")
  const [city, setCity] = useState("")
  const [dist, setDist] = useState("")
  const provinces = useRegions(disabled ? null : "/states")
  const cities = useRegions(!disabled && prov ? `/states/${prov}/cities` : null)
  const districts = useRegions(!disabled && city ? `/cities/${city}/districts` : null)

  if (disabled) {
    return (
      <div className="flex flex-wrap items-start gap-2">
        <ReadOnlyBox className="w-40 truncate">DKI JAKARTA</ReadOnlyBox>
        <ReadOnlyBox className="w-40 truncate">JAKARTA SELATAN</ReadOnlyBox>
        <ReadOnlyBox className="w-40 truncate">KEBAYORAN BARU</ReadOnlyBox>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-start gap-2">
      <NativeSelect className="w-40" value={prov} disabled={provinces.loading}
        onChange={(e) => { setProv(e.target.value); setCity(""); setDist("") }}>
        <NativeSelectOption value="">{provinces.loading ? "Loading…" : "Province"}</NativeSelectOption>
        {provinces.data.map((r) => <NativeSelectOption key={r.code} value={r.code}>{r.name}</NativeSelectOption>)}
      </NativeSelect>
      <NativeSelect className="w-40" value={city} disabled={!prov || cities.loading}
        onChange={(e) => { setCity(e.target.value); setDist("") }}>
        <NativeSelectOption value="">{cities.loading ? "Loading…" : !prov ? "City" : "City"}</NativeSelectOption>
        {cities.data.map((r) => <NativeSelectOption key={r.code} value={r.code}>{r.name}</NativeSelectOption>)}
      </NativeSelect>
      <NativeSelect className="w-40" value={dist} disabled={!city || districts.loading}
        onChange={(e) => setDist(e.target.value)}>
        <NativeSelectOption value="">{districts.loading ? "Loading…" : !city ? "District" : "District"}</NativeSelectOption>
        {districts.data.map((r) => <NativeSelectOption key={r.code} value={r.code}>{r.name}</NativeSelectOption>)}
      </NativeSelect>
    </div>
  )
}

function TagsDemo({ disabled }: { disabled: boolean }) {
  const [tags, setTags] = useState(["urgent", "finance"])
  const [draft, setDraft] = useState("")
  const add = () => { const t = draft.trim(); if (t && !tags.includes(t)) setTags([...tags, t]); setDraft("") }
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5", disabled && "bg-muted/40")}>
      {tags.map((t) => (
        <Badge key={t} variant="secondary" className="gap-1">
          {t}
          {!disabled && <button onClick={() => setTags(tags.filter((x) => x !== t))} className="text-muted-foreground hover:text-foreground">×</button>}
        </Badge>
      ))}
      {!disabled && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add() } }}
          placeholder="Add tag…"
          className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      )}
    </div>
  )
}

function RatingDemo({ disabled }: { disabled: boolean }) {
  const [val, setVal] = useState(4)
  return (
    <div className="flex items-center gap-1 pt-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          disabled={disabled}
          onClick={() => setVal(n)}
          className={cn("text-2xl leading-none", disabled && "cursor-default", n <= val ? "text-amber-400" : "text-muted-foreground/40")}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function DatePickerDemo({ disabled, withTime = false }: { disabled: boolean; withTime?: boolean }) {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 2, 18))
  const label = date ? format(date, withTime ? "dd MMM yyyy, HH:mm" : "dd MMM yyyy") : "Pick a date"
  if (disabled) return <ReadOnlyBox>{label}</ReadOnlyBox>
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(dateTriggerClass, "w-full")}>
          <span className="truncate">{label}</span>
          <HugeiconsIcon icon={Calendar01Icon} className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} />
        {withTime && (
          <div className="border-t border-border p-2">
            <Input type="time" defaultValue="09:30" className="w-full" />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Predefined ranges — same set as the app-react-v2 business-process filter.
const RANGE_PRESETS: { label: string; range: () => DateRange }[] = [
  { label: "Last 30 days", range: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: "Last 3 months", range: () => ({ from: subDays(new Date(), 89), to: new Date() }) },
  { label: "Last 6 months", range: () => ({ from: subDays(new Date(), 179), to: new Date() }) },
  { label: "Last 12 months", range: () => ({ from: subDays(new Date(), 364), to: new Date() }) },
  { label: "This week", range: () => ({ from: startOfWeek(new Date()), to: new Date() }) },
  { label: "This month", range: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "This year", range: () => ({ from: startOfYear(new Date()), to: new Date() }) },
]

function DateRangeDemo({ disabled }: { disabled: boolean }) {
  const [range, setRange] = useState<DateRange | undefined>({ from: new Date(2026, 2, 1), to: new Date(2026, 2, 15) })
  const label = range?.from
    ? range.to ? `${format(range.from, "dd MMM")} – ${format(range.to, "dd MMM yyyy")}` : format(range.from, "dd MMM yyyy")
    : "Pick a range"
  if (disabled) return <ReadOnlyBox>{label}</ReadOnlyBox>
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(dateTriggerClass, "w-full")}>
          <span className="truncate">{label}</span>
          <HugeiconsIcon icon={Calendar01Icon} className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex max-sm:flex-col">
          <div className="flex shrink-0 flex-col gap-0.5 border-r border-border p-2 max-sm:border-b max-sm:border-r-0">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setRange(p.range())}
                className="rounded-md px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {p.label}
              </button>
            ))}
          </div>
          <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MonthPickerDemo({ disabled }: { disabled: boolean }) {
  const [m, setM] = useState(2)
  const [open, setOpen] = useState(false)
  if (disabled) return <ReadOnlyBox className="w-44">{MONTHS[m]}</ReadOnlyBox>
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(dateTriggerClass, "w-44")}>
          <span className="truncate">{MONTHS[m]}</span>
          <HugeiconsIcon icon={Calendar01Icon} className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((name, i) => (
            <button
              key={name}
              onClick={() => { setM(i); setOpen(false) }}
              className={cn("rounded-md px-2 py-1.5 text-sm", i === m ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              {name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function YearPickerDemo({ disabled }: { disabled: boolean }) {
  const [year, setYear] = useState(2026)
  const [open, setOpen] = useState(false)
  const [pageStart, setPageStart] = useState(2026 - (2026 % 12)) // align to 12-year groups
  if (disabled) return <ReadOnlyBox className="w-44">{year}</ReadOnlyBox>
  const years = Array.from({ length: 12 }, (_, i) => pageStart + i)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(dateTriggerClass, "w-44")}>
          <span className="truncate">{year}</span>
          <HugeiconsIcon icon={Calendar01Icon} className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="mb-1.5 flex items-center justify-between">
          <button onClick={() => setPageStart(pageStart - 12)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Previous years">‹</button>
          <span className="text-sm font-medium">{pageStart}–{pageStart + 11}</span>
          <button onClick={() => setPageStart(pageStart + 12)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Next years">›</button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => { setYear(y); setOpen(false) }}
              className={cn("rounded-md px-2 py-1.5 text-sm", y === year ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              {y}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function DmyDemo({ disabled }: { disabled: boolean }) {
  return (
    <div className="flex gap-1.5">
      <NativeSelect defaultValue="17" disabled={disabled} className="w-16">
        {DAYS.map((d) => <NativeSelectOption key={d} value={String(d)}>{d}</NativeSelectOption>)}
      </NativeSelect>
      <NativeSelect defaultValue="2" disabled={disabled} className="w-20">
        {MONTHS.map((m, i) => <NativeSelectOption key={m} value={String(i)}>{m}</NativeSelectOption>)}
      </NativeSelect>
      <NativeSelect defaultValue="1990" disabled={disabled} className="w-20">
        {YEARS.map((y) => <NativeSelectOption key={y} value={String(y)}>{y}</NativeSelectOption>)}
      </NativeSelect>
    </div>
  )
}

function OtpDemo({ disabled }: { disabled: boolean }) {
  return (
    <InputOTP maxLength={6} defaultValue="1284" disabled={disabled}>
      <InputOTPGroup>
        <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}

function MaskedDemo({ disabled }: { disabled: boolean }) {
  const [val, setVal] = useState("09.254.294.3-407.000")
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 15)
    let out = d
    if (d.length > 2) out = `${d.slice(0, 2)}.${d.slice(2)}`
    if (d.length > 5) out = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
    if (d.length > 8) out = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}.${d.slice(8)}`
    if (d.length > 9) out = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}.${d.slice(8, 9)}-${d.slice(9)}`
    if (d.length > 12) out = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}.${d.slice(8, 9)}-${d.slice(9, 12)}.${d.slice(12)}`
    setVal(out)
  }
  return <Input value={val} onChange={onChange} disabled={disabled} placeholder="00.000.000.0-000.000" inputMode="numeric" />
}

// Rupiah currency — auto-formats digits with thousand separators as you type.
function CurrencyDemo({ disabled }: { disabled: boolean }) {
  const [raw, setRaw] = useState("1250000")
  const display = raw ? Number(raw).toLocaleString("id-ID") : ""
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
      <Input
        value={display}
        onChange={(e) => setRaw(e.target.value.replace(/\D/g, ""))}
        disabled={disabled}
        inputMode="numeric"
        placeholder="0"
        className="pl-9 tabular-nums"
      />
    </div>
  )
}

const DIAL_CODES = [
  { value: "+62", flag: "🇮🇩", name: "Indonesia" },
  { value: "+65", flag: "🇸🇬", name: "Singapore" },
  { value: "+60", flag: "🇲🇾", name: "Malaysia" },
  { value: "+1", flag: "🇺🇸", name: "United States" },
  { value: "+44", flag: "🇬🇧", name: "United Kingdom" },
]

function PhoneDemo({ disabled }: { disabled: boolean }) {
  const [code, setCode] = useState("+62")
  const sel = DIAL_CODES.find((c) => c.value === code) ?? DIAL_CODES[0]
  return (
    <div className="flex">
      <Select value={code} onValueChange={setCode} disabled={disabled}>
        <SelectTrigger className="w-24 shrink-0 gap-1 rounded-r-none border-r-0 focus:z-10">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-base leading-none">{sel.flag}</span>
            {sel.value}
          </span>
        </SelectTrigger>
        <SelectContent>
          {DIAL_CODES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              <span className="mr-2">{c.flag}</span>
              {c.name}
              <span className="ml-1.5 text-muted-foreground">{c.value}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input type="tel" defaultValue="812 3456 7890" disabled={disabled} className="rounded-l-none" />
    </div>
  )
}

function AddonDemo({ disabled, suffix }: { disabled: boolean; suffix: string }) {
  return (
    <div className="relative">
      <Input defaultValue="75" disabled={disabled} inputMode="numeric" className="pr-9" />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>
    </div>
  )
}

function SignatureDemo({ disabled }: { disabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const draw = (e: React.PointerEvent, down: boolean) => {
    if (disabled) return
    const c = canvasRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    const ctx = c.getContext("2d")!
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    if (down) { drawing.current = true; ctx.beginPath(); ctx.moveTo(x, y) }
    else if (drawing.current) { ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#6366f1"; ctx.lineTo(x, y); ctx.stroke() }
  }
  const clear = () => { const c = canvasRef.current; c?.getContext("2d")?.clearRect(0, 0, c.width, c.height) }
  return (
    <div>
      <canvas
        ref={canvasRef}
        width={320}
        height={96}
        onPointerDown={(e) => draw(e, true)}
        onPointerMove={(e) => draw(e, false)}
        onPointerUp={() => (drawing.current = false)}
        className={cn(
          "h-24 w-full rounded-md border border-input bg-card",
          disabled ? "bg-muted/40 opacity-70" : "cursor-crosshair touch-none",
        )}
      />
      {disabled ? (
        <p className="mt-1 text-xs italic text-muted-foreground">Signed — Budi Santoso</p>
      ) : (
        <Button variant="ghost" size="sm" className="mt-1 h-7 px-2 text-xs" onClick={clear}>Clear</Button>
      )}
    </div>
  )
}

function RichTextDemo({ disabled }: { disabled: boolean }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false })],
    content: "<p>This <strong>contract</strong> is governed by the laws of the Republic of Indonesia.</p>",
    editable: !disabled,
    editorProps: {
      attributes: {
        class: "min-h-[100px] px-3 py-2 text-sm outline-none prose prose-sm dark:prose-invert max-w-none",
      },
    },
  })
  useEffect(() => { editor?.setEditable(!disabled) }, [editor, disabled])
  // Mirrors app-react-v2 discussion composer (EditorToolbar.tsx) formats.
  const promptLink = (e: Editor) => {
    const prev = e.getAttributes("link").href as string | undefined
    const url = window.prompt("Link URL", prev ?? "https://")
    if (url === null) return
    if (url === "") { e.chain().focus().unsetLink().run(); return }
    e.chain().focus().setLink({ href: url }).run()
  }
  const Div = () => <span className="mx-0.5 h-5 w-px bg-border" />
  return (
    <div className={cn("overflow-hidden rounded-md border border-input", disabled && "bg-muted/40")}>
      {!disabled && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 px-1.5 py-1">
          <ToolbarBtn ed={editor} cmd={(e) => e.chain().focus().toggleBold().run()} active={editor?.isActive("bold")}><span className="font-bold">B</span></ToolbarBtn>
          <ToolbarBtn ed={editor} cmd={(e) => e.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")}><span className="italic">I</span></ToolbarBtn>
          <ToolbarBtn ed={editor} cmd={(e) => e.chain().focus().toggleUnderline().run()} active={editor?.isActive("underline")}><span className="underline">U</span></ToolbarBtn>
          <ToolbarBtn ed={editor} cmd={(e) => e.chain().focus().toggleStrike().run()} active={editor?.isActive("strike")}><span className="line-through">S</span></ToolbarBtn>
          <ToolbarBtn ed={editor} cmd={(e) => e.chain().focus().toggleCode().run()} active={editor?.isActive("code")}><span className="font-mono text-xs">{"</>"}</span></ToolbarBtn>
          <Div />
          <ToolbarBtn ed={editor} cmd={(e) => e.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive("heading", { level: 1 })}><span className="text-xs font-semibold">H1</span></ToolbarBtn>
          <ToolbarBtn ed={editor} cmd={(e) => e.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })}><span className="text-xs font-semibold">H2</span></ToolbarBtn>
          <ToolbarBtn ed={editor} cmd={(e) => e.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive("heading", { level: 3 })}><span className="text-xs font-semibold">H3</span></ToolbarBtn>
          <Div />
          <ToolbarBtn ed={editor} cmd={(e) => e.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")}>•</ToolbarBtn>
          <ToolbarBtn ed={editor} cmd={(e) => e.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")}><span className="text-xs">1.</span></ToolbarBtn>
          <ToolbarBtn ed={editor} cmd={(e) => e.chain().focus().liftListItem("listItem").run()}><span className="text-xs">⇤</span></ToolbarBtn>
          <ToolbarBtn ed={editor} cmd={(e) => e.chain().focus().sinkListItem("listItem").run()}><span className="text-xs">⇥</span></ToolbarBtn>
          <Div />
          <ToolbarBtn ed={editor} cmd={promptLink} active={editor?.isActive("link")}><span className="text-xs">🔗</span></ToolbarBtn>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
function ToolbarBtn({ ed, cmd, active, children }: { ed: Editor | null; cmd: (e: Editor) => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={() => ed && cmd(ed)}
      className={cn("flex size-7 items-center justify-center rounded text-sm hover:bg-muted", active && "bg-muted text-foreground")}
    >
      {children}
    </button>
  )
}

function FileUploadDemo({ disabled }: { disabled: boolean }) {
  const [files, setFiles] = useState<string[]>(disabled ? ["contract-draft.pdf"] : [])
  const onDrop = useCallback((accepted: File[]) => setFiles((p) => [...p, ...accepted.map((f) => f.name)]), [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, disabled })
  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center rounded-md border border-dashed border-input px-4 py-5 text-center text-sm",
          disabled ? "cursor-not-allowed bg-muted/40 text-muted-foreground" : "cursor-pointer hover:border-primary/50 hover:bg-muted/40",
          isDragActive && "border-primary bg-primary/5",
        )}
      >
        <input {...getInputProps()} />
        <p className="text-muted-foreground">{disabled ? "Upload disabled" : isDragActive ? "Drop files here…" : "Drag files or click to upload"}</p>
      </div>
      {files.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border border-border bg-card px-2 py-1 text-xs">
              <span className="truncate">📄 {f}</span>
              {!disabled && <button onClick={() => setFiles(files.filter((_, x) => x !== i))} className="text-muted-foreground hover:text-foreground">×</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Search bar that queries the live province API (debounced) — icon + clear.
function SearchDemo({ disabled }: { disabled: boolean }) {
  const [v, setV] = useState(disabled ? "Jawa Barat" : "")
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Region[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const q = v.trim().toLowerCase()
    if (disabled || !q) { setResults([]); setLoading(false); return }
    let alive = true
    setLoading(true)
    const t = setTimeout(() => {
      fetchRegions("/states")
        .then((d) => alive && setResults(d.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 8)))
        .catch(() => alive && setResults([]))
        .finally(() => alive && setLoading(false))
    }, 300)
    return () => { alive = false; clearTimeout(t) }
  }, [v, disabled])

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">🔍</span>
      <Input
        value={v}
        onChange={(e) => { setV(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={disabled}
        placeholder="Search province…"
        className="px-9"
      />
      {v && !disabled && (
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setV(""); setResults([]) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">×</button>
      )}
      {open && v.trim() && !disabled && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
          {loading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No results</p>
          ) : (
            <div className="max-h-48 overflow-auto py-1">
              {results.map((r) => (
                <button key={r.code} onMouseDown={(e) => e.preventDefault()} onClick={() => { setV(r.name); setOpen(false) }} className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted">
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StepperDemo({ disabled }: { disabled: boolean }) {
  const [n, setN] = useState(3)
  return (
    <div className="flex w-fit items-center">
      <Button type="button" variant="outline" size="icon" disabled={disabled} onClick={() => setN((x) => Math.max(0, x - 1))} className="rounded-l-md rounded-r-none">−</Button>
      <Input value={n} onChange={(e) => setN(Number(e.target.value.replace(/\D/g, "")) || 0)} disabled={disabled} inputMode="numeric" className="w-14 rounded-none border-x-0 text-center tabular-nums" />
      <Button type="button" variant="outline" size="icon" disabled={disabled} onClick={() => setN((x) => x + 1)} className="rounded-r-md rounded-l-none">+</Button>
    </div>
  )
}

function AvatarUploadDemo({ disabled }: { disabled: boolean }) {
  const [url, setUrl] = useState<string | null>(disabled ? "preset" : null)
  const onDrop = useCallback((files: File[]) => { const f = files[0]; if (f) setUrl(URL.createObjectURL(f)) }, [])
  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { "image/*": [] }, multiple: false, disabled })
  return (
    <div className="flex items-center gap-3">
      <div
        {...getRootProps()}
        className={cn(
          "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-input bg-muted/40 text-xs text-muted-foreground",
          disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:border-primary/50",
        )}
      >
        <input {...getInputProps()} />
        {url === "preset" ? <span className="text-2xl">🧑</span> : url ? <img src={url} alt="" className="size-full object-cover" /> : <span>Photo</span>}
      </div>
      <p className="text-xs text-muted-foreground">{disabled ? "Locked" : "Click or drop image · max 2 MB"}</p>
    </div>
  )
}

// Image upload with a basic editor: rotate, flip, zoom, crop frame.
function ImageEditorDemo({ disabled }: { disabled: boolean }) {
  const [src, setSrc] = useState<string | null>(disabled ? "preset" : null)
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [flip, setFlip] = useState(false)
  const reset = () => { setRotation(0); setZoom(1); setFlip(false) }
  const onDrop = useCallback((files: File[]) => { const f = files[0]; if (f) { setSrc(URL.createObjectURL(f)); setRotation(0); setZoom(1); setFlip(false) } }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] }, multiple: false, disabled })

  if (!src) {
    return (
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center rounded-md border border-dashed border-input px-4 py-6 text-center text-sm",
          disabled ? "cursor-not-allowed bg-muted/40 text-muted-foreground" : "cursor-pointer hover:border-primary/50 hover:bg-muted/40",
          isDragActive && "border-primary bg-primary/5",
        )}
      >
        <input {...getInputProps()} />
        <p className="text-muted-foreground">{isDragActive ? "Drop image…" : "Upload an image to edit"}</p>
      </div>
    )
  }

  const transform = `rotate(${rotation}deg) scale(${zoom}) scaleX(${flip ? -1 : 1})`
  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-md border border-input bg-muted/30">
        {src === "preset" ? (
          <div style={{ transform }} className="size-28 rounded bg-gradient-to-br from-blue-400 to-indigo-600 transition-transform" />
        ) : (
          <img src={src} alt="" style={{ transform }} className="max-h-full max-w-full transition-transform" />
        )}
        <div className="pointer-events-none absolute inset-6 rounded border-2 border-dashed border-foreground/40" />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setRotation((r) => r - 90)}>↺ Rotate</Button>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setRotation((r) => r + 90)}>↻ Rotate</Button>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setFlip((f) => !f)}>⇋ Flip</Button>
        <Button type="button" variant="outline" size="sm" disabled={disabled}>⛶ Crop</Button>
        <span className="ml-1 text-xs text-muted-foreground">Zoom</span>
        <div className="w-24"><Slider value={[zoom]} min={0.5} max={2} step={0.1} disabled={disabled} onValueChange={(v) => setZoom(v[0])} /></div>
        {!disabled && <Button type="button" variant="ghost" size="sm" onClick={reset}>Reset</Button>}
      </div>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────────── */

export function StartProcessPage() {
  const { theme, setTheme } = useTheme()
  const [filter, setFilter] = useState("all")
  const FILTERS = [
    { id: "all", label: "All", count: 40 },
    { id: "text", label: "Basic", count: 13 },
    { id: "choice", label: "Choice & Selection", count: 12 },
    { id: "date", label: "Date & Time", count: 6 },
    { id: "advanced", label: "Advanced", count: 9 },
  ]
  const show = (id: string) => filter === "all" || filter === id

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-lg font-semibold text-foreground">Form Components</h1>
            <p className="text-xs text-muted-foreground">
              Left column = <span className="font-medium text-foreground">Active</span> ·
              Right column = <span className="font-medium text-foreground">Disabled</span> (value shown, no interaction)
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "☀ Light" : "🌙 Dark"}
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* component filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                filter === f.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {f.label}
              <span className={cn(
                "rounded-full px-1.5 text-[10px] font-medium tabular-nums",
                filter === f.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
              )}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Text & basic ── */}
        <Section id="text" title="Basic" visible={show("text")}>
          <ShowField title="Text" hint="single-line">{(d) => <Input defaultValue="Service Agreement #2024-118" disabled={d} placeholder="Enter text" />}</ShowField>
          <ShowField title="Search" hint="icon + clear · live province API">{(d) => <SearchDemo disabled={d} />}</ShowField>
          <ShowField title="Number stepper" hint="quantity ±">{(d) => <StepperDemo disabled={d} />}</ShowField>
          <ShowField title="Number">{(d) => <Input type="number" defaultValue={42} disabled={d} />}</ShowField>
          <ShowField title="Email" hint="icon + client-side validation">{(d) => <EmailValidatedDemo disabled={d} />}</ShowField>
          <ShowField title="Password">{(d) => <Input type="password" defaultValue="secret123" disabled={d} />}</ShowField>
          <ShowField title="URL" hint="https:// prefix">{(d) => (
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">https://</span>
              <Input type="text" defaultValue="alurkerja.com" disabled={d} className="pl-[4.25rem]" />
            </div>
          )}</ShowField>
          <ShowField title="Time">{(d) => <Input type="time" defaultValue="09:30" disabled={d} />}</ShowField>
          <ShowField title="Textarea" hint="multi-line">{(d) => <Textarea defaultValue="Internal notes about this contract…" rows={3} disabled={d} />}</ShowField>
          <ShowField title="Input + add-on" hint="suffix unit">{(d) => <AddonDemo disabled={d} suffix="kg" />}</ShowField>
          <ShowField title="Currency (Rupiah)" hint="auto thousand separators">{(d) => <CurrencyDemo disabled={d} />}</ShowField>
          <ShowField title="Masked — NPWP" hint="formatted identity">{(d) => <MaskedDemo disabled={d} />}</ShowField>
          <ShowField title="Phone" hint="country code + number">{(d) => <PhoneDemo disabled={d} />}</ShowField>
        </Section>

        {/* ── Choice & selection ── */}
        <Section id="choice" title="Choice & Selection" visible={show("choice")}>
          <ShowField title="Switch">{(d) => <SwitchDemo disabled={d} />}</ShowField>
          <ShowField title="Toggle group" hint="segmented">{(d) => <ToggleGroupDemo disabled={d} />}</ShowField>
          <ShowField title="Checkbox group">{(d) => <CheckboxGroupDemo disabled={d} />}</ShowField>
          <ShowField title="Single checkbox" hint="consent">{(d) => (
            <Label className={cn("flex items-center gap-2 font-normal", d && "text-muted-foreground")}>
              <Checkbox defaultChecked disabled={d} /> I agree to the Terms &amp; Privacy Policy
            </Label>
          )}</ShowField>
          <ShowField title="Radio group">{(d) => (
            <RadioGroup defaultValue="medium" disabled={d} className="flex gap-4">
              {["low", "medium", "high"].map((v) => (
                <Label key={v} className={cn("flex items-center gap-1.5 font-normal capitalize", d && "text-muted-foreground")}>
                  <RadioGroupItem value={v} /> {v}
                </Label>
              ))}
            </RadioGroup>
          )}</ShowField>
          <ShowField title="Select" hint="single">{(d) => (
            <Select defaultValue="service" disabled={d}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{SELECT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          )}</ShowField>
          <ShowField title="Native select">{(d) => (
            <NativeSelect defaultValue="employment" disabled={d}>
              {SELECT_OPTIONS.map((o) => <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>)}
            </NativeSelect>
          )}</ShowField>
          <ShowField title="Combobox" hint="autocomplete / large datasets">{(d) => <ComboboxDemo disabled={d} />}</ShowField>
          <ShowField title="Cascading select" hint="province → city → district · live mock.alurkerja.com">{(d) => <CascadeDemo disabled={d} />}</ShowField>
          <ShowField title="Tags / chips">{(d) => <TagsDemo disabled={d} />}</ShowField>
          <ShowField title="Remote select — populated" hint="options loaded upfront (live provinces)">{(d) => <RemoteSelectDemo disabled={d} />}</ShowField>
          <ShowField title="Remote select — search to load" hint="type first to query the API">{(d) => <SearchRemoteDemo disabled={d} />}</ShowField>
        </Section>

        {/* ── Date & time ── */}
        <Section id="date" title="Date & Time" visible={show("date")}>
          <ShowField title="Date">{(d) => <DatePickerDemo disabled={d} />}</ShowField>
          <ShowField title="Date + time">{(d) => <DatePickerDemo disabled={d} withTime />}</ShowField>
          <ShowField title="Date range" hint="reuse BP filter picker">{(d) => <DateRangeDemo disabled={d} />}</ShowField>
          <ShowField title="Month picker" hint="month name only">{(d) => <MonthPickerDemo disabled={d} />}</ShowField>
          <ShowField title="Year picker">{(d) => <YearPickerDemo disabled={d} />}</ShowField>
          <ShowField title="Date — D / M / Y dropdowns" hint="birthdate entry">{(d) => <DmyDemo disabled={d} />}</ShowField>
        </Section>

        {/* ── Advanced ── */}
        <Section id="advanced" title="Advanced" visible={show("advanced")}>
          <ShowField title="Input OTP" hint="verification / 2FA">{(d) => <OtpDemo disabled={d} />}</ShowField>
          <ShowField title="Rich text" hint="Tiptap — same formats as discussion composer">{(d) => <RichTextDemo disabled={d} />}</ShowField>
          <ShowField title="File upload" hint="react-dropzone">{(d) => <FileUploadDemo disabled={d} />}</ShowField>
          <ShowField title="Avatar / photo upload" hint="circular, single image">{(d) => <AvatarUploadDemo disabled={d} />}</ShowField>
          <ShowField title="Image editor" hint="upload · rotate / flip / zoom / crop">{(d) => <ImageEditorDemo disabled={d} />}</ShowField>
          <ShowField title="Signature pad">{(d) => <SignatureDemo disabled={d} />}</ShowField>
          <ShowField title="Slider">{(d) => <SliderDemo disabled={d} />}</ShowField>
          <ShowField title="Rating">{(d) => <RatingDemo disabled={d} />}</ShowField>
          <ShowField title="Color picker" hint="branding">{(d) => (
            <div className="flex items-center gap-2">
              <input type="color" defaultValue="#6366f1" disabled={d} className={cn("size-9 rounded-md border border-input bg-card p-0.5", d && "opacity-60")} />
              <span className="text-sm text-muted-foreground">#6366F1</span>
            </div>
          )}</ShowField>
        </Section>

        <Separator className="my-4" />
        <p className="pb-8 text-center text-xs text-muted-foreground">
          AlurKerja form-builder · input components · visual spec for shadcn revamp
        </p>
      </div>
    </div>
  )
}
