import { useId, useState } from "react"
import { format, subDays } from "date-fns"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Analytics01Icon,
  ArrowDownRight01Icon,
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  Maximize01Icon,
  MoreHorizontalIcon,
  Table01Icon,
  TimeHalfPassIcon,
  Timer01Icon,
  XlsIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeltaBadge } from "@/components/dashboard/kpi-card"
import { trayClass as tray, trayPanelClass as panel } from "@/components/dashboard/tray"
import { axisTick, gridStroke, legendStyle, SERIES, tooltipStyle } from "@/components/dashboard/chart-theme"
import { noise } from "@/lib/mock-series"

/* ────────────────────────────────────────────────────────────────────────
   Card visual options for the analytics dashboards. Every option renders the
   same four KPIs and the same two charts from Process Analytics, so only the
   card treatment changes. Previews only — the download icons do nothing here.
──────────────────────────────────────────────────────────────────────── */

/* ── Sample data ── */

const PROCESS = [
  { name: "Onboarding", short: "Onboard", v: 31 },
  { name: "Expense", short: "Expense", v: 73 },
  { name: "IT Ticket", short: "IT", v: 94 },
  { name: "Leave", short: "Leave", v: 82 },
  { name: "Procurement", short: "Procure", v: 34 },
  { name: "Travel", short: "Travel", v: 23 },
  { name: "Hiring", short: "Hiring", v: 10 },
  { name: "Training", short: "Training", v: 43 },
]
const PROCESS_TOTAL = PROCESS.reduce((s, p) => s + p.v, 0)
const TOP_PROCESS = PROCESS.reduce((a, b) => (b.v > a.v ? b : a))

const TODAY = new Date()
type Field = "submitted" | "completed" | "active" | "cycle"
const DAILY = (() => {
  let active = 70
  return Array.from({ length: 30 }, (_, i) => {
    const submitted = 10 + Math.round(noise("cp-s", i) * 6)
    const completed = 8 + Math.round(noise("cp-c", i) * 5)
    active += submitted - completed
    return {
      label: format(subDays(TODAY, 29 - i), "d MMM"),
      submitted,
      completed,
      active,
      cycle: Math.round((2.2 + noise("cp-t", i) * 0.6) * 10) / 10,
    }
  })
})()

type Tone = "indigo" | "amber" | "emerald" | "sky"
const TONE: Record<Tone, { hex: string; chip: string; soft: string; ring: string; grad: string; rail: string }> = {
  indigo: {
    hex: "#6366f1",
    chip: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
    soft: "from-indigo-500/10",
    ring: "ring-indigo-500/15",
    grad: "from-indigo-400 to-indigo-600",
    rail: "bg-indigo-500",
  },
  amber: {
    hex: "#f59e0b",
    chip: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    soft: "from-amber-500/10",
    ring: "ring-amber-500/15",
    grad: "from-amber-400 to-amber-600",
    rail: "bg-amber-500",
  },
  emerald: {
    hex: "#10b981",
    chip: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    soft: "from-emerald-500/10",
    ring: "ring-emerald-500/15",
    grad: "from-emerald-400 to-emerald-600",
    rail: "bg-emerald-500",
  },
  sky: {
    hex: "#0ea5e9",
    chip: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
    soft: "from-sky-500/10",
    ring: "ring-sky-500/15",
    grad: "from-sky-400 to-sky-600",
    rail: "bg-sky-500",
  },
}

interface Kpi {
  key: string
  label: string
  value: string
  sub?: string
  delta?: number
  goodDown?: boolean
  icon: typeof Analytics01Icon
  tone: Tone
  field: Field
}
const KPIS: Kpi[] = [
  { key: "total", label: "Total Instances", value: "390", delta: 3, icon: Analytics01Icon, tone: "indigo", field: "submitted" },
  { key: "active", label: "Active Instances", value: "98", sub: "25% of total", icon: TimeHalfPassIcon, tone: "amber", field: "active" },
  { key: "completed", label: "Completed", value: "292", delta: 2, icon: CheckmarkCircle02Icon, tone: "emerald", field: "completed" },
  {
    key: "cycle",
    label: "Avg. Cycle Time",
    value: "2.5d",
    sub: "per completed instance",
    delta: -4,
    goodDown: true,
    icon: Timer01Icon,
    tone: "sky",
    field: "cycle",
  },
]
const series = (f: Field) => DAILY.map((d) => d[f])

/* ── Shared bits ── */

const KpiGrid = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>{children}</div>
)
const ChartGrid = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-2", className)}>{children}</div>
)

function Xls({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="Download .xlsx"
      title="Download .xlsx"
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <HugeiconsIcon icon={XlsIcon} className="size-[18px]" />
    </button>
  )
}

/** The download tucked into a ⋯ menu with the other card actions. */
function MoreMenu({ className }: { className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Card actions"
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            className,
          )}
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem>
          <HugeiconsIcon icon={XlsIcon} /> Download .xlsx
        </DropdownMenuItem>
        <DropdownMenuItem>
          <HugeiconsIcon icon={Table01Icon} /> View as table
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <HugeiconsIcon icon={Maximize01Icon} /> Expand
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const isGood = (k: Kpi) => (k.delta == null ? null : k.goodDown ? k.delta < 0 : k.delta > 0)

