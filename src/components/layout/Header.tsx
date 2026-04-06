import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Menu02Icon,
  GridViewIcon,
  AiBeautifyIcon,
  CpuIcon,
  Globe02Icon,
  Notification02Icon,
  UserIcon,
  Settings02Icon,
  Logout01Icon,
  Home01Icon,
} from "@hugeicons/core-free-icons"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PreferencesPanel } from "@/components/pages/PreferencesPage"
import { usePreferences } from "@/contexts/PreferencesContext"
import { cn } from "@/lib/utils"
import type { Page } from "@/types/navigation"

const PAGE_BREADCRUMBS: Record<Page, string[]> = {
  login: [],
  workspaces: [],
  invitations: [],
  home: [],
  profile: ["My Profile"],
  notifications: ["My Notifications"],
  tasks: ["My Tasks"],
  "group-tasks": ["Group Tasks"],
  "requests-active": ["My Requests", "Active"],
  "requests-completed": ["My Requests", "Completed"],
  "md-departments": ["Master Data", "Departments"],
  "md-positions": ["Master Data", "Positions"],
  "md-locations": ["Master Data", "Locations"],
}

const appItems = [
  {
    icon: GridViewIcon,
    title: "App",
    description: "End-user task management",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    icon: AiBeautifyIcon,
    title: "Studio",
    description: "Design & build processes",
    gradient: "from-violet-500 to-purple-600",
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
  onNavigate: (page: Page) => void
  scrolled?: boolean
}

export function Header({ activePage, onMenuToggle, onNavigate, scrolled = false }: HeaderProps) {
  const { color } = usePreferences()
  const isDefaultAccent = color.id === "zinc"
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  return (
    <>
      <div className={cn(
        "sticky top-0 z-30 transition-all duration-300",
        scrolled ? "p-0" : "px-3 pt-2"
      )}>
      <header className={cn(
        "flex h-11 items-center gap-2 px-3 transition-all duration-300",
        scrolled
          ? "rounded-none border-b border-border bg-background/95 backdrop-blur-sm"
          : "rounded-full border border-border/50 bg-background/80 backdrop-blur-md dark:border-border/65 dark:bg-background/60 dark:backdrop-blur-xl"
      )}>
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
              className="mr-2 gap-1.5 rounded-full border-border/50 bg-gradient-to-b from-white to-zinc-50 shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(15,23,42,0.03)] transition-[background-image,border-color,box-shadow,transform] hover:border-border/60 hover:from-zinc-50 hover:to-zinc-100 hover:shadow-[0_1px_3px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(15,23,42,0.04)] active:from-zinc-100 active:to-zinc-50 active:shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] active:translate-y-px dark:border-border/65 dark:bg-gradient-to-b dark:from-zinc-700 dark:to-zinc-800 dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.15)] dark:hover:border-border/75 dark:hover:from-zinc-650 dark:hover:to-zinc-750 dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.15)]"
            >
              <div className="grid grid-cols-2 gap-px size-4">
                <div className="rounded-tl-sm bg-violet-500 size-[7px]" />
                <div className="rounded-tr-sm bg-blue-500 size-[7px]" />
                <div className="rounded-bl-sm bg-emerald-500 size-[7px]" />
                <div className="rounded-br-sm bg-orange-500 size-[7px]" />
              </div>
              <span className="font-semibold">App</span>
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
        {activePage !== "home" && (
          <Breadcrumb>
            <BreadcrumbList>
              {/* Home icon */}
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="flex items-center cursor-pointer"
                  onClick={() => onNavigate("home")}
                >
                  <HugeiconsIcon icon={Home01Icon} className="size-3.5" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              {PAGE_BREADCRUMBS[activePage].map((crumb, i, arr) => (
                <BreadcrumbItem key={i}>
                  <BreadcrumbSeparator />
                  {i < arr.length - 1 ? (
                    <BreadcrumbLink>{crumb}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
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
                <span
                  className={cn(
                    "pointer-events-none absolute right-1 top-1 flex size-3 items-center justify-center",
                  )}
                >
                  <span
                    className={cn(
                      "absolute size-3 rounded-full",
                      isDefaultAccent ? "bg-red-500/18" : "bg-primary/18"
                    )}
                  />
                  <span
                    className={cn(
                      "absolute size-2.5 rounded-full animate-ping",
                      isDefaultAccent ? "bg-red-500/65" : "bg-primary/65"
                    )}
                  />
                  <span
                    className={cn(
                      "relative size-1.5 rounded-full",
                      isDefaultAccent ? "bg-red-500" : "bg-primary"
                    )}
                  />
                </span>
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              My Notifications
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  isDefaultAccent
                    ? "bg-red-500 text-white"
                    : "bg-primary text-primary-foreground"
                )}
              >
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
            <DropdownMenuItem className="justify-center font-medium text-primary" onClick={() => onNavigate("notifications")}>
              See all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 px-2">
              <Avatar size="sm">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-[10px]">
                  AW
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold leading-tight">Alice Wang</p>
                <p className="text-[10px] text-muted-foreground leading-tight">alice@company.com</p>
              </div>
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
            <DropdownMenuItem className="gap-2" onClick={() => onNavigate("profile")}>
              <HugeiconsIcon icon={UserIcon} className="size-3.5" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => setPreferencesOpen(true)}>
              <HugeiconsIcon icon={Settings02Icon} className="size-3.5" />
              My Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="gap-2" onClick={() => onNavigate("login")}>
              <HugeiconsIcon icon={Logout01Icon} className="size-3.5" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </header>
      </div>

      <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogContent
          className="max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] overflow-hidden p-0 sm:max-w-3xl"
          overlayClassName="supports-backdrop-filter:backdrop-blur-none backdrop-blur-none"
        >
          <PreferencesPanel inDialog />
        </DialogContent>
      </Dialog>
    </>
  )
}
