import { useState } from "react"
import {
  RiArrowUpDownLine,
  RiCheckboxCircleLine,
  RiAlertLine,
} from "@remixicon/react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const summaryStats = [
  { label: "Avg Duration", value: "3.2h", unit: "per instance" },
  { label: "Avg Steps", value: "5.4", unit: "per case" },
  { label: "Min Duration", value: "0.8h", unit: "fastest case" },
  { label: "Max Duration", value: "48h", unit: "longest case" },
  { label: "Total Instances", value: "1,284", unit: "all time" },
]

interface ActivityRow {
  activity: string
  frequency: number
  avgDuration: string
  slaStatus: "ok" | "warn" | "breach"
  heatLevel: number // 0-4
}

const activityData: ActivityRow[] = [
  { activity: "Request Submitted", frequency: 1284, avgDuration: "0:05", slaStatus: "ok", heatLevel: 4 },
  { activity: "Initial Assessment", frequency: 1280, avgDuration: "0:12", slaStatus: "ok", heatLevel: 4 },
  { activity: "Data Entry", frequency: 1230, avgDuration: "0:28", slaStatus: "ok", heatLevel: 4 },
  { activity: "Document Verification", frequency: 980, avgDuration: "0:45", slaStatus: "ok", heatLevel: 3 },
  { activity: "Manager Review", frequency: 860, avgDuration: "4:12", slaStatus: "warn", heatLevel: 3 },
  { activity: "Finance Approval", frequency: 420, avgDuration: "6:30", slaStatus: "warn", heatLevel: 2 },
  { activity: "Budget Review", frequency: 310, avgDuration: "8:15", slaStatus: "breach", heatLevel: 2 },
  { activity: "Vendor Confirmation", frequency: 280, avgDuration: "12:00", slaStatus: "breach", heatLevel: 1 },
  { activity: "Security Review", frequency: 190, avgDuration: "3:20", slaStatus: "ok", heatLevel: 1 },
  { activity: "Process Execution", frequency: 1100, avgDuration: "1:45", slaStatus: "ok", heatLevel: 4 },
]

const HEAT_COLORS = [
  "bg-blue-100 dark:bg-blue-900/20",
  "bg-blue-200 dark:bg-blue-800/30",
  "bg-blue-400/40 dark:bg-blue-700/40",
  "bg-blue-500/50 dark:bg-blue-600/50",
  "bg-blue-600/70 dark:bg-blue-500/70",
]

type SortKey = "activity" | "frequency" | "avgDuration"

