import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
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

const PROCESS_GRADIENTS: Record<string, string> = {
  "Employee Onboarding": "from-blue-500 to-indigo-600",
  "Expense Reimbursement": "from-emerald-500 to-teal-600",
  "IT Support Ticket": "from-amber-500 to-orange-600",
  "Leave Request": "from-violet-500 to-purple-600",
  "Procurement Request": "from-rose-500 to-pink-600",
  "Travel Request": "from-cyan-500 to-sky-600",
}

const PROCESS_TEXT_COLOR: Record<string, string> = {
  "Employee Onboarding": "text-blue-500",
  "Expense Reimbursement": "text-emerald-500",
  "IT Support Ticket": "text-amber-500",
  "Leave Request": "text-violet-500",
  "Procurement Request": "text-rose-500",
  "Travel Request": "text-cyan-500",
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

export function TaskCard({ task, onClick, selected }: TaskCardProps) {
  const gradient = PROCESS_GRADIENTS[task.process] ?? "from-zinc-500 to-zinc-600"
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "Done"

  return (
    <button
      onClick={() => onClick(task)}
      className={cn(
        "flex items-center gap-3 px-5 py-3 text-left transition-colors group w-full",
        selected ? "bg-primary/5" : "hover:bg-muted/40"
      )}
    >
      {/* Process icon */}
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white text-xs font-bold shadow-sm",
          gradient
        )}
      >
        {task.process.split(" ").map((w) => w[0]).join("").slice(0, 2)}
      </div>

      {/* Content — 2 rows */}
      <div className="min-w-0 flex-1">
        {/* Row 1: title + process name */}
        <p className="text-sm leading-snug truncate">
          <span className="font-medium">{task.title}</span>
          <span className="mx-1.5 text-muted-foreground">·</span>
          <span className={cn("text-xs font-medium", PROCESS_TEXT_COLOR[task.process] ?? "text-muted-foreground")}>{task.process}</span>
        </p>
        {/* Row 2: metadata */}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs font-mono text-muted-foreground shrink-0">{task.id}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <span className="flex size-4 items-center justify-center rounded-full border border-current text-[7px] font-bold leading-none">
              {getInitials(task.author)}
            </span>
            {task.author}
          </span>
          <span
            className={cn(
              "flex items-center gap-1 text-xs shrink-0",
              isOverdue ? "text-red-500" : "text-muted-foreground"
            )}
          >
            <HugeiconsIcon icon={Calendar01Icon} className="size-3" />
            {formatDate(task.dueDate)}
          </span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-xs font-medium shrink-0",
              PRIORITY_STYLES[task.priority]
            )}
          >
            {task.priority}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors"
      />
    </button>
  )
}
