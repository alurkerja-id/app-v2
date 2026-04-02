import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, FilterIcon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/tasks/TaskCard"
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel"
import { TASKS } from "@/data/tasks"
import type { Task, TaskStatus, Priority } from "@/data/tasks"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 6

export function TasksPage() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All")
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return TASKS.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.process.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "All" || t.status === statusFilter
      const matchPriority = priorityFilter === "All" || t.priority === priorityFilter
      return matchSearch && matchStatus && matchPriority
    })
  }, [search, statusFilter, priorityFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSelect = (task: Task) => {
    setSelectedTask((prev) => (prev?.id === task.id ? null : task))
  }

  return (
    <div className="flex h-[calc(100vh-44px)] overflow-hidden">
      {/* Left panel: list */}
      <div
        className={cn(
          "flex flex-col border-r border-border bg-background transition-all",
          selectedTask ? "w-full md:w-80 lg:w-96" : "w-full"
        )}
      >
        {/* Filters */}
        <div className="flex flex-col gap-2 border-b border-border p-3">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-8 text-xs"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Button variant="outline" size="icon-sm">
              <HugeiconsIcon icon={FilterIcon} />
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as TaskStatus | "All")
                setPage(1)
              }}
            >
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Pending Review">Pending Review</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={priorityFilter}
              onValueChange={(v) => {
                setPriorityFilter(v as Priority | "All")
                setPage(1)
              }}
            >
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Priority</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Task count */}
        <div className="px-3 py-2 border-b border-border">
          <p className="text-[11px] text-muted-foreground">
            {filtered.length} task{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2 p-3">
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <HugeiconsIcon icon={Search01Icon} className="size-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">No tasks found</p>
                <p className="text-xs text-muted-foreground">Adjust your filters</p>
              </div>
            ) : (
              paginated.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={handleSelect}
                  selected={selectedTask?.id === task.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <p className="text-[11px] text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right panel: detail */}
      {selectedTask && (
        <div className="hidden flex-1 md:flex md:flex-col overflow-hidden">
          <TaskDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
          />
        </div>
      )}
    </div>
  )
}
