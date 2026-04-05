export interface Workspace {
  id: string
  initials: string
  name: string
  role: "owner" | "admin" | "member"
  current: boolean
  accent: string
}

export const WORKSPACES: Workspace[] = [
  { id: "ws1", initials: "BE", name: "Bayu edited", role: "owner", current: true, accent: "from-fuchsia-500 to-pink-500" },
  { id: "ws2", initials: "T1", name: "testing 123 /?# foobar", role: "member", current: false, accent: "from-cyan-500 to-sky-500" },
  { id: "ws3", initials: "D", name: "d", role: "member", current: false, accent: "from-red-400 to-rose-500" },
  { id: "ws4", initials: "BH", name: "bayu hendra winata", role: "admin", current: false, accent: "from-violet-500 to-purple-600" },
  { id: "ws5", initials: "WB", name: "Workspace baru Selasa 3 Feb 2026", role: "member", current: false, accent: "from-emerald-500 to-teal-600" },
  { id: "ws6", initials: "BK", name: "Bayu Kodigi", role: "member", current: false, accent: "from-blue-500 to-indigo-600" },
  { id: "ws7", initials: "TE", name: "test123", role: "member", current: false, accent: "from-amber-500 to-orange-500" },
  { id: "ws8", initials: "ET", name: "Etalazen", role: "member", current: false, accent: "from-violet-500 to-purple-500" },
  { id: "ws9", initials: "E2", name: "Etalazen 2", role: "member", current: false, accent: "from-indigo-500 to-blue-500" },
  { id: "ws10", initials: "E3", name: "Etalazen 3", role: "member", current: false, accent: "from-blue-500 to-cyan-500" },
  { id: "ws11", initials: "E4", name: "Etalazen 4", role: "member", current: false, accent: "from-teal-500 to-emerald-500" },
  { id: "ws12", initials: "E5", name: "Etalazen 5", role: "member", current: false, accent: "from-lime-500 to-green-500" },
  { id: "ws13", initials: "TE", name: "Telco", role: "member", current: false, accent: "from-orange-500 to-red-500" },
  { id: "ws14", initials: "JU", name: "Jurnal", role: "member", current: false, accent: "from-sky-500 to-blue-600" },
  { id: "ws15", initials: "OSS", name: "OSS", role: "member", current: false, accent: "from-slate-500 to-gray-600" },
  { id: "ws16", initials: "HC", name: "Hasna Collection", role: "member", current: false, accent: "from-rose-500 to-pink-600" },
  { id: "ws17", initials: "AK", name: "AlurKerjaaaaa", role: "member", current: false, accent: "from-emerald-500 to-green-600" },
  { id: "ws18", initials: "JA", name: "javan-dev", role: "member", current: false, accent: "from-zinc-500 to-stone-600" },
]
