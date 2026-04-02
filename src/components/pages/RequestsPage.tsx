import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Download01Icon,
  EyeIcon,
  ArrowUpDownIcon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
} from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { REQUESTS } from "@/data/requests"
import type { RequestStatus } from "@/data/requests"

const TYPE_GRADIENTS: Record<string, string> = {
  "Leave Request": "from-violet-500 to-purple-600",
  "IT Support": "from-amber-500 to-orange-600",
  "Expense Claim": "from-emerald-500 to-teal-600",
  Procurement: "from-rose-500 to-pink-600",
  "Travel Request": "from-cyan-500 to-sky-600",
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

type SortKey = "id" | "requester" | null

export function RequestsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "All">("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const filtered = useMemo(() => {
    let list = REQUESTS.filter((r) => {
      const q = search.toLowerCase()
      const matchSearch =
        r.title.toLowerCase().includes(q) ||
        r.requester.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
      const matchStatus = statusFilter === "All" || r.status === statusFilter
      const matchType = typeFilter === "All" || r.type === typeFilter
      return matchSearch && matchStatus && matchType
    })

    if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = sortKey === "requester" ? a.requester : a.id
        const bv = sortKey === "requester" ? b.requester : b.id
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    }
    return list
  }, [search, statusFilter, typeFilter, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v)
    else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="font-semibold font-heading">Requests</h1>
        <p className="text-muted-foreground">Track and manage all submitted process requests</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-40">
          <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as RequestStatus | "All")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            <SelectItem value="Leave Request">Leave Request</SelectItem>
            <SelectItem value="IT Support">IT Support</SelectItem>
            <SelectItem value="Expense Claim">Expense Claim</SelectItem>
            <SelectItem value="Procurement">Procurement</SelectItem>
            <SelectItem value="Travel Request">Travel Request</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-1.5">
          <HugeiconsIcon icon={Download01Icon} />
          Export
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-none border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead
                className="text-[11px] cursor-pointer select-none"
                onClick={() => toggleSort("id")}
              >
                <span className="flex items-center gap-1">
                  Request
                  <HugeiconsIcon icon={ArrowUpDownIcon}
                    className={cn(
                      "size-3",
                      sortKey === "id" ? "text-foreground" : "text-muted-foreground"
                    )}
                  />
                </span>
              </TableHead>
              <TableHead
                className="text-[11px] cursor-pointer select-none"
                onClick={() => toggleSort("requester")}
              >
                <span className="flex items-center gap-1">
                  Requester
                  <HugeiconsIcon icon={ArrowUpDownIcon}
                    className={cn(
                      "size-3",
                      sortKey === "requester" ? "text-foreground" : "text-muted-foreground"
                    )}
                  />
                </span>
              </TableHead>
              <TableHead className="text-[11px]">Current Task</TableHead>
              <TableHead className="text-[11px]">Status</TableHead>
              <TableHead className="text-[11px] w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <HugeiconsIcon icon={Search01Icon} className="mx-auto mb-2 size-7 text-muted-foreground" />
                  <p className="font-medium">No requests found</p>
                  <p className="text-[11px] text-muted-foreground">Try adjusting your filters</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((req) => {
                const gradient = TYPE_GRADIENTS[req.type] ?? "from-zinc-500 to-zinc-600"
                return (
                  <TableRow key={req.id} className="hover:bg-muted/30">
                    <TableCell className="py-3">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-none bg-gradient-to-br text-white text-[9px] font-bold mt-0.5",
                            gradient
                          )}
                        >
                          {req.id.replace("REQ-", "")}
                        </div>
                        <div>
                          <p className="font-medium">{req.title}</p>
                          <p className="text-[11px] text-muted-foreground">{req.type}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback
                            className={cn(
                              "bg-gradient-to-br text-white text-[9px]",
                              gradient
                            )}
                          >
                            {getInitials(req.requester)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{req.requester}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {relativeTime(req.requestedAt)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      {req.status !== "Closed" && req.currentTask !== "Completed" ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                req.status === "Open"
                                  ? "bg-blue-500 animate-pulse"
                                  : "bg-muted-foreground"
                              )}
                            />
                            <span className="font-medium">{req.currentTask}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground pl-3">
                            {req.assignee}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5">
                        {req.status === "Open" && (
                          <>
                            <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              Open
                            </span>
                          </>
                        )}
                        {req.status === "Completed" && (
                          <>
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5 text-emerald-500" />
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              Completed
                            </span>
                          </>
                        )}
                        {req.status === "Closed" && (
                          <>
                            <HugeiconsIcon icon={CancelCircleIcon} className="size-3.5 text-muted-foreground" />
                            <span className="font-medium text-muted-foreground">
                              Closed
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Button variant="ghost" size="icon-xs">
                        <HugeiconsIcon icon={EyeIcon} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="xs" disabled>
            Previous
          </Button>
          <Button variant="outline" size="xs" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
