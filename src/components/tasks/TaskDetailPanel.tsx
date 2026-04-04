import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  FileEditIcon,
  CheckListIcon,
  Flowchart01Icon,
  WorkHistoryIcon,
  BubbleChatIcon,
} from "@hugeicons/core-free-icons"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FormTab } from "./tabs/FormTab"
import { DetailsTab } from "./tabs/DetailsTab"
import { DiagramTab } from "./tabs/DiagramTab"
import { HistoryTab } from "./tabs/HistoryTab"
import { DiscussionTab } from "./tabs/DiscussionTab"
import type { Task } from "@/data/tasks"

export type TaskMode = "my-tasks" | "group-tasks"

interface TaskDetailPanelProps {
  task: Task
  onClose: () => void
  mode?: TaskMode
}

const PROCESS_THEME: Record<string, { gradient: string; accent: string; abbr: string; btnText: string }> = {
  "Employee Onboarding": { gradient: "from-blue-600 to-indigo-700", accent: "bg-blue-400/20", abbr: "EO", btnText: "text-indigo-700 dark:text-indigo-300" },
  "Expense Reimbursement": { gradient: "from-emerald-600 to-teal-700", accent: "bg-emerald-400/20", abbr: "ER", btnText: "text-teal-700 dark:text-teal-300" },
  "IT Support Ticket": { gradient: "from-amber-500 to-orange-600", accent: "bg-amber-400/20", abbr: "IT", btnText: "text-orange-600 dark:text-orange-300" },
  "Leave Request": { gradient: "from-violet-600 to-purple-700", accent: "bg-violet-400/20", abbr: "LR", btnText: "text-purple-700 dark:text-purple-300" },
  "Procurement Request": { gradient: "from-rose-600 to-pink-700", accent: "bg-rose-400/20", abbr: "PR", btnText: "text-pink-700 dark:text-pink-300" },
  "Travel Request": { gradient: "from-cyan-600 to-sky-700", accent: "bg-cyan-400/20", abbr: "TR", btnText: "text-sky-700 dark:text-sky-300" },
}

const DEFAULT_THEME = { gradient: "from-zinc-600 to-zinc-700", accent: "bg-zinc-400/20", abbr: "??", btnText: "text-zinc-700 dark:text-zinc-300" }

function getTaskAge(createdDate: string) {
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

export function TaskDetailPanel({ task, onClose, mode = "my-tasks" }: TaskDetailPanelProps) {
  const theme = PROCESS_THEME[task.process] ?? DEFAULT_THEME

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Colored Header */}
      <div className={cn("relative overflow-hidden bg-gradient-to-br text-white", theme.gradient)}>
        {/* Decorative shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={cn("absolute -right-8 -top-8 size-40 rounded-full opacity-30", theme.accent)} />
          <div className={cn("absolute -right-4 top-16 size-24 rounded-full opacity-20", theme.accent)} />
          <div className={cn("absolute left-1/3 -bottom-6 size-32 rounded-full opacity-15", theme.accent)} />
          {/* Subtle dot grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
        </div>

        <div className="relative px-4 py-4 sm:px-6 sm:py-5">
          {/* Title row: badge + id + title + process + close */}
          <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-xs font-bold backdrop-blur-sm">
                  {theme.abbr}
                </span>
                <span className="text-sm font-medium text-white/80 shrink-0">{task.process}</span>
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold font-heading leading-snug line-clamp-2">{task.title}</h2>
                <span className="text-xs font-mono text-white/50 shrink-0">#{task.id}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 shrink-0">
              <HugeiconsIcon icon={Cancel01Icon} />
            </Button>
          </div>

          {/* Metadata + Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
            <div className="flex items-start gap-3 sm:gap-5 flex-1 min-w-0 flex-wrap">
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Task Age</p>
                <p className="text-sm font-semibold">{getTaskAge(task.createdDate)}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Priority</p>
                <p className="text-sm font-semibold">{task.priority}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Due Date</p>
                <p className="text-sm font-semibold">{task.dueDate}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Assignee</p>
                <p className="text-sm font-semibold">{task.author}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Initiator</p>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold backdrop-blur-sm">
                    {task.author.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                  {task.author}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {mode === "my-tasks" ? (
                <>
                  <Button variant="outline" size="sm" className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white">
                    Delegate
                  </Button>
                  <Button variant="outline" size="sm" className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white">
                    Unclaim
                  </Button>
                  <Button size="sm" className={cn("bg-white hover:bg-white/90 font-semibold shadow-sm dark:bg-white/20 dark:text-white dark:hover:bg-white/30", theme.btnText)}>
                    Complete Task
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white">
                    Delegate
                  </Button>
                  <Button size="sm" className={cn("bg-white hover:bg-white/90 font-semibold shadow-sm dark:bg-white/20 dark:text-white dark:hover:bg-white/30", theme.btnText)}>
                    Claim
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="form" className="flex flex-col flex-1 min-h-0">
        <div className="px-4 pt-3 flex justify-center overflow-x-auto">
          <TabsList className="w-max">
            {[
              { value: "form", label: "Form", icon: FileEditIcon },
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
          <TabsContent value="form">
            <FormTab task={task} />
          </TabsContent>
          <TabsContent value="details">
            <DetailsTab task={task} />
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
