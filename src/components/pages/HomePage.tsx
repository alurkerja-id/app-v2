import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Task01Icon,
  Alert01Icon,
  Calendar01Icon,
  Time01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ProcessList } from "@/components/processes/ProcessList"

const statCards = [
  {
    label: "All Tasks",
    value: 24,
    description: "Across all processes",
    icon: Task01Icon,
    color: "text-blue-500",
  },
  {
    label: "Overdue",
    value: 3,
    description: "Need immediate attention",
    icon: Alert01Icon,
    color: "text-red-500",
  },
  {
    label: "Due Today",
    value: 5,
    description: "Must complete today",
    icon: Calendar01Icon,
    color: "text-amber-500",
  },
  {
    label: "Upcoming",
    value: 16,
    description: "Next 7 days",
    icon: Time01Icon,
    color: "text-emerald-500",
  },
]

export function HomePage() {
  const [search, setSearch] = useState("")

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Task Summary Banner */}
      <div className="rounded-4xl bg-primary px-6 py-4 text-primary-foreground shadow-md flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2 shrink-0">
          <HugeiconsIcon icon={Task01Icon} className="size-4 opacity-70" />
          <span className="font-semibold font-heading text-sm">Task Summary</span>
        </div>
        <div className="w-px h-5 bg-primary-foreground/20 hidden sm:block" />
        {statCards.map((card, i) => (
          <div key={card.label} className="flex items-center gap-4">
            {i > 0 && <div className="w-px h-5 bg-primary-foreground/20 hidden sm:block" />}
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={card.icon} className="size-4 opacity-70" />
              <span className="font-bold text-lg font-heading leading-none">{card.value}</span>
              <span className="text-xs opacity-70">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Start a Process */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold font-heading">Start a Process</h2>
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search processes..."
              className="pl-8 h-8 w-44"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ProcessList search={search} />
      </div>
    </div>
  )
}
