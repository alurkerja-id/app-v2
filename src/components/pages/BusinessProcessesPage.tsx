import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  FilterIcon,
  Cancel01Icon,
  CheckListIcon,
  Flowchart01Icon,
  WorkHistoryIcon,
  BubbleChatIcon,
  FileExportIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { PROCESS_INSTANCES } from "@/data/process-instances"
import type { ProcessInstance } from "@/data/process-instances"
import { processes } from "@/components/processes/ProcessList"
import { DiagramTab } from "@/components/tasks/tabs/DiagramTab"
import { HistoryTab } from "@/components/tasks/tabs/HistoryTab"
import { DiscussionTab } from "@/components/tasks/tabs/DiscussionTab"

const PAGE_SIZE = 10

const PROCESS_GRADIENTS: Record<string, string> = Object.fromEntries(
  processes.map((p) => [p.name, p.gradient])
)

const PROCESS_ABBRS: Record<string, string> = Object.fromEntries(
  processes.map((p) => [p.name, p.abbr])
)

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

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

/* ── Filter Types ── */

interface FilterValues {
  processInstanceId: string
  processName: string
  requestorName: string
  requestorEmail: string
  currentAssignee: string
  currentAssigneeEmail: string
  currentTask: string
  creationDate: string
  completionDate: string
}

const EMPTY_FILTERS: FilterValues = {
  processInstanceId: "",
  processName: "",
  requestorName: "",
  requestorEmail: "",
  currentAssignee: "",
  currentAssigneeEmail: "",
  currentTask: "",
  creationDate: "",
  completionDate: "",
}

const FILTER_LABELS: { key: keyof FilterValues; label: string; type: "text" | "date" }[] = [
  { key: "processInstanceId", label: "Process Instance ID", type: "text" },
  { key: "processName", label: "Process Name", type: "text" },
  { key: "requestorName", label: "Requestor Name", type: "text" },
  { key: "requestorEmail", label: "Requestor Email", type: "text" },
  { key: "currentAssignee", label: "Current Assignee", type: "text" },
  { key: "currentAssigneeEmail", label: "Current Assignee Email", type: "text" },
  { key: "currentTask", label: "Current Task", type: "text" },
  { key: "creationDate", label: "Creation Date", type: "date" },
  { key: "completionDate", label: "Completion Date", type: "date" },
]

/* ── Filter Grid (above table, toggleable) ── */

