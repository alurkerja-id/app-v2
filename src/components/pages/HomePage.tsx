import { useState } from "react"
import {
  RiTaskLine,
  RiAlertLine,
  RiCalendarLine,
  RiTimeLine,
  RiGridLine,
  RiListCheck2,
  RiSearchLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiArrowRightSLine,
} from "@remixicon/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const statCards = [
  {
    label: "All Tasks",
    value: 24,
    description: "Across all processes",
    icon: RiTaskLine,
    color: "text-blue-500",
    bg: "from-blue-500/10 to-indigo-500/5",
  },
  {
    label: "Overdue",
    value: 3,
    description: "Need immediate attention",
    icon: RiAlertLine,
    color: "text-red-500",
    bg: "from-red-500/10 to-pink-500/5",
  },
  {
    label: "Due Today",
    value: 5,
    description: "Must complete today",
    icon: RiCalendarLine,
    color: "text-amber-500",
    bg: "from-amber-500/10 to-orange-500/5",
  },
  {
    label: "Upcoming",
    value: 16,
    description: "Next 7 days",
    icon: RiTimeLine,
    color: "text-emerald-500",
    bg: "from-emerald-500/10 to-teal-500/5",
  },
]

const processes = [
  {
    id: "emp",
    name: "Employee Onboarding",
    description: "Streamline new hire setup from day one",
    gradient: "from-blue-500 to-indigo-600",
    abbr: "EO",
  },
  {
    id: "exp",
    name: "Expense Reimbursement",
    description: "Submit and track expense claims",
    gradient: "from-emerald-500 to-teal-600",
    abbr: "ER",
  },
  {
    id: "it",
    name: "IT Support Ticket",
    description: "Report and resolve IT issues quickly",
    gradient: "from-amber-500 to-orange-600",
    abbr: "IT",
  },
  {
    id: "lv",
    name: "Leave Request",
    description: "Apply for leave and track approvals",
    gradient: "from-violet-500 to-purple-600",
    abbr: "LR",
  },
  {
    id: "pr",
    name: "Procurement Request",
    description: "Raise purchase requests and manage vendors",
    gradient: "from-rose-500 to-pink-600",
    abbr: "PR",
  },
  {
    id: "tr",
    name: "Travel Request",
    description: "Plan and approve business travel",
    gradient: "from-cyan-500 to-sky-600",
    abbr: "TR",
  },
]

export function HomePage() {
  const [bannerExpanded, setBannerExpanded] = useState(true)
  const [gridMode, setGridMode] = useState(true)
  const [search, setSearch] = useState("")

  const filtered = processes.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Task Summary Banner */}
      <div className="rounded-none overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative">
          {/* Header */}
          <button
            onClick={() => setBannerExpanded((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <RiTaskLine className="size-4" />
              <span className="text-sm font-semibold">Task Summary</span>
            </div>
            {bannerExpanded ? (
              <RiArrowUpSLine className="size-4 opacity-70" />
            ) : (
              <RiArrowDownSLine className="size-4 opacity-70" />
            )}
          </button>

          {bannerExpanded ? (
            <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-4">
              {statCards.map((card) => {
                const Icon = card.icon
                return (
                  <div
                    key={card.label}
                    className="rounded-none border border-white/10 bg-white/10 backdrop-blur-sm p-3"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className="size-3.5 opacity-80" />
                      <span className="text-[11px] font-medium uppercase tracking-wider opacity-70">
                        {card.label}
                      </span>
                    </div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-[11px] opacity-60 mt-0.5">{card.description}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
              {statCards.map((card) => {
                const Icon = card.icon
                return (
                  <div
                    key={card.label}
                    className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1"
                  >
                    <Icon className="size-3 opacity-80" />
                    <span className="text-xs font-semibold">{card.value}</span>
                    <span className="text-[11px] opacity-70">{card.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Start a Process */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Start a Process</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <RiSearchLine className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search processes..."
                className="pl-8 h-7 text-xs w-40"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-0.5 rounded-none border border-border bg-muted/40 p-0.5">
              <Button
                variant="ghost"
                size="icon-xs"
                className={cn(gridMode && "bg-background shadow-xs")}
                onClick={() => setGridMode(true)}
              >
                <RiGridLine />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className={cn(!gridMode && "bg-background shadow-xs")}
                onClick={() => setGridMode(false)}
              >
                <RiListCheck2 />
              </Button>
            </div>
          </div>
        </div>

        {gridMode ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((proc) => (
              <button
                key={proc.id}
                className="group flex flex-col gap-3 rounded-none border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800"
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-none bg-gradient-to-br text-white text-sm font-bold shadow-sm",
                    proc.gradient
                  )}
                >
                  {proc.abbr}
                </div>
                <div>
                  <p className="text-xs font-semibold">{proc.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                    {proc.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Start process
                  <RiArrowRightSLine className="size-3" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((proc) => (
              <button
                key={proc.id}
                className="flex items-center gap-3 rounded-none border border-border bg-card px-3 py-2.5 text-left hover:bg-muted/50 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-none bg-gradient-to-br text-white text-[10px] font-bold",
                    proc.gradient
                  )}
                >
                  {proc.abbr}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{proc.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{proc.description}</p>
                </div>
                <RiArrowRightSLine className="size-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <RiSearchLine className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">No processes found</p>
            <p className="text-xs text-muted-foreground">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  )
}
