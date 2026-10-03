import { useMemo } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Analytics01Icon,
  Building06Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  TimeHalfPassIcon,
  Timer01Icon,
  UserAccountIcon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardCard } from "@/components/dashboard/dashboard-card"
import { DashboardPage, useDashboardState } from "@/components/dashboard/dashboard-page"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { axisTick, gridStroke, legendStyle, SERIES, tooltipStyle } from "@/components/dashboard/chart-theme"
import { computeProcessAnalytics, PROCESS_FILTERS } from "@/data/process-analytics"
import { computeWorkforce, WORKFORCE_FILTERS } from "@/data/workforce-analytics"
import { GRANULARITY_LABEL } from "@/lib/mock-series"

const margin = { top: 4, right: 8, left: -16, bottom: 0 }
const fmt = (n: number) => n.toLocaleString("en-US")

export function AnalyticsPage({ variant }: { variant: "process" | "workforce" }) {
  // Distinct components so switching routes resets each dashboard's filters.
  return variant === "process" ? <ProcessAnalytics /> : <WorkforceAnalytics />
}

/* ══════════════════════════════════════════════════════════════════
   Process Analytics
══════════════════════════════════════════════════════════════════ */

function ProcessAnalytics() {
  const state = useDashboardState()
  const data = useMemo(() => computeProcessAnalytics(state.range, state.values), [state.range, state.values])
  const g = GRANULARITY_LABEL[data.granularity]

  return (
    <DashboardPage
      title="Process Analytics"
      description="Instance volume, throughput, and cycle time across business processes"
      state={state}
      filters={PROCESS_FILTERS}
      merged
    >
      {data.table.length === 0 ? (
        <NoData />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              icon={Analytics01Icon}
              label="Total Instances"
              value={fmt(data.kpi.total.value)}
              delta={data.kpi.total.delta}
              accent="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
            />
            <KpiCard
              icon={TimeHalfPassIcon}
              label="Active Instances"
              value={fmt(data.kpi.active.value)}
              sub={`${data.kpi.active.share}% of total`}
              accent="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
            />
            <KpiCard
              icon={CheckmarkCircle02Icon}
              label="Completed"
              value={fmt(data.kpi.completed.value)}
              delta={data.kpi.completed.delta}
              accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
            />
            <KpiCard
              icon={Timer01Icon}
              label="Avg. Cycle Time"
              value={`${data.kpi.avgDays.value}d`}
              sub="per completed instance"
              delta={data.kpi.avgDays.delta}
              goodDown
              accent="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DashboardCard
              title="Instances by Process"
              exportTable={{
                columns: [
                  { header: "Process", value: (r) => r.process, width: 26 },
                  { header: "Instances", value: (r) => r.total },
                ],
                rows: data.table,
              }}
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.table} margin={margin}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="short" tick={axisTick} interval={0} />
                  <YAxis tick={axisTick} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="total" name="Instances" fill={SERIES[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </DashboardCard>

            <DashboardCard
              title={`${g} Submitted vs Completed`}
              exportTable={{
                columns: [
                  { header: "Period", value: (r) => r.label },
                  { header: "Submitted", value: (r) => r.submitted },
                  { header: "Completed", value: (r) => r.completed },
                ],
                rows: data.flow,
              }}
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.flow} margin={margin}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="label" tick={axisTick} interval="preserveStartEnd" minTickGap={16} />
                  <YAxis tick={axisTick} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={legendStyle} />
                  <Line type="monotone" dataKey="submitted" name="Submitted" stroke={SERIES[0]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke={SERIES[1]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </DashboardCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DashboardCard
              className="lg:col-span-2"
              title="Cumulative Submitted vs Completed"
              description="The gap between the lines is the open backlog."
              exportTable={{
                columns: [
                  { header: "Period", value: (r) => r.label },
                  { header: "Cumulative submitted", value: (r) => r.submitted, width: 22 },
                  { header: "Cumulative completed", value: (r) => r.completed, width: 22 },
                  { header: "Open backlog", value: (r) => r.submitted - r.completed, width: 16 },
                ],
                rows: data.burnup,
              }}
            >
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.burnup} margin={margin}>
                  <defs>
                    <Gradient id="pa-sub" color={SERIES[0]} />
                    <Gradient id="pa-com" color={SERIES[1]} />
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="label" tick={axisTick} interval="preserveStartEnd" minTickGap={16} />
                  <YAxis tick={axisTick} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={legendStyle} />
                  <Area type="monotone" dataKey="submitted" name="Submitted" stroke={SERIES[0]} fill="url(#pa-sub)" strokeWidth={2} />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke={SERIES[1]} fill="url(#pa-com)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </DashboardCard>

            <DashboardCard
              title="Status Distribution"
              exportTable={{
                columns: [
                  { header: "Status", value: (r) => r.name },
                  { header: "Instances", value: (r) => r.value },
                  { header: "Share (%)", value: (r) => (data.kpi.total.value ? Math.round((r.value / data.kpi.total.value) * 1000) / 10 : 0) },
                ],
                rows: data.status,
              }}
            >
              <Donut data={data.status} colors={[SERIES[1], SERIES[2]]} />
            </DashboardCard>
          </div>

          <DashboardCard
            title="Instance Volume vs Avg Cycle Time"
            description="One point per process — high and to the right is busy and slow."
            exportTable={{
              columns: [
                { header: "Process", value: (r) => r.process, width: 26 },
                { header: "Instances", value: (r) => r.total },
                { header: "Avg cycle time (days)", value: (r) => r.avgDays, format: "0.0", width: 22 },
              ],
              rows: data.table,
            }}
          >
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ ...margin, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="x" type="number" name="Instances" tick={axisTick} />
                <YAxis dataKey="y" type="number" name="Cycle time" unit="d" tick={axisTick} />
                <Tooltip content={<PointTip x="Instances" y="Avg cycle" unit="d" />} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={data.scatter} fill={SERIES[4]} />
              </ScatterChart>
            </ResponsiveContainer>
          </DashboardCard>

          <DashboardCard
            title="Process Summary"
            contentClassName="overflow-x-auto"
            exportTable={{
              columns: [
                { header: "Process", value: (r) => r.process, width: 26 },
                { header: "Owner department", value: (r) => r.department, width: 18 },
                { header: "Total", value: (r) => r.total },
                { header: "Active", value: (r) => r.active },
                { header: "Completed", value: (r) => r.completed },
                { header: "Avg days", value: (r) => r.avgDays, format: "0.0" },
                { header: "Status", value: (r) => (r.active > r.completed ? "In Progress" : "On Track") },
              ],
              rows: data.table,
            }}
          >
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead>Process</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Avg. Days</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.table.map((r) => (
                  <TableRow key={r.process}>
                    <TableCell className="font-medium">{r.process}</TableCell>
                    <TableCell className="text-muted-foreground">{r.department}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.total)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.active)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.completed)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.avgDays}d</TableCell>
                    <TableCell>
                      <Badge variant={r.active > r.completed ? "secondary" : "outline"} className="text-[10px]">
                        {r.active > r.completed ? "In Progress" : "On Track"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DashboardCard>
        </>
      )}
    </DashboardPage>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Workforce Analytics
══════════════════════════════════════════════════════════════════ */

function WorkforceAnalytics() {
  const state = useDashboardState()
  const data = useMemo(() => computeWorkforce(state.range, state.values), [state.range, state.values])
  const g = GRANULARITY_LABEL[data.granularity]
  const net = data.kpi.headcount.net

  return (
    <DashboardPage
      title="Workforce Analytics"
      description="Headcount distribution, hiring trends, and leave patterns across departments"
      state={state}
      filters={WORKFORCE_FILTERS}
      merged
    >
      {data.table.length === 0 ? (
        <NoData />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              icon={UserMultiple02Icon}
              label="Total Employees"
              value={fmt(data.kpi.headcount.value)}
              sub={`${net >= 0 ? "+" : ""}${net} net this period`}
              accent="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
            />
            <KpiCard
              icon={Building06Icon}
              label="Departments"
              value={String(data.kpi.departments.value)}
              sub={`across ${data.kpi.departments.locations} location${data.kpi.departments.locations === 1 ? "" : "s"}`}
              accent="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"
            />
            <KpiCard
              icon={Calendar03Icon}
              label="Leave Days Taken"
              value={fmt(data.kpi.leaveDays.value)}
              delta={data.kpi.leaveDays.delta}
              goodDown
              accent="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
            />
            <KpiCard
              icon={UserAccountIcon}
              label="Open Positions"
              value={String(data.kpi.openRoles.value)}
              sub="currently hiring"
              accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DashboardCard
              title="Headcount by Department"
              exportTable={{
                columns: [
                  { header: "Department", value: (r) => r.name, width: 18 },
                  { header: "Headcount", value: (r) => r.headcount },
                ],
                rows: data.byDept,
              }}
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.byDept} margin={margin}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="name" tick={axisTick} interval={0} />
                  <YAxis tick={axisTick} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="headcount" name="Headcount" fill={SERIES[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </DashboardCard>

            <DashboardCard
              title={`${g} Hiring vs Attrition`}
              exportTable={{
                columns: [
                  { header: "Period", value: (r) => r.label },
                  { header: "Hired", value: (r) => r.hired },
                  { header: "Resigned", value: (r) => r.resigned },
                ],
                rows: data.series,
              }}
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.series} margin={margin}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="label" tick={axisTick} interval="preserveStartEnd" minTickGap={16} />
                  <YAxis tick={axisTick} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={legendStyle} />
                  <Line type="monotone" dataKey="hired" name="Hired" stroke={SERIES[1]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="resigned" name="Resigned" stroke={SERIES[3]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </DashboardCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DashboardCard
              className="lg:col-span-2"
              title={`${g} Leave Days by Type`}
              exportTable={{
                columns: [
                  { header: "Period", value: (r) => r.label },
                  { header: "Annual", value: (r) => r.annual },
                  { header: "Sick", value: (r) => r.sick },
                  { header: "Unpaid", value: (r) => r.unpaid },
                ],
                rows: data.series,
              }}
            >
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.series} margin={margin}>
                  <defs>
                    <Gradient id="wf-a" color={SERIES[0]} />
                    <Gradient id="wf-s" color={SERIES[3]} />
                    <Gradient id="wf-u" color={SERIES[2]} />
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="label" tick={axisTick} interval="preserveStartEnd" minTickGap={16} />
                  <YAxis tick={axisTick} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={legendStyle} />
                  <Area type="monotone" dataKey="annual" name="Annual" stroke={SERIES[0]} fill="url(#wf-a)" strokeWidth={2} />
                  <Area type="monotone" dataKey="sick" name="Sick" stroke={SERIES[3]} fill="url(#wf-s)" strokeWidth={2} />
                  <Area type="monotone" dataKey="unpaid" name="Unpaid" stroke={SERIES[2]} fill="url(#wf-u)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </DashboardCard>

            <DashboardCard
              title="Employment Type"
              exportTable={{
                columns: [
                  { header: "Employment type", value: (r) => r.name, width: 18 },
                  { header: "Employees", value: (r) => r.value },
                ],
                rows: data.byType,
              }}
            >
              <Donut data={data.byType} colors={SERIES} />
            </DashboardCard>
          </div>

          <DashboardCard
            title="Team Size vs Task Completion Rate"
            description="One point per department."
            exportTable={{
              columns: [
                { header: "Department", value: (r) => r.name, width: 18 },
                { header: "Team size", value: (r) => r.x },
                { header: "Completion rate (%)", value: (r) => r.y, width: 20 },
              ],
              rows: data.scatter,
            }}
          >
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ ...margin, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="x" type="number" name="Team size" tick={axisTick} />
                <YAxis dataKey="y" type="number" name="Completion" unit="%" domain={[60, 100]} tick={axisTick} />
                <Tooltip content={<PointTip x="Team size" y="Completion" unit="%" />} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={data.scatter} fill={SERIES[4]} />
              </ScatterChart>
            </ResponsiveContainer>
          </DashboardCard>

          <DashboardCard
            title="Department Summary"
            contentClassName="overflow-x-auto"
            exportTable={{
              columns: [
                { header: "Department", value: (r) => r.department, width: 18 },
                { header: "Location", value: (r) => r.location },
                { header: "Headcount", value: (r) => r.headcount },
                { header: "Leave days", value: (r) => r.leaveDays },
                { header: "Avg tenure (years)", value: (r) => r.avgTenure, format: "0.0", width: 18 },
                { header: "Open roles", value: (r) => r.openRoles },
              ],
              rows: data.table,
            }}
          >
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Headcount</TableHead>
                  <TableHead className="text-right">Leave Days</TableHead>
                  <TableHead className="text-right">Avg. Tenure</TableHead>
                  <TableHead className="text-right">Open Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.table.map((r) => (
                  <TableRow key={r.department}>
                    <TableCell className="font-medium">{r.department}</TableCell>
                    <TableCell className="text-muted-foreground">{r.location}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.headcount}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.leaveDays)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.avgTenure}y</TableCell>
                    <TableCell className="text-right">
                      {r.openRoles > 0 ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {r.openRoles} open
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DashboardCard>
        </>
      )}
    </DashboardPage>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Shared bits
══════════════════════════════════════════════════════════════════ */

function Gradient({ id, color }: { id: string; color: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
      <stop offset="95%" stopColor={color} stopOpacity={0} />
    </linearGradient>
  )
}

function Donut({ data, colors }: { data: { name: string; value: number }[]; colors: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
          {data.map((d, i) => (
            <Cell key={d.name} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={legendStyle} />
      </PieChart>
    </ResponsiveContainer>
  )
}

/** Scatter tooltip that names the point — recharts' default only shows x/y. */
function PointTip({
  active,
  payload,
  x,
  y,
  unit,
}: {
  active?: boolean
  payload?: { payload: { name: string; x: number; y: number } }[]
  x: string
  y: string
  unit: string
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div style={tooltipStyle} className="px-3 py-2">
      <p className="font-medium">{p.name}</p>
      <p className="text-muted-foreground">
        {x}: <span className="text-foreground tabular-nums">{fmt(p.x)}</span>
      </p>
      <p className="text-muted-foreground">
        {y}: <span className="text-foreground tabular-nums">{p.y}{unit}</span>
      </p>
    </div>
  )
}

function NoData() {
  return (
    <Empty className="rounded-4xl border border-dashed py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={Analytics01Icon} />
        </EmptyMedia>
        <EmptyTitle>No data for these filters</EmptyTitle>
        <EmptyDescription>Remove a filter or widen the period to see results.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
