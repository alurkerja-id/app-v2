import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export const processes = [
  { id: "emp",     name: "Employee Onboarding",        description: "Streamline new hire setup from day one",             gradient: "from-blue-500 to-indigo-600",    abbr: "EO", bgHover: "hover:bg-blue-500/10" },
  { id: "exp",     name: "Expense Reimbursement",       description: "Submit and track expense claims",                    gradient: "from-emerald-500 to-teal-600",   abbr: "ER", bgHover: "hover:bg-emerald-500/10" },
  { id: "it",      name: "IT Support Ticket",           description: "Report and resolve IT issues quickly",               gradient: "from-amber-500 to-orange-600",   abbr: "IT", bgHover: "hover:bg-amber-500/10" },
  { id: "lv",      name: "Leave Request",               description: "Apply for leave and track approvals",                gradient: "from-violet-500 to-purple-600",  abbr: "LR", bgHover: "hover:bg-violet-500/10" },
  { id: "pr",      name: "Procurement Request",         description: "Raise purchase requests and manage vendors",         gradient: "from-rose-500 to-pink-600",      abbr: "PR", bgHover: "hover:bg-rose-500/10" },
  { id: "tr",      name: "Travel Request",              description: "Plan and approve business travel",                   gradient: "from-cyan-500 to-sky-600",       abbr: "TR", bgHover: "hover:bg-cyan-500/10" },
  { id: "acc",     name: "Account Opening",             description: "Request new vendor or customer account setup",       gradient: "from-sky-500 to-blue-600",       abbr: "AO", bgHover: "hover:bg-sky-500/10" },
  { id: "ast",     name: "Asset Request",               description: "Request hardware, furniture, or equipment",          gradient: "from-orange-500 to-amber-600",   abbr: "AR", bgHover: "hover:bg-orange-500/10" },
  { id: "aud",     name: "Audit Report Submission",     description: "Submit internal audit findings and reports",         gradient: "from-slate-500 to-gray-600",     abbr: "AU", bgHover: "hover:bg-slate-500/10" },
  { id: "bon",     name: "Bonus Approval",              description: "Initiate and approve employee bonus requests",       gradient: "from-yellow-500 to-orange-500",  abbr: "BA", bgHover: "hover:bg-yellow-500/10" },
  { id: "bud",     name: "Budget Request",              description: "Submit department budget proposals",                 gradient: "from-teal-500 to-emerald-600",   abbr: "BR", bgHover: "hover:bg-teal-500/10" },
  { id: "car",     name: "Car Pool Booking",            description: "Reserve company vehicles for business use",          gradient: "from-indigo-500 to-violet-600",  abbr: "CB", bgHover: "hover:bg-indigo-500/10" },
  { id: "cli",     name: "Client Onboarding",           description: "Set up new client accounts and agreements",         gradient: "from-pink-500 to-rose-600",      abbr: "CO", bgHover: "hover:bg-pink-500/10" },
  { id: "con",     name: "Contract Review",             description: "Submit contracts for legal review and sign-off",    gradient: "from-blue-600 to-cyan-600",      abbr: "CR", bgHover: "hover:bg-blue-500/10" },
  { id: "emp-off", name: "Employee Offboarding",        description: "Manage exit process for departing employees",        gradient: "from-zinc-500 to-slate-600",     abbr: "OF", bgHover: "hover:bg-zinc-500/10" },
  { id: "hlt",     name: "Health & Safety Report",      description: "Log workplace incidents and safety concerns",        gradient: "from-red-500 to-rose-600",       abbr: "HS", bgHover: "hover:bg-red-500/10" },
  { id: "hire",    name: "Hiring Request",              description: "Open new job requisitions for vacant roles",         gradient: "from-violet-600 to-purple-700",  abbr: "HR", bgHover: "hover:bg-violet-500/10" },
  { id: "ins",     name: "Insurance Claim",             description: "File and track employee insurance claims",           gradient: "from-emerald-600 to-green-700",  abbr: "IC", bgHover: "hover:bg-emerald-500/10" },
  { id: "inv",     name: "Invoice Approval",            description: "Review and approve vendor invoices",                 gradient: "from-amber-600 to-yellow-600",   abbr: "IA", bgHover: "hover:bg-amber-500/10" },
  { id: "key",     name: "Key & Access Request",        description: "Request building access cards or keys",              gradient: "from-cyan-600 to-teal-600",      abbr: "KA", bgHover: "hover:bg-cyan-500/10" },
  { id: "mat",     name: "Maternity / Paternity Leave", description: "Apply for parental leave and benefits",              gradient: "from-fuchsia-500 to-pink-600",   abbr: "ML", bgHover: "hover:bg-fuchsia-500/10" },
  { id: "ovt",     name: "Overtime Request",            description: "Submit and approve overtime hours",                  gradient: "from-orange-600 to-red-600",     abbr: "OT", bgHover: "hover:bg-orange-500/10" },
  { id: "pay",     name: "Payroll Correction",          description: "Report and fix payroll discrepancies",               gradient: "from-green-500 to-teal-500",     abbr: "PC", bgHover: "hover:bg-green-500/10" },
  { id: "per",     name: "Performance Review",          description: "Initiate quarterly or annual performance cycles",    gradient: "from-blue-500 to-sky-500",       abbr: "PV", bgHover: "hover:bg-blue-500/10" },
  { id: "pol",     name: "Policy Acknowledgement",      description: "Confirm reading of company policies",                gradient: "from-slate-600 to-zinc-700",     abbr: "PA", bgHover: "hover:bg-slate-500/10" },
  { id: "pro",     name: "Promotion Request",           description: "Nominate employees for role promotions",             gradient: "from-purple-500 to-indigo-600",  abbr: "PM", bgHover: "hover:bg-purple-500/10" },
  { id: "ref",     name: "Reference Letter Request",    description: "Request official employment reference letters",      gradient: "from-sky-600 to-indigo-600",     abbr: "RL", bgHover: "hover:bg-sky-500/10" },
  { id: "res",     name: "Resource Allocation",         description: "Assign team members to projects",                   gradient: "from-rose-500 to-fuchsia-600",   abbr: "RA", bgHover: "hover:bg-rose-500/10" },
  { id: "soft",    name: "Software License Request",    description: "Request new or additional software licenses",        gradient: "from-teal-600 to-cyan-600",      abbr: "SL", bgHover: "hover:bg-teal-500/10" },
  { id: "train",   name: "Training Enrollment",         description: "Register for internal or external training",         gradient: "from-amber-500 to-yellow-500",   abbr: "TE", bgHover: "hover:bg-amber-500/10" },
  { id: "wfh",     name: "Work From Home Request",      description: "Apply for remote work arrangements",                 gradient: "from-indigo-400 to-blue-500",    abbr: "WH", bgHover: "hover:bg-indigo-500/10" },
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
    <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-0.5">
      {filtered.map((proc) => (
        <button
          key={proc.id}
          onClick={() => onSelect?.(proc.id)}
          className={cn("group flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-all duration-200 hover:translate-x-0.5", proc.bgHover)}
        >
          <div
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-white text-[9px] font-bold transition-all duration-200 group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-md",
              proc.gradient
            )}
          >
            {proc.abbr}
          </div>
          <span className="text-sm font-medium truncate flex-1 transition-all duration-200 group-hover:translate-x-0.5">{proc.name}</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-3.5 shrink-0 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
          />
        </button>
      ))}
    </div>
  )
}
