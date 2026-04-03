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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function DetailsTab({ request }: DetailsTabProps) {
  const fields = [
    { label: "Request ID", value: request.id },
    { label: "Process", value: request.process },
    { label: "Title", value: request.title },
    { label: "Requester", value: request.requester },
    { label: "Requester Email", value: request.requesterEmail },
    { label: "Created Date", value: formatDate(request.createdDate) },
    { label: "Priority", value: request.priority },
    { label: "Status", value: request.status },
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
