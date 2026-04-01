import { RiUploadCloud2Line, RiFileTextLine, RiImageLine } from "@remixicon/react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Task, TaskField } from "@/data/tasks"

interface FormTabProps {
  task: Task
}

function groupFields(fields: TaskField[]) {
  return fields.reduce<Record<string, TaskField[]>>((acc, f) => {
    if (!acc[f.group]) acc[f.group] = []
    acc[f.group].push(f)
    return acc
  }, {})
}

const GROUP_COLORS: Record<number, string> = {
  0: "bg-blue-500",
  1: "bg-emerald-500",
  2: "bg-amber-500",
  3: "bg-violet-500",
  4: "bg-rose-500",
  5: "bg-cyan-500",
}

export function FormTab({ task }: FormTabProps) {
  const grouped = groupFields(task.fields)

  return (
    <div className="flex flex-col gap-3 p-4">
      {Object.entries(grouped).map(([group, fields], gi) => (
        <div key={group} className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <span className={cn("size-2 rounded-full", GROUP_COLORS[gi % 6])} />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </span>
          </div>
          <div className="grid gap-3 p-3 sm:grid-cols-2">
            {fields.map((field) => (
              <FieldInput key={field.id} field={field} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FieldInput({ field }: { field: TaskField }) {
  const label = (
    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
      {field.label}
    </label>
  )

  if (field.type === "longtext") {
    return (
      <div className="sm:col-span-2">
        {label}
        <Textarea
          defaultValue={field.value as string}
          rows={3}
          className="resize-none text-xs"
        />
      </div>
    )
  }

  if (field.type === "json") {
    return (
      <div className="sm:col-span-2">
        {label}
        <Textarea
          defaultValue={JSON.stringify(field.value, null, 2)}
          rows={4}
          className="resize-none font-mono text-xs"
        />
      </div>
    )
  }

  if (field.type === "boolean") {
    return (
      <div>
        {label}
        <Select defaultValue={field.value ? "yes" : "no"}>
          <SelectTrigger className="w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (field.type === "file") {
    const files = (field.value as string[]) ?? []
    return (
      <div className="sm:col-span-2">
        {label}
        <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-4 text-center">
          <RiUploadCloud2Line className="mx-auto mb-1.5 size-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Drop files here or click to upload</p>
        </div>
        {files.length > 0 && (
          <div className="mt-2 flex flex-col gap-1">
            {files.map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5"
              >
                <RiFileTextLine className="size-3.5 shrink-0 text-blue-500" />
                <span className="text-xs text-foreground">{f}</span>
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
      <div className="sm:col-span-2">
        {label}
        <div className="flex flex-wrap gap-2">
          {imgs.map((img) => (
            <div
              key={img}
              className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-muted"
            >
              <RiImageLine className="size-5 text-muted-foreground" />
            </div>
          ))}
          <div className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-blue-400 transition-colors">
            <span className="text-lg text-muted-foreground">+</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {label}
      <Input
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        defaultValue={field.value as string | number}
        className="text-xs"
      />
    </div>
  )
}
