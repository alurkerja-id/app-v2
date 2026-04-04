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

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getHumanDuration(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffMs = end.getTime() - start.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    const remainHours = diffHours % 24
    return remainHours > 0 ? `${diffDays}d ${remainHours}h` : `${diffDays}d`
  }
  if (diffHours > 0) {
    const remainMins = diffMins % 60
    return remainMins > 0 ? `${diffHours}h ${remainMins}m` : `${diffHours}h`
  }
  return `${diffMins}m`
}

function getProcessDuration(request: { createdDate: string; completedDate?: string; status: string }) {
  const endDate = request.completedDate ?? new Date().toISOString()
  return getHumanDuration(request.createdDate, endDate)
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

        <div className="relative px-4 py-3 sm:px-6 sm:py-5">
          {/* Title row: avatar + process name + close */}
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-bold backdrop-blur-sm">
                {theme.abbr}
              </span>
              <h2 className="text-base sm:text-lg font-semibold font-heading leading-snug truncate">{request.process}</h2>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 shrink-0">
              <HugeiconsIcon icon={Cancel01Icon} />
            </Button>
          </div>

          {/* Status badge (always visible) */}
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Badge className={cn(
              "text-sm font-medium px-3 py-1",
              request.status === "Active"
                ? "bg-white/20 text-white border-white/30"
                : "bg-emerald-400/20 text-emerald-100 border-emerald-300/30"
            )}>
              {request.status === "Active" ? "In Progress" : "Completed"}
            </Badge>
          </div>

          {/* Metadata (hidden on mobile, visible on sm+) */}
          <div className="hidden sm:flex items-start gap-5 flex-wrap">
            <div>
              <p className="text-[11px] text-white/60 mb-0.5">Requestor</p>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold backdrop-blur-sm">
                  {request.requester.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </span>
                {request.requester}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-white/60 mb-0.5">Requested at</p>
              <p className="text-sm font-semibold">{formatDateTime(request.createdDate)}</p>
            </div>
            {request.completedDate ? (
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Completed at</p>
                <p className="text-sm font-semibold">{formatDateTime(request.completedDate)}</p>
              </div>
            ) : (
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Completed at</p>
                <p className="text-sm font-semibold text-white/40">—</p>
              </div>
            )}
            <div>
              <p className="text-[11px] text-white/60 mb-0.5">Process Duration</p>
              <p className="text-sm font-semibold">{getProcessDuration(request)}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/60 mb-0.5">Steps</p>
              <p className="text-sm font-semibold">{request.steps}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs — no Form tab */}
      <Tabs defaultValue="details" className="flex flex-col flex-1 min-h-0">
        <div className="px-4 pt-3 overflow-x-auto flex justify-start sm:justify-center">
          <TabsList className="w-max">
            {[
              { value: "details", label: "Details", icon: CheckListIcon },
              { value: "diagram", label: "Diagram", icon: Flowchart01Icon },
              { value: "history", label: "History", icon: WorkHistoryIcon },
              { value: "discussion", label: "Discussion", icon: BubbleChatIcon },
            ].map(({ value, label, icon }) => (
              <TabsTrigger key={value} value={value} className="gap-1.5 shrink-0">
                <HugeiconsIcon icon={icon} className="size-3.5" />
                {label}
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
