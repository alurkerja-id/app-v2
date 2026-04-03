import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Request } from "@/data/requests"

interface DetailsTabProps {
  request: Request
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
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

export function DetailsTab({ request }: DetailsTabProps) {
  const processDuration = getHumanDuration(
    request.createdDate,
    request.completedDate ?? new Date().toISOString()
  )

  const fields = [
    { label: "Request ID", value: request.id },
    { label: "Process", value: request.process },
    { label: "Title", value: request.title },
    { label: "Requestor", value: request.requester },
    { label: "Requestor Email", value: request.requesterEmail },
    { label: "Requested at", value: formatDateTime(request.createdDate) },
    { label: "Completed at", value: request.completedDate ? formatDateTime(request.completedDate) : "—" },
    { label: "Process Duration", value: processDuration },
    { label: "Steps", value: String(request.steps) },
    { label: "Priority", value: request.priority },
    { label: "Status", value: request.status === "Active" ? "In Progress" : "Completed" },
    { label: "Current Task", value: request.currentTask === "-" ? "—" : request.currentTask },
    { label: "Assignee", value: request.assignee === "-" ? "—" : request.assignee },
  ]

  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Field</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((f) => (
            <TableRow key={f.label}>
              <TableCell className="font-medium text-muted-foreground">{f.label}</TableCell>
              <TableCell>{f.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