/** Delta as a small filled pill: ↗ 3%. */
function DeltaPill({ k, className, onDark }: { k: Kpi; className?: string; onDark?: boolean }) {
  if (k.delta == null) return null
  const good = isGood(k)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        onDark
          ? good
            ? "bg-emerald-400/15 text-emerald-300 dark:bg-emerald-600/15 dark:text-emerald-700"
            : "bg-red-400/15 text-red-300"
          : good
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-red-500/10 text-red-700 dark:text-red-400",
        className,
      )}
    >
      <HugeiconsIcon icon={k.delta > 0 ? ArrowUpRight01Icon : ArrowDownRight01Icon} className="size-3" />
      {Math.abs(k.delta)}%
    </span>
  )
}

/**
 * Sub text on the left, delta on the right — the current KPI footer. `tight`
 * shows only one of them (the delta wins), for tiles too narrow for both.
 */
function Foot({ k, className, tight }: { k: Kpi; className?: string; tight?: boolean }) {
  if (tight)
    return (
      <div className={cn("flex min-h-4 items-center", className)}>
        {k.delta != null ? <DeltaBadge delta={k.delta} goodDown={k.goodDown} /> : <span className="truncate text-[11px] text-muted-foreground">{k.sub}</span>}
      </div>
    )
  return (
    <div className={cn("flex min-h-4 items-center justify-between gap-2", className)}>
      {k.sub ? <span className="truncate text-[11px] text-muted-foreground">{k.sub}</span> : <span />}
      {k.delta != null && <DeltaBadge delta={k.delta} goodDown={k.goodDown} />}
    </div>
  )
}

/* ── Charts ── */

const margin = { top: 8, right: 8, left: -18, bottom: 0 }

