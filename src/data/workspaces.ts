export interface Workspace {
  id: string
  initials: string
  name: string
  role: "owner" | "admin" | "member"
  current: boolean
  accent: string
}

export const WORKSPACES: Workspace[] = [
  { id: "ws1", initials: "JC", name: "Javan Cipta Solusi", role: "owner", current: true, accent: "from-blue-500 to-indigo-600" },
  { id: "ws2", initials: "KD", name: "Kodigi", role: "admin", current: false, accent: "from-violet-500 to-purple-600" },
  { id: "ws3", initials: "SQ", name: "SyarQ", role: "member", current: false, accent: "from-emerald-500 to-teal-600" },
]
