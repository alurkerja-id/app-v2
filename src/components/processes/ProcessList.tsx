import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export const processes = [
  {
    id: "emp",
    name: "Employee Onboarding",
    description: "Streamline new hire setup from day one",
    gradient: "from-blue-500 to-indigo-600",
    abbr: "EO",
  },
  {
    id: "exp",
    name: "Expense Reimbursement",
    description: "Submit and track expense claims",
    gradient: "from-emerald-500 to-teal-600",
    abbr: "ER",
  },
  {
    id: "it",
    name: "IT Support Ticket",
    description: "Report and resolve IT issues quickly",
    gradient: "from-amber-500 to-orange-600",
    abbr: "IT",
  },
  {
    id: "lv",
    name: "Leave Request",
    description: "Apply for leave and track approvals",
    gradient: "from-violet-500 to-purple-600",
    abbr: "LR",
  },
  {
    id: "pr",
    name: "Procurement Request",
    description: "Raise purchase requests and manage vendors",
    gradient: "from-rose-500 to-pink-600",
    abbr: "PR",
  },
  {
    id: "tr",
    name: "Travel Request",
    description: "Plan and approve business travel",
    gradient: "from-cyan-500 to-sky-600",
    abbr: "TR",
  },
]

interface ProcessListProps {
  search?: string
  onSelect?: (id: string) => void
}

export function ProcessList({ search = "", onSelect }: ProcessListProps) {
  const filtered = processes.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  )

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <HugeiconsIcon icon={Search01Icon} className="size-8 text-muted-foreground mb-2" />
        <p className="font-medium text-sm">No processes found</p>
        <p className="text-xs text-muted-foreground">Try a different search term</p>
      </div>
    )
  }

  return (
    <Card className="gap-0 py-0 divide-y divide-border">
      {filtered.map((proc) => (
        <button
          key={proc.id}
          onClick={() => onSelect?.(proc.id)}
          className="flex items-center gap-3 px-6 py-3.5 text-left hover:bg-muted/40 transition-colors group first:rounded-t-4xl last:rounded-b-4xl w-full"
        >
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white text-xs font-bold shadow-sm",
              proc.gradient
            )}
          >
            {proc.abbr}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{proc.name}</p>
            <p className="text-xs text-muted-foreground truncate">{proc.description}</p>
          </div>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-4 text-muted-foreground group-hover:text-foreground transition-colors"
          />
        </button>
      ))}
    </Card>
  )
}
