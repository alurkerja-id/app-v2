import { useMemo, useState } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  RefreshIcon,
  Ticket01Icon,
  CheckmarkCircle02Icon,
  Alert01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Shield01Icon,
  Timer01Icon,
  Clock01Icon,
  FavouriteIcon,
} from "@hugeicons/core-free-icons"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  computeDashboard,
  formatDuration,
  RANGE_PRESETS,
  NOW,
  type DateRangeValue,
  type KpiWithDelta,
} from "@/data/helpdesk"

/* ── Palette (chart series only; accent UI uses theme tokens) ── */
const C = {
  created: "#6366f1",
  resolved: "#10b981",
  met: "#10b981",
  breached: "#ef4444",
  sla: "#8b5cf6",
  amber: "#f59e0b",
}
const STATUS_COLOR: Record<string, string> = { Resolved: C.resolved, Open: C.amber }
const SLA_GOAL = 90 // target compliance %

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
} as const

/* ══════════════════════════════════════════════════════════════════
   Date range picker — AlurKerja standard (preset column + range cal)
══════════════════════════════════════════════════════════════════ */
const triggerClass =
  "flex h-9 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1 text-left text-sm shadow-xs transition-colors hover:bg-accent/40 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"

function DateRangePicker({
  value,
  activePreset,
  onChange,
}: {
  value: DateRangeValue
  activePreset: string | null
  onChange: (range: DateRangeValue, preset: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>({ from: value.from, to: value.to })

  const label =
    activePreset ??
    (value.from
      ? value.to
        ? `${format(value.from, "d MMM yyyy")} – ${format(value.to, "d MMM yyyy")}`
        : format(value.from, "d MMM yyyy")
      : "Pick a range")

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) setDraft({ from: value.from, to: value.to })
      }}
    >
      <PopoverTrigger asChild>
        <button className={cn(triggerClass, "min-w-[220px]")}>
          <span className="flex items-center gap-2 truncate">
            <HugeiconsIcon icon={Calendar01Icon} className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{label}</span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex max-sm:flex-col">
          <div className="flex shrink-0 flex-col gap-0.5 border-r border-border p-2 max-sm:border-b max-sm:border-r-0">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  const r = p.range()
                  setDraft({ from: r.from, to: r.to })
                  onChange(r, p.label)
                  setOpen(false)
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                  activePreset === p.label
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="p-1">
            <Calendar
              mode="range"
              defaultMonth={value.from}
              selected={draft}
              onSelect={(r) => {
                setDraft(r)
                if (r?.from && r?.to) {
                  onChange({ from: r.from, to: r.to }, null)
                  setOpen(false)
                }
              }}
              numberOfMonths={2}
              disabled={{ after: NOW }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Small building blocks
══════════════════════════════════════════════════════════════════ */
function DeltaBadge({ delta, unit, goodDown = false }: { delta: number | null; unit: "%" | "pp"; goodDown?: boolean }) {
  if (delta == null) return <span className="text-[11px] text-muted-foreground">no prior data</span>
  if (Math.round(delta * 10) === 0) return <span className="text-[11px] text-muted-foreground">no change</span>
  const up = delta > 0
  const good = goodDown ? !up : up
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-medium",
        good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
      )}
    >
      <HugeiconsIcon icon={up ? ArrowUp01Icon : ArrowDown01Icon} className="size-3" />
      {Math.abs(delta).toFixed(unit === "pp" ? 1 : 0)}
      {unit === "pp" ? " pp" : "%"}
      <span className="font-normal text-muted-foreground">vs prev</span>
    </span>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  kpi,
  unit = "%",
  goodDown = false,
  accent,
  footer,
}: {
  icon: typeof Ticket01Icon
  label: string
  value: string
  sub?: string
  kpi?: KpiWithDelta
  unit?: "%" | "pp"
  goodDown?: boolean
  accent?: string
  footer?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className={cn("flex size-7 items-center justify-center rounded-lg", accent ?? "bg-muted text-foreground/70")}>
            <HugeiconsIcon icon={icon} className="size-4" />
          </span>
          <span className="text-xs">{label}</span>
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          {sub ? <span className="text-[11px] text-muted-foreground">{sub}</span> : <span />}
          {kpi && <DeltaBadge delta={kpi.deltaPct} unit={unit} goodDown={goodDown} />}
        </div>
        {footer}
      </CardContent>
    </Card>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Page
══════════════════════════════════════════════════════════════════ */
export function HelpDeskDashboardPage() {
  const defaultPreset = RANGE_PRESETS.find((p) => p.label === "Last 30 days")!
  const [range, setRange] = useState<DateRangeValue>(defaultPreset.range())
  const [preset, setPreset] = useState<string | null>("Last 30 days")

  const data = useMemo(() => computeDashboard(range.from, range.to), [range])

  return (
    <div className="mx-auto max-w-screen-xl space-y-5 p-4 sm:p-6">
      {/* Title + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">HelpDesk Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">SLA compliance & ticket performance for the selected period</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={range}
            activePreset={preset}
            onChange={(r, p) => {
              setRange(r)
              setPreset(p)
            }}
          />
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <HugeiconsIcon icon={RefreshIcon} className="size-4" />
            Refresh
          </Button>
        </div>
      </div>

      <p className="-mt-2 text-xs text-muted-foreground">
        Showing {format(range.from, "d MMM yyyy")} – {format(range.to, "d MMM yyyy")} · auto-refreshes every 2 min
      </p>

      {/* ── Headline metrics ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          icon={Ticket01Icon}
          label="Total Tickets In"
          value={String(data.totalIn.value)}
          kpi={data.totalIn}
          accent="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
        />
        <StatCard
          icon={CheckmarkCircle02Icon}
          label="Resolved within SLA"
          value={String(data.resolvedInSla.value)}
          kpi={data.resolvedInSla}
          accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
        />
        <StatCard
          icon={Alert01Icon}
          label="Breached (late)"
          value={String(data.breached.value)}
          kpi={data.breached}
          goodDown
          accent="bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
        />
        <StatCard
          icon={Shield01Icon}
          label="SLA Compliance"
          value={`${data.compliance.value}%`}
          kpi={data.compliance}
          unit="pp"
          accent="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"
          footer={
            <div className="mt-3">
              <Progress
                value={data.compliance.value}
                className={cn(
                  "h-1.5",
                  data.compliance.value >= SLA_GOAL
                    ? "[&>[data-slot=progress-indicator]]:bg-emerald-500"
                    : "[&>[data-slot=progress-indicator]]:bg-amber-500",
                )}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Target {SLA_GOAL}%</p>
            </div>
          }
        />
        <StatCard
          icon={Timer01Icon}
          label="Open / Escalated"
          value={String(data.openCount)}
          sub={`${data.escalatedCount} escalated`}
          accent="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
        />
      </div>

      {/* ── Speed & satisfaction ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={Timer01Icon}
          label="Avg Resolution Time"
          value={formatDuration(data.avgResolutionHours.value)}
          sub="created → resolved"
          kpi={data.avgResolutionHours}
          goodDown
          accent="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
        />
        <StatCard
          icon={Clock01Icon}
          label="Avg Completion (days)"
          value={`${data.avgCompletionDays.value}`}
          sub="created → closed"
          kpi={data.avgCompletionDays}
          goodDown
          accent="bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400"
        />
        <StatCard
          icon={FavouriteIcon}
          label="User Satisfaction (CSAT)"
          value={data.csatScore == null ? "—" : `${data.csatScore} / 100`}
          sub={`${data.csatCount} rated ticket${data.csatCount === 1 ? "" : "s"}`}
          accent="bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400"
        />
      </div>

      {/* ── Breakdown per Priority ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Breakdown by Priority</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">In</TableHead>
                <TableHead className="text-right">Resolved</TableHead>
                <TableHead className="text-right">Breached</TableHead>
                <TableHead className="w-[180px]">SLA Compliance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.priorityStats.map((p) => (
                <TableRow key={p.priority}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="inline-block size-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="font-medium">{p.label}</span>
                      <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                        {p.target}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.masuk}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.selesai}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={p.breach > 0 ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground"}>
                      {p.breach}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={p.compliance}
                        className={cn(
                          "h-1.5 flex-1",
                          p.compliance >= SLA_GOAL
                            ? "[&>[data-slot=progress-indicator]]:bg-emerald-500"
                            : "[&>[data-slot=progress-indicator]]:bg-amber-500",
                        )}
                      />
                      <span
                        className={cn(
                          "w-10 text-right text-sm font-semibold tabular-nums",
                          p.compliance >= SLA_GOAL ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {p.selesai === 0 ? "—" : `${p.compliance}%`}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-2 text-[11px] text-muted-foreground">
            In = tickets created in period · Resolved = closed in period · Breached = resolved past the resolution SLA.
          </p>
        </CardContent>
      </Card>

      {/* ── SLA compliance trend + ticket trend ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="SLA Compliance Trend">
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={data.trend} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="slaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.sla} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.sla} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={16} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => (v == null ? "—" : `${v}%`)} />
              <ReferenceLine
                y={SLA_GOAL}
                stroke={C.amber}
                strokeDasharray="4 4"
                label={{ value: `Target ${SLA_GOAL}%`, position: "insideTopRight", fontSize: 10, fill: C.amber }}
              />
              <Area type="monotone" dataKey="slaRate" name="SLA compliance" stroke={C.sla} strokeWidth={2} fill="url(#slaFill)" connectNulls dot={{ r: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ticket Trend — Created vs Resolved">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={data.trend} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={16} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="created" name="Created" stroke={C.created} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke={C.resolved} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Category + status ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Tickets by Category — SLA Met vs Breached">
            <ResponsiveContainer width="100%" height={Math.max(180, data.categoryStats.length * 42)}>
              <BarChart layout="vertical" data={data.categoryStats} margin={{ top: 4, right: 12, left: 8, bottom: 0 }} barCategoryGap={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="met" name="Met" stackId="a" fill={C.met} radius={[4, 0, 0, 4]} />
                <Bar dataKey="breached" name="Breached" stackId="a" fill={C.breached} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Tickets by Status">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={data.statusBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={3} dataKey="value">
                {data.statusBreakdown.map((s) => (
                  <Cell key={s.name} fill={STATUS_COLOR[s.name] ?? C.created} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Team performance ── */}
      <ChartCard title="Team Performance — SLA Compliance">
            <div className="grid gap-x-8 gap-y-3 pt-1 sm:grid-cols-2">
              {data.teamStats.map((t) => (
                <div key={t.name} className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{t.name}</span>
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          t.slaRate >= SLA_GOAL ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {t.slaRate}%
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Progress
                        value={t.slaRate}
                        className={cn(
                          "h-1.5 flex-1",
                          t.slaRate >= SLA_GOAL
                            ? "[&>[data-slot=progress-indicator]]:bg-emerald-500"
                            : "[&>[data-slot=progress-indicator]]:bg-amber-500",
                        )}
                      />
                      <span className="shrink-0 text-[11px] text-muted-foreground">{t.resolved} resolved</span>
                    </div>
                  </div>
                </div>
              ))}
              {data.teamStats.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground sm:col-span-2">No resolved tickets in this period.</p>
              )}
            </div>
      </ChartCard>
    </div>
  )
}
