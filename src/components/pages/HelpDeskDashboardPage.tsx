import { useMemo } from "react"
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
  RefreshIcon,
  Ticket01Icon,
  CheckmarkCircle02Icon,
  Alert01Icon,
  Shield01Icon,
  Timer01Icon,
  Clock01Icon,
  FavouriteIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardCard } from "@/components/dashboard/dashboard-card"
import { DashboardPage, useDashboardState } from "@/components/dashboard/dashboard-page"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { axisTick, gridStroke, legendStyle, tooltipStyle } from "@/components/dashboard/chart-theme"
import { SHORT_PRESETS, STANDARD_PRESETS } from "@/lib/date-presets"
import { opts } from "@/lib/filters"
import { test, type TypedFilterDef } from "@/lib/typed-filters"
import {
  CATEGORIES,
  computeDashboard,
  formatDuration,
  NOW,
  PRIORITIES,
  PRIORITY_META,
  TEAM,
  TICKETS,
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

const FILTERS: TypedFilterDef[] = [
  { id: "priority", label: "Priority", kind: "field", pinned: true, options: PRIORITIES.map((p) => ({ value: p, label: `${p} (${PRIORITY_META[p].target})` })) },
  { id: "category", label: "Category", kind: "field", pinned: true, options: opts(CATEGORIES) },
  { id: "assignee", label: "Assignee", kind: "field", options: opts(TEAM) },
  { id: "sla", label: "SLA result", kind: "field", options: opts(["Met", "Breached", "Open"]) },
  { id: "csat", label: "CSAT rating", kind: "number" },
]

const slaResult = (t: { slaMet: boolean | null }) => (t.slaMet === true ? "Met" : t.slaMet === false ? "Breached" : "Open")

// Support queues watch days, not quarters — short ranges first, then the standard set.
const PRESETS = [...SHORT_PRESETS, ...STANDARD_PRESETS]

const compliance = (v: number) =>
  v >= SLA_GOAL ? "[&>[data-slot=progress-indicator]]:bg-emerald-500" : "[&>[data-slot=progress-indicator]]:bg-amber-500"

/* ══════════════════════════════════════════════════════════════════
   Page
══════════════════════════════════════════════════════════════════ */
export function HelpDeskDashboardPage() {
  // Mock tickets end 31 Aug 2026, so presets count back from that, not the wall clock.
  const state = useDashboardState({ today: NOW, presets: PRESETS })
  const { range, values } = state

  const data = useMemo(() => {
    const tickets = TICKETS.filter(
      (t) =>
        test(values.priority, t.priority) &&
        test(values.category, t.category) &&
        test(values.assignee, t.assignee) &&
        test(values.sla, slaResult(t)) &&
        test(values.csat, t.csat),
    )
    return computeDashboard(range.from, range.to, tickets)
  }, [range, values])

  return (
    <DashboardPage
      title="HelpDesk Dashboard"
      description="SLA compliance & ticket performance for the selected period · auto-refreshes every 2 min"
      state={state}
      filters={FILTERS}
      merged
      trailing={
        // The page description (which carried this) is gone in the merged header.
        <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-full" title="Auto-refreshes every 2 min">
          <HugeiconsIcon icon={RefreshIcon} className="size-4" />
          Refresh
        </Button>
      }
    >
      {/* ── Headline metrics ── five across only from xl: beside the sidebar at
          lg each tile is ~140px and every label truncates. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          icon={Ticket01Icon}
          label="Total Tickets In"
          value={String(data.totalIn.value)}
          delta={data.totalIn.deltaPct}
          accent="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
        />
        <KpiCard
          icon={CheckmarkCircle02Icon}
          label="Resolved within SLA"
          value={String(data.resolvedInSla.value)}
          delta={data.resolvedInSla.deltaPct}
          accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
        />
        <KpiCard
          icon={Alert01Icon}
          label="Breached (late)"
          value={String(data.breached.value)}
          delta={data.breached.deltaPct}
          goodDown
          accent="bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
        />
        <KpiCard
          icon={Shield01Icon}
          label="SLA Compliance"
          value={`${data.compliance.value}%`}
          exportValue={data.compliance.value}
          delta={data.compliance.deltaPct}
          deltaUnit="pp"
          accent="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"
          footer={
            <div className="mt-3">
              <Progress value={data.compliance.value} className={cn("h-1.5", compliance(data.compliance.value))} />
              <p className="mt-1 text-[11px] text-muted-foreground">Target {SLA_GOAL}%</p>
            </div>
          }
        />
        <KpiCard
          icon={Timer01Icon}
          label="Open / Escalated"
          value={String(data.openCount)}
          sub={`${data.escalatedCount} escalated`}
          accent="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
        />
      </div>

      {/* ── Speed & satisfaction ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          icon={Timer01Icon}
          label="Avg Resolution Time"
          value={formatDuration(data.avgResolutionHours.value)}
          exportValue={Math.round(data.avgResolutionHours.value * 10) / 10}
          exportUnit="hours"
          sub="created → resolved"
          delta={data.avgResolutionHours.deltaPct}
          goodDown
          accent="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
        />
        <KpiCard
          icon={Clock01Icon}
          label="Avg Completion (days)"
          value={`${data.avgCompletionDays.value}`}
          sub="created → closed"
          delta={data.avgCompletionDays.deltaPct}
          goodDown
          accent="bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400"
        />
        <KpiCard
          icon={FavouriteIcon}
          label="User Satisfaction (CSAT)"
          value={data.csatScore == null ? "—" : `${data.csatScore} / 100`}
          exportValue={data.csatScore ?? ""}
          sub={`${data.csatCount} rated ticket${data.csatCount === 1 ? "" : "s"}`}
          accent="bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400"
        />
      </div>

      {/* ── Breakdown per Priority ── */}
      <DashboardCard
        title="Breakdown by Priority"
        exportTable={{
          columns: [
            { header: "Priority", value: (p) => p.label },
            { header: "SLA target", value: (p) => p.target },
            { header: "In", value: (p) => p.masuk },
            { header: "Resolved", value: (p) => p.selesai },
            { header: "Breached", value: (p) => p.breach },
            { header: "SLA compliance (%)", value: (p) => (p.selesai === 0 ? null : p.compliance), width: 20 },
          ],
          rows: data.priorityStats,
        }}
      >
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
                  <span className={p.breach > 0 ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground"}>{p.breach}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={p.compliance} className={cn("h-1.5 flex-1", compliance(p.compliance))} />
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
      </DashboardCard>

      {/* ── SLA compliance trend + ticket trend ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard
          title="SLA Compliance Trend"
          exportTable={{
            columns: [
              { header: "Period", value: (t) => t.label },
              { header: "Resolved", value: (t) => t.resolved },
              { header: "SLA compliance (%)", value: (t) => t.slaRate, width: 20 },
            ],
            rows: data.trend,
          }}
        >
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={data.trend} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="slaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.sla} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.sla} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="label" tick={axisTick} interval="preserveStartEnd" minTickGap={16} />
              <YAxis domain={[0, 100]} tick={axisTick} unit="%" />
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
        </DashboardCard>

        <DashboardCard
          title="Ticket Trend — Created vs Resolved"
          exportTable={{
            columns: [
              { header: "Period", value: (t) => t.label },
              { header: "Created", value: (t) => t.created },
              { header: "Resolved", value: (t) => t.resolved },
            ],
            rows: data.trend,
          }}
        >
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={data.trend} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="label" tick={axisTick} interval="preserveStartEnd" minTickGap={16} />
              <YAxis tick={axisTick} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={legendStyle} />
              <Line type="monotone" dataKey="created" name="Created" stroke={C.created} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke={C.resolved} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </DashboardCard>
      </div>

      {/* ── Category + status ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardCard
          className="lg:col-span-2"
          title="Tickets by Category — SLA Met vs Breached"
          exportTable={{
            columns: [
              { header: "Category", value: (c) => c.category, width: 20 },
              { header: "Met", value: (c) => c.met },
              { header: "Breached", value: (c) => c.breached },
              { header: "Total resolved", value: (c) => c.total, width: 16 },
            ],
            rows: data.categoryStats,
          }}
        >
          <ResponsiveContainer width="100%" height={Math.max(180, data.categoryStats.length * 42)}>
            <BarChart layout="vertical" data={data.categoryStats} margin={{ top: 4, right: 12, left: 8, bottom: 0 }} barCategoryGap={12}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis type="number" tick={axisTick} allowDecimals={false} />
              <YAxis type="category" dataKey="category" tick={{ ...axisTick, fontSize: 11 }} width={120} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Legend wrapperStyle={legendStyle} />
              <Bar dataKey="met" name="Met" stackId="a" fill={C.met} radius={[4, 0, 0, 4]} />
              <Bar dataKey="breached" name="Breached" stackId="a" fill={C.breached} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>

        <DashboardCard
          title="Tickets by Status"
          exportTable={{
            columns: [
              { header: "Status", value: (s) => s.name },
              { header: "Tickets", value: (s) => s.value },
            ],
            rows: data.statusBreakdown,
          }}
        >
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={data.statusBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={3} dataKey="value">
                {data.statusBreakdown.map((s) => (
                  <Cell key={s.name} fill={STATUS_COLOR[s.name] ?? C.created} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={legendStyle} />
            </PieChart>
          </ResponsiveContainer>
        </DashboardCard>
      </div>

      {/* ── Team performance ── */}
      <DashboardCard
        title="Team Performance — SLA Compliance"
        exportTable={{
          columns: [
            { header: "Agent", value: (t) => t.name, width: 22 },
            { header: "Resolved", value: (t) => t.resolved },
            { header: "SLA compliance (%)", value: (t) => t.slaRate, width: 20 },
          ],
          rows: data.teamStats,
        }}
      >
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
                  <Progress value={t.slaRate} className={cn("h-1.5 flex-1", compliance(t.slaRate))} />
                  <span className="shrink-0 text-[11px] text-muted-foreground">{t.resolved} resolved</span>
                </div>
              </div>
            </div>
          ))}
          {data.teamStats.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground sm:col-span-2">No resolved tickets in this period.</p>
          )}
        </div>
      </DashboardCard>
    </DashboardPage>
  )
}
