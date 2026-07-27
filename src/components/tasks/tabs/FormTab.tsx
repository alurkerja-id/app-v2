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

/** Editable field values, keyed by field id — the shape persisted to a local draft. */
export type FormValues = Record<string, string | boolean>

export function fieldsToValues(fields: TaskField[]): FormValues {
  const values: FormValues = {}
  for (const field of fields) {
    if (field.type === "file" || field.type === "images") continue
    if (field.type === "boolean") {
      values[field.id] = Boolean(field.value)
    } else if (field.type === "json") {
      values[field.id] = JSON.stringify(field.value, null, 2)
    } else {
      values[field.id] = field.value == null ? "" : String(field.value)
    }
  }
  return values
}

/** Share of fields the user has actually changed from the task's current values. */
export function computeEditedPercent(original: FormValues, current: FormValues) {
  const keys = Object.keys(original)
  if (keys.length === 0) return 0
  const changed = keys.filter((k) => String(current[k]) !== String(original[k])).length
  return Math.round((changed / keys.length) * 100)
}

interface FormTabProps {
  task: Task
  values: FormValues
  onFieldChange: (id: string, value: string | boolean) => void
}

export function FormTab({ task, values, onFieldChange }: FormTabProps) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {task.fields.map((field) => (
        <div key={field.id} className="flex flex-col gap-1.5 px-6 py-4">
          <Label className="text-xs text-muted-foreground">{field.label}</Label>
          <FieldInput field={field} value={values[field.id]} onChange={(v) => onFieldChange(field.id, v)} />
        </div>
      ))}
    </div>
  )
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: TaskField
  value: string | boolean | undefined
  onChange: (value: string | boolean) => void
}) {
  if (field.type === "longtext") {
    return (
      <Textarea
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="resize-none"
      />
    )
  }

  if (field.type === "json") {
    return (
      <Textarea
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="resize-none font-mono text-xs"
      />
    )
  }

  if (field.type === "boolean") {
    return (
      <Select value={value ? "yes" : "no"} onValueChange={(v) => onChange(v === "yes")}>
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
        <p className="text-xs text-muted-foreground">Not saved in the draft — re-attach if you resume this later.</p>
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
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
