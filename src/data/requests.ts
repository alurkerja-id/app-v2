export type RequestStatus = "Open" | "Completed" | "Closed"

export interface Request {
  id: string
  type: string
  title: string
  requester: string
  requesterEmail: string
  requestedAt: string
  currentTask: string
  assignee: string
  status: RequestStatus
}

export const REQUESTS: Request[] = [
  {
    id: "REQ-1001",
    type: "Leave Request",
    title: "Annual leave 1–10 May",
    requester: "Emma Wilson",
    requesterEmail: "emma@company.com",
    requestedAt: "2026-03-28T09:12:00Z",
    currentTask: "Manager Review",
    assignee: "Alice Wang",
    status: "Open",
  },
  {
    id: "REQ-1002",
    type: "IT Support",
    title: "Laptop battery replacement",
    requester: "Carlos Ruiz",
    requesterEmail: "carlos@company.com",
    requestedAt: "2026-03-29T14:30:00Z",
    currentTask: "Completed",
    assignee: "IT Team",
    status: "Completed",
  },
  {
    id: "REQ-1003",
    type: "Expense Claim",
    title: "Client dinner reimbursement",
    requester: "John Doe",
    requesterEmail: "john@company.com",
    requestedAt: "2026-03-30T11:00:00Z",
    currentTask: "Finance Approval",
    assignee: "David Park",
    status: "Open",
  },
  {
    id: "REQ-1004",
    type: "Procurement",
    title: "Standing desk for remote worker",
    requester: "Aisha Kamara",
    requesterEmail: "aisha@company.com",
    requestedAt: "2026-03-25T08:45:00Z",
    currentTask: "Closed",
    assignee: "—",
    status: "Closed",
  },
  {
    id: "REQ-1005",
    type: "Travel Request",
    title: "Product Summit - Tokyo",
    requester: "Ken Watanabe",
    requesterEmail: "ken@company.com",
    requestedAt: "2026-03-31T16:20:00Z",
    currentTask: "Budget Review",
    assignee: "Sophie Martin",
    status: "Open",
  },
  {
    id: "REQ-1006",
    type: "Leave Request",
    title: "Sick leave 2 Apr",
    requester: "Maria Santos",
    requesterEmail: "maria@company.com",
    requestedAt: "2026-04-01T07:55:00Z",
    currentTask: "Completed",
    assignee: "Alice Wang",
    status: "Completed",
  },
  {
    id: "REQ-1007",
    type: "IT Support",
    title: "Access to staging environment",
    requester: "Liam O'Brien",
    requesterEmail: "liam@company.com",
    requestedAt: "2026-04-01T10:10:00Z",
    currentTask: "Security Review",
    assignee: "Chen Wei",
    status: "Open",
  },
  {
    id: "REQ-1008",
    type: "Expense Claim",
    title: "Online course subscription",
    requester: "Priya Sharma",
    requesterEmail: "priya@company.com",
    requestedAt: "2026-03-27T13:40:00Z",
    currentTask: "Completed",
    assignee: "HR Team",
    status: "Completed",
  },
  {
    id: "REQ-1009",
    type: "Procurement",
    title: "Adobe Creative Cloud license",
    requester: "Tom Brady",
    requesterEmail: "tom@company.com",
    requestedAt: "2026-03-26T15:05:00Z",
    currentTask: "Vendor Confirmation",
    assignee: "Procurement Team",
    status: "Open",
  },
  {
    id: "REQ-1010",
    type: "Travel Request",
    title: "Client visit - London",
    requester: "Rachel Kim",
    requesterEmail: "rachel@company.com",
    requestedAt: "2026-03-20T09:30:00Z",
    currentTask: "Closed",
    assignee: "—",
    status: "Closed",
  },
]
