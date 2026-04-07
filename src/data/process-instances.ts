export interface ProcessInstance {
  id: string
  processId: string
  processName: string
  title: string
  initiator: string
  initiatorEmail: string
  createdDate: string
  completedDate?: string
  currentTask: string
  assignee: string
  assigneeEmail: string
  status: "Active" | "Completed"
}

const PEOPLE = [
  { name: "Alice Wang", email: "alice@company.com" },
  { name: "Carlos Ruiz", email: "carlos@company.com" },
  { name: "Emma Wilson", email: "emma@company.com" },
  { name: "John Doe", email: "john@company.com" },
  { name: "Priya Sharma", email: "priya@company.com" },
  { name: "Ken Watanabe", email: "ken@company.com" },
  { name: "Sophie Martin", email: "sophie@company.com" },
  { name: "David Park", email: "david@company.com" },
  { name: "Liam O'Brien", email: "liam@company.com" },
  { name: "Rachel Kim", email: "rachel@company.com" },
  { name: "Tom Brady", email: "tom@company.com" },
  { name: "Maria Santos", email: "maria@company.com" },
  { name: "Chen Wei", email: "chen@company.com" },
  { name: "Aisha Kamara", email: "aisha@company.com" },
  { name: "James Lee", email: "james@company.com" },
]

const TASKS_BY_PROCESS: Record<string, string[]> = {
  emp: ["Document Verification", "IT Setup", "Badge Creation", "Orientation", "Training Assignment"],
  exp: ["Receipt Upload", "Manager Review", "Finance Approval", "Payment Processing"],
  it: ["Triage", "Assignment", "Investigation", "Resolution", "Security Review"],
  lv: ["Manager Review", "HR Validation", "Calendar Update"],
  pr: ["Vendor Selection", "Budget Check", "Procurement Approval", "Vendor Confirmation", "Order Placed"],
  tr: ["Manager Approval", "Budget Review", "Booking Confirmation", "Visa Processing"],
  acc: ["KYC Verification", "Account Setup", "Credit Check", "Final Approval"],
  ast: ["Availability Check", "Manager Approval", "IT Procurement", "Delivery"],
  aud: ["Draft Review", "Manager Sign-off", "Compliance Check", "Final Filing"],
  bon: ["Manager Nomination", "Director Approval", "HR Review", "Finance Processing"],
  bud: ["Department Review", "Director Approval", "CFO Review", "Final Allocation"],
  car: ["Availability Check", "Manager Approval", "Key Handover"],
  cli: ["Agreement Setup", "Legal Review", "Account Creation", "Onboarding Call"],
  con: ["Draft Review", "Legal Review", "Counterparty Review", "Sign-off"],
  "emp-off": ["Exit Interview", "Asset Return", "Access Revocation", "Final Settlement"],
  hlt: ["Incident Report", "Investigation", "Corrective Action", "Final Review"],
  hire: ["Job Posting Approval", "Sourcing", "Interview Scheduling", "Offer Approval"],
  ins: ["Claim Filing", "Document Review", "Provider Verification", "Settlement"],
  inv: ["Receipt Validation", "Manager Approval", "Finance Verification", "Payment"],
  key: ["Security Clearance", "Badge Programming", "Key Issuance"],
  mat: ["HR Review", "Document Verification", "Benefits Setup", "Leave Calendar Update"],
  ovt: ["Manager Approval", "HR Review", "Payroll Processing"],
  pay: ["Discrepancy Review", "Manager Approval", "Payroll Adjustment", "Confirmation"],
  per: ["Self Assessment", "Peer Review", "Manager Evaluation", "Calibration"],
  pol: ["Distribution", "Read Confirmation", "Quiz Completion"],
  pro: ["Nomination", "HR Review", "Director Approval", "Promotion Letter"],
  ref: ["Manager Approval", "HR Draft", "Legal Review", "Issuance"],
  res: ["Resource Check", "Manager Approval", "Assignment Confirmation"],
  soft: ["License Check", "Budget Approval", "IT Procurement", "Installation"],
  train: ["Budget Approval", "Registration", "Scheduling", "Completion Verification"],
  wfh: ["Manager Approval", "IT Equipment Check", "HR Confirmation"],
}

