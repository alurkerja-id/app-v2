import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  Task01Icon,
  UserGroupIcon,
  InboxIcon,
  Database02Icon,
  Building06Icon,
  UserAccountIcon,
  Location01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  Search01Icon,
  Rocket01Icon,
  CheckmarkCircle02Icon,
  TimeHalfPassIcon,
} from "@hugeicons/core-free-icons"
import type { Page } from "@/types/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ProcessList } from "@/components/processes/ProcessList"

interface SidebarProps {
  activePage: Page
  onNavigate: (page: Page) => void
  open?: boolean
}

interface NavChild {
  id: Page
  label: string
  icon: typeof Home01Icon
}

interface NavItem {
  id?: Page
  label: string
  icon: typeof Home01Icon
  badge?: string
  children?: NavChild[]
}

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: Home01Icon },
  { id: "tasks", label: "My Tasks", icon: Task01Icon, badge: "3" },
  { id: "group-tasks", label: "Group Tasks", icon: UserGroupIcon, badge: "8" },
  {
    label: "My Requests",
    icon: InboxIcon,
    children: [
      { id: "requests-active", label: "Active", icon: TimeHalfPassIcon },
      { id: "requests-completed", label: "Completed", icon: CheckmarkCircle02Icon },
    ],
  },
  {
    label: "Master Data",
    icon: Database02Icon,
    children: [
      { id: "md-departments", label: "Departments", icon: Building06Icon },
      { id: "md-positions", label: "Positions", icon: UserAccountIcon },
      { id: "md-locations", label: "Locations", icon: Location01Icon },
    ],
  },
]

const workspaces = [
  { id: "ws1", name: "Lotus HQ", current: true, role: "owner" as const },
  { id: "ws2", name: "Lotus APAC", current: false, role: "admin" as const },
  { id: "ws3", name: "Lotus Europe", current: false, role: "member" as const },
  { id: "ws4", name: "Lotus Americas", current: false, role: "member" as const },
]

export function Sidebar({ activePage, onNavigate, open = true }: SidebarProps) {
  const [wsSearch, setWsSearch] = useState("")
  const [processSearch, setProcessSearch] = useState("")
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["My Requests"])

  const filteredWs = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(wsSearch.toLowerCase())
  )

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    )
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl transition-transform duration-200 lg:shadow-none",
        open ? "translate-x-0" : "-translate-x-full pointer-events-none"
      )}
      aria-hidden={!open}
    >
      {/* Workspace Switcher */}
      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center gap-2.5 px-3 py-3.5 hover:bg-zinc-800 transition-colors text-left w-full border-b border-zinc-800">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white select-none">
              L
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-zinc-100">Lotus HQ</p>
              <p className="truncate text-[10px] text-zinc-400">Member</p>
            </div>
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 shrink-0 text-zinc-400" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Switch Workspace</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search workspaces..."
              className="pl-8"
              value={wsSearch}
              onChange={(e) => setWsSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            {filteredWs.map((ws) => (
              <button
                key={ws.id}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-accent transition-colors"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white">
                  {ws.name[0]}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium truncate">{ws.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{ws.role}</p>
                </div>
                {ws.current && (
                  <Badge variant="secondary" className="text-[10px]">
                    Current
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {/* Start a Process CTA */}
        <div className="px-2 mb-2">
          <Dialog open={processDialogOpen} onOpenChange={(open) => {
            setProcessDialogOpen(open)
            if (!open) setProcessSearch("")
          }}>
            <DialogTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 bg-sidebar-primary/15 border border-sidebar-primary/30 hover:bg-sidebar-primary/25 transition-all">
                <HugeiconsIcon icon={Rocket01Icon} className="size-5 shrink-0 text-sidebar-primary" />
                <span className="text-sm font-semibold text-sidebar-primary">
                  Start a Process
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-md bg-sidebar-primary">
                    <HugeiconsIcon icon={Rocket01Icon} className="size-3.5 text-sidebar-primary-foreground" />
                  </div>
                  Start a Process
                </DialogTitle>
              </DialogHeader>
              <div className="relative">
                <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search processes..."
                  className="pl-8"
                  value={processSearch}
                  onChange={(e) => setProcessSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <ProcessList
                search={processSearch}
                onSelect={() => setProcessDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="px-2">
          {navItems.map((item) => {
            // Item with children (expandable)
            if (item.children) {
              const expanded = expandedMenus.includes(item.label)
              const isChildActive = item.children.some((c) => activePage === c.id)

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 mb-0.5 transition-colors text-base",
                      isChildActive
                        ? "text-zinc-100 font-medium"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    )}
                  >
                    <HugeiconsIcon icon={item.icon} className="size-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className={cn(
                        "size-3.5 shrink-0 text-zinc-500 transition-transform duration-200",
                        expanded && "rotate-90"
                      )}
                    />
                  </button>

                  {/* Children */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-200",
                      expanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="ml-4 border-l border-zinc-700/60 pl-2 py-0.5">
                      {item.children.map((child) => {
                        const childActive = activePage === child.id
                        return (
                          <button
                            key={child.id}
                            onClick={() => onNavigate(child.id)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 mb-0.5 transition-colors text-sm",
                              childActive
                                ? "bg-zinc-700/60 text-zinc-100 font-medium"
                                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                            )}
                          >
                            <HugeiconsIcon icon={child.icon} className="size-3.5 shrink-0" />
                            <span className="flex-1 text-left">{child.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            }

            // Regular item (no children)
            const active = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => item.id && onNavigate(item.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 mb-0.5 transition-colors text-base",
                  active
                    ? "bg-zinc-700/60 text-zinc-100 font-medium"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                )}
              >
                <HugeiconsIcon icon={item.icon} className="size-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-sidebar-primary text-[10px] font-bold text-sidebar-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
