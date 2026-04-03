import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  CheckListIcon,
  Flowchart01Icon,
  WorkHistoryIcon,
  BubbleChatIcon,
} from "@hugeicons/core-free-icons"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DetailsTab } from "./tabs/RequestDetailsTab"
import { DiagramTab } from "@/components/tasks/tabs/DiagramTab"
import { HistoryTab } from "@/components/tasks/tabs/HistoryTab"
import { DiscussionTab } from "@/components/tasks/tabs/DiscussionTab"
import type { Request } from "@/data/requests"

interface RequestDetailPanelProps {
  request: Request
  onClose: () => void
}

const PROCESS_THEME: Record<string, { gradient: string; accent: string; abbr: string }> = {
  "Employee Onboarding": { gradient: "from-blue-600 to-indigo-700", accent: "bg-blue-400/20", abbr: "EO" },
  "Expense Reimbursement": { gradient: "from-emerald-600 to-teal-700", accent: "bg-emerald-400/20", abbr: "ER" },
  "IT Support Ticket": { gradient: "from-amber-500 to-orange-600", accent: "bg-amber-400/20", abbr: "IT" },
  "Leave Request": { gradient: "from-violet-600 to-purple-700", accent: "bg-violet-400/20", abbr: "LR" },
  "Procurement Request": { gradient: "from-rose-600 to-pink-700", accent: "bg-rose-400/20", abbr: "PR" },
  "Travel Request": { gradient: "from-cyan-600 to-sky-700", accent: "bg-cyan-400/20", abbr: "TR" },
}

const DEFAULT_THEME = { gradient: "from-zinc-600 to-zinc-700", accent: "bg-zinc-400/20", abbr: "??" }

function getRequestAge(createdDate: string) {
  const now = new Date()
  const created = new Date(createdDate)
  const diffMs = now.getTime() - created.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "1 day"
  if (diffDays < 7) return `${diffDays} days`
  const weeks = Math.floor(diffDays / 7)
  if (weeks === 1) return "1 week"
  return `${weeks} weeks`
}

export function RequestDetailPanel({ request, onClose }: RequestDetailPanelProps) {
  const theme = PROCESS_THEME[request.process] ?? DEFAULT_THEME

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Colored Header */}
      <div className={cn("relative overflow-hidden bg-gradient-to-br text-white", theme.gradient)}>
        {/* Decorative shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={cn("absolute -right-8 -top-8 size-40 rounded-full opacity-30", theme.accent)} />
          <div className={cn("absolute -right-4 top-16 size-24 rounded-full opacity-20", theme.accent)} />
          <div className={cn("absolute left-1/3 -bottom-6 size-32 rounded-full opacity-15", theme.accent)} />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
        </div>

        <div className="relative px-4 py-4 sm:px-6 sm:py-5">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-xs font-bold backdrop-blur-sm">
                  {theme.abbr}
                </span>
                <span className="text-sm font-mono text-white/60 shrink-0">{request.id}</span>
                <span className="text-sm text-white/50 shrink-0 hidden sm:inline">·</span>
                <span className="text-sm font-medium text-white/80 shrink-0 hidden sm:inline">{request.process}</span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold font-heading leading-snug line-clamp-2">{request.title}</h2>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 shrink-0">
              <HugeiconsIcon icon={Cancel01Icon} />
            </Button>
          </div>

          {/* Metadata + Status */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
            <div className="flex items-start gap-3 sm:gap-5 flex-1 min-w-0 flex-wrap">
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Age</p>
                <p className="text-sm font-semibold">{getRequestAge(request.createdDate)}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Priority</p>
                <p className="text-sm font-semibold">{request.priority}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Current Task</p>
                <p className="text-sm font-semibold">{request.currentTask === "-" ? "—" : request.currentTask}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Assignee</p>
                <p className="text-sm font-semibold">{request.assignee === "-" ? "—" : request.assignee}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Requester</p>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold backdrop-blur-sm">
                    {request.requester.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                  {request.requester}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge className={cn(
                "text-sm font-medium px-3 py-1",
                request.status === "Active"
                  ? "bg-white/20 text-white border-white/30"
                  : "bg-emerald-400/20 text-emerald-100 border-emerald-300/30"
              )}>
                {request.status === "Active" ? "In Progress" : "Completed"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs — no Form tab */}
      <Tabs defaultValue="details" className="flex flex-col flex-1 min-h-0">
        <div className="px-4 pt-3 flex justify-center overflow-x-auto">
          <TabsList className="w-max">
            {[
              { value: "details", label: "Details", icon: CheckListIcon },
              { value: "diagram", label: "Diagram", icon: Flowchart01Icon },
              { value: "history", label: "History", icon: WorkHistoryIcon },
              { value: "discussion", label: "Discussion", icon: BubbleChatIcon },
            ].map(({ value, label, icon }) => (
              <TabsTrigger key={value} value={value} className="gap-1.5">
                <HugeiconsIcon icon={icon} className="size-3.5" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.slice(0, 4)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="details">
            <DetailsTab request={request} />
          </TabsContent>
          <TabsContent value="diagram">
            <DiagramTab />
          </TabsContent>
          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>
          <TabsContent value="discussion">
            <DiscussionTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
