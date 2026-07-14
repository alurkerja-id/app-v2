import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import type { Task } from "@/data/tasks"
import { formatFieldValue } from "@/lib/task-fields"

interface TaskTableProps {
  tasks: Task[]
  onSelect: (task: Task) => void
  selectedId?: string
}

/** Tables need a fixed column set, so we cap how many distinct variable columns can appear. */
const MAX_VARIABLE_COLUMNS = 4

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

/**
 * Different tasks — even within the same process — can carry different fields.
 * A table needs a fixed set of columns, so we pick the variable names that occur
 * most often across the given tasks (capped) and fall back to "—" per row when a
 * task doesn't have that particular field. If variables differ too much from task
 * to task, the expandable list view is a better fit than a table.
 */
function getVariableColumns(tasks: Task[]): string[] {
  const firstSeenOrder: string[] = []
  const frequency = new Map<string, number>()
  tasks.forEach((t) => {
    t.fields.forEach((f) => {
      if (!frequency.has(f.label)) firstSeenOrder.push(f.label)
      frequency.set(f.label, (frequency.get(f.label) ?? 0) + 1)
    })
  })
  return firstSeenOrder
    .sort((a, b) => (frequency.get(b) ?? 0) - (frequency.get(a) ?? 0))
    .slice(0, MAX_VARIABLE_COLUMNS)
}

export function TaskTable({ tasks, onSelect, selectedId }: TaskTableProps) {
  const variableColumns = getVariableColumns(tasks)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Process</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Due</TableHead>
          {variableColumns.map((col) => (
            <TableHead key={col} className="text-muted-foreground">
              {col}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const gradient = PROCESS_GRADIENTS[task.process] ?? "from-zinc-500 to-zinc-600"
          const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "Done"

          return (
            <TableRow
              key={task.id}
              onClick={() => onSelect(task)}
              data-state={selectedId === task.id ? "selected" : undefined}
              className="cursor-pointer"
            >
              <TableCell className="max-w-[240px] whitespace-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {task.title}
                    {task.priority === "High" && (
                      <span className="rounded-full bg-destructive/10 text-destructive px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0">
                        High
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{task.id}</span>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-1.5">
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
              </TableCell>

              <TableCell>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Avatar className="size-5">
                    <AvatarFallback className="bg-foreground/[0.08] text-foreground text-[8px] font-bold">
                      {getInitials(task.author)}
                    </AvatarFallback>
                  </Avatar>
                  {task.author}
                </span>
              </TableCell>

              <TableCell>
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    isOverdue ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  <HugeiconsIcon icon={Calendar01Icon} className="size-3" />
                  {formatDate(task.dueDate)}
                </span>
              </TableCell>

              {variableColumns.map((col) => {
                const field = task.fields.find((f) => f.label === col)
                const value = field ? formatFieldValue(field) : "—"
                return (
                  <TableCell key={col} className="max-w-[160px]">
                    <span className="block truncate text-xs text-muted-foreground" title={value}>
                      {value}
                    </span>
                  </TableCell>
                )
              })}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
