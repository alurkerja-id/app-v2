import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { TaskCard } from "@/components/tasks/TaskCard"
import { TaskDetailPanel, type TaskMode } from "@/components/tasks/TaskDetailPanel"
import { TASKS } from "@/data/tasks"
import type { Task } from "@/data/tasks"
import { processes } from "@/components/processes/ProcessList"

type DueFilter = "all" | "overdue" | "today" | "soon"

const PAGE_SIZE = 8

function getDueCategory(dueDate: string, status: string): DueFilter {
  if (status === "Done") return "all"
  const now = new Date()
  const due = new Date(dueDate)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const diffDays = Math.ceil((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return "overdue"
  if (diffDays === 0) return "today"
  if (diffDays <= 7) return "soon"
  return "all"
}

interface TasksPageProps {
  mode?: TaskMode
}

export function TasksPage({ mode = "my-tasks" }: TasksPageProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState<string[]>([])
  const [processSearch, setProcessSearch] = useState("")
  const [dueFilter, setDueFilter] = useState<DueFilter>("all")
  const [page, setPage] = useState(1)

  const filteredProcesses = processes.filter((p) =>
    p.name.toLowerCase().includes(processSearch.toLowerCase())
  )

  const toggleProcess = (name: string) => {
    setProcessFilter((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    )
    setPage(1)
  }

  const filtered = useMemo(() => {
    return TASKS.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.process.toLowerCase().includes(search.toLowerCase()) ||
        t.author.toLowerCase().includes(search.toLowerCase())
      const matchProcess =
        processFilter.length === 0 || processFilter.includes(t.process)
      const matchDue =
        dueFilter === "all" || getDueCategory(t.dueDate, t.status) === dueFilter
      return matchSearch && matchProcess && matchDue
    })
  }, [search, processFilter, dueFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-4 md:p-6">
      <Card className="gap-0 py-0 overflow-hidden">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap px-5 py-3 border-b border-border">
          {/* Search */}
          <div className="relative w-48">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-8 h-8 shadow-none border-0 bg-muted/40 focus-visible:ring-0"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>

          {/* Due date toggle group */}
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={dueFilter}
            onValueChange={(v) => {
              setDueFilter((v as DueFilter) || "all")
              setPage(1)
            }}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="overdue">Overdue</ToggleGroupItem>
            <ToggleGroupItem value="today">Today</ToggleGroupItem>
            <ToggleGroupItem value="soon">Soon</ToggleGroupItem>
          </ToggleGroup>

          {/* Process filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                {processFilter.length > 0
                  ? `${processFilter.length} Process${processFilter.length > 1 ? "es" : ""}`
                  : "All Business Process"}
                <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-2">
              <div className="relative mb-2">
                <HugeiconsIcon icon={Search01Icon} className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search process..."
                  className="pl-7 h-8"
                  value={processSearch}
                  onChange={(e) => setProcessSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-0.5 max-h-52 overflow-y-auto">
                {filteredProcesses.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={processFilter.includes(p.name)}
                      onCheckedChange={() => toggleProcess(p.name)}
                    />
                    <span className="text-sm">{p.name}</span>
                  </label>
                ))}
              </div>
              {processFilter.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-1"
                  onClick={() => {
                    setProcessFilter([])
                    setPage(1)
                  }}
                >
                  Clear all
                </Button>
              )}
            </PopoverContent>
          </Popover>

          {/* Count */}
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} task{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Task list */}
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <HugeiconsIcon icon={Search01Icon} className="size-8 text-muted-foreground mb-2" />
            <p className="font-medium">No tasks found</p>
            <p className="text-sm text-muted-foreground">Adjust your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {paginated.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={(t) => setSelectedTask(t)}
                selected={selectedTask?.id === task.id}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    text=""
                    size="icon-sm"
                    className="pl-0!"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (page > 1) setPage((p) => p - 1)
                    }}
                    aria-disabled={page <= 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      size="icon-sm"
                      href="#"
                      isActive={p === page}
                      onClick={(e) => {
                        e.preventDefault()
                        setPage(p)
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    text=""
                    size="icon-sm"
                    className="pr-0!"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (page < totalPages) setPage((p) => p + 1)
                    }}
                    aria-disabled={page >= totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Task Detail Sheet */}
      <Sheet
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null)
        }}
      >
        <SheetContent side="right" showCloseButton={false} className="sm:max-w-4xl! w-full p-0">
          {selectedTask && (
            <TaskDetailPanel
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              mode={mode}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
