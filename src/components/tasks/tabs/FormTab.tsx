import { HugeiconsIcon } from "@hugeicons/react"
import { CloudUploadIcon, File01Icon, Image01Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Task, TaskField } from "@/data/tasks"

interface FormTabProps {
  task: Task
}

export function FormTab({ task }: FormTabProps) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {task.fields.map((field) => (
        <div key={field.id} className="flex flex-col gap-1.5 px-6 py-4">
          <Label className="text-xs text-muted-foreground">{field.label}</Label>
          <FieldInput field={field} />
        </div>
      ))}
    </div>
  )
}

function FieldInput({ field }: { field: TaskField }) {
  if (field.type === "longtext") {
    return (
      <Textarea
        defaultValue={field.value as string}
        rows={3}
        className="resize-none"
      />
    )
  }

  if (field.type === "json") {
    return (
      <Textarea
        defaultValue={JSON.stringify(field.value, null, 2)}
        rows={4}
        className="resize-none font-mono text-xs"
      />
    )
  }

  if (field.type === "boolean") {
    return (
      <Select defaultValue={field.value ? "yes" : "no"}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="yes">Yes</SelectItem>
          <SelectItem value="no">No</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  if (field.type === "file") {
    const files = (field.value as string[]) ?? []
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-4 text-center">
          <HugeiconsIcon icon={CloudUploadIcon} className="mx-auto mb-1.5 size-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Drop files here or click to upload</p>
        </div>
        {files.length > 0 && (
          <div className="flex flex-col gap-1">
            {files.map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
              >
                <HugeiconsIcon icon={File01Icon} className="size-3.5 shrink-0 text-blue-500" />
                <span className="text-xs">{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (field.type === "images") {
    const imgs = (field.value as string[]) ?? []
    return (
      <div className="flex flex-wrap gap-2">
        {imgs.map((img) => (
          <div
            key={img}
            className="flex size-16 items-center justify-center rounded-xl border border-border bg-muted"
          >
            <HugeiconsIcon icon={Image01Icon} className="size-5 text-muted-foreground" />
          </div>
        ))}
        <div className="flex size-16 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors">
          <span className="text-lg text-muted-foreground">+</span>
        </div>
      </div>
    )
  }

  return (
    <Input
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      defaultValue={field.value as string | number}
    />
  )
}
