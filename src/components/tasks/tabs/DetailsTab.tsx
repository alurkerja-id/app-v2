import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckListIcon,
  LayoutGridIcon,
  Table01Icon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  Calendar01Icon,
  File01Icon,
  Download01Icon,
  Time01Icon,
  Attachment01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Task, TaskField } from "@/data/tasks"

interface DetailsTabProps {
  task: Task
}

type LayoutMode = "one" | "two" | "table"

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
      <pre className="overflow-x-auto rounded-none bg-muted p-2 font-mono text-[10px]">
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
            className="flex h-14 w-14 items-center justify-center rounded-none bg-muted grayscale transition-all hover:grayscale-0"
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
            className="flex items-center gap-2 rounded-none border border-border bg-muted/40 px-2 py-1.5"
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
  const [layout, setLayout] = useState<LayoutMode>("one")

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Layout switcher */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold uppercase tracking-wider text-muted-foreground">
          Field Details
        </h3>
        <div className="flex items-center gap-0.5 rounded-none border border-border bg-muted/40 p-0.5">
          {(
            [
              { mode: "one" as LayoutMode, icon: CheckListIcon, label: "Single column" },
              { mode: "two" as LayoutMode, icon: LayoutGridIcon, label: "Two columns" },
              { mode: "table" as LayoutMode, icon: Table01Icon, label: "Table view" },
            ] as const
          ).map(({ mode, icon, label }) => (
            <Button
              key={mode}
              variant="ghost"
              size="icon-xs"
              title={label}
              className={cn(layout === mode && "bg-background shadow-xs")}
              onClick={() => setLayout(mode)}
            >
              <HugeiconsIcon icon={icon} />
            </Button>
          ))}
        </div>
      </div>

      {/* One column */}
      {layout === "one" && (
        <div className="flex flex-col gap-3">
          {task.fields.map((f) => (
            <div key={f.id} className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {f.label}
              </span>
              <div className="">{formatValue(f)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Two columns */}
      {layout === "two" && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {task.fields.map((f) => (
            <div
              key={f.id}
              className={cn(
                "flex flex-col gap-0.5",
                (f.type === "longtext" || f.type === "json" || f.type === "file" || f.type === "images") &&
                  "col-span-2"
              )}
            >
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {f.label}
              </span>
              <div className="">{formatValue(f)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {layout === "table" && (
        <div className="rounded-none border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground w-1/3">
                  Field
                </th>
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {task.fields.map((f, i) => (
                <tr
                  key={f.id}
                  className={cn("border-b border-border last:border-0", i % 2 === 1 && "bg-muted/20")}
                >
                  <td className="px-3 py-2 font-medium text-muted-foreground">{f.label}</td>
                  <td className="px-3 py-2">{formatValue(f)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-none border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <HugeiconsIcon icon={Time01Icon} className="size-4 text-blue-500" />
            <span className="font-semibold font-heading">Time Tracked</span>
          </div>
          <p className="font-bold">4h 32m</p>
          <p className="text-[11px] text-muted-foreground">Across 3 sessions</p>
        </div>
        <div className="rounded-none border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <HugeiconsIcon icon={Attachment01Icon} className="size-4 text-emerald-500" />
            <span className="font-semibold font-heading">Attachments</span>
          </div>
          <p className="font-bold">{task.attachments}</p>
          <p className="text-[11px] text-muted-foreground">Files attached</p>
        </div>
      </div>
    </div>
  )
}