const TITLE_TEMPLATES: Record<string, string[]> = {
  emp: ["Onboard new hire - {person}", "Onboard contractor - {person}", "Onboard intern - {person}", "Transfer onboarding - {person}"],
  exp: ["Client dinner reimbursement", "Travel expense claim", "Office supplies receipt", "Conference fee reimbursement", "Taxi expense claim", "Team lunch receipt"],
  it: ["Laptop repair request", "VPN access issue", "Printer malfunction", "Software installation", "Email setup", "Network connectivity issue", "Monitor replacement"],
  lv: ["Annual leave request", "Sick leave notification", "Personal day request", "Family emergency leave", "Vacation request"],
  pr: ["Office furniture purchase", "Software license renewal", "Server equipment order", "Marketing materials order", "Office supplies bulk order"],
  tr: ["Client visit - London", "Conference - Singapore", "Product Summit - Tokyo", "Workshop - Berlin", "Sales meeting - New York", "Training - Sydney"],
  acc: ["New vendor account - {person}", "Customer account setup", "Partner account creation"],
  ast: ["External monitor request", "Standing desk request", "Laptop upgrade", "Keyboard replacement", "Headset request"],
  aud: ["Q1 internal audit report", "Compliance audit findings", "Financial audit summary", "Process audit report"],
  bon: ["Q1 performance bonus", "Spot bonus nomination", "Annual bonus request", "Project completion bonus"],
  bud: ["Q2 department budget", "Marketing campaign budget", "R&D allocation request", "Training budget proposal"],
  car: ["Airport pickup booking", "Client meeting transport", "Site visit vehicle", "Team outing transport"],
  cli: ["Onboard GlobalTech Industries", "Onboard DataFlow Corp", "Onboard NexGen Solutions", "Onboard CloudFirst Ltd"],
  con: ["NDA with Acme Corp", "Service agreement review", "Employment contract update", "Vendor agreement renewal"],
  "emp-off": ["Offboard departing employee", "Contract end processing", "Retirement processing"],
  hlt: ["Fire drill report", "Ergonomic assessment", "Incident report - slip", "Air quality concern", "First aid kit audit"],
  hire: ["Senior Frontend Engineer", "Data Analyst position", "Product Manager role", "DevOps Engineer opening", "UX Designer vacancy"],
  ins: ["Medical claim filing", "Dental insurance claim", "Vision care claim", "Accident report claim"],
  inv: ["Cloud hosting invoice - March", "SaaS subscription renewal", "Consulting services invoice", "Hardware vendor payment"],
  key: ["Server room access card", "Building entry badge", "Parking garage key", "Lab access request"],
  mat: ["Maternity leave application", "Paternity leave request", "Adoption leave filing"],
  ovt: ["Weekend deployment support", "Quarter-end processing", "System migration overtime", "Holiday coverage shift"],
  pay: ["Overtime pay adjustment", "Bonus calculation fix", "Tax withholding correction", "Shift differential update"],
  per: ["Q1 Engineering review", "Annual sales review", "Mid-year design review", "Q3 marketing evaluation"],
  pol: ["Code of conduct acknowledgement", "Data privacy policy review", "Remote work policy update", "Travel policy revision"],
  pro: ["Senior to Lead promotion", "Associate to Senior promotion", "Manager to Director nomination"],
  ref: ["Employment reference - {person}", "Academic reference request", "Immigration reference letter"],
  res: ["Project Alpha staffing", "Client project resource", "Cross-team assignment", "Temporary reassignment"],
  soft: ["JetBrains license request", "Adobe Creative Cloud", "Slack workspace upgrade", "Figma team license", "GitHub Enterprise seat"],
  train: ["AWS certification course", "Leadership workshop", "Agile training program", "Data science bootcamp", "Security awareness training"],
  wfh: ["WFH arrangement - 3 days/week", "Full remote - temporary", "Hybrid schedule request", "Remote work extension"],
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

function generateInstances(): ProcessInstance[] {
  const instances: ProcessInstance[] = []
  const processIds = Object.keys(TASKS_BY_PROCESS)
  let counter = 1

  for (const processId of processIds) {
    const tasks = TASKS_BY_PROCESS[processId]
    const titles = TITLE_TEMPLATES[processId] ?? [`${processId} task`]
    const rand = seededRandom(processId.charCodeAt(0) * 1000 + processId.length)

    // Map processId to process name
    const processNameMap: Record<string, string> = {
      emp: "Employee Onboarding",
      exp: "Expense Reimbursement",
      it: "IT Support Ticket",
      lv: "Leave Request",
      pr: "Procurement Request",
      tr: "Travel Request",
      acc: "Account Opening",
      ast: "Asset Request",
      aud: "Audit Report Submission",
      bon: "Bonus Approval",
      bud: "Budget Request",
      car: "Car Pool Booking",
      cli: "Client Onboarding",
      con: "Contract Review",
      "emp-off": "Employee Offboarding",
      hlt: "Health & Safety Report",
      hire: "Hiring Request",
      ins: "Insurance Claim",
      inv: "Invoice Approval",
      key: "Key & Access Request",
      mat: "Maternity / Paternity Leave",
      ovt: "Overtime Request",
      pay: "Payroll Correction",
      per: "Performance Review",
      pol: "Policy Acknowledgement",
      pro: "Promotion Request",
      ref: "Reference Letter Request",
      res: "Resource Allocation",
      soft: "Software License Request",
      train: "Training Enrollment",
      wfh: "Work From Home Request",
    }

    const processName = processNameMap[processId] ?? processId

    for (let i = 0; i < 30; i++) {
      const r = rand()
      const initiator = PEOPLE[Math.floor(rand() * PEOPLE.length)]
      const assigneePerson = PEOPLE[Math.floor(rand() * PEOPLE.length)]
      const isCompleted = rand() > 0.5
      const titleTemplate = titles[Math.floor(rand() * titles.length)]
      const title = titleTemplate.replace("{person}", PEOPLE[Math.floor(rand() * PEOPLE.length)].name)

      // Generate dates spread across March-April 2026
      const dayOffset = Math.floor(r * 40)
      const hour = Math.floor(rand() * 14) + 7
      const minute = Math.floor(rand() * 60)
      const createdDate = new Date(2026, 2, 1 + dayOffset, hour, minute)

      let completedDate: Date | undefined
      if (isCompleted) {
        const daysToComplete = Math.floor(rand() * 10) + 1
        completedDate = new Date(createdDate.getTime() + daysToComplete * 86400000)
      }

      const currentTask = isCompleted ? "-" : tasks[Math.floor(rand() * tasks.length)]
      const assignee = isCompleted ? "-" : assigneePerson.name
      const assigneeEmail = isCompleted ? "-" : assigneePerson.email

      instances.push({
        id: `PI-${String(counter).padStart(4, "0")}`,
        processId,
        processName,
        title,
        initiator: initiator.name,
        initiatorEmail: initiator.email,
        createdDate: createdDate.toISOString().replace("Z", ""),
        completedDate: completedDate ? completedDate.toISOString().replace("Z", "") : undefined,
        currentTask,
        assignee,
        assigneeEmail,
        status: isCompleted ? "Completed" : "Active",
      })

      counter++
    }
  }

  return instances
}

export const PROCESS_INSTANCES: ProcessInstance[] = generateInstances()