export function HeatmapPage() {
  const [startDate, setStartDate] = useState("2026-01-01")
  const [endDate, setEndDate] = useState("2026-04-01")
  const [instanceType, setInstanceType] = useState("all")
  const [heatmapType, setHeatmapType] = useState("frequency")
  const [sortKey, setSortKey] = useState<SortKey>("frequency")
  const [sortAsc, setSortAsc] = useState(false)

  const sorted = [...activityData].sort((a, b) => {
    if (sortKey === "activity") {
      return sortAsc ? a.activity.localeCompare(b.activity) : b.activity.localeCompare(a.activity)
    }
    if (sortKey === "frequency") {
      return sortAsc ? a.frequency - b.frequency : b.frequency - a.frequency
    }
    return sortAsc
      ? a.avgDuration.localeCompare(b.avgDuration)
      : b.avgDuration.localeCompare(a.avgDuration)
  })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v)
    else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-base font-semibold">Process Discovery</h1>
        <p className="text-xs text-muted-foreground">
          Analyze process execution patterns and activity heatmaps
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">From</label>
          <Input
            type="date"
            className="h-7 text-xs w-36"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">To</label>
          <Input
            type="date"
            className="h-7 text-xs w-36"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Select value={instanceType} onValueChange={setInstanceType}>
          <SelectTrigger className="h-7 text-xs w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Instance Types</SelectItem>
            <SelectItem value="onboarding">Employee Onboarding</SelectItem>
            <SelectItem value="expense">Expense Claim</SelectItem>
            <SelectItem value="leave">Leave Request</SelectItem>
            <SelectItem value="it">IT Support</SelectItem>
          </SelectContent>
        </Select>
        <Select value={heatmapType} onValueChange={setHeatmapType}>
          <SelectTrigger className="h-7 text-xs w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="frequency">By Frequency</SelectItem>
            <SelectItem value="duration">By Duration</SelectItem>
            <SelectItem value="sla">By SLA Status</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="ml-auto">
          Apply Filters
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {summaryStats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-center"
          >
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-[11px] font-medium text-foreground/70">{s.label}</p>
            <p className="text-[10px] text-muted-foreground">{s.unit}</p>
          </div>
        ))}
      </div>

      {/* BPMN placeholder */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-3 py-2 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold">Process Flow Heatmap</h3>
            <p className="text-[11px] text-muted-foreground">
              Color intensity represents {heatmapType === "frequency" ? "activity frequency" : heatmapType === "duration" ? "avg duration" : "SLA compliance"}
            </p>
          </div>
          {/* Heat scale legend */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Low</span>
            <div className="flex gap-0.5">
              {HEAT_COLORS.map((c, i) => (
                <div key={i} className={cn("h-3 w-4 rounded-sm", c)} />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">High</span>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <svg viewBox="0 0 720 160" className="w-full min-w-[600px]" xmlns="http://www.w3.org/2000/svg">
            {/* Arrow defs */}
            <defs>
              <marker id="harrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#9ca3af" />
              </marker>
            </defs>

            {/* Connectors */}
            <line x1="44" y1="80" x2="80" y2="80" stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#harrow)" />
            <line x1="190" y1="80" x2="226" y2="80" stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#harrow)" />
            <line x1="336" y1="80" x2="372" y2="80" stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#harrow)" />
            <line x1="482" y1="80" x2="518" y2="80" stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#harrow)" />
            <line x1="628" y1="80" x2="664" y2="80" stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#harrow)" />

            {/* Start */}
            <circle cx="30" cy="80" r="14" fill="#22c55e" />
            <text x="30" y="105" textAnchor="middle" fontSize="8" fill="#6b7280">Start</text>

            {/* Activity nodes with heat colors */}
            {[
              { x: 80, label: "Submit\nRequest", heat: 4 },
              { x: 226, label: "Initial\nAssessment", heat: 4 },
              { x: 372, label: "Document\nVerification", heat: 3 },
              { x: 518, label: "Manager\nReview", heat: 3 },
            ].map((node, i) => {
              const heatColors = ["#dbeafe","#bfdbfe","#93c5fd","#60a5fa","#3b82f6"]
              const fill = heatColors[node.heat] ?? "#f3f4f6"
              const textColor = node.heat >= 3 ? "#1e40af" : "#374151"
              const lines = node.label.split("\n")
              return (
                <g key={i}>
                  <rect
                    x={node.x}
                    y={58}
                    width={110}
                    height={44}
                    rx={6}
                    fill={fill}
                    stroke="#93c5fd"
                    strokeWidth="1.5"
                  />
                  {lines.map((line, li) => (
                    <text
                      key={li}
                      x={node.x + 55}
                      y={76 + li * 13}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="600"
                      fill={textColor}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              )
            })}

            {/* End */}
            <circle cx="678" cy="80" r="14" fill="white" stroke="#ef4444" strokeWidth="2" />
            <circle cx="678" cy="80" r="9" fill="#ef4444" />
            <text x="678" y="105" textAnchor="middle" fontSize="8" fill="#6b7280">End</text>
          </svg>
        </div>
      </div>

      {/* Metrics table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="border-b border-border px-3 py-2">
          <h3 className="text-xs font-semibold">Activity Metrics</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead
                className="text-[11px] cursor-pointer"
                onClick={() => toggleSort("activity")}
              >
                <span className="flex items-center gap-1">
                  Activity
                  <RiArrowUpDownLine className="size-3 text-muted-foreground" />
                </span>
              </TableHead>
              <TableHead
                className="text-[11px] cursor-pointer"
                onClick={() => toggleSort("frequency")}
              >
                <span className="flex items-center gap-1">
                  Frequency
                  <RiArrowUpDownLine className="size-3 text-muted-foreground" />
                </span>
              </TableHead>
              <TableHead
                className="text-[11px] cursor-pointer"
                onClick={() => toggleSort("avgDuration")}
              >
                <span className="flex items-center gap-1">
                  Avg Duration
                  <RiArrowUpDownLine className="size-3 text-muted-foreground" />
                </span>
              </TableHead>
              <TableHead className="text-[11px]">SLA Status</TableHead>
              <TableHead className="text-[11px]">Heatmap</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={row.activity} className="hover:bg-muted/30">
                <TableCell className="text-xs font-medium py-2.5">{row.activity}</TableCell>
                <TableCell className="text-xs py-2.5">{row.frequency.toLocaleString()}</TableCell>
                <TableCell className="text-xs py-2.5">{row.avgDuration}h</TableCell>
                <TableCell className="py-2.5">
                  {row.slaStatus === "ok" && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <RiCheckboxCircleLine className="size-3.5" />
                      On Track
                    </span>
                  )}
                  {row.slaStatus === "warn" && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      <RiAlertLine className="size-3.5" />
                      At Risk
                    </span>
                  )}
                  {row.slaStatus === "breach" && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-400">
                      <RiAlertLine className="size-3.5" />
                      Breached
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-2.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-3 w-3.5 rounded-sm",
                          i <= row.heatLevel - 1
                            ? HEAT_COLORS[i]
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
