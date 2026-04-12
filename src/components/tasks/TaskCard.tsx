import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDistanceToNow, format } from "date-fns"
import type { Task } from "@/data/tasks"

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
  selected?: boolean
}


const PROCESS_GRADIENTS: Record<string, string> = {
  "Employee Onboarding": "from-blue-500 to-indigo-600",
  "Expense Reimbursement": "from-emerald-500 to-teal-600",
  "IT Support Ticket": "from-amber-500 to-orange-600",
  "Leave Request": "from-violet-500 to-purple-600",
  "Procurement Request": "from-rose-500 to-pink-600",
  "Travel Request": "from-cyan-500 to-sky-600",
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
        "group flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors sm:px-5",
        selected ? "bg-primary/5" : "hover:bg-muted/40"
      )}
    >
      {/* Row 1: Title + Action */}
      <div className="flex w-full items-start justify-between min-w-0 gap-3">
        <p className="text-sm leading-snug whitespace-normal min-w-0 flex-1 flex flex-wrap items-center gap-y-0.5">
          <span className="font-medium">{task.title}</span>
          <span className="mx-1.5 text-muted-foreground flex-shrink-0">·</span>
          <span className="text-xs font-mono text-muted-foreground flex-shrink-0">{task.id}</span>
          <span className="mx-1.5 text-muted-foreground flex-shrink-0">·</span>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground flex-shrink-0 border-b border-dotted border-muted-foreground/50 cursor-help">
                  {formatDistanceToNow(new Date(task.createdDate), { addSuffix: true })}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{format(new Date(task.createdDate), "PP p")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </p>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="hidden size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:block mt-0.5"
        />
      </div>

      {/* Row 2: Metadata */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded bg-gradient-to-br text-white text-[7px] font-bold shadow-sm",
              gradient
            )}
          >
            {task.process.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </div>
          <span className="text-xs font-medium text-muted-foreground">{task.process}</span>
        </div>

        <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <Avatar className="size-4">
            <AvatarFallback className="bg-foreground/[0.08] text-foreground text-[7px] font-bold">
              {getInitials(task.author)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{task.author}</span>
        </span>

        <span
          className={cn(
            "flex items-center gap-1 text-xs shrink-0",
            isOverdue ? "text-destructive" : "text-muted-foreground"
          )}
        >
          <HugeiconsIcon icon={Calendar01Icon} className="size-3" />
          {formatDate(task.dueDate)}
        </span>

        {task.priority === "High" && (
          <span className="rounded-full bg-destructive/10 text-destructive px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0">
            High
          </span>
        )}
      </div>
    </button>
  )
}
