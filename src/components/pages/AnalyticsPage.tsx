import { useState } from "react"
import {
  RiInboxLine,
  RiTimeLine,
  RiStarLine,
  RiTeamLine,
} from "@remixicon/react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const statCards = [
  {
    label: "Total Requests",
    value: "1,284",
    trend: "+12%",
    trendUp: true,
    sub: "vs last month",
    icon: RiInboxLine,
    ring: "ring-blue-200 dark:ring-blue-800",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    label: "Avg Resolution",
    value: "2.4h",
    trend: "+8%",
    trendUp: true,
    sub: "faster than last month",
    icon: RiTimeLine,
    ring: "ring-violet-200 dark:ring-violet-800",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    label: "Satisfaction",
    value: "98%",
    trend: "Target: 95%",
    trendUp: true,
    sub: "user rating",
    icon: RiStarLine,
    ring: "ring-amber-200 dark:ring-amber-800",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    label: "Active Staff",
    value: "42",
    trend: "+38 more",
    trendUp: true,
    sub: "team members",
    icon: RiTeamLine,
    ring: "ring-teal-200 dark:ring-teal-800",
    iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
]

const BAR_DATA = [
  { day: "M", val: 52 },
  { day: "T", val: 78 },
  { day: "W", val: 65 },
  { day: "T", val: 91 },
  { day: "F", val: 83 },
  { day: "S", val: 44 },
  { day: "S", val: 20 },
  { day: "M", val: 68 },
  { day: "T", val: 95 },
  { day: "W", val: 72 },
  { day: "T", val: 88 },
  { day: "F", val: 76 },
  { day: "S", val: 38 },
  { day: "S", val: 15 },
]

const maxVal = Math.max(...BAR_DATA.map((d) => d.val))

// Donut segments: green 64%, blue 28%, red 8%
// SVG donut: cx=50, cy=50, r=35
const DONUT_R = 35
const DONUT_CX = 50
const DONUT_CY = 50
const CIRC = 2 * Math.PI * DONUT_R

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function donutSegment(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

const donutSegments = [
  { label: "Completed", pct: 64, color: "#22c55e", stroke: "#22c55e" },
  { label: "In Progress", pct: 28, color: "#3b82f6", stroke: "#3b82f6" },
  { label: "Overdue", pct: 8, color: "#ef4444", stroke: "#ef4444" },
]

const avatarColors = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
]
const avatarInitials = ["AW", "JD", "DP"]

export function AnalyticsPage() {
  const [period, setPeriod] = useState("14d")

  // Build donut paths
  let angle = 0
  const paths = donutSegments.map((seg) => {
    const sweep = (seg.pct / 100) * 360
    const path = donutSegment(DONUT_CX, DONUT_CY, DONUT_R, angle, angle + sweep)
    angle += sweep
    return { ...seg, path }
  })

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-base font-semibold">Analytics</h1>
        <p className="text-xs text-muted-foreground">Performance overview across all processes</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={cn(
                "rounded-2xl border bg-card p-4 ring-1",
                card.ring
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <div className={cn("flex size-7 items-center justify-center rounded-lg", card.iconBg)}>
                  <Icon className="size-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <div className="mt-1 flex items-center gap-1">
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    card.trendUp
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500"
                  )}
                >
                  {card.trend}
                </span>
                <span className="text-[11px] text-muted-foreground">{card.sub}</span>
              </div>
              {card.label === "Active Staff" && (
                <div className="mt-2 flex items-center gap-1.5">
                  <AvatarGroup>
                    {avatarInitials.map((init, i) => (
                      <Avatar key={i} size="sm">
                        <AvatarFallback
                          className={cn(
                            "bg-gradient-to-br text-white text-[9px]",
                            avatarColors[i]
                          )}
                        >
                          {init}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    <AvatarGroupCount className="size-6 text-[9px]">+38</AvatarGroupCount>
                  </AvatarGroup>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Bar chart (2/3) */}
        <div className="rounded-2xl border border-border bg-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold">Request Volume Trends</h3>
              <p className="text-[11px] text-muted-foreground">Daily request activity</p>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-28 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="14d">Last 14 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-1 h-36 relative">
            {/* Background columns */}
            {BAR_DATA.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group h-full">
                {/* Tooltip */}
                <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] rounded px-1.5 py-0.5 pointer-events-none z-10">
                  {d.val}
                </div>
                <div className="w-full flex-1 flex flex-col justify-end">
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-blue-600 to-indigo-500 transition-all hover:from-blue-500 hover:to-indigo-400 cursor-default"
                    style={{ height: `${(d.val / maxVal) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut chart (1/3) */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-4">
            <h3 className="text-xs font-semibold">Status Distribution</h3>
            <p className="text-[11px] text-muted-foreground">Request breakdown by status</p>
          </div>

          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <svg viewBox="0 0 100 100" className="size-36">
                {paths.map((seg, i) => (
                  <path
                    key={i}
                    d={seg.path}
                    fill="none"
                    stroke={seg.stroke}
                    strokeWidth="12"
                    strokeLinecap="butt"
                  />
                ))}
                {/* Center text */}
                <text
                  x="50"
                  y="47"
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill="currentColor"
                  className="text-foreground"
                >
                  Total
                </text>
                <text
                  x="50"
                  y="58"
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill="currentColor"
                  className="text-foreground"
                >
                  1,284
                </text>
              </svg>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {donutSegments.map((seg) => (
              <div key={seg.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: seg.color }}
                  />
                  <span className="text-xs text-muted-foreground">{seg.label}</span>
                </div>
                <span className="text-xs font-semibold">{seg.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
