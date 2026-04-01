import {
  RiCalendarLine,
  RiChat1Line,
  RiAttachmentLine,
  RiArrowRightSLine,
} from "@remixicon/react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Task } from "@/data/tasks"

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
  selected?: boolean
}

const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-500/10 text-red-600 dark:text-red-400",
  Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

const STATUS_STYLES: Record<string, string> = {
  "In Progress": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Pending Review": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  New: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  Done: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

const STATUS_DOT: Record<string, string> = {
  "In Progress": "bg-blue-500",
  "Pending Review": "bg-amber-500 animate-pulse",
  New: "bg-zinc-400",
  Done: "bg-emerald-500",
}

const PROCESS_GRADIENTS: Record<string, string> = {
  "Employee Onboarding": "from-blue-500 to-indigo-600",
  "Expense Reimbursement": "from-emerald-500 to-teal-600",
  "IT Support Ticket": "from-amber-500 to-orange-600",
  "Leave Request": "from-violet-500 to-purple-600",
  "Procurement Request": "from-rose-500 to-pink-600",
  "Travel Request": "from-cyan-500 to-sky-600",
}

export function TaskCard({ task, onClick, selected }: TaskCardProps) {
  const gradient = PROCESS_GRADIENTS[task.process] ?? "from-zinc-500 to-zinc-600"
  const dueDate = new Date(task.dueDate)
  const now = new Date()
  const isOverdue = dueDate < now && task.status !== "Done"

  return (
    <button
      onClick={() => onClick(task)}
      className={cn(
        "w-full text-left rounded-none border bg-card p-3 transition-all hover:shadow-sm hover:border-blue-200 dark:hover:border-blue-800",
        selected
          ? "border-blue-400 dark:border-blue-600 ring-1 ring-blue-400/30"
          : "border-border"
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Process icon */}
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-none bg-gradient-to-br text-white text-[10px] font-bold",
            gradient
          )}
        >
          {task.process.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1 mb-1">
            <p className="text-xs font-semibold leading-snug line-clamp-1">{task.title}</p>
            <RiArrowRightSLine className="size-3.5 shrink-0 text-muted-foreground mt-0.5" />
          </div>

          <p className="text-[11px] text-muted-foreground mb-2">{task.process}</p>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  task.status === "Done" ? "bg-emerald-500" : "bg-blue-500"
                )}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status */}
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                STATUS_STYLES[task.status]
              )}
            >
              <span className={cn("size-1.5 rounded-full", STATUS_DOT[task.status])} />
              {task.status}
            </span>

            {/* Priority */}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                PRIORITY_STYLES[task.priority]
              )}
            >
              {task.priority}
            </span>

            {/* Due date */}
            <span
              className={cn(
                "flex items-center gap-0.5 text-[10px]",
                isOverdue ? "text-red-500" : "text-muted-foreground"
              )}
            >
              <RiCalendarLine className="size-3" />
              {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>

            {/* Meta */}
            <span className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
              {task.comments > 0 && (
                <span className="flex items-center gap-0.5">
                  <RiChat1Line className="size-3" />
                  {task.comments}
                </span>
              )}
              {task.attachments > 0 && (
                <span className="flex items-center gap-0.5">
                  <RiAttachmentLine className="size-3" />
                  {task.attachments}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
