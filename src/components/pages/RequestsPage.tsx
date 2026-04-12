import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  FilterIcon,
  InboxIcon,
  CheckmarkCircle02Icon,
  Appointment02Icon,
  CalendarCheckOut02Icon,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { cn } from "@/lib/utils"
import { formatDistanceStrict, format } from "date-fns"
import { REQUESTS } from "@/data/requests"
import type { Request } from "@/data/requests"
import { processes } from "@/components/processes/ProcessList"
import { RequestDetailPanel } from "@/components/requests/RequestDetailPanel"

const PAGE_SIZE = 10

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

function getProcessAbbr(process: string) {
  return process.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

/* ── Filter Panel Content (shared between desktop sidebar & mobile drawer) ── */
function FilterPanelContent({
  search,
  onSearchChange,
  processFilter,
  onToggleProcess,
  onClearProcesses,
}: {
  search: string
  onSearchChange: (v: string) => void
  processFilter: string[]
  onToggleProcess: (name: string) => void
  onClearProcesses: () => void
}) {
  const [processSearch, setProcessSearch] = useState("")
  const filteredProcesses = processes.filter((p) =>
    p.name.toLowerCase().includes(processSearch.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Search</p>
        <div className="relative">
          <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            className="pl-8 h-8"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
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
        <div className="relative overflow-hidden rounded-xl border border-border/70 bg-background/70">
          <div className="border-b border-border/70 p-1.5">
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search process..."
                className="h-8 border-transparent bg-background pl-8"
                value={processSearch}
                onChange={(e) => setProcessSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-background via-background/95 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-5 bg-gradient-to-t from-background via-background/95 to-transparent" />
            <div className="h-72 overflow-y-auto p-1.5">
            <div className="flex flex-col gap-0.5">
            {filteredProcesses.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                No process found
              </div>
            ) : filteredProcesses.map((p) => (
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
        </div>
      </div>
    </div>
  )
}

function RequestCard({
  request,
  onClick,
  selected,
}: {
  request: Request
  onClick: (r: Request) => void
  selected?: boolean
}) {
  const gradient = PROCESS_GRADIENTS[request.process] ?? "from-zinc-500 to-zinc-600"
  const completedDateStr = request.completedDate ? format(new Date(request.completedDate), "MMM d") : ""
  const durationStr = formatDistanceStrict(
    request.completedDate ? new Date(request.completedDate) : new Date(),
    new Date(request.createdDate)
  )

  return (
    <button
      onClick={() => onClick(request)}
      className={cn(
        "group flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors sm:px-5",
        selected ? "bg-primary/5" : "hover:bg-muted/40"
      )}
    >
      <div className="flex w-full items-start justify-between min-w-0 gap-3">
        {/* Row 1: Process Logo, Process Name, Process ID */}
        <div className="flex gap-2.5 items-center flex-1 min-w-0">
          <div
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded bg-gradient-to-br text-white text-[8px] font-bold shadow-sm",
              gradient
            )}
          >
            {getProcessAbbr(request.process)}
          </div>
          <p className="text-sm leading-snug whitespace-normal min-w-0 flex items-center flex-wrap gap-x-1.5 flex-1">
            <span className="font-medium text-foreground">{request.process}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs font-mono text-muted-foreground">{request.id}</span>
          </p>
        </div>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="hidden size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:block mt-0.5"
        />
      </div>

      {/* Row 2: User avatar & name, timeline visual, priority */}
      <div className="flex items-center justify-start w-full gap-3 flex-wrap min-w-0 mt-1">
        <span className="flex items-center gap-1.5 text-xs text-foreground font-medium min-w-0">
          <Avatar className="size-4">
            <AvatarFallback className="bg-foreground/[0.08] text-[7px] font-bold">
              {getInitials(request.requester)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{request.requester}</span>
          {request.priority === "High" && (
            <span className="rounded-full bg-destructive/10 text-destructive px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ml-1">
              High
            </span>
          )}
        </span>

        {/* Race Duration Timeline */}
        <div className="flex items-center gap-1.5 rounded-full bg-secondary/40 border border-border/40 px-2.5 py-0.5 flex-shrink-0">
          <div className="flex items-center gap-1 title-xs text-xs font-medium text-muted-foreground">
            <HugeiconsIcon icon={CalendarCheckOut02Icon} className="size-3.5 opacity-60" />
            <span>{formatDate(request.createdDate)}</span>
          </div>
          
          <div className="flex items-center text-muted-foreground/50 gap-0.5">
            <div className="w-3 border-t border-dashed border-current relative top-px" />
            <span className="text-xs font-medium px-1 border-current">
              {durationStr}
            </span>
            <div className="flex items-center">
              <div className="w-3 border-t border-dashed border-current relative top-px" />
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-2.5 -ml-[3px]" />
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            {request.completedDate ? (
              <>
                <HugeiconsIcon icon={Appointment02Icon} className="size-3.5 opacity-60" />
                <span>{completedDateStr}</span>
              </>
            ) : (
              <>
                 <span className="size-1.5 rounded-full bg-primary/60 animate-pulse ml-0.5" />
                 <span className="italic">Ongoing</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

interface RequestsPageProps {
  status?: "active" | "completed"
}

type SortOrder = 
  | "created_desc"
  | "created_asc"
  | "completed_desc"
  | "completed_asc"
  | "duration_asc"
  | "duration_desc"

export function RequestsPage({ status = "active" }: RequestsPageProps) {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState<SortOrder>("created_desc")

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

  const filtered = useMemo(() => {
    return REQUESTS.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.process.toLowerCase().includes(search.toLowerCase()) ||
        r.requester.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase())
      const matchProcess =
        processFilter.length === 0 || processFilter.includes(r.process)
      const matchStatus =
        status === "active" ? r.status === "Active" : r.status === "Completed"
      return matchSearch && matchProcess && matchStatus
    }).sort((a, b) => {
      if (sortOrder === "created_desc") return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      if (sortOrder === "created_asc") return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
      if (sortOrder === "completed_desc") return (b.completedDate ? new Date(b.completedDate).getTime() : 0) - (a.completedDate ? new Date(a.completedDate).getTime() : 0)
      if (sortOrder === "completed_asc") return (a.completedDate ? new Date(a.completedDate).getTime() : Infinity) - (b.completedDate ? new Date(b.completedDate).getTime() : Infinity)
      
      const durA = (a.completedDate ? new Date(a.completedDate).getTime() : Date.now()) - new Date(a.createdDate).getTime()
      const durB = (b.completedDate ? new Date(b.completedDate).getTime() : Date.now()) - new Date(b.createdDate).getTime()
      
      if (sortOrder === "duration_asc") return durA - durB
      if (sortOrder === "duration_desc") return durB - durA
      
      return 0
    })
  }, [search, processFilter, status, sortOrder])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const activeFilterCount =
    processFilter.length + (search ? 1 : 0)

  const pageTitle = status === "completed" ? "Completed Requests" : "Active Requests"
  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-xl font-normal font-heading">
          <HugeiconsIcon icon={status === "completed" ? CheckmarkCircle02Icon : InboxIcon} className="size-5 text-muted-foreground" />
          {pageTitle}
        </h1>
      </div>
      <div className="flex gap-6 items-start">
        {/* ── Desktop Filter Sidebar ── */}
        <div className="hidden lg:block w-56 shrink-0 sticky top-4 md:top-6">
          <FilterPanelContent
            search={search}
            onSearchChange={handleSearchChange}
            processFilter={processFilter}
            onToggleProcess={toggleProcess}
            onClearProcesses={clearProcesses}
          />
        </div>

        {/* ── Request List ── */}
        <Card className="gap-0 py-0 overflow-hidden flex-1 min-w-0">
          {/* Mobile filter bar */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-border lg:hidden">
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
                {processFilter.map((p) => (
                  <Badge key={p} variant="secondary" className="shrink-0 gap-1 text-xs">
                    {p.split(" ")[0]}
                    <button onClick={() => toggleProcess(p)} className="ml-0.5 hover:text-foreground">&times;</button>
                  </Badge>
                ))}
              </div>
            )}

            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
              <SelectTrigger className="h-7 text-[10px] w-auto border-border px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Req. Newest</SelectItem>
                <SelectItem value="created_asc">Req. Oldest</SelectItem>
                <SelectItem value="completed_desc">Done Newest</SelectItem>
                <SelectItem value="completed_asc">Done Oldest</SelectItem>
                <SelectItem value="duration_asc">Short Duration</SelectItem>
                <SelectItem value="duration_desc">Long Duration</SelectItem>
              </SelectContent>
            </Select>

            <span className="ml-auto text-xs text-muted-foreground shrink-0">
              {filtered.length} request{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Desktop count bar */}
          <div className="hidden lg:flex items-center justify-between px-5 py-2.5 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Sort by:</span>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
                <SelectTrigger className="h-7 text-xs border-none shadow-none focus:ring-0 px-2 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">Request Time (Newest)</SelectItem>
                  <SelectItem value="created_asc">Request Time (Oldest)</SelectItem>
                  <SelectItem value="completed_desc">Completion Time (Newest)</SelectItem>
                  <SelectItem value="completed_asc">Completion Time (Oldest)</SelectItem>
                  <SelectItem value="duration_asc">Shortest Duration</SelectItem>
                  <SelectItem value="duration_desc">Longest Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-muted-foreground">
              {filtered.length} request{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Request list */}
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HugeiconsIcon icon={Search01Icon} className="size-8 text-muted-foreground mb-2" />
              <p className="font-medium">No requests found</p>
              <p className="text-sm text-muted-foreground">Adjust your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {paginated.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  onClick={(r) => setSelectedRequest(r)}
                  selected={selectedRequest?.id === req.id}
                />
              ))}
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
                        size="icon-xs"
                        className="text-[11px]"
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
                      size="icon-xs"
                      className="pr-0! text-[11px]"
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

      {/* Request Detail Sheet */}
      <Sheet
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(null)
        }}
      >
        <SheetContent side="right" showCloseButton={false} className="w-full! sm:max-w-4xl! p-0">
          {selectedRequest && (
            <RequestDetailPanel
              request={selectedRequest}
              onClose={() => setSelectedRequest(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
