import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, FilterIcon } from "@hugeicons/core-free-icons"
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
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
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

/* ── Filter Panel Content (shared between desktop sidebar & mobile sheet) ── */
function FilterPanelContent({
  search,
  onSearchChange,
  dueFilter,
  onDueFilterChange,
  processFilter,
  onToggleProcess,
  onClearProcesses,
}: {
  search: string
  onSearchChange: (v: string) => void
  dueFilter: DueFilter
  onDueFilterChange: (v: DueFilter) => void
  processFilter: string[]
  onToggleProcess: (name: string) => void
  onClearProcesses: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Search</p>
        <div className="relative">
          <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-8 h-8"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Due Date */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Due Date</p>
        <div className="grid grid-cols-2 gap-1">
          {(["all", "overdue", "today", "soon"] as const).map((value) => (
            <button
              key={value}
              onClick={() => onDueFilterChange(value)}
              className={`rounded-md border px-2 py-1 text-xs font-medium capitalize transition-colors ${
                dueFilter === value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Process */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Business Process</p>
          {processFilter.length > 0 && (
            <button
              onClick={onClearProcesses}
              className="text-[11px] text-primary hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto">
          {processes.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/60 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={processFilter.includes(p.name)}
                onCheckedChange={() => onToggleProcess(p.name)}
              />
              <span className="text-sm">{p.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TasksPage({ mode = "my-tasks" }: TasksPageProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState<string[]>([])
  const [dueFilter, setDueFilter] = useState<DueFilter>("all")
  const [page, setPage] = useState(1)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const toggleProcess = (name: string) => {
    setProcessFilter((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    )
    setPage(1)
  }

  const clearProcesses = () => {
    setProcessFilter([])
    setPage(1)
  }

  const handleSearchChange = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const handleDueFilterChange = (v: DueFilter) => {
    setDueFilter(v)
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

  const activeFilterCount =
    (dueFilter !== "all" ? 1 : 0) + processFilter.length + (search ? 1 : 0)

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-start gap-6 lg:items-stretch">
        {/* ── Desktop Filter Sidebar ── */}
        <div className="hidden w-56 shrink-0 lg:block">
          <div className="h-full p-4">
            <FilterPanelContent
              search={search}
              onSearchChange={handleSearchChange}
              dueFilter={dueFilter}
              onDueFilterChange={handleDueFilterChange}
              processFilter={processFilter}
              onToggleProcess={toggleProcess}
              onClearProcesses={clearProcesses}
            />
          </div>
        </div>

        {/* ── Task List ── */}
        <Card className="gap-0 py-0 overflow-hidden flex-1 min-w-0">
          {/* Mobile filter bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border lg:hidden">
            <Drawer open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <HugeiconsIcon icon={FilterIcon} className="size-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="size-4 p-0 justify-center text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Filters</DrawerTitle>
                </DrawerHeader>
                <div className="max-h-[60vh] overflow-y-auto px-4 pb-6">
                  <FilterPanelContent
                    search={search}
                    onSearchChange={handleSearchChange}
                    dueFilter={dueFilter}
                    onDueFilterChange={handleDueFilterChange}
                    processFilter={processFilter}
                    onToggleProcess={toggleProcess}
                    onClearProcesses={clearProcesses}
                  />
                </div>
              </DrawerContent>
            </Drawer>

            {/* Active filter pills */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {search && (
                  <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                    "{search}"
                    <button onClick={() => handleSearchChange("")} className="ml-0.5 hover:text-foreground">&times;</button>
                  </Badge>
                )}
                {dueFilter !== "all" && (
                  <Badge variant="secondary" className="shrink-0 gap-1 text-xs capitalize">
                    {dueFilter}
                    <button onClick={() => handleDueFilterChange("all")} className="ml-0.5 hover:text-foreground">&times;</button>
                  </Badge>
                )}
                {processFilter.map((p) => (
                  <Badge key={p} variant="secondary" className="shrink-0 gap-1 text-xs">
                    {p.split(" ")[0]}
                    <button onClick={() => toggleProcess(p)} className="ml-0.5 hover:text-foreground">&times;</button>
                  </Badge>
                ))}
              </div>
            )}

            <span className="ml-auto text-xs text-muted-foreground shrink-0">
              {filtered.length} task{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Desktop count bar */}
          <div className="hidden lg:flex items-center px-5 py-2.5 border-b border-border">
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
      </div>

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
