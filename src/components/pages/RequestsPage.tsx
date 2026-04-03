import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
// Status is controlled via sidebar sub-menu
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { REQUESTS } from "@/data/requests"
import type { Request } from "@/data/requests"
import { processes } from "@/components/processes/ProcessList"
import { RequestDetailPanel } from "@/components/requests/RequestDetailPanel"

const PAGE_SIZE = 8

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
        {getProcessAbbr(request.process)}
      </div>

      {/* Content — 2 rows */}
      <div className="min-w-0 flex-1">
        {/* Row 1: title + process name */}
        <p className="text-sm leading-snug truncate">
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
        className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors"
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
  const [processSearch, setProcessSearch] = useState("")
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

  return (
    <div className="p-4 md:p-6">
      <Card className="gap-0 py-0 overflow-hidden">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap px-5 py-3 border-b border-border">
            {/* Search */}
            <div className="relative w-48">
              <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                className="pl-8 h-8 shadow-none border-0 bg-muted/40 focus-visible:ring-0"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>

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

      {/* Request Detail Sheet */}
      <Sheet
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(null)
        }}
      >
        <SheetContent side="right" showCloseButton={false} className="sm:max-w-4xl! w-full p-0">
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
