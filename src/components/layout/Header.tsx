import { HugeiconsIcon } from "@hugeicons/react"
import {
  Menu02Icon,
  GridViewIcon,
  AiBeautifyIcon,
  TerminalIcon,
  CpuIcon,
  Globe02Icon,
  Notification02Icon,
  UserIcon,
  Settings02Icon,
  Logout01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Page = "home" | "tasks" | "requests" | "analytics" | "heatmap"

const PAGE_LABELS: Record<Page, string> = {
  home: "Home",
  tasks: "My Tasks",
  requests: "Requests",
  analytics: "Analytics",
  heatmap: "Process Discovery",
}

const appItems = [
  {
    icon: AiBeautifyIcon,
    title: "Studio",
    description: "Design & build processes",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: GridViewIcon,
    title: "App",
    description: "End-user task management",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    icon: CpuIcon,
    title: "Simulation Engine",
    description: "Model & test workflows",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: Globe02Icon,
    title: "Microsite",
    description: "Publish branded web pages",
    gradient: "from-orange-500 to-amber-600",
  },
]

const notifications = [
  {
    id: 1,
    initials: "JD",
    color: "from-blue-500 to-indigo-600",
    title: "John Doe submitted expense report",
    description: "Expense Reimbursement · 5m ago",
  },
  {
    id: 2,
    initials: "EW",
    color: "from-emerald-500 to-teal-600",
    title: "Emma Wilson requested leave approval",
    description: "Leave Request · 12m ago",
  },
  {
    id: 3,
    initials: "DP",
    color: "from-amber-500 to-orange-600",
    title: "David Park flagged procurement as urgent",
    description: "Procurement Request · 1h ago",
  },
  {
    id: 4,
    initials: "CW",
    color: "from-rose-500 to-pink-600",
    title: "Chen Wei escalated IT ticket",
    description: "IT Support · 2h ago",
  },
  {
    id: 5,
    initials: "LT",
    color: "from-violet-500 to-purple-600",
    title: "Lisa Tan's travel request was approved",
    description: "Travel Request · 3h ago",
  },
  {
    id: 6,
    initials: "NO",
    color: "from-cyan-500 to-sky-600",
    title: "Nina Okafor submitted maternity leave",
    description: "Leave Request · 5h ago",
  },
]

interface HeaderProps {
  activePage: Page
  onMenuToggle: () => void
}

export function Header({ activePage, onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-11 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur-sm">
      {/* Left: hamburger + app switcher + breadcrumb */}
      <div className="flex items-center gap-1.5">
        {/* Hamburger (mobile) */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onMenuToggle}
        >
          <HugeiconsIcon icon={Menu02Icon} />
        </Button>

        {/* App Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-200/50 dark:border-blue-800/50 hover:from-blue-500/20 hover:to-indigo-500/20"
            >
              <HugeiconsIcon icon={GridViewIcon} className="size-3.5 text-blue-500" />
              <span className="font-semibold text-blue-600 dark:text-blue-400">App</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuLabel>Switch App</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {appItems.map((app) => (
                <DropdownMenuItem key={app.title} className="gap-3 py-2">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${app.gradient} text-white`}
                  >
                    <HugeiconsIcon icon={app.icon} className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{app.title}</p>
                    <p className="truncate text-muted-foreground">{app.description}</p>
                  </div>
                </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
          <span className="font-medium text-foreground">{PAGE_LABELS[activePage]}</span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Notification + User */}
      <div className="flex items-center gap-1">
        {/* Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative">
              <HugeiconsIcon icon={Notification02Icon} />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-red-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                6
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="gap-2.5 py-2 items-start">
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${n.color} text-[10px] font-semibold text-white`}
                >
                  {n.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{n.title}</p>
                  <p className="text-muted-foreground">{n.description}</p>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center font-medium text-blue-600 dark:text-blue-400">
              See all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <Avatar size="sm">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-[10px]">
                  AW
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="flex items-center gap-2.5 px-2 py-2">
              <Avatar size="sm">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-[10px]">
                  AW
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold">Alice Wang</p>
                <p className="truncate text-[10px] text-muted-foreground">alice@company.com</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <HugeiconsIcon icon={UserIcon} className="size-3.5" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <HugeiconsIcon icon={Settings02Icon} className="size-3.5" />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="gap-2">
              <HugeiconsIcon icon={Logout01Icon} className="size-3.5" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
