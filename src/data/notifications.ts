export type AppNotification = {
  id: number
  type: "task_assigned" | "request_completed" | "request_rejected" | "request_progressed" | "approval_requested"
  title: string
  description: string
  process: string
  timestamp: string
  read: boolean
}

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 1,
    type: "task_assigned",
    title: "You were assigned a new approval task",
    description: "Review and approve Bayu Hendra Winata's travel request.",
    process: "Travel Request",
    timestamp: "2026-04-05T09:05:00+07:00",
    read: false,
  },
  {
    id: 2,
    type: "request_completed",
    title: "Your expense reimbursement was completed",
    description: "Expense reimbursement ER-2026-018 has been fully processed.",
    process: "Expense Reimbursement",
    timestamp: "2026-04-05T08:30:00+07:00",
    read: false,
  },
  {
    id: 3,
    type: "request_rejected",
    title: "Your procurement request was rejected",
    description: "Server hardware procurement requires revised vendor quotations.",
    process: "Procurement Request",
    timestamp: "2026-04-04T16:15:00+07:00",
    read: false,
  },
  {
    id: 4,
    type: "request_progressed",
    title: "Your leave request moved to final approval",
    description: "The request is now waiting for HR confirmation.",
    process: "Leave Request",
    timestamp: "2026-04-04T13:20:00+07:00",
    read: true,
  },
  {
    id: 5,
    type: "approval_requested",
    title: "Approval requested for employee onboarding",
    description: "Please validate laptop and account provisioning for James Lee.",
    process: "Employee Onboarding",
    timestamp: "2026-04-04T10:00:00+07:00",
    read: true,
  },
  {
    id: 6,
    type: "request_progressed",
    title: "Your IT support ticket has been updated",
    description: "The infrastructure team is currently investigating the VPN issue.",
    process: "IT Support Ticket",
    timestamp: "2026-04-03T15:40:00+07:00",
    read: true,
  },
]
