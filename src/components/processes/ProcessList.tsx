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
  {
    id: "acc",
    name: "Account Opening",
    description: "Request new vendor or customer account setup",
    gradient: "from-sky-500 to-blue-600",
    abbr: "AO",
  },
  {
    id: "ast",
    name: "Asset Request",
    description: "Request hardware, furniture, or equipment",
    gradient: "from-orange-500 to-amber-600",
    abbr: "AR",
  },
  {
    id: "aud",
    name: "Audit Report Submission",
    description: "Submit internal audit findings and reports",
    gradient: "from-slate-500 to-gray-600",
    abbr: "AU",
  },
  {
    id: "bon",
    name: "Bonus Approval",
    description: "Initiate and approve employee bonus requests",
    gradient: "from-yellow-500 to-orange-500",
    abbr: "BA",
  },
  {
    id: "bud",
    name: "Budget Request",
    description: "Submit department budget proposals",
    gradient: "from-teal-500 to-emerald-600",
    abbr: "BR",
  },
  {
    id: "car",
    name: "Car Pool Booking",
    description: "Reserve company vehicles for business use",
    gradient: "from-indigo-500 to-violet-600",
    abbr: "CB",
  },
  {
    id: "cli",
    name: "Client Onboarding",
    description: "Set up new client accounts and agreements",
    gradient: "from-pink-500 to-rose-600",
    abbr: "CO",
  },
  {
    id: "con",
    name: "Contract Review",
    description: "Submit contracts for legal review and sign-off",
    gradient: "from-blue-600 to-cyan-600",
    abbr: "CR",
  },
  {
    id: "emp-off",
    name: "Employee Offboarding",
    description: "Manage exit process for departing employees",
    gradient: "from-zinc-500 to-slate-600",
    abbr: "OF",
  },
  {
    id: "hlt",
    name: "Health & Safety Report",
    description: "Log workplace incidents and safety concerns",
    gradient: "from-red-500 to-rose-600",
    abbr: "HS",
  },
  {
    id: "hire",
    name: "Hiring Request",
    description: "Open new job requisitions for vacant roles",
    gradient: "from-violet-600 to-purple-700",
    abbr: "HR",
  },
  {
    id: "ins",
    name: "Insurance Claim",
    description: "File and track employee insurance claims",
    gradient: "from-emerald-600 to-green-700",
    abbr: "IC",
  },
  {
    id: "inv",
    name: "Invoice Approval",
    description: "Review and approve vendor invoices",
    gradient: "from-amber-600 to-yellow-600",
    abbr: "IA",
  },
  {
    id: "key",
    name: "Key & Access Request",
    description: "Request building access cards or keys",
    gradient: "from-cyan-600 to-teal-600",
    abbr: "KA",
  },
  {
    id: "mat",
    name: "Maternity / Paternity Leave",
    description: "Apply for parental leave and benefits",
    gradient: "from-fuchsia-500 to-pink-600",
    abbr: "ML",
  },
  {
    id: "ovt",
    name: "Overtime Request",
    description: "Submit and approve overtime hours",
    gradient: "from-orange-600 to-red-600",
    abbr: "OT",
  },
  {
    id: "pay",
    name: "Payroll Correction",
    description: "Report and fix payroll discrepancies",
    gradient: "from-green-500 to-teal-500",
    abbr: "PC",
  },
  {
    id: "per",
    name: "Performance Review",
    description: "Initiate quarterly or annual performance cycles",
    gradient: "from-blue-500 to-sky-500",
    abbr: "PV",
  },
  {
    id: "pol",
    name: "Policy Acknowledgement",
    description: "Confirm reading of company policies",
    gradient: "from-slate-600 to-zinc-700",
    abbr: "PA",
  },
  {
    id: "pro",
    name: "Promotion Request",
    description: "Nominate employees for role promotions",
    gradient: "from-purple-500 to-indigo-600",
    abbr: "PM",
  },
  {
    id: "ref",
    name: "Reference Letter Request",
    description: "Request official employment reference letters",
    gradient: "from-sky-600 to-indigo-600",
    abbr: "RL",
  },
  {
    id: "res",
    name: "Resource Allocation",
    description: "Assign team members to projects",
    gradient: "from-rose-500 to-fuchsia-600",
    abbr: "RA",
  },
  {
    id: "soft",
    name: "Software License Request",
    description: "Request new or additional software licenses",
    gradient: "from-teal-600 to-cyan-600",
    abbr: "SL",
  },
  {
    id: "train",
    name: "Training Enrollment",
    description: "Register for internal or external training",
    gradient: "from-amber-500 to-yellow-500",
    abbr: "TE",
  },
  {
    id: "wfh",
    name: "Work From Home Request",
    description: "Apply for remote work arrangements",
    gradient: "from-indigo-400 to-blue-500",
    abbr: "WH",
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
    <div className="overflow-y-auto max-h-[60vh] flex flex-col gap-0.5">
      {filtered.map((proc) => (
        <button
          key={proc.id}
          onClick={() => onSelect?.(proc.id)}
          className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-muted/60 transition-colors"
        >
          <div
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-white text-[9px] font-bold",
              proc.gradient
            )}
          >
            {proc.abbr}
          </div>
          <span className="text-sm font-medium truncate flex-1">{proc.name}</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-3.5 shrink-0 text-muted-foreground opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
          />
        </button>
      ))}
    </div>
  )
}
