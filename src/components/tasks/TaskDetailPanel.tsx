import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  FileEditIcon,
  CheckListIcon,
  Flowchart01Icon,
  WorkHistoryIcon,
  BubbleChatIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { FormTab } from "./tabs/FormTab"
import { DetailsTab } from "./tabs/DetailsTab"
import { DiagramTab } from "./tabs/DiagramTab"
import { HistoryTab } from "./tabs/HistoryTab"
import { DiscussionTab } from "./tabs/DiscussionTab"
import type { Task } from "@/data/tasks"

export type TaskMode = "my-tasks" | "group-tasks"

interface TaskDetailPanelProps {
  task: Task
  onClose: () => void
  mode?: TaskMode
}

const PROCESS_THEME: Record<string, { gradient: string; accent: string; abbr: string; btnText: string }> = {
  "Employee Onboarding": { gradient: "from-blue-600 to-indigo-700", accent: "bg-blue-400/20", abbr: "EO", btnText: "text-indigo-700" },
  "Expense Reimbursement": { gradient: "from-emerald-600 to-teal-700", accent: "bg-emerald-400/20", abbr: "ER", btnText: "text-teal-700" },
  "IT Support Ticket": { gradient: "from-amber-500 to-orange-600", accent: "bg-amber-400/20", abbr: "IT", btnText: "text-orange-600" },
  "Leave Request": { gradient: "from-violet-600 to-purple-700", accent: "bg-violet-400/20", abbr: "LR", btnText: "text-purple-700" },
  "Procurement Request": { gradient: "from-rose-600 to-pink-700", accent: "bg-rose-400/20", abbr: "PR", btnText: "text-pink-700" },
  "Travel Request": { gradient: "from-cyan-600 to-sky-700", accent: "bg-cyan-400/20", abbr: "TR", btnText: "text-sky-700" },
}

const DEFAULT_THEME = { gradient: "from-zinc-600 to-zinc-700", accent: "bg-zinc-400/20", abbr: "??", btnText: "text-zinc-700" }

function getTaskAge(createdDate: string) {
  const now = new Date()
  const created = new Date(createdDate)
  const diffMs = now.getTime() - created.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "1 day"
  if (diffDays < 7) return `${diffDays} days`
  const weeks = Math.floor(diffDays / 7)
  if (weeks === 1) return "1 week"
  return `${weeks} weeks`
}

const USERS = [
  { name: "Alice Wang", email: "alice@company.com" },
  { name: "Bayu Hendra", email: "bayu@company.com" },
  { name: "Carlos Ruiz", email: "carlos@company.com" },
  { name: "David Park", email: "david@company.com" },
  { name: "Ken Watanabe", email: "ken@company.com" },
  { name: "Priya Sharma", email: "priya@company.com" },
  { name: "Rachel Kim", email: "rachel@company.com" },
  { name: "Rina Susanti", email: "rina@company.com" },
  { name: "Sophie Martin", email: "sophie@company.com" },
  { name: "Tom Brady", email: "tom@company.com" },
]

