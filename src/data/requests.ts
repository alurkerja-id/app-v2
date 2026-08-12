import type { TaskField } from "@/data/tasks"

export type RequestStatus = "Active" | "Completed"

export interface Request {
  id: string
  process: string
  title: string
  requester: string
  requesterEmail: string
  createdDate: string
  completedDate?: string
  currentTask: string
  assignee: string
  status: RequestStatus
  priority: "High" | "Medium" | "Low"
  steps: number
  fields: TaskField[]
}

export const REQUESTS: Request[] = [
  {
    id: "REQ-1001",
    process: "Leave Request",
    title: "Annual leave 1–10 May",
    requester: "Emma Wilson",
    requesterEmail: "emma@company.com",
    createdDate: "2026-03-28T09:15:00",
    currentTask: "Supervisor Review, Manager Review",
    assignee: "Alice Wang",
    status: "Active",
    priority: "Medium",
    steps: 3,
    fields: [
      { id: "f1", label: "Employee", type: "text", value: "Emma Wilson", group: "Info" },
      { id: "f2", label: "Leave Type", type: "text", value: "Annual Leave", group: "Info" },
    ],
  },
  {
    id: "REQ-1002",
    process: "IT Support Ticket",
    title: "Laptop battery replacement",
    requester: "Carlos Ruiz",
    requesterEmail: "carlos@company.com",
    createdDate: "2026-03-29T14:30:00",
    completedDate: "2026-03-31T10:45:00",
    currentTask: "-",
    assignee: "-",
    status: "Completed",
    priority: "Low",
    steps: 5,
    fields: [
      { id: "f1", label: "Reporter", type: "text", value: "Carlos Ruiz", group: "Info" },
      { id: "f2", label: "Category", type: "text", value: "Hardware", group: "Info" },
    ],
  },
  {
    id: "REQ-1003",
    process: "Expense Reimbursement",
    title: "Client dinner reimbursement",
    requester: "John Doe",
    requesterEmail: "john@company.com",
    createdDate: "2026-03-30T11:00:00",
    currentTask: "Finance Approval",
    assignee: "David Park",
    status: "Active",
    priority: "High",
    steps: 4,
    fields: [
      { id: "f1", label: "Employee", type: "text", value: "John Doe", group: "Info" },
      { id: "f2", label: "Period", type: "text", value: "Q1 2026 (Jan–Mar)", group: "Info" },
    ],
  },
  {
    id: "REQ-1004",
    process: "Procurement Request",
    title: "Standing desk for remote worker",
    requester: "Aisha Kamara",
    requesterEmail: "aisha@company.com",
    createdDate: "2026-03-25T08:20:00",
    completedDate: "2026-04-01T16:30:00",
    currentTask: "-",
    assignee: "-",
    status: "Completed",
    priority: "Medium",
    steps: 7,
    fields: [
      { id: "f1", label: "Requestor", type: "text", value: "Aisha Kamara", group: "Info" },
      { id: "f2", label: "Description", type: "longtext", value: "Ergonomic standing desk for home office setup", group: "Info" },
    ],
  },
  {
    id: "REQ-1005",
    process: "Travel Request",
    title: "Product Summit - Tokyo",
    requester: "Ken Watanabe",
    requesterEmail: "ken@company.com",
    createdDate: "2026-03-31T10:45:00",
    currentTask: "Budget Review",
    assignee: "Sophie Martin",
    status: "Active",
    priority: "High",
    steps: 5,
    fields: [
      { id: "f1", label: "Traveler", type: "text", value: "Ken Watanabe", group: "Info" },
      { id: "f2", label: "Destination", type: "text", value: "Tokyo, Japan", group: "Info" },
    ],
  },
  {
    id: "REQ-1006",
    process: "Leave Request",
    title: "Sick leave 2 Apr",
    requester: "Maria Santos",
    requesterEmail: "maria@company.com",
    createdDate: "2026-04-01T07:30:00",
    completedDate: "2026-04-01T09:15:00",
    currentTask: "-",
    assignee: "-",
    status: "Completed",
    priority: "Low",
    steps: 3,
    fields: [
      { id: "f1", label: "Employee", type: "text", value: "Maria Santos", group: "Info" },
      { id: "f2", label: "Leave Type", type: "text", value: "Sick Leave", group: "Info" },
    ],
  },
  {
    id: "REQ-1007",
    process: "IT Support Ticket",
    title: "Access to staging environment",
    requester: "Liam O'Brien",
    requesterEmail: "liam@company.com",
    createdDate: "2026-04-01T13:00:00",
    currentTask: "Security Review",
    assignee: "Chen Wei",
    status: "Active",
    priority: "Medium",
    steps: 4,
    fields: [
      { id: "f1", label: "Reporter", type: "text", value: "Liam O'Brien", group: "Info" },
      { id: "f2", label: "Category", type: "text", value: "Access Request", group: "Info" },
    ],
  },
  {
    id: "REQ-1008",
    process: "Expense Reimbursement",
    title: "Online course subscription",
    requester: "Priya Sharma",
    requesterEmail: "priya@company.com",
    createdDate: "2026-03-27T15:45:00",
    completedDate: "2026-03-29T11:20:00",
    currentTask: "-",
    assignee: "-",
    status: "Completed",
    priority: "Low",
    steps: 4,
    fields: [
      { id: "f1", label: "Employee", type: "text", value: "Priya Sharma", group: "Info" },
      { id: "f2", label: "Period", type: "text", value: "Q1 2026 (Jan–Mar)", group: "Info" },
    ],
  },
  {
    id: "REQ-1009",
    process: "Procurement Request",
    title: "Adobe Creative Cloud license",
    requester: "Tom Brady",
    requesterEmail: "tom@company.com",
    createdDate: "2026-03-26T09:00:00",
    currentTask: "Vendor Confirmation",
    assignee: "Procurement Team",
    status: "Active",
    priority: "Medium",
    steps: 6,
    fields: [
      { id: "f1", label: "Requestor", type: "text", value: "Tom Brady", group: "Info" },
      { id: "f2", label: "Description", type: "longtext", value: "Annual Adobe Creative Cloud subscription for design team", group: "Info" },
    ],
  },
  {
    id: "REQ-1010",
    process: "Travel Request",
    title: "Client visit - London",
    requester: "Rachel Kim",
    requesterEmail: "rachel@company.com",
    createdDate: "2026-03-20T10:00:00",
    completedDate: "2026-03-28T14:30:00",
    currentTask: "-",
    assignee: "-",
    status: "Completed",
    priority: "Medium",
    steps: 6,
    fields: [
      { id: "f1", label: "Traveler", type: "text", value: "Rachel Kim", group: "Info" },
      { id: "f2", label: "Destination", type: "text", value: "London, UK", group: "Info" },
    ],
  },
  {
    id: "REQ-1011",
    process: "Employee Onboarding",
    title: "Onboard new intern - Alex Tan",
    requester: "Alice Wang",
    requesterEmail: "alice@company.com",
    createdDate: "2026-04-02T08:00:00",
    currentTask: "Document Verification",
    assignee: "HR Team",
    status: "Active",
    priority: "Medium",
    steps: 3,
    fields: [
      { id: "f1", label: "Employee Name", type: "text", value: "Alex Tan", group: "Info" },
      { id: "f2", label: "Department", type: "text", value: "Engineering", group: "Info" },
    ],
  },
  {
    id: "REQ-1012",
    process: "Employee Onboarding",
    title: "Onboard contractor - Yuki Sato",
    requester: "Alice Wang",
    requesterEmail: "alice@company.com",
    createdDate: "2026-03-15T09:30:00",
    completedDate: "2026-03-22T17:00:00",
    currentTask: "-",
    assignee: "-",
    status: "Completed",
    priority: "Low",
    steps: 8,
    fields: [
      { id: "f1", label: "Employee Name", type: "text", value: "Yuki Sato", group: "Info" },
      { id: "f2", label: "Department", type: "text", value: "Design", group: "Info" },
    ],
  },
]