function BarsChart({
  height = 200,
  classic = false,
  highlightMax = false,
  gradient = false,
  radius = 6,
}: {
  height?: number | `${number}%`
  /** The current look: full grid, axis lines, 4px corners. */
  classic?: boolean
  /** Only the leader in colour — the chart states its point. */
  highlightMax?: boolean
  gradient?: boolean
  radius?: number
}) {
  const id = useSvgId()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={PROCESS} margin={margin}>
        {gradient && (
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES[0]} stopOpacity={1} />
              <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0.45} />
            </linearGradient>
          </defs>
        )}
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={classic} />
        <XAxis dataKey="short" tick={axisTick} interval={0} tickLine={classic} axisLine={classic} />
        <YAxis tick={axisTick} allowDecimals={false} tickLine={classic} axisLine={classic} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="v" name="Instances" radius={classic ? [4, 4, 0, 0] : [radius, radius, 0, 0]} isAnimationActive={false}>
          {PROCESS.map((p) => (
            <Cell
              key={p.name}
              fill={gradient ? `url(#${id})` : SERIES[0]}
              fillOpacity={highlightMax && p.name !== TOP_PROCESS.name ? 0.22 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function FlowChart({
  height = 200,
  classic = false,
  area = false,
  legend = classic,
  focus,
}: {
  height?: number | `${number}%`
  classic?: boolean
  area?: boolean
  legend?: boolean
  /** Draw this series strong and the other one quiet. */
  focus?: "submitted" | "completed"
}) {
  const id = useSvgId()
  if (classic)
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={DAILY} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="label" tick={axisTick} minTickGap={16} />
          <YAxis tick={axisTick} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          {legend && <Legend wrapperStyle={legendStyle} />}
          <Line type="monotone" dataKey="completed" name="Completed" stroke={SERIES[1]} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="submitted" name="Submitted" stroke={SERIES[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    )
  const op = (s: "submitted" | "completed") => (focus && focus !== s ? 0.35 : 1)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={DAILY} margin={margin}>
        <defs>
          {[0, 1].map((i) => (
            <linearGradient key={i} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES[i]} stopOpacity={0.22} />
              <stop offset="100%" stopColor={SERIES[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="label" tick={axisTick} minTickGap={24} tickLine={false} axisLine={false} />
        <YAxis tick={axisTick} allowDecimals={false} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        {legend && <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={7} />}
        <Area
          type="monotone"
          dataKey="submitted"
          name="Submitted"
          stroke={SERIES[0]}
          strokeOpacity={op("submitted")}
          strokeWidth={2}
          fill={area ? `url(#${id}-0)` : "transparent"}
          fillOpacity={op("submitted")}
          dot={false}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="completed"
          name="Completed"
          stroke={SERIES[1]}
          strokeOpacity={op("completed")}
          strokeWidth={2}
          fill={area ? `url(#${id}-1)` : "transparent"}
          fillOpacity={op("completed")}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** One metric over the 30 days, filled. */
function MetricArea({ k, height = 240 }: { k: Kpi; height?: number }) {
  const id = useSvgId()
  const color = TONE[k.tone].hex
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={DAILY} margin={margin}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="label" tick={axisTick} minTickGap={24} tickLine={false} axisLine={false} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey={k.field} name={k.label} stroke={color} strokeWidth={2} fill={`url(#${id})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function Spark({ data, color, area = true, className }: { data: number[]; color: string; area?: boolean; className?: string }) {
  const id = useSvgId()
  const rows = data.map((v, i) => ({ i, v }))
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={area ? `url(#${id})` : "transparent"} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/** useId() output contains colons, which break `url(#…)` references. */
function useSvgId() {
  return "g" + useId().replace(/[^a-zA-Z0-9]/g, "")
}

const BAR_TITLE = "Instances by Process"
const FLOW_TITLE = "Daily Submitted vs Completed"

/* ════════════════════════════ The options ════════════════════════════ */

/* A — the cards before the tray (kept here as the baseline). */
function LegacyChart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="gap-3">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <Xls className="-mt-1 -mr-2" />
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )
}

function PreviewA() {
  return (
    <div className="space-y-4">
      <KpiGrid>
        {KPIS.map((k) => (
          <Card key={k.key} className="py-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", TONE[k.tone].chip)}>
                  <HugeiconsIcon icon={k.icon} className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs">{k.label}</span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{k.value}</p>
              <Foot k={k} className="mt-1" />
            </CardContent>
          </Card>
        ))}
      </KpiGrid>
      <ChartGrid>
        <LegacyChart title={BAR_TITLE}>
          <BarsChart classic height={220} />
        </LegacyChart>
        <LegacyChart title={FLOW_TITLE}>
          <FlowChart classic height={220} />
        </LegacyChart>
      </ChartGrid>
    </div>
  )
}

/* B — Hairline: flat, 1px border, smaller radius, no shadow. */
const cardB = "rounded-2xl border border-border bg-card"
function ChartB({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cardB}>
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <Xls className="-mr-1.5" />
      </div>
      <div className="px-2 pt-1 pb-3">{children}</div>
    </div>
  )
}

function PreviewB() {
  return (
    <div className="space-y-3">
      <KpiGrid>
        {KPIS.map((k) => (
          <div key={k.key} className={cn(cardB, "p-4")}>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HugeiconsIcon icon={k.icon} className="size-3.5" />
              {k.label}
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{k.value}</p>
            <Foot k={k} className="mt-1" />
          </div>
        ))}
      </KpiGrid>
      <ChartGrid className="gap-3">
        <ChartB title={BAR_TITLE}>
          <BarsChart />
        </ChartB>
        <ChartB title={FLOW_TITLE}>
          <FlowChart legend />
        </ChartB>
      </ChartGrid>
    </div>
  )
}

/* C — Tray: a tinted tray holds the label; the content sits on a white panel inside it.
   Adopted — the dashboards' KpiCard / DashboardCard use these same classes. */
function ChartC({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={tray}>
      <div className="flex items-center justify-between gap-2 py-1 pr-1 pl-3">
        <h3 className="text-[13px] font-medium text-muted-foreground">{title}</h3>
        <Xls />
      </div>
      <div className={cn(panel, "p-3 pl-1")}>{children}</div>
    </div>
  )
}

function PreviewC() {
  return (
    <div className="space-y-3">
      <KpiGrid>
        {KPIS.map((k) => (
          <div key={k.key} className={tray}>
            <div className="flex items-center gap-1.5 px-3 pt-1.5 pb-2 text-xs text-muted-foreground">
              <HugeiconsIcon icon={k.icon} className="size-3.5" />
              {k.label}
            </div>
            <div className={cn(panel, "px-4 py-3")}>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">{k.value}</p>
              <Foot k={k} className="mt-1" />
            </div>
          </div>
        ))}
      </KpiGrid>
      <ChartGrid className="gap-3">
        <ChartC title={BAR_TITLE}>
          <BarsChart />
        </ChartC>
        <ChartC title={FLOW_TITLE}>
          <FlowChart legend />
        </ChartC>
      </ChartGrid>
    </div>
  )
}

/* D — Header bar: every card gets a tinted title bar with its controls. */
const cardD = "overflow-hidden rounded-2xl border border-border bg-card"
const barD = "flex items-center gap-1.5 border-b border-border bg-muted/50 dark:bg-muted/30"
function ChartD({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cardD}>
      <div className={cn(barD, "h-11 pr-2 pl-4")}>
        <h3 className="flex-1 text-[13px] font-semibold">{title}</h3>
        <div className="mr-1 hidden rounded-full bg-background p-0.5 text-[11px] ring-1 ring-border sm:flex">
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium">Day</span>
          <span className="px-2 py-0.5 text-muted-foreground">Week</span>
        </div>
        <Xls />
        <MoreMenu />
      </div>
      <div className="p-3 pl-1">{children}</div>
    </div>
  )
}

function PreviewD() {
  return (
    <div className="space-y-3">
      <KpiGrid>
        {KPIS.map((k) => (
          <div key={k.key} className={cardD}>
            <div className={cn(barD, "h-9 px-3 text-xs font-medium text-muted-foreground")}>
              <HugeiconsIcon icon={k.icon} className="size-3.5" />
              {k.label}
            </div>
            <div className="px-3.5 py-3">
              <p className="text-2xl font-semibold tracking-tight tabular-nums">{k.value}</p>
              <Foot k={k} className="mt-1" />
            </div>
          </div>
        ))}
      </KpiGrid>
      <ChartGrid className="gap-3">
        <ChartD title={BAR_TITLE}>
          <BarsChart />
        </ChartD>
        <ChartD title={FLOW_TITLE}>
          <FlowChart legend />
        </ChartD>
      </ChartGrid>
    </div>
  )
}

/* E — Inline sparkline: each number shows its own 30-day shape. */
const cardE = "rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10"
function ChartE({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className={cardE}>
      <div className="flex items-start justify-between gap-2 px-5 pt-4">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
        <Xls className="-mr-2" />
      </div>
      <div className="px-2 pt-2 pb-4">{children}</div>
    </div>
  )
}

function PreviewE() {
  return (
    <div className="space-y-4">
      <KpiGrid>
        {KPIS.map((k) => (
          <div key={k.key} className={cn(cardE, "p-4")}>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate">{k.label}</span>
              <DeltaPill k={k} />
            </div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="text-2xl font-semibold tracking-tight tabular-nums">{k.value}</p>
              <Spark data={series(k.field)} color={TONE[k.tone].hex} area={false} className="h-9 w-20 shrink-0 sm:w-24" />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{k.sub ?? "vs previous 30 days"}</p>
          </div>
        ))}
      </KpiGrid>
      <ChartGrid>
        <ChartE title={BAR_TITLE} sub="Instances started in the period">
          <BarsChart />
        </ChartE>
        <ChartE title={FLOW_TITLE} sub="New vs finished, per day">
          <FlowChart legend />
        </ChartE>
      </ChartGrid>
    </div>
  )
}

/* F — Report sheet: one card, cells split by hairlines (no gaps, no shadows between). */
function PreviewF() {
  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <div
            key={k.key}
            className={cn("border-border/70 px-5 py-4", i % 2 === 1 && "border-l", i >= 2 && "border-t lg:border-t-0", i >= 1 && "lg:border-l")}
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", TONE[k.tone].rail)} />
              {k.label}
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{k.value}</p>
            <Foot k={k} className="mt-1" />
          </div>
        ))}
      </div>
      <div className="grid border-t border-border/70 lg:grid-cols-2">
        {[
          { title: BAR_TITLE, chart: <BarsChart /> },
          { title: FLOW_TITLE, chart: <FlowChart legend /> },
        ].map((c, i) => (
          <div key={c.title} className={cn("border-border/70", i === 1 && "border-t lg:border-t-0 lg:border-l")}>
            <div className="flex items-center justify-between px-5 pt-4">
              <h3 className="text-sm font-semibold">{c.title}</h3>
              <Xls className="-mr-2" />
            </div>
            <div className="px-2 pt-1 pb-4">{c.chart}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* G — Hero: the headline metric inverted (like the home Task Summary bar), the rest quiet. */
const cardG = "rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10"
function ChartG({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cardG}>
      <div className="flex items-center justify-between px-5 pt-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Xls className="-mr-2" />
      </div>
      <div className="px-2 pt-1 pb-4">{children}</div>
    </div>
  )
}

function PreviewG() {
  const [hero, ...rest] = KPIS
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="relative col-span-2 overflow-hidden rounded-3xl bg-zinc-900 p-5 text-white dark:bg-zinc-100 dark:text-zinc-900">
          <div className="relative z-10 pb-10">
            <div className="flex items-center gap-2 text-xs opacity-70">
              <HugeiconsIcon icon={hero.icon} className="size-4" />
              {hero.label}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <p className="text-4xl font-semibold tracking-tight tabular-nums">{hero.value}</p>
              <DeltaPill k={hero} onDark />
            </div>
            <p className="mt-1 text-xs opacity-60">vs previous 30 days</p>
          </div>
          <Spark data={series(hero.field)} color="#818cf8" className="absolute inset-x-0 bottom-0 h-12 opacity-70" />
        </div>
        {rest.map((k) => (
          <div key={k.key} className={cn(cardG, "p-4")}>
            <span className={cn("flex size-7 items-center justify-center rounded-lg", TONE[k.tone].chip)}>
              <HugeiconsIcon icon={k.icon} className="size-4" />
            </span>
            <p className="mt-3 text-xs text-muted-foreground">{k.label}</p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{k.value}</p>
            <Foot k={k} tight className="mt-0.5" />
          </div>
        ))}
      </div>
      <ChartGrid>
        <ChartG title={BAR_TITLE}>
          <BarsChart />
        </ChartG>
        <ChartG title={FLOW_TITLE}>
          <FlowChart legend area />
        </ChartG>
      </ChartGrid>
    </div>
  )
}

/* H — Tinted: each KPI washed in its colour (Process Discovery's summary cells), legends in the header. */
function ChartH({ title, legend, children }: { title: string; legend: { label: string; color: string }[]; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-gradient-to-b from-indigo-500/5 to-card to-40% ring-1 ring-border/70 ring-inset">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pt-3.5">
        <h3 className="mr-auto text-sm font-semibold">{title}</h3>
        {legend.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
        <Xls className="-mr-1.5" />
      </div>
      <div className="px-2 pt-2 pb-3">{children}</div>
    </div>
  )
}

function PreviewH() {
  return (
    <div className="space-y-3">
      <KpiGrid>
        {KPIS.map((k) => {
          const t = TONE[k.tone]
          return (
            <div key={k.key} className={cn("rounded-2xl bg-gradient-to-br to-card px-4 py-3.5 ring-1 ring-inset", t.soft, t.ring)}>
              <div className="flex items-start gap-3">
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", t.grad)}>
                  <HugeiconsIcon icon={k.icon} className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{k.label}</p>
                  <p className="text-2xl leading-tight font-bold tabular-nums">{k.value}</p>
                  <Foot k={k} tight className="mt-0.5" />
                </div>
              </div>
            </div>
          )
        })}
      </KpiGrid>
      <ChartGrid className="gap-3">
        <ChartH title={BAR_TITLE} legend={[{ label: "Instances", color: SERIES[0] }]}>
          <BarsChart />
        </ChartH>
        <ChartH
          title={FLOW_TITLE}
          legend={[
            { label: "Submitted", color: SERIES[0] },
            { label: "Completed", color: SERIES[1] },
          ]}
        >
          <FlowChart />
        </ChartH>
      </ChartGrid>
    </div>
  )
}

/* I — Open: no boxes at all; headings, hairlines and whitespace do the grouping. */
function PreviewI() {
  return (
    <div className="space-y-8 rounded-3xl bg-background p-5">
      <div className="grid grid-cols-2 gap-y-5 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <div key={k.key} className={cn("border-border px-4", i % 2 === 1 && "border-l", i >= 1 && "lg:border-l", i === 0 && "pl-0", i === 2 && "pl-0 lg:pl-4")}>
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{k.value}</p>
            <Foot k={k} className="mt-1" />
          </div>
        ))}
      </div>
      <ChartGrid className="gap-8">
        {[
          { title: BAR_TITLE, chart: <BarsChart /> },
          { title: FLOW_TITLE, chart: <FlowChart legend /> },
        ].map((c) => (
          <section key={c.title}>
            <div className="flex items-baseline justify-between border-b border-border pb-2">
              <h3 className="text-sm font-semibold">{c.title}</h3>
              <button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <HugeiconsIcon icon={XlsIcon} className="size-3.5" /> Export
              </button>
            </div>
            <div className="-ml-2 pt-3">{c.chart}</div>
          </section>
        ))}
      </ChartGrid>
    </div>
  )
}

/* J — Glass: translucent cards that let the page pattern / colour through. */
const cardJ = "rounded-3xl bg-white/55 shadow-[0_8px_30px_rgb(0_0_0/0.06)] ring-1 ring-white/80 backdrop-blur-xl dark:bg-white/[0.04] dark:ring-white/10"
function ChartJ({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cardJ}>
      <div className="flex items-center justify-between px-5 pt-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Xls className="-mr-2 hover:bg-white/60 dark:hover:bg-white/10" />
      </div>
      <div className="px-2 pt-1 pb-4">{children}</div>
    </div>
  )
}

function PreviewJ() {
  return (
    <div className="relative isolate overflow-hidden rounded-[28px] bg-slate-100/60 p-4 dark:bg-zinc-900/60">
      <div className="absolute -top-20 -left-16 -z-10 size-80 rounded-full bg-indigo-400/30 blur-3xl" />
      <div className="absolute top-40 right-0 -z-10 size-72 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="absolute -bottom-24 left-1/3 -z-10 size-72 rounded-full bg-sky-300/25 blur-3xl" />
      <div className="space-y-4">
        <KpiGrid>
          {KPIS.map((k) => (
            <div key={k.key} className={cn(cardJ, "p-4")}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("flex size-6 items-center justify-center rounded-lg", TONE[k.tone].chip)}>
                  <HugeiconsIcon icon={k.icon} className="size-3.5" />
                </span>
                {k.label}
              </div>
              <p className="mt-2.5 text-2xl font-semibold tracking-tight tabular-nums">{k.value}</p>
              <Foot k={k} className="mt-1" />
            </div>
          ))}
        </KpiGrid>
        <ChartGrid>
          <ChartJ title={BAR_TITLE}>
            <BarsChart gradient />
          </ChartJ>
          <ChartJ title={FLOW_TITLE}>
            <FlowChart legend area />
          </ChartJ>
        </ChartGrid>
      </div>
    </div>
  )
}

/* K — Insight-first: big type, no icons, and each chart leads with what it says. */
const cardK = "rounded-2xl bg-card ring-1 ring-foreground/5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:ring-foreground/10"
function ChartK({ eyebrow, headline, sub, children }: { eyebrow: string; headline: string; sub: string; children: React.ReactNode }) {
  return (
    <div className={cn(cardK, "p-5")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{eyebrow}</p>
          <h3 className="mt-1 text-lg leading-snug font-semibold">{headline}</h3>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
        <Xls className="-mt-1 -mr-2" />
      </div>
      <div className="-ml-3 pt-3">{children}</div>
    </div>
  )
}

function PreviewK() {
  const backlog = DAILY[DAILY.length - 1].active - DAILY[0].active
  return (
    <div className="space-y-3">
      <KpiGrid>
        {KPIS.map((k) => (
          <div key={k.key} className={cn(cardK, "p-5")}>
            <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{k.label}</p>
            <p className="mt-2 text-4xl font-semibold tracking-tighter tabular-nums">{k.value}</p>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {k.delta != null ? (
                <>
                  <DeltaPill k={k} />
                  vs prev 30 days
                </>
              ) : (
                k.sub
              )}
            </div>
          </div>
        ))}
      </KpiGrid>
      <ChartGrid className="gap-3">
        <ChartK
          eyebrow={BAR_TITLE}
          headline={`${TOP_PROCESS.name} leads with ${TOP_PROCESS.v}`}
          sub={`${Math.round((TOP_PROCESS.v / PROCESS_TOTAL) * 100)}% of all ${PROCESS_TOTAL} instances`}
        >
          <BarsChart highlightMax />
        </ChartK>
        <ChartK eyebrow={FLOW_TITLE} headline={`Backlog grew by ${backlog}`} sub="More submitted than completed on most days">
          <FlowChart area focus="submitted" legend />
        </ChartK>
      </ChartGrid>
    </div>
  )
}

/* L — Accent rail: a thin colour rail ties each card to its series. */
const cardL = "relative overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10"
function ChartL({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cardL}>
      <span className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-gradient-to-r from-indigo-500 to-emerald-500" />
      <div className="flex items-center justify-between px-5 pt-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Xls className="-mr-2" />
      </div>
      <div className="px-2 pt-1 pb-4">{children}</div>
    </div>
  )
}

function PreviewL() {
  return (
    <div className="space-y-3">
      <KpiGrid>
        {KPIS.map((k) => (
          <div key={k.key} className={cn(cardL, "py-4 pr-4 pl-5")}>
            <span className={cn("absolute inset-y-4 left-0 w-[3px] rounded-r-full", TONE[k.tone].rail)} />
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{k.value}</p>
            <Foot k={k} className="mt-1" />
          </div>
        ))}
      </KpiGrid>
      <ChartGrid className="gap-3">
        <ChartL title={BAR_TITLE}>
          <BarsChart />
        </ChartL>
        <ChartL title={FLOW_TITLE}>
          <FlowChart legend />
        </ChartL>
      </ChartGrid>
    </div>
  )
}

/* M — Compact: dense ops style, tiny caps headers (the Process Discovery heatmap header). */
const cardM = "rounded-xl border border-border bg-card"
function ChartM({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cardM}>
      <div className="flex h-9 items-center justify-between border-b border-border pr-1.5 pl-3">
        <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{title}</h3>
        <Xls className="size-6" />
      </div>
      <div className="p-2 pl-0">{children}</div>
    </div>
  )
}

function PreviewM() {
  return (
    <div className="space-y-2">
      <KpiGrid className="gap-2">
        {KPIS.map((k) => (
          <div key={k.key} className={cn(cardM, "px-3 py-2.5")}>
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{k.label}</p>
              {k.delta != null && <DeltaBadge delta={k.delta} goodDown={k.goodDown} />}
            </div>
            <p className="mt-0.5 text-xl font-semibold tabular-nums">
              {k.value}
              {k.sub && <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">{k.sub}</span>}
            </p>
          </div>
        ))}
      </KpiGrid>
      <ChartGrid className="gap-2">
        <ChartM title={BAR_TITLE}>
          <BarsChart height={160} radius={3} />
        </ChartM>
        <ChartM title={FLOW_TITLE}>
          <FlowChart height={160} />
        </ChartM>
      </ChartGrid>
    </div>
  )
}

/* N — KPIs as tabs: the numbers are the chart's switcher (Stripe / Google Analytics). */
const cardN = "overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10"

function PreviewN() {
  const [sel, setSel] = useState(KPIS[0].key)
  const k = KPIS.find((x) => x.key === sel) ?? KPIS[0]
  return (
    <div className="space-y-4">
      <div className={cardN}>
        <div role="tablist" className="grid grid-cols-2 lg:grid-cols-4">
          {KPIS.map((x, i) => {
            const on = x.key === sel
            return (
              <button
                key={x.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setSel(x.key)}
                className={cn(
                  "relative border-border/70 px-5 py-4 text-left transition-colors",
                  i % 2 === 1 && "border-l",
                  i >= 2 && "border-t lg:border-t-0",
                  i >= 1 && "lg:border-l",
                  on ? "bg-cardN" : "border-b bg-muted/50 hover:bg-muted/80 dark:bg-muted/25",
                )}
              >
                {on && <span className={cn("absolute inset-x-0 top-0 h-[3px]", TONE[x.tone].rail)} />}
                <p className={cn("text-xs", on ? "font-medium text-foreground" : "text-muted-foreground")}>{x.label}</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{x.value}</p>
                <Foot k={x} className="mt-1" />
              </button>
            )
          })}
        </div>
        <div className="p-4 pt-3">
          <div className="flex items-center justify-between pb-2 pl-1">
            <p className="text-sm font-semibold">
              {k.label} <span className="font-normal text-muted-foreground">· per day</span>
            </p>
            <Xls />
          </div>
          <div className="-ml-2">
            <MetricArea k={k} height={220} />
          </div>
        </div>
      </div>
      <div className={cardN}>
        <div className="flex items-center justify-between px-5 pt-4">
          <h3 className="text-sm font-semibold">{BAR_TITLE}</h3>
          <Xls className="-mr-2" />
        </div>
        <div className="px-2 pt-1 pb-4">
          <BarsChart />
        </div>
      </div>
    </div>
  )
}

/* O — Full-bleed trend: the 30-day area fills the bottom of every KPI tile. */
const cardO = "relative overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10"
function ChartO({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cardO}>
      <div className="flex items-center justify-between px-5 pt-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <MoreMenu className="-mr-2" />
      </div>
      <div className="px-2 pt-1 pb-4">{children}</div>
    </div>
  )
}

function PreviewO() {
  return (
    <div className="space-y-4">
      <KpiGrid>
        {KPIS.map((k) => (
          <div key={k.key} className={cn(cardO, "h-36")}>
            <div className="relative z-10 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs text-muted-foreground">{k.label}</p>
                <DeltaPill k={k} />
              </div>
              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{k.value}</p>
              {k.sub && <p className="text-[11px] text-muted-foreground">{k.sub}</p>}
            </div>
            <Spark data={series(k.field)} color={TONE[k.tone].hex} className="absolute inset-x-0 bottom-0 h-14" />
          </div>
        ))}
      </KpiGrid>
      <ChartGrid>
        <ChartO title={BAR_TITLE}>
          <BarsChart gradient radius={8} />
        </ChartO>
        <ChartO title={FLOW_TITLE}>
          <FlowChart legend area />
        </ChartO>
      </ChartGrid>
    </div>
  )
}

/* P — Bento: one hero chart, KPIs packed beside it, one accent tile. */
const cardP = "rounded-[28px] bg-card shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10"

function PreviewP() {
  const [first, ...rest] = KPIS
  return (
    <div className="grid gap-3 lg:grid-cols-4">
      <div className={cn(cardP, "flex min-h-72 flex-col p-5 lg:col-span-2 lg:row-span-2")}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">{FLOW_TITLE}</h3>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              390 <span className="text-sm font-normal text-muted-foreground">submitted</span> · 292{" "}
              <span className="text-sm font-normal text-muted-foreground">completed</span>
            </p>
          </div>
          <Xls className="-mr-2" />
        </div>
        <div className="-ml-3 min-h-0 flex-1 pt-3">
          <FlowChart area legend height="100%" />
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[28px] bg-primary p-5 text-primary-foreground shadow-sm">
        <div className="flex items-center gap-2 text-xs opacity-80">
          <HugeiconsIcon icon={first.icon} className="size-4" />
          {first.label}
        </div>
        <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">{first.value}</p>
        <p className="mt-1 text-xs opacity-80">↗ {first.delta}% vs prev 30 days</p>
      </div>
      {rest.map((k) => (
        <div key={k.key} className={cn(cardP, "p-5")}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn("flex size-6 items-center justify-center rounded-lg", TONE[k.tone].chip)}>
              <HugeiconsIcon icon={k.icon} className="size-3.5" />
            </span>
            {k.label}
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{k.value}</p>
          <Foot k={k} className="mt-1" />
        </div>
      ))}
      <div className={cn(cardP, "p-5 lg:col-span-4")}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{BAR_TITLE}</h3>
          <Xls className="-mr-2" />
        </div>
        <div className="-ml-3 pt-2">
          <BarsChart height={180} radius={8} />
        </div>
      </div>
    </div>
  )
}

