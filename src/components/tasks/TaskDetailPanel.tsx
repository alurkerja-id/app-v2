import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  FileEditIcon,
  CheckListIcon,
  Flowchart01Icon,
  WorkHistoryIcon,
  BubbleChatIcon,
  Calendar01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FormTab } from "./tabs/FormTab"
import { DetailsTab } from "./tabs/DetailsTab"
import { DiagramTab } from "./tabs/DiagramTab"
import { HistoryTab } from "./tabs/HistoryTab"
import { DiscussionTab } from "./tabs/DiscussionTab"
import type { Task } from "@/data/tasks"

interface TaskDetailPanelProps {
  task: Task
  onClose: () => void
}

const PRIORITY_DOT: Record<string, string> = {
  High: "bg-red-500",
  Medium: "bg-amber-500",
  Low: "bg-emerald-500",
}

const STATUS_COLOR: Record<string, string> = {
  "In Progress": "text-blue-600 dark:text-blue-400",
  "Pending Review": "text-amber-600 dark:text-amber-400",
  New: "text-zinc-500",
  Done: "text-emerald-600 dark:text-emerald-400",
}

export function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  return (
    <div className="flex h-full flex-col border-l border-border bg-background">
      {/* Header */}
      <div className="flex items-start gap-2 border-b border-border px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[11px] font-mono text-muted-foreground">{task.id}</span>
            <span className="text-[11px] text-muted-foreground">·</span>
            <span className="text-[11px] text-muted-foreground">{task.process}</span>
          </div>
          <h2 className="text-sm font-semibold font-heading leading-snug line-clamp-2">{task.title}</h2>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            {/* Status */}
            <span className={cn("text-[11px] font-medium", STATUS_COLOR[task.status])}>
              {task.status}
            </span>
            {/* Priority */}
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", PRIORITY_DOT[task.priority])} />
              {task.priority}
            </span>
            {/* Due */}
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <HugeiconsIcon icon={Calendar01Icon} className="size-3" />
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          {/* Author */}
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <HugeiconsIcon icon={UserIcon} className="size-3" />
            <span>Submitted by</span>
            <span className="font-medium text-foreground/70">{task.author}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} className="shrink-0 mt-0.5">
          <HugeiconsIcon icon={Cancel01Icon} />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className={cn(
            "h-full transition-all",
            task.status === "Done" ? "bg-emerald-500" : "bg-blue-500"
          )}
          style={{ width: `${task.progress}%` }}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="form" className="flex flex-col flex-1 min-h-0">
        <div className="border-b border-border px-2 pt-2">
          <TabsList variant="line" className="h-auto gap-0">
            {[
              { value: "form", label: "Form", icon: FileEditIcon },
              { value: "details", label: "Details", icon: CheckListIcon },
              { value: "diagram", label: "Diagram", icon: Flowchart01Icon },
              { value: "history", label: "History", icon: WorkHistoryIcon },
              { value: "discussion", label: "Discussion", icon: BubbleChatIcon },
            ].map(({ value, label, icon }) => (
              <TabsTrigger key={value} value={value} className="gap-1.5 px-3">
                <HugeiconsIcon icon={icon} className="size-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="form">
            <FormTab task={task} />
          </TabsContent>
          <TabsContent value="details">
            <DetailsTab task={task} />
          </TabsContent>
          <TabsContent value="diagram">
            <DiagramTab />
          </TabsContent>
          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>
          <TabsContent value="discussion">
            <DiscussionTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
