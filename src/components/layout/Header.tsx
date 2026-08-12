import { Fragment } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Menu02Icon,
  Notification02Icon,
  GridViewIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserMenu } from "@/components/layout/UserMenu"
import { usePreferences } from "@/contexts/PreferencesContext"
import { useAppMode } from "@/contexts/AppModeContext"
import { cn } from "@/lib/utils"
import type { Page } from "@/types/navigation"
import { processes } from "@/components/processes/ProcessList"

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
  start: ["Start Process", "Formulation"],
  "form-component": ["Pages", "Form Component"],
  "business-processes": ["Business Processes"],
  "analytics-process": ["Analytics", "Process Analytics"],
  "process-discovery": ["Analytics", "Process Discovery"],
  "analytics-workforce": ["Analytics", "Workforce Analytics"],
  "helpdesk-dashboard": ["Analytics", "HelpDesk Dashboard"],
  "invite-link": [],
}

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
  activeProcessId?: string
}

export function Header({ activePage, onMenuToggle, onNavigate, scrolled = false, activeProcessId }: HeaderProps) {
  const { color } = usePreferences()
  const { testMode, setTestMode } = useAppMode()
  const isDefaultAccent = color.id === "zinc"

  const breadcrumbs = (() => {
    if (activePage === "business-processes" && activeProcessId) {
      const proc = processes.find((p) => p.id === activeProcessId)
      return ["Business Processes", proc?.name ?? activeProcessId]
    }
    return PAGE_BREADCRUMBS[activePage]
  })()

  return (
    <>
      {testMode && (
        <div className="sticky top-0 z-40 border-b border-blue-500/20 bg-blue-500/10 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 py-2">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <HugeiconsIcon icon={InformationCircleIcon} className="size-3.5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  You are in Test Mode
                </p>

                <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                  All changes will not affect the live environment
                </p>
              </div>
            </div>

            <Button size="sm" className="h-8 shrink-0" onClick={() => setTestMode(false)}>
              Switch to Live
            </Button>
          </div>
        </div>
      )}
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

        {/* Breadcrumb */}
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            {/* App icon — always visible */}
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbLink
                className="flex items-center gap-1.5 cursor-pointer"
                onClick={() => onNavigate("home")}
              >
                <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <HugeiconsIcon icon={GridViewIcon} className="size-3" />
                </div>
                <span className="hidden sm:inline font-semibold text-foreground leading-none">App</span>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {/* Mobile ellipsis — shown only when more than 1 crumb */}
            {breadcrumbs.length > 1 && (
              <BreadcrumbItem className="inline-flex sm:hidden shrink-0">
                <BreadcrumbSeparator />
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center">
                    <BreadcrumbEllipsis />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {breadcrumbs.slice(0, -1).map((crumb, i) => (
                      <DropdownMenuItem key={i}>{crumb}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            )}

            {/* Crumb items — middle items hidden on mobile, last item always visible */}
            {breadcrumbs?.map((crumb, i, arr) => (
              <Fragment key={i}>
                <BreadcrumbSeparator className={cn(arr.length > 1 && i < arr.length - 1 && "hidden sm:block")} />
                <BreadcrumbItem
                  className={cn(
                    "shrink-0",
                    arr.length > 1 && i < arr.length - 1 && "hidden sm:inline-flex"
                  )}
                >
                  {i < arr.length - 1 ? (
                    <BreadcrumbLink>{crumb}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
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
        <UserMenu onNavigate={onNavigate} activePage={activePage} showAdvanced />
      </div>
      </header>
      </div>
    </>
  )
}