function FilterGrid({
  filters,
  onFilterChange,
  onClearFilters,
}: {
  filters: FilterValues
  onFilterChange: (key: keyof FilterValues, value: string) => void
  onClearFilters: () => void
}) {
  const hasActiveFilters = Object.values(filters).some((v) => v !== "")

  return (
    <div className="border-b border-border px-4 py-3 sm:px-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Filters</p>
        {hasActiveFilters && (
          <button onClick={onClearFilters} className="text-[11px] text-primary hover:underline">
            Clear all
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2.5">
        {FILTER_LABELS.map(({ key, label, type }) => (
          <div key={key} className="flex flex-col gap-1">
            <Label className="text-[11px] text-muted-foreground">{label}</Label>
            <Input
              type={type}
              placeholder={label}
              className="h-7 text-xs"
              value={filters[key]}
              onChange={(e) => onFilterChange(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Instance Detail Panel ── */

function InstanceDetailPanel({
  instance,
  onClose,
}: {
  instance: ProcessInstance
  onClose: () => void
}) {
  const gradient = PROCESS_GRADIENTS[instance.processName] ?? "from-zinc-600 to-zinc-700"
  const abbr = PROCESS_ABBRS[instance.processName] ?? "??"

  const detailFields = [
    { label: "Instance ID", value: instance.id },
    { label: "Process Name", value: instance.processName },
    { label: "Title", value: instance.title },
    { label: "Initiator", value: instance.initiator },
    { label: "Initiator Email", value: instance.initiatorEmail },
    { label: "Created", value: formatDateTime(instance.createdDate) },
    { label: "Completed", value: instance.completedDate ? formatDateTime(instance.completedDate) : "—" },
    {
      label: "Duration",
      value: getHumanDuration(instance.createdDate, instance.completedDate ?? new Date().toISOString()),
    },
    { label: "Status", value: instance.status },
    { label: "Current Task", value: instance.currentTask },
    { label: "Assignee", value: instance.assignee },
    { label: "Assignee Email", value: instance.assigneeEmail },
  ]

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Colored Header */}
      <div className={cn("relative overflow-hidden bg-gradient-to-br text-white", gradient)}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-8 -top-8 size-40 rounded-full opacity-30 bg-white/10" />
          <div className="absolute -right-4 top-16 size-24 rounded-full opacity-20 bg-white/10" />
          <div className="absolute left-1/3 -bottom-6 size-32 rounded-full opacity-15 bg-white/10" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
        </div>

        <div className="relative px-4 py-3 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-bold backdrop-blur-sm">
                {abbr}
              </span>
              <h2 className="text-base sm:text-lg font-semibold font-heading leading-snug truncate">{instance.processName}</h2>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 shrink-0">
              <HugeiconsIcon icon={Cancel01Icon} />
            </Button>
          </div>

          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Badge className={cn(
              "text-sm font-medium px-3 py-1",
              instance.status === "Active"
                ? "bg-white/20 text-white border-white/30"
                : "bg-emerald-400/20 text-emerald-100 border-emerald-300/30"
            )}>
              {instance.status === "Active" ? "In Progress" : "Completed"}
            </Badge>
          </div>

          <div className="hidden sm:flex items-start gap-5 flex-wrap">
            <div>
              <p className="text-[11px] text-white/60 mb-0.5">Initiator</p>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold backdrop-blur-sm">
                  {instance.initiator.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </span>
                {instance.initiator}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-white/60 mb-0.5">Created</p>
              <p className="text-sm font-semibold">{formatDateTime(instance.createdDate)}</p>
            </div>
            {instance.completedDate ? (
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Completed</p>
                <p className="text-sm font-semibold">{formatDateTime(instance.completedDate)}</p>
              </div>
            ) : (
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Completed</p>
                <p className="text-sm font-semibold text-white/40">—</p>
              </div>
            )}
            <div>
              <p className="text-[11px] text-white/60 mb-0.5">Duration</p>
              <p className="text-sm font-semibold">
                {getHumanDuration(instance.createdDate, instance.completedDate ?? new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
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
            <div className="p-4 sm:p-6">
              <Table>
                <TableBody>
                  {detailFields.map(({ label, value }) => (
                    <TableRow key={label}>
                      <TableCell className="w-1/3 font-medium text-muted-foreground">{label}</TableCell>
                      <TableCell>{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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

/* ── Export to Excel ── */

function exportToExcel(data: ProcessInstance[], processName: string) {
  const headers = [
    "No", "Process Instance ID", "Initiator", "Requestor Email", "Process Name",
    "Created Date", "Completion Date", "Assignee", "Assignee Email", "Current Task",
  ]
  const rows = data.map((inst, i) => [
    i + 1,
    inst.id,
    inst.initiator,
    inst.initiatorEmail,
    inst.processName,
    formatDate(inst.createdDate),
    inst.completedDate ? formatDate(inst.completedDate) : "",
    inst.assignee,
    inst.assigneeEmail,
    inst.currentTask,
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${processName.replace(/\s+/g, "_").toLowerCase()}_instances.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/* ── Main Page ── */

interface BusinessProcessesPageProps {
  processId?: string
}

export function BusinessProcessesPage({ processId }: BusinessProcessesPageProps) {
  const activeProcess = processes.find((p) => p.id === processId) ?? processes[0]

  const [selectedInstance, setSelectedInstance] = useState<ProcessInstance | null>(null)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<"id" | "initiator" | "processName" | "createdDate" | "assignee" | "currentTask">("createdDate")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleSearchChange = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const filtered = useMemo(() => {
    let result = PROCESS_INSTANCES.filter((inst) => inst.processId === activeProcess.id)

    // Keyword search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (inst) =>
          inst.id.toLowerCase().includes(q) ||
          inst.processName.toLowerCase().includes(q) ||
          inst.initiator.toLowerCase().includes(q) ||
          inst.initiatorEmail.toLowerCase().includes(q) ||
          inst.title.toLowerCase().includes(q) ||
          inst.assignee.toLowerCase().includes(q) ||
          inst.assigneeEmail.toLowerCase().includes(q) ||
          inst.currentTask.toLowerCase().includes(q)
      )
    }

    // Individual filters
    if (filters.processInstanceId) {
      result = result.filter((inst) => inst.id.toLowerCase().includes(filters.processInstanceId.toLowerCase()))
    }
    if (filters.processName) {
      result = result.filter((inst) => inst.processName.toLowerCase().includes(filters.processName.toLowerCase()))
    }
    if (filters.requestorName) {
      result = result.filter((inst) => inst.initiator.toLowerCase().includes(filters.requestorName.toLowerCase()))
    }
    if (filters.requestorEmail) {
      result = result.filter((inst) => inst.initiatorEmail.toLowerCase().includes(filters.requestorEmail.toLowerCase()))
    }
    if (filters.currentAssignee) {
      result = result.filter((inst) => inst.assignee.toLowerCase().includes(filters.currentAssignee.toLowerCase()))
    }
    if (filters.currentAssigneeEmail) {
      result = result.filter((inst) => inst.assigneeEmail.toLowerCase().includes(filters.currentAssigneeEmail.toLowerCase()))
    }
    if (filters.currentTask) {
      result = result.filter((inst) => inst.currentTask.toLowerCase().includes(filters.currentTask.toLowerCase()))
    }
    if (filters.creationDate) {
      result = result.filter((inst) => inst.createdDate.startsWith(filters.creationDate))
    }
    if (filters.completionDate) {
      result = result.filter((inst) => inst.completedDate?.startsWith(filters.completionDate))
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [activeProcess.id, search, filters, sortField, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length

  const gradient = PROCESS_GRADIENTS[activeProcess.name] ?? "from-zinc-500 to-zinc-600"
  const abbr = activeProcess.abbr

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null
    return (
      <HugeiconsIcon
        icon={sortDir === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
        className="size-3 shrink-0"
      />
    )
  }

  return (
    <div className="p-6 md:p-10 overflow-hidden">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white text-xs font-bold shadow-sm",
              gradient
            )}
          >
            {abbr}
          </div>
          <div>
            <h1 className="text-xl font-normal font-heading">{activeProcess.name}</h1>
            <p className="text-sm text-muted-foreground">{activeProcess.description}</p>
          </div>
        </div>
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        {/* Toolbar: Search (always visible) + Filter toggle + Export */}
        <div className="flex flex-col gap-2 border-b border-border px-4 py-2.5 sm:flex-row sm:items-center sm:px-5">
          {/* Search — always visible */}
          <div className="relative flex-1 min-w-0 sm:max-w-xs">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by keyword..."
              className="pl-8 h-8 text-xs"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <div className="flex flex-1 items-center gap-2">
            {/* Desktop filter toggle */}
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              className="gap-1.5 hidden lg:flex"
              onClick={() => setShowFilters((v) => !v)}
            >
              <HugeiconsIcon icon={FilterIcon} className="size-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="size-4 p-0 justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {/* Mobile filter button */}
            <Drawer open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 lg:hidden">
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
                  <div className="flex flex-col gap-3">
                    {FILTER_LABELS.map(({ key, label, type }) => (
                      <div key={key} className="flex flex-col gap-1">
                        <Label className="text-[11px] text-muted-foreground">{label}</Label>
                        <Input
                          type={type}
                          placeholder={label}
                          className="h-8 text-xs"
                          value={filters[key]}
                          onChange={(e) => handleFilterChange(key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  {Object.values(filters).some((v) => v !== "") && (
                    <button onClick={handleClearFilters} className="mt-3 text-xs text-primary hover:underline">
                      Clear all filters
                    </button>
                  )}
                </div>
              </DrawerContent>
            </Drawer>

            {/* Export — primary action */}
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => exportToExcel(filtered, activeProcess.name)}
            >
              <HugeiconsIcon icon={FileExportIcon} className="size-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>

          {/* Count — right side */}
          <span className="text-xs text-muted-foreground shrink-0">
            {filtered.length} instance{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Filter grid (toggleable, above table) */}
        {showFilters && (
          <div className="hidden lg:block">
            <FilterGrid
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        )}

        {/* Active filter pills (mobile) */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-b border-border lg:hidden">
            {FILTER_LABELS.filter(({ key }) => filters[key]).map(({ key, label }) => (
              <Badge key={key} variant="secondary" className="shrink-0 gap-1 text-xs">
                {label.split(" ")[0]}: {filters[key]}
                <button onClick={() => handleFilterChange(key, "")} className="ml-0.5 hover:text-foreground">&times;</button>
              </Badge>
            ))}
          </div>
        )}

        {/* Datatable */}
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <HugeiconsIcon icon={Search01Icon} className="size-8 text-muted-foreground mb-2" />
            <p className="font-medium">No process instances found</p>
            <p className="text-sm text-muted-foreground">Adjust your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-max">
              <TableHeader className="hidden sm:[display:table-header-group]">
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("id")}>
                    <span className="flex items-center gap-1">Process Instance ID <SortIcon field="id" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("initiator")}>
                    <span className="flex items-center gap-1">Initiator <SortIcon field="initiator" /></span>
                  </TableHead>
                  <TableHead>Requestor Email</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("processName")}>
                    <span className="flex items-center gap-1">Process Name <SortIcon field="processName" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("createdDate")}>
                    <span className="flex items-center gap-1">Created Date <SortIcon field="createdDate" /></span>
                  </TableHead>
                  <TableHead>Completion Date</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("assignee")}>
                    <span className="flex items-center gap-1">Assignee <SortIcon field="assignee" /></span>
                  </TableHead>
                  <TableHead>Assignee Email</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("currentTask")}>
                    <span className="flex items-center gap-1">Current Task <SortIcon field="currentTask" /></span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((inst, i) => (
                  <TableRow
                    key={inst.id}
                    className={cn(
                      "block sm:[display:table-row] cursor-pointer hover:bg-muted/40 sm:h-9 py-2.5 sm:py-0 px-4 sm:px-0",
                      selectedInstance?.id === inst.id && "bg-primary/5"
                    )}
                    onClick={() => setSelectedInstance(inst)}
                  >
                    {/* No */}
                    <TableCell className="flex items-center justify-between sm:[display:table-cell] p-0 pb-1 sm:p-3 sm:py-1.5 sm:text-center">
                      <span className="text-xs text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5 text-muted-foreground sm:hidden" />
                    </TableCell>
                    {/* Instance ID */}
                    <TableCell className="flex items-center gap-2 sm:[display:table-cell] p-0 py-0.5 sm:p-3 sm:py-1.5">
                      <span className="text-[11px] text-muted-foreground/60 min-w-20 shrink-0 sm:hidden">Instance ID</span>
                      <span className="text-xs font-mono">{inst.id}</span>
                    </TableCell>
                    {/* Initiator */}
                    <TableCell className="flex items-center gap-2 sm:[display:table-cell] p-0 py-0.5 sm:p-3 sm:py-1.5">
                      <span className="text-[11px] text-muted-foreground/60 min-w-20 shrink-0 sm:hidden">Initiator</span>
                      <span className="text-xs">{inst.initiator}</span>
                    </TableCell>
                    {/* Requestor Email */}
                    <TableCell className="flex items-center gap-2 sm:[display:table-cell] p-0 py-0.5 sm:p-3 sm:py-1.5">
                      <span className="text-[11px] text-muted-foreground/60 min-w-20 shrink-0 sm:hidden">Email</span>
                      <span className="text-xs text-muted-foreground">{inst.initiatorEmail}</span>
                    </TableCell>
                    {/* Process Name */}
                    <TableCell className="flex items-center gap-2 sm:[display:table-cell] p-0 py-0.5 sm:p-3 sm:py-1.5">
                      <span className="text-[11px] text-muted-foreground/60 min-w-20 shrink-0 sm:hidden">Process</span>
                      <span className="text-xs">{inst.processName}</span>
                    </TableCell>
                    {/* Created Date */}
                    <TableCell className="flex items-center gap-2 sm:[display:table-cell] p-0 py-0.5 sm:p-3 sm:py-1.5">
                      <span className="text-[11px] text-muted-foreground/60 min-w-20 shrink-0 sm:hidden">Created</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <HugeiconsIcon icon={Calendar01Icon} className="size-3 hidden sm:block" />
                        {formatDate(inst.createdDate)}
                      </span>
                    </TableCell>
                    {/* Completion Date */}
                    <TableCell className="flex items-center gap-2 sm:[display:table-cell] p-0 py-0.5 sm:p-3 sm:py-1.5">
                      <span className="text-[11px] text-muted-foreground/60 min-w-20 shrink-0 sm:hidden">Completed</span>
                      {inst.completedDate ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <HugeiconsIcon icon={Calendar01Icon} className="size-3 hidden sm:block" />
                          {formatDate(inst.completedDate)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {/* Assignee */}
                    <TableCell className="flex items-center gap-2 sm:[display:table-cell] p-0 py-0.5 sm:p-3 sm:py-1.5">
                      <span className="text-[11px] text-muted-foreground/60 min-w-20 shrink-0 sm:hidden">Assignee</span>
                      <span className="text-xs">{inst.assignee}</span>
                    </TableCell>
                    {/* Assignee Email */}
                    <TableCell className="flex items-center gap-2 sm:[display:table-cell] p-0 py-0.5 sm:p-3 sm:py-1.5">
                      <span className="text-[11px] text-muted-foreground/60 min-w-20 shrink-0 sm:hidden">Assignee Email</span>
                      <span className="text-xs text-muted-foreground">{inst.assigneeEmail}</span>
                    </TableCell>
                    {/* Current Task */}
                    <TableCell className="flex items-center gap-2 sm:[display:table-cell] p-0 py-0.5 sm:p-3 sm:py-1.5">
                      <span className="text-[11px] text-muted-foreground/60 min-w-20 shrink-0 sm:hidden">Task</span>
                      {inst.currentTask !== "-" ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                          {inst.currentTask}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-2 border-t border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-[11px] text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <Pagination className="mx-0 w-full justify-center sm:w-auto sm:justify-end">
              <PaginationContent className="gap-0.5">
                <PaginationItem>
                  <PaginationPrevious
                    text=""
                    size="icon-xs"
                    className="pl-0! text-[11px]"
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (page > 1) setPage((p) => p - 1) }}
                    aria-disabled={page <= 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      size="icon-xs"
                      className="text-[11px]"
                      href="#"
                      isActive={p === page}
                      onClick={(e) => { e.preventDefault(); setPage(p) }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    text=""
                    size="icon-xs"
                    className="pr-0! text-[11px]"
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage((p) => p + 1) }}
                    aria-disabled={page >= totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Instance Detail Sheet */}
      <Sheet
        open={!!selectedInstance}
        onOpenChange={(open) => {
          if (!open) setSelectedInstance(null)
        }}
      >
        <SheetContent side="right" showCloseButton={false} className="w-full! sm:max-w-4xl! p-0">
          {selectedInstance && (
            <InstanceDetailPanel
              instance={selectedInstance}
              onClose={() => setSelectedInstance(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
