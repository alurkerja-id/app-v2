import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon, ArrowRight01Icon, ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDistanceToNow, format } from "date-fns"
import type { Task } from "@/data/tasks"
import { formatFieldValue } from "@/lib/task-fields"

export type TaskCardVariant = "detailed" | "compact" | "expandable" | "tabular"

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
  selected?: boolean
  /**
   * "detailed" (default): variables on their own row, capped (3 rows total).
   * "compact": variables merge into the metadata row, capped tighter (2 rows total).
   * "expandable": variables hidden behind a toggle; expands to show ALL of them, uncapped.
   * "tabular": single row split into 3 columns — task info, a variable mini-table, and the chevron.
   */
  variant?: TaskCardVariant
}

/** Max number of process variables shown per task row. Compact rows have less room, so they show fewer. */
const MAX_VISIBLE_VARIABLES = 3
const MAX_VISIBLE_VARIABLES_COMPACT = 2
const MAX_VISIBLE_VARIABLES_TABULAR = 2

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

export function TaskCard({ task, onClick, selected, variant = "detailed" }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false)
  const gradient = PROCESS_GRADIENTS[task.process] ?? "from-zinc-500 to-zinc-600"
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "Done"
  const maxVariables = variant === "compact" ? MAX_VISIBLE_VARIABLES_COMPACT : MAX_VISIBLE_VARIABLES

  const variableChips = task.fields.slice(0, maxVariables).map((f) => (
    <span
      key={f.id}
      title={`${f.label}: ${formatFieldValue(f)}`}
      className="inline-block max-w-[42vw] truncate rounded-md bg-muted/60 px-1.5 py-0.5 align-middle text-[11px] text-muted-foreground sm:max-w-[160px]"
    >
      <span className="font-medium text-foreground/70">{f.label}:</span> {formatFieldValue(f)}
    </span>
  ))

  const titleContent = (
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
  )

  const metadataContent = (
    <>
      <div className="flex items-center gap-1.5 shrink-0">
        <div
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded bg-gradient-to-br text-white text-[7px] font-bold shadow-sm",
            gradient
          )}
        >
          {task.process.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </div>
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{task.process}</span>
      </div>

      {variant !== "compact" && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <Avatar className="size-4">
            <AvatarFallback className="bg-foreground/[0.08] text-foreground text-[7px] font-bold">
              {getInitials(task.author)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{task.author}</span>
        </span>
      )}

      <span
        className={cn(
          "flex items-center gap-1 text-xs shrink-0",
          variant === "compact" && "w-14 tabular-nums",
          isOverdue ? "text-destructive" : "text-muted-foreground"
        )}
      >
        <HugeiconsIcon icon={Calendar01Icon} className="size-3" />
        {formatDate(task.dueDate)}
      </span>

      {variant === "compact" ? (
        <span
          className={cn(
            "flex items-center shrink-0",
            task.priority !== "High" && "invisible"
          )}
          aria-hidden={task.priority !== "High"}
        >
          <span className="rounded-full bg-destructive/10 text-destructive px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
            High
          </span>
        </span>
      ) : (
        task.priority === "High" && (
          <span className="rounded-full bg-destructive/10 text-destructive px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0">
            High
          </span>
        )
      )}
    </>
  )

  const arrowIcon = (
    <HugeiconsIcon
      icon={ArrowRight01Icon}
      className="hidden size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:block"
    />
  )

  const variableTable = task.fields.length > 0 && (
    <div className="overflow-hidden rounded-lg border border-border/70">
      {task.fields.slice(0, MAX_VISIBLE_VARIABLES_TABULAR).map((f, i) => (
        <div
          key={f.id}
          className={cn(
            "grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-center gap-3 px-2.5 py-1.5",
            i % 2 === 0 ? "bg-muted/40" : "bg-background",
            i !== 0 && "border-t border-border/70"
          )}
        >
          <span className="truncate text-xs font-semibold text-foreground/80" title={f.label}>
            {f.label}
          </span>
          <span className="truncate text-xs font-medium text-muted-foreground" title={formatFieldValue(f)}>
            {formatFieldValue(f)}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick(task)
        }
      }}
      className={cn(
        "group flex w-full cursor-pointer flex-col gap-2 px-4 py-3 text-left transition-colors sm:px-5",
        selected ? "bg-primary/5" : "hover:bg-muted/40"
      )}
    >
      {variant === "tabular" ? (
        /* Single row, 3 columns: task info | variable mini-table | chevron */
        <div className="flex w-full items-center gap-5 min-w-0">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 lg:flex-none">
            {titleContent}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">{metadataContent}</div>
          </div>

          {task.fields.length > 0 && (
            <div className="hidden w-[420px] shrink-0 lg:block">{variableTable}</div>
          )}

          {arrowIcon}
        </div>
      ) : (
        <>
          {/* Row 1: Title + Action */}
          <div className="flex w-full items-start justify-between min-w-0 gap-3">
            {titleContent}
            {arrowIcon}
          </div>

          {/* Row 2: Metadata */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
            {metadataContent}

            {variant === "compact" && variableChips}

            {variant === "expandable" && task.fields.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded((v) => !v)
                }}
                className="ml-auto flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10"
              >
                {task.fields.length} variable{task.fields.length !== 1 ? "s" : ""}
                <HugeiconsIcon icon={expanded ? ArrowUp01Icon : ArrowDown01Icon} className="size-3" />
              </button>
            )}
          </div>

          {/* Row 3: Process variables (detailed variant only) */}
          {variant === "detailed" && task.fields.length > 0 && (
            <div className="flex flex-wrap gap-1.5 min-w-0">{variableChips}</div>
          )}

          {/* Expanded variables panel (expandable variant only) */}
          {variant === "expandable" && expanded && task.fields.length > 0 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="grid grid-cols-1 gap-x-4 gap-y-1.5 rounded-lg border border-border/70 bg-muted/30 p-2.5 sm:grid-cols-2"
            >
              {task.fields.map((f) => (
                <div key={f.id} className="flex items-baseline justify-between gap-3 text-xs min-w-0">
                  <span className="shrink-0 text-muted-foreground">{f.label}</span>
                  <span className="min-w-0 flex-1 truncate text-right font-medium" title={formatFieldValue(f)}>
                    {formatFieldValue(f)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
