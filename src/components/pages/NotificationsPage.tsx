import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert01Icon,
  CheckmarkCircle02Icon,
  InboxIcon,
  Task01Icon,
  TimeHalfPassIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { NOTIFICATIONS, type AppNotification } from "@/data/notifications"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 5

const TYPE_META: Record<AppNotification["type"], {
  label: string
  icon: typeof InboxIcon
  tone: string
  badgeClass: string
}> = {
  task_assigned: {
    label: "Task Assigned",
    icon: Task01Icon,
    tone: "text-blue-600 dark:text-blue-400",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  request_completed: {
    label: "Request Completed",
    icon: CheckmarkCircle02Icon,
    tone: "text-emerald-600 dark:text-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  request_rejected: {
    label: "Request Rejected",
    icon: Alert01Icon,
    tone: "text-red-600 dark:text-red-400",
    badgeClass: "bg-red-500/10 text-red-700 dark:text-red-300",
  },
  request_progressed: {
    label: "Request Progressed",
    icon: TimeHalfPassIcon,
    tone: "text-amber-600 dark:text-amber-400",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  approval_requested: {
    label: "Approval Requested",
    icon: InboxIcon,
    tone: "text-violet-600 dark:text-violet-400",
    badgeClass: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>(NOTIFICATIONS)
  const [page, setPage] = useState(1)

  const unreadCount = items.filter((item) => !item.read).length
  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const markAllAsRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })))
  }

  const toggleRead = (id: number, nextRead: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: nextRead } : item))
    )
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold font-heading">My Notifications</h1>
          <Badge variant="secondary">{unreadCount} unread</Badge>
        </div>
        <Button type="button" onClick={markAllAsRead} disabled={unreadCount === 0} className="w-full sm:w-auto">
          Mark All As Read
        </Button>
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="px-0 py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Event</TableHead>
                <TableHead className="hidden w-40 sm:table-cell"></TableHead>
                <TableHead className="w-24 text-center sm:w-28">Read</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => {
                const meta = TYPE_META[item.type]
                return (
                  <TableRow key={item.id} className={cn(!item.read && "bg-primary/[0.03]")}>
                    <TableCell className="pl-4 align-top sm:pl-6">
                      <div className="flex items-start gap-3">
                        <div className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted", meta.tone)}>
                          <HugeiconsIcon icon={meta.icon} className="size-4" />
                        </div>
                        <div className="min-w-0 space-y-1 whitespace-normal">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={cn("font-medium leading-snug", !item.read && "text-foreground")}>
                              {item.title}
                            </p>
                            <Badge className={meta.badgeClass}>{meta.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">
                            {formatTimestamp(item.timestamp)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden align-top text-sm text-muted-foreground sm:table-cell">
                      {formatTimestamp(item.timestamp)}
                    </TableCell>
                    <TableCell className="align-top text-center">
                      <div className="flex justify-center pt-0.5">
                        <Switch
                          size="sm"
                          checked={item.read}
                          onCheckedChange={(checked) => toggleRead(item.id, checked)}
                          aria-label={item.read ? "Mark as unread" : "Mark as read"}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <Pagination className="mx-0 w-full justify-center sm:w-auto sm:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      text=""
                      size="icon-sm"
                      className="pl-0!"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (page > 1) setPage((prev) => prev - 1)
                      }}
                      aria-disabled={page <= 1}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((currentPage) => (
                    <PaginationItem key={currentPage}>
                      <PaginationLink
                        size="icon-sm"
                        href="#"
                        isActive={currentPage === page}
                        onClick={(e) => {
                          e.preventDefault()
                          setPage(currentPage)
                        }}
                      >
                        {currentPage}
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
                        if (page < totalPages) setPage((prev) => prev + 1)
                      }}
                      aria-disabled={page >= totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
