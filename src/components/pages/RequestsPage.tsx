import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  FilterIcon,
  InboxIcon,
  CheckmarkCircle02Icon,
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

const PROCESS_TEXT_COLOR: Record<string, string> = {
  "Employee Onboarding": "text-blue-500",
  "Expense Reimbursement": "text-emerald-500",
  "IT Support Ticket": "text-amber-500",
  "Leave Request": "text-violet-500",
  "Procurement Request": "text-rose-500",
  "Travel Request": "text-cyan-500",
}

const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-500/10 text-red-600 dark:text-red-400",
  Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
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

  return (
    <button
      onClick={() => onClick(request)}
      className={cn(
        "group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors sm:items-center sm:px-5",
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
        {getProcessAbbr(request.process)}
      </div>

      {/* Content — 2 rows */}
      <div className="min-w-0 flex-1">
        {/* Row 1: title + process name */}
        <p className="text-sm leading-snug whitespace-normal">
          <span className="font-medium">{request.title}</span>
          <span className="mx-1.5 text-muted-foreground">·</span>
          <span className={cn("text-xs font-medium", PROCESS_TEXT_COLOR[request.process] ?? "text-muted-foreground")}>{request.process}</span>
        </p>
        {/* Row 2: metadata */}
        <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground shrink-0">{request.id}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <span className="flex size-4 items-center justify-center rounded-full border border-current text-[7px] font-bold leading-none">
              {getInitials(request.requester)}
            </span>
            <span className="hidden sm:inline">{request.requester}</span>
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <HugeiconsIcon icon={Calendar01Icon} className="size-3" />
            {formatDate(request.createdDate)}
          </span>
          {request.currentTask !== "-" && (
            <span className="flex items-center gap-1.5 text-xs shrink-0 hidden sm:flex">
              <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-muted-foreground">{request.currentTask}</span>
            </span>
          )}
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-xs font-medium shrink-0",
              PRIORITY_STYLES[request.priority]
            )}
          >
            {request.priority}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        className="hidden size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:block"
      />
    </button>
  )
}

interface RequestsPageProps {
  status?: "active" | "completed"
}

export function RequestsPage({ status = "active" }: RequestsPageProps) {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState<string[]>([])
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
    })
  }, [search, processFilter, status])

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

            <span className="ml-auto text-xs text-muted-foreground shrink-0">
              {filtered.length} request{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Desktop count bar */}
          <div className="hidden lg:flex items-center justify-end px-5 py-2.5 border-b border-border">
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
