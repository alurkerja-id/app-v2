import { useState } from "react"
import {
  RiHome4Line,
  RiTaskLine,
  RiInboxLine,
  RiBarChartLine,
  RiMapLine,
  RiArrowDownSLine,
  RiCheckLine,
  RiSearchLine,
  RiBuildingLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Page = "home" | "tasks" | "requests" | "analytics" | "heatmap"

interface SidebarProps {
  activePage: Page
  onNavigate: (page: Page) => void
  open?: boolean
}

const navItems: { id: Page; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "home", label: "Home", icon: RiHome4Line },
  { id: "tasks", label: "My Tasks", icon: RiTaskLine, badge: "3" },
  { id: "requests", label: "Requests", icon: RiInboxLine },
  { id: "analytics", label: "Analytics", icon: RiBarChartLine },
  { id: "heatmap", label: "Process Discovery", icon: RiMapLine },
]

const workspaces = [
  { id: "ws1", name: "Lotus HQ", connected: true },
  { id: "ws2", name: "Lotus APAC", connected: false },
  { id: "ws3", name: "Lotus Europe", connected: false },
  { id: "ws4", name: "Lotus Americas", connected: false },
]

export function Sidebar({ activePage, onNavigate, open = true }: SidebarProps) {
  const [wsSearch, setWsSearch] = useState("")

  const filteredWs = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(wsSearch.toLowerCase())
  )

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-zinc-900 text-zinc-100 transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Workspace Switcher */}
      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center gap-2.5 px-3 py-3.5 hover:bg-zinc-800 transition-colors text-left w-full border-b border-zinc-800">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-none bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white select-none">
              L
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-100">Lotus HQ</p>
              <p className="truncate text-[10px] text-zinc-400">Enterprise</p>
            </div>
            <RiArrowDownSLine className="size-3.5 shrink-0 text-zinc-400" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Switch Workspace</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <RiSearchLine className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
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
                className="flex items-center gap-2.5 rounded-none px-2 py-2 text-xs hover:bg-accent transition-colors"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-none bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white">
                  {ws.name[0]}
                </div>
                <span className="flex-1 text-left font-medium">{ws.name}</span>
                {ws.connected && (
                  <Badge variant="secondary" className="text-[10px]">
                    Connected
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-2">
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Main
          </p>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-none px-2 py-1.5 text-xs transition-colors",
                  active
                    ? "bg-zinc-700/60 text-zinc-100 font-medium"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-4 px-2">
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Organization
          </p>
          <button className="flex w-full items-center gap-2.5 rounded-none px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors">
            <RiBuildingLine className="size-4 shrink-0" />
            <span className="flex-1 text-left">Company</span>
            <RiCheckLine className="size-3.5 text-blue-400" />
          </button>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-800 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[10px] font-semibold text-white">
            AW
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-zinc-200">Alice Wang</p>
            <p className="truncate text-[10px] text-zinc-500">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