/* ── Catalogue ── */

const OPTIONS: {
  key: string
  title: string
  like: string
  idea: string
  plus: string
  minus: string
  Preview: () => React.ReactNode
}[] = [
  {
    key: "A",
    title: "Before",
    like: "Previous cards",
    idea: "Big radius, soft drop shadow, icon chips; every card the same weight.",
    plus: "Friendly, already consistent with the rest of the app.",
    minus: "Heavy shadows + very round corners read 'consumer app'; KPIs and charts compete; bold titles everywhere.",
    Preview: PreviewA,
  },
  {
    key: "B",
    title: "Hairline",
    like: "Linear, Vercel",
    idea: "Flat cards, 1px border, 16px radius, no shadow, medium-weight titles, icons inline with the label.",
    plus: "Calm and precise; the data is the loudest thing on the page. Scales to dense dashboards.",
    minus: "Can feel plain; needs good spacing to not look like a wireframe.",
    Preview: PreviewB,
  },
  {
    key: "C",
    title: "Tray (adopted)",
    like: "Claude Studio, Apple Settings",
    idea: "A tinted tray carries the label and actions; the number or chart sits on a white panel inside it.",
    plus: "Clear split between 'what is this' and 'the data'; matches the new header (tinted strip + white controls).",
    minus: "Two nested radii to keep tidy; slightly more chrome per card.",
    Preview: PreviewC,
  },
  {
    key: "D",
    title: "Header bar",
    like: "Grafana, classic admin",
    idea: "Every card has a tinted title bar holding its controls (granularity, download, ⋯).",
    plus: "Room for per-card controls without crowding the chart; very scannable.",
    minus: "Heavier and more 'enterprise'; bars repeat a lot on a full page.",
    Preview: PreviewD,
  },
  {
    key: "E",
    title: "Inline sparkline",
    like: "Stripe",
    idea: "Each KPI carries a tiny 30-day line next to its number; delta as a pill by the label.",
    plus: "A number with its shape answers 'is this normal?' at a glance.",
    minus: "Needs a time series per KPI from the backend.",
    Preview: PreviewE,
  },
  {
    key: "F",
    title: "Report sheet",
    like: "Stripe Home, Vercel Analytics",
    idea: "One card for the whole report; KPIs and charts are cells split by hairlines.",
    plus: "Feels like one document, not a pile of boxes; the least visual noise of any boxed option.",
    minus: "Less flexible for drag-to-rearrange or per-card states.",
    Preview: PreviewF,
  },
  {
    key: "G",
    title: "Hero metric",
    like: "Home 'Task Summary' bar",
    idea: "The headline KPI inverted (dark) and wider, with its trend behind it; the others stay quiet.",
    plus: "Strong hierarchy: the eye lands on the one number that matters.",
    minus: "Every dashboard has to pick a hero; dark tile flips in dark mode.",
    Preview: PreviewG,
  },
  {
    key: "H",
    title: "Tinted",
    like: "Process Discovery summary cells",
    idea: "KPIs washed in their colour with gradient chips; charts carry their legend in the header.",
    plus: "Colourful and lively; reuses a style already in the app.",
    minus: "Colour stops meaning anything when everything is coloured.",
    Preview: PreviewH,
  },
  {
    key: "I",
    title: "Open",
    like: "Notion, PostHog notebooks",
    idea: "No containers. Headings, hairline rules and whitespace do the grouping.",
    plus: "Lightest possible; reads like a report.",
    minus: "Weak on a patterned background; sections blur together on long pages.",
    Preview: PreviewI,
  },
  {
    key: "J",
    title: "Glass",
    like: "visionOS, Arc",
    idea: "Translucent, blurred cards over colour; gradient bars and areas.",
    plus: "Distinctive, premium; shows off the page pattern.",
    minus: "Contrast depends on what's behind; costly blur; trendy (ages fast).",
    Preview: PreviewJ,
  },
  {
    key: "K",
    title: "Insight-first",
    like: "Amplitude, Mode notebooks",
    idea: "Big type, no icons. Each chart's title states its finding; only the point is in colour.",
    plus: "Tells the reader what to see, not just what was measured.",
    minus: "Headlines must be computed per chart (and can be wrong for odd data).",
    Preview: PreviewK,
  },
  {
    key: "L",
    title: "Accent rail",
    like: "Datadog, IBM Carbon",
    idea: "A thin colour rail on each card ties it to its series; everything else neutral.",
    plus: "Colour coding with almost no ink.",
    minus: "Subtle — the rails can look like decoration if colours aren't reused in the charts.",
    Preview: PreviewL,
  },
  {
    key: "M",
    title: "Compact",
    like: "Ops consoles, HelpDesk",
    idea: "Small radius, tight padding, tiny caps headers, shorter charts.",
    plus: "Fits twice the information above the fold; good for live monitoring.",
    minus: "Dense; less friendly for occasional readers.",
    Preview: PreviewM,
  },
  {
    key: "N",
    title: "KPIs as tabs",
    like: "Stripe, Google Analytics",
    idea: "The KPI strip is the switcher for the big chart under it — click a number to see its trend.",
    plus: "Every number gets a trend without four extra charts; very little chrome.",
    minus: "A different mental model; one trend visible at a time.",
    Preview: PreviewN,
  },
  {
    key: "O",
    title: "Full-bleed trend",
    like: "Tremor, Apple Health",
    idea: "The 30-day area fills the bottom of each KPI tile; actions live in a ⋯ menu.",
    plus: "Rich at a glance and still tidy; the download stops competing with the title.",
    minus: "Taller tiles; the trend is decorative unless it has an axis.",
    Preview: PreviewO,
  },
  {
    key: "P",
    title: "Bento",
    like: "Apple keynote grids",
    idea: "One hero chart with the KPIs packed beside it; one accent tile; a full-width chart below.",
    plus: "Strong composition, very 'designed'; makes a dashboard feel curated.",
    minus: "Layout is per-dashboard work; doesn't flow automatically for any number of cards.",
    Preview: PreviewP,
  },
]

