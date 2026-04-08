import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

/* ── Colors ── */
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"]

/* ── Stat Card ── */
function StatCard({ label, value }: { label: string; value: string; sub?: string; trend?: "up" | "down" | "neutral" }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 flex flex-col items-center text-center">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}

/* ── Chart wrapper ── */
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

/* ══════════════════════════════════════
   PROCESS ANALYTICS DATA
══════════════════════════════════════ */

const procStatCards = [
  { label: "Total Instances",    value: "930",    sub: "+12% from last month",   trend: "up"     as const },
  { label: "Active Instances",   value: "462",    sub: "49.7% of total",         trend: "neutral" as const },
  { label: "Completed",          value: "468",    sub: "+8% from last month",    trend: "up"     as const },
  { label: "Avg. Cycle Time",    value: "4.5d",   sub: "−0.3d improvement",      trend: "up"     as const },
]

const procBarData = [
  { name: "Leave Req.",    instances: 30 },
  { name: "IT Ticket",     instances: 30 },
  { name: "Expense",       instances: 30 },
  { name: "Travel",        instances: 30 },
  { name: "Procurement",   instances: 30 },
  { name: "Onboarding",    instances: 30 },
  { name: "Training",      instances: 30 },
  { name: "WFH",           instances: 30 },
]

const procLineData = [
  { month: "Oct",  submitted: 72,  completed: 58 },
  { month: "Nov",  submitted: 88,  completed: 74 },
  { month: "Dec",  submitted: 65,  completed: 60 },
  { month: "Jan",  submitted: 94,  completed: 80 },
  { month: "Feb",  submitted: 108, completed: 91 },
  { month: "Mar",  submitted: 130, completed: 112 },
  { month: "Apr",  submitted: 143, completed: 118 },
]

const procAreaData = [
  { week: "W1 Mar", active: 42, completed: 18 },
  { week: "W2 Mar", active: 55, completed: 24 },
  { week: "W3 Mar", active: 61, completed: 32 },
  { week: "W4 Mar", active: 58, completed: 40 },
  { week: "W1 Apr", active: 73, completed: 35 },
  { week: "W2 Apr", active: 68, completed: 48 },
]

const procPieData = [
  { name: "Completed", value: 468 },
  { name: "Active",    value: 462 },
]

const procScatterData = [
  { x: 1, y: 2.1 }, { x: 2, y: 1.8 }, { x: 3, y: 3.4 }, { x: 4, y: 2.9 },
  { x: 5, y: 4.1 }, { x: 6, y: 3.7 }, { x: 7, y: 5.2 }, { x: 8, y: 4.8 },
  { x: 9, y: 6.1 }, { x: 10, y: 5.4 }, { x: 11, y: 7.2 }, { x: 12, y: 6.8 },
  { x: 13, y: 8.1 }, { x: 14, y: 7.5 }, { x: 15, y: 9.3 },
]

const procTableData = [
  { process: "Employee Onboarding",     total: 30, active: 14, completed: 16, avgDays: "5.2" },
  { process: "Expense Reimbursement",   total: 30, active: 13, completed: 17, avgDays: "2.1" },
  { process: "IT Support Ticket",       total: 30, active: 16, completed: 14, avgDays: "1.8" },
  { process: "Leave Request",           total: 30, active: 12, completed: 18, avgDays: "1.2" },
  { process: "Procurement Request",     total: 30, active: 17, completed: 13, avgDays: "6.8" },
  { process: "Travel Request",          total: 30, active: 15, completed: 15, avgDays: "4.5" },
  { process: "Hiring Request",          total: 30, active: 19, completed: 11, avgDays: "9.3" },
  { process: "Training Enrollment",     total: 30, active: 11, completed: 19, avgDays: "3.1" },
]

/* ══════════════════════════════════════
   WORKFORCE ANALYTICS DATA
══════════════════════════════════════ */

const wfStatCards = [
  { label: "Total Employees",       value: "248",   sub: "+6 new hires this month",   trend: "up"     as const },
  { label: "Departments",           value: "12",    sub: "Across 4 locations",         trend: "neutral" as const },
  { label: "On Leave Today",        value: "18",    sub: "7.3% of workforce",          trend: "neutral" as const },
  { label: "Open Positions",        value: "9",     sub: "3 in final interview stage", trend: "neutral" as const },
]

const wfBarData = [
  { dept: "Engineering",  headcount: 62 },
  { dept: "Operations",   headcount: 38 },
  { dept: "Sales",        headcount: 34 },
  { dept: "HR",           headcount: 18 },
  { dept: "Finance",      headcount: 22 },
  { dept: "Marketing",    headcount: 26 },
  { dept: "Legal",        headcount: 14 },
  { dept: "IT Support",   headcount: 34 },
]

const wfLineData = [
  { month: "Oct", hired: 4,  resigned: 1 },
  { month: "Nov", hired: 6,  resigned: 2 },
  { month: "Dec", hired: 2,  resigned: 3 },
  { month: "Jan", hired: 8,  resigned: 1 },
  { month: "Feb", hired: 5,  resigned: 2 },
  { month: "Mar", hired: 9,  resigned: 2 },
  { month: "Apr", hired: 6,  resigned: 1 },
]

const wfAreaData = [
  { week: "W1 Mar", annual: 8,  sick: 3,  unpaid: 1 },
  { week: "W2 Mar", annual: 12, sick: 5,  unpaid: 2 },
  { week: "W3 Mar", annual: 10, sick: 4,  unpaid: 1 },
  { week: "W4 Mar", annual: 15, sick: 6,  unpaid: 2 },
  { week: "W1 Apr", annual: 11, sick: 4,  unpaid: 3 },
  { week: "W2 Apr", annual: 18, sick: 7,  unpaid: 2 },
]

const wfPieData = [
  { name: "Full-time",   value: 198 },
  { name: "Contract",    value: 34  },
  { name: "Part-time",   value: 16  },
]

const wfScatterData = [
  { x: 14, y: 82 }, { x: 18, y: 78 }, { x: 22, y: 85 }, { x: 26, y: 88 },
  { x: 34, y: 90 }, { x: 34, y: 76 }, { x: 38, y: 92 }, { x: 62, y: 87 },
  { x: 22, y: 80 }, { x: 26, y: 84 }, { x: 14, y: 75 }, { x: 18, y: 91 },
]

const wfTableData = [
  { dept: "Engineering",  headcount: 62, onLeave: 4, avgTenure: "3.2y", openRoles: 3 },
  { dept: "Operations",   headcount: 38, onLeave: 3, avgTenure: "4.1y", openRoles: 1 },
  { dept: "Sales",        headcount: 34, onLeave: 2, avgTenure: "2.8y", openRoles: 2 },
  { dept: "HR",           headcount: 18, onLeave: 1, avgTenure: "5.0y", openRoles: 0 },
  { dept: "Finance",      headcount: 22, onLeave: 2, avgTenure: "4.6y", openRoles: 1 },
  { dept: "Marketing",    headcount: 26, onLeave: 3, avgTenure: "2.3y", openRoles: 1 },
  { dept: "Legal",        headcount: 14, onLeave: 1, avgTenure: "6.1y", openRoles: 0 },
  { dept: "IT Support",   headcount: 34, onLeave: 2, avgTenure: "3.7y", openRoles: 1 },
]

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */

interface AnalyticsPageProps {
  variant: "process" | "workforce"
}

export function AnalyticsPage({ variant }: AnalyticsPageProps) {
  const isProcess = variant === "process"

  const statCards   = isProcess ? procStatCards   : wfStatCards
  const barData     = (isProcess ? procBarData     : wfBarData)     as object[]
  const lineData    = (isProcess ? procLineData    : wfLineData)    as object[]
  const areaData    = (isProcess ? procAreaData    : wfAreaData)    as object[]
  const pieData     = isProcess ? procPieData     : wfPieData
  const scatterData = isProcess ? procScatterData : wfScatterData

  const barKey      = isProcess ? "instances"  : "headcount"
  const barLabel    = isProcess ? "Instances"  : "Headcount"
  const barCatKey   = isProcess ? "name"       : "dept"

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-screen-xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold">
          {isProcess ? "Process Analytics" : "Workforce Analytics"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isProcess
            ? "Instance volume, throughput, and cycle time across all business processes"
            : "Headcount distribution, hiring trends, and leave patterns across departments"}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Bar + Line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={isProcess ? "Instances by Process Type" : "Headcount by Department"}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={barCatKey} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))" }}
              />
              <Bar dataKey={barKey} name={barLabel} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={isProcess ? "Monthly Submission vs Completion" : "Monthly Hiring vs Attrition"}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))" }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {isProcess ? (
                <>
                  <Line type="monotone" dataKey="submitted" name="Submitted" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke={COLORS[1]} strokeWidth={2} dot={false} />
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey="hired"    name="Hired"    stroke={COLORS[1]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="resigned" name="Resigned" stroke={COLORS[3]} strokeWidth={2} dot={false} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Area + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard title={isProcess ? "Weekly Active vs Completed" : "Weekly Leave by Type"}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={areaData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS[0]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS[1]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS[2]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS[2]} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))" }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {isProcess ? (
                  <>
                    <Area type="monotone" dataKey="active"    name="Active"    stroke={COLORS[0]} fill="url(#colorA)" strokeWidth={2} />
                    <Area type="monotone" dataKey="completed" name="Completed" stroke={COLORS[1]} fill="url(#colorB)" strokeWidth={2} />
                  </>
                ) : (
                  <>
                    <Area type="monotone" dataKey="annual" name="Annual"  stroke={COLORS[0]} fill="url(#colorA)" strokeWidth={2} />
                    <Area type="monotone" dataKey="sick"   name="Sick"    stroke={COLORS[3]} fill="url(#colorB)" strokeWidth={2} />
                    <Area type="monotone" dataKey="unpaid" name="Unpaid"  stroke={COLORS[2]} fill="url(#colorC)" strokeWidth={2} />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title={isProcess ? "Status Distribution" : "Employment Type"}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))" }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Scatter Plot */}
      <ChartCard title={isProcess ? "Instance Volume vs Avg Cycle Time (days)" : "Team Size vs Task Completion Rate (%)"}>
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="x"
              type="number"
              name={isProcess ? "Volume" : "Team Size"}
              tick={{ fontSize: 10 }}
              label={{ value: isProcess ? "Volume" : "Team Size", position: "insideBottomRight", offset: -4, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              dataKey="y"
              type="number"
              name={isProcess ? "Cycle Time (d)" : "Completion (%)"}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))" }}
            />
            <Scatter data={scatterData} fill={COLORS[4]} opacity={0.8} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {isProcess ? "Process Summary" : "Department Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 overflow-x-auto">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                {isProcess ? (
                  <>
                    <TableHead>Process</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Avg. Days</TableHead>
                    <TableHead>Status</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Headcount</TableHead>
                    <TableHead className="text-right">On Leave</TableHead>
                    <TableHead className="text-right">Avg. Tenure</TableHead>
                    <TableHead className="text-right">Open Roles</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isProcess
                ? (procTableData).map((row) => (
                    <TableRow key={row.process}>
                      <TableCell className="font-medium">{row.process}</TableCell>
                      <TableCell className="text-right">{row.total}</TableCell>
                      <TableCell className="text-right">{row.active}</TableCell>
                      <TableCell className="text-right">{row.completed}</TableCell>
                      <TableCell className="text-right">{row.avgDays}d</TableCell>
                      <TableCell>
                        <Badge variant={row.active > row.completed ? "secondary" : "outline"} className="text-[10px]">
                          {row.active > row.completed ? "In Progress" : "On Track"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                : (wfTableData).map((row) => (
                    <TableRow key={row.dept}>
                      <TableCell className="font-medium">{row.dept}</TableCell>
                      <TableCell className="text-right">{row.headcount}</TableCell>
                      <TableCell className="text-right">{row.onLeave}</TableCell>
                      <TableCell className="text-right">{row.avgTenure}</TableCell>
                      <TableCell className="text-right">
                        {row.openRoles > 0
                          ? <Badge variant="secondary" className="text-[10px]">{row.openRoles} open</Badge>
                          : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                    </TableRow>
                  ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
