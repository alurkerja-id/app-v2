import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  Calendar01Icon,
  File01Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Task, TaskField } from "@/data/tasks"

interface DetailsTabProps {
  task: Task
}

function formatValue(field: TaskField) {
  if (field.value === null || field.value === undefined || field.value === "") {
    return <span className="text-muted-foreground italic">—</span>
  }

  if (field.type === "number") {
    return <span>{(field.value as number).toLocaleString()}</span>
  }

  if (field.type === "date") {
    const d = new Date(field.value as string)
    return (
      <span className="flex items-center gap-1">
        <HugeiconsIcon icon={Calendar01Icon} className="size-3 text-muted-foreground" />
        {d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
      </span>
    )
  }

  if (field.type === "boolean") {
    return field.value ? (
      <span className="flex items-center gap-1 text-emerald-600">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" />
        Yes
      </span>
    ) : (
      <span className="flex items-center gap-1 text-red-500">
        <HugeiconsIcon icon={CancelCircleIcon} className="size-3.5" />
        No
      </span>
    )
  }

  if (field.type === "longtext") {
    return <p className="whitespace-pre-wrap leading-relaxed">{field.value as string}</p>
  }

  if (field.type === "json") {
    return (
      <pre className="overflow-x-auto rounded-lg bg-muted p-2 font-mono text-[10px]">
        {JSON.stringify(field.value, null, 2)}
      </pre>
    )
  }

  if (field.type === "images") {
    const imgs = field.value as string[]
    return (
      <div className="flex flex-wrap gap-1.5">
        {imgs.map((img) => (
          <div
            key={img}
            className="flex size-14 items-center justify-center rounded-lg bg-muted"
          >
            <HugeiconsIcon icon={File01Icon} className="size-4 text-muted-foreground" />
          </div>
        ))}
      </div>
    )
  }

  if (field.type === "file") {
    const files = field.value as string[]
    return (
      <div className="flex flex-col gap-1">
        {files.map((f) => (
          <div
            key={f}
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2 py-1.5"
          >
            <HugeiconsIcon icon={File01Icon} className="size-3.5 shrink-0 text-blue-500" />
            <span className="flex-1">{f}</span>
            <Button variant="ghost" size="icon-xs">
              <HugeiconsIcon icon={Download01Icon} />
            </Button>
          </div>
        ))}
      </div>
    )
  }

  return <span>{String(field.value)}</span>
}

export function DetailsTab({ task }: DetailsTabProps) {
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
          {task.fields.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="font-medium text-muted-foreground">{f.label}</TableCell>
              <TableCell>{formatValue(f)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