export function CardPatternsPage() {
  return (
    <div className="mx-auto max-w-screen-xl space-y-10 p-4 sm:p-6">
      <header className="space-y-3">
        <div>
          <h1 className="text-xl font-bold">Card Patterns</h1>
          <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">
            {OPTIONS.length} ways to draw the dashboard cards, same data in each: the four Process Analytics KPIs and two of its charts. A is
            the previous look; C (Tray) is now used on every analytics dashboard. Download icons and menus are for show.
          </p>
        </div>
        <nav className="flex flex-wrap gap-1.5">
          {OPTIONS.map((o) => (
            <a
              key={o.key}
              href={`#card-${o.key}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              <b className="font-semibold text-foreground">{o.key}</b>
              {o.title}
            </a>
          ))}
        </nav>
      </header>

      {OPTIONS.map(({ key, title, like, idea, plus, minus, Preview }) => (
        <section key={key} id={`card-${key}`} className="scroll-mt-28 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">{key}</span>
            <h2 className="text-base font-semibold">{title}</h2>
            <Badge variant="secondary" className="font-normal">
              like {like}
            </Badge>
          </div>
          <p className="max-w-4xl text-sm">{idea}</p>
          <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <p>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">Good </span>
              <span className="text-muted-foreground">{plus}</span>
            </p>
            <p>
              <span className="font-medium text-amber-600 dark:text-amber-400">Watch out </span>
              <span className="text-muted-foreground">{minus}</span>
            </p>
          </div>
          <Preview />
        </section>
      ))}
    </div>
  )
}