export function TaskDetailPanel({ task, onClose, mode = "my-tasks" }: TaskDetailPanelProps) {
  const theme = PROCESS_THEME[task.process] ?? DEFAULT_THEME
  const [delegateOpen, setDelegateOpen] = useState(false)
  const [unclaimOpen, setUnclaimOpen] = useState(false)
  const [delegateTo, setDelegateTo] = useState<string | null>(null)
  const [delegateReason, setDelegateReason] = useState("")
  const [isCompleting, setIsCompleting] = useState(false)

  const handleDelegate = () => {
    setDelegateTo(null)
    setDelegateReason("")
    setDelegateOpen(true)
  }

  const handleDelegateSubmit = () => {
    setDelegateOpen(false)
    const user = USERS.find((u) => u.email === delegateTo)
    toast.success("Task delegated", {
      description: `Task has been delegated to ${user?.name ?? delegateTo}.`,
    })
  }

  const handleUnclaim = () => {
    setUnclaimOpen(true)
  }

  const handleUnclaimConfirm = () => {
    setUnclaimOpen(false)
    toast.success("Task unclaimed", {
      description: "The task has been moved back to group tasks.",
    })
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsCompleting(false)
    toast.success("Task completed", {
      description: `"${task.title}" has been marked as completed.`,
    })
  }

  return (
    <>
    <div className="flex h-full flex-col bg-background">
      {/* Colored Header */}
      <div className={cn("relative overflow-hidden bg-gradient-to-br text-white", theme.gradient)}>
        {/* Decorative shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={cn("absolute -right-8 -top-8 size-40 rounded-full opacity-30", theme.accent)} />
          <div className={cn("absolute -right-4 top-16 size-24 rounded-full opacity-20", theme.accent)} />
          <div className={cn("absolute left-1/3 -bottom-6 size-32 rounded-full opacity-15", theme.accent)} />
          {/* Subtle dot grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
        </div>

        <div className="relative px-4 py-3 sm:px-6 sm:py-5">
          {/* Top row: process badge + close */}
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-xs font-bold backdrop-blur-sm">
                {theme.abbr}
              </span>
              <span className="text-sm font-medium text-white/80 truncate">{task.process}</span>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 shrink-0">
              <HugeiconsIcon icon={Cancel01Icon} />
            </Button>
          </div>

          {/* Title + ID */}
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold font-heading leading-snug line-clamp-1 sm:line-clamp-2">{task.title}</h2>
            <span className="text-xs font-mono text-white/50 shrink-0">#{task.id}</span>
          </div>

          {/* Desktop: Metadata + Actions side by side */}
          <div className="hidden sm:flex sm:items-end sm:gap-6">
            <div className="flex items-start gap-5 flex-1 min-w-0 flex-wrap">
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Task Age</p>
                <p className="text-sm font-semibold">{getTaskAge(task.createdDate)}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Priority</p>
                <p className="text-sm font-semibold">{task.priority}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Created Date</p>
                <p className="text-sm font-semibold">{task.createdDate}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Due Date</p>
                <p className="text-sm font-semibold">{task.dueDate}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Assignee</p>
                <p className="text-sm font-semibold">{task.author}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/60 mb-0.5">Initiator</p>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold backdrop-blur-sm">
                    {task.author.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                  {task.author}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {mode === "my-tasks" ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleDelegate} className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white">
                    Delegate
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleUnclaim} className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white">
                    Unclaim
                  </Button>
                  <Button size="sm" onClick={handleComplete} disabled={isCompleting} className={cn("relative bg-white hover:bg-white/90 font-semibold shadow-sm dark:bg-white dark:hover:bg-white/90", theme.btnText)}>
                    <span className={cn("bg-gradient-to-br bg-clip-text text-transparent transition-opacity", isCompleting ? "opacity-0" : "opacity-100", theme.gradient)}>
                      Complete Task
                    </span>
                    {isCompleting && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                      </div>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleDelegate} className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white">
                    Delegate
                  </Button>
                  <Button size="sm" className={cn("bg-white hover:bg-white/90 font-semibold shadow-sm dark:bg-white dark:hover:bg-white/90", theme.btnText)}>
                    <span className={cn("bg-gradient-to-br bg-clip-text text-transparent", theme.gradient)}>
                      Claim
                    </span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="form" className="flex flex-col flex-1 min-h-0">
        <div className="px-4 pt-3 overflow-x-auto flex justify-start sm:justify-center">
          <TabsList className="w-max">
            {[
              { value: "form", label: "Form", icon: FileEditIcon },
              { value: "details", label: "Details", icon: CheckListIcon },
              { value: "diagram", label: "Diagram", icon: Flowchart01Icon },
              { value: "history", label: "History", icon: WorkHistoryIcon },
              { value: "discussion", label: "Discussion", icon: BubbleChatIcon },
            ].map(({ value, label, icon }) => (
              <TabsTrigger key={value} value={value} className="gap-1.5 shrink-0">
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

      {/* Mobile: Sticky footer actions */}
      <div className="flex sm:hidden items-center gap-2 border-t border-border px-4 py-3">
        {mode === "my-tasks" ? (
          <>
            <Button variant="outline" size="sm" onClick={handleDelegate}>
              Delegate
            </Button>
            <Button variant="outline" size="sm" onClick={handleUnclaim}>
              Unclaim
            </Button>
            <div className="flex-1" />
            <Button size="sm" onClick={handleComplete} disabled={isCompleting} className="relative">
              <span className={cn("transition-opacity", isCompleting ? "opacity-0" : "opacity-100")}>
                Complete Task
              </span>
              {isCompleting && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                </div>
              )}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={handleDelegate}>
              Delegate
            </Button>
            <div className="flex-1" />
            <Button size="sm">
              Claim
            </Button>
          </>
        )}
      </div>
    </div>

    {/* Delegate Dialog */}
    <Dialog open={delegateOpen} onOpenChange={setDelegateOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delegate Task</DialogTitle>
          <DialogDescription>
            Assign this task to another team member.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Delegate to</Label>
            <Combobox value={delegateTo} onValueChange={setDelegateTo}>
              <ComboboxInput placeholder="Search by name or email..." showClear />
              <ComboboxContent>
                <ComboboxList>
                  {USERS.map((u) => (
                    <ComboboxItem key={u.email} value={u.email}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{u.name}</span>
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    </ComboboxItem>
                  ))}
                  <ComboboxEmpty>No users found.</ComboboxEmpty>
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className="grid gap-2">
            <Label>Reason</Label>
            <Textarea
              placeholder="Explain why you are delegating this task..."
              value={delegateReason}
              onChange={(e) => setDelegateReason(e.target.value)}
              className="min-h-24"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDelegateOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDelegateSubmit} disabled={!delegateTo}>
            Delegate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Unclaim Confirmation */}
    <AlertDialog open={unclaimOpen} onOpenChange={setUnclaimOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unclaim Task</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to unclaim this task? It will be returned to the group task pool and become available for other team members to claim.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleUnclaimConfirm}>
            Yes, Unclaim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
