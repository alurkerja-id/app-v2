import { useState } from "react"
import {
  RiCheckboxCircleLine,
  RiSearchEyeLine,
  RiFileEditLine,
  RiShieldCheckLine,
  RiUserLine,
} from "@remixicon/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface HistoryStep {
  id: number
  name: string
  type: "user" | "service" | "gateway"
  person: string
  timestamp: string
  status: "done" | "current" | "pending"
  color: string
  icon: React.ElementType
  details: Record<string, string>
}

const steps: HistoryStep[] = [
  {
    id: 1,
    name: "Request Submitted",
    type: "user",
    person: "Alice Wang",
    timestamp: "Mar 28, 2026 · 09:12 AM",
    status: "done",
    color: "bg-blue-500",
    icon: RiFileEditLine,
    details: {
      "Action": "Form submitted",
      "Channel": "Web App",
      "IP Address": "192.168.1.42",
      "Duration": "8 minutes",
    },
  },
  {
    id: 2,
    name: "Initial Assessment",
    type: "user",
    person: "HR System",
    timestamp: "Mar 28, 2026 · 09:15 AM",
    status: "done",
    color: "bg-emerald-500",
    icon: RiSearchEyeLine,
    details: {
      "Action": "Auto-assigned to HR queue",
      "SLA Target": "4 hours",
      "Priority": "High",
      "Duration": "3 minutes",
    },
  },
  {
    id: 3,
    name: "Data Entry",
    type: "user",
    person: "Raj Patel",
    timestamp: "Mar 28, 2026 · 10:30 AM",
    status: "done",
    color: "bg-indigo-500",
    icon: RiFileEditLine,
    details: {
      "Action": "Employee record created in HRIS",
      "System": "SAP SuccessFactors",
      "Record ID": "EMP-2026-0042",
      "Duration": "22 minutes",
    },
  },
  {
    id: 4,
    name: "Document Verification",
    type: "service",
    person: "DocuVerify API",
    timestamp: "Mar 29, 2026 · 11:00 AM",
    status: "done",
    color: "bg-violet-500",
    icon: RiShieldCheckLine,
    details: {
      "Action": "Documents validated",
      "Documents Checked": "3",
      "Result": "All Valid",
      "Duration": "45 seconds",
    },
  },
  {
    id: 5,
    name: "Manager Review",
    type: "user",
    person: "David Park",
    timestamp: "Mar 30, 2026 · 02:00 PM",
    status: "current",
    color: "bg-amber-500",
    icon: RiUserLine,
    details: {
      "Action": "Awaiting manager approval",
      "Assigned To": "David Park",
      "SLA Deadline": "Apr 2, 2026",
      "Status": "In Review",
    },
  },
]

interface StepDialogProps {
  step: HistoryStep
}

function StepDialog({ step }: StepDialogProps) {
  const Icon = step.icon
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-xs font-medium hover:underline text-foreground transition-colors hover:text-blue-600">
          {step.name}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={cn("flex size-5 items-center justify-center rounded-full text-white", step.color)}>
              <Icon className="size-3" />
            </span>
            {step.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-0">
          {Object.entries(step.details).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between border-b border-border py-2 last:border-0">
              <span className="text-xs text-muted-foreground">{key}</span>
              <span className="text-xs font-medium">{val}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
          {step.person} · {step.timestamp}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function HistoryTab() {
  return (
    <div className="p-4">
      <div className="relative flex flex-col gap-0">
        {steps.map((step, i) => {
          const Icon = step.icon
          const isLast = i === steps.length - 1
          return (
            <div key={step.id} className="flex gap-3">
              {/* Timeline line + icon */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm",
                    step.color,
                    step.status === "current" && "ring-4 ring-amber-500/30"
                  )}
                >
                  <Icon className="size-3.5" />
                  {step.status === "current" && (
                    <span className="absolute size-7 animate-ping rounded-full bg-amber-400 opacity-30" />
                  )}
                </div>
                {!isLast && <div className="mt-1 h-8 w-0.5 bg-border" />}
              </div>

              {/* Content */}
              <div className="flex flex-col pb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <StepDialog step={step} />
                  {step.type === "service" && (
                    <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                      Service Task
                    </span>
                  )}
                  {step.status === "current" && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Current
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/70">{step.person}</span>
                  <span>·</span>
                  <span>{step.timestamp}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
