import { useState, Fragment } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Menu02Icon,
  Notification02Icon,
  UserIcon,
  Settings02Icon,
  Logout01Icon,
  ArrowDown01Icon,
  Building06Icon,
  Mail01Icon,
  GridViewIcon,
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
  start: ["Start Process", "Formulation"],
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
            {PAGE_BREADCRUMBS[activePage].length > 1 && (
              <BreadcrumbItem className="inline-flex sm:hidden shrink-0">
                <BreadcrumbSeparator />
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center">
                    <BreadcrumbEllipsis />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {PAGE_BREADCRUMBS[activePage].slice(0, -1).map((crumb, i) => (
                      <DropdownMenuItem key={i}>{crumb}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            )}

            {/* Crumb items — middle items hidden on mobile, last item always visible */}
            {PAGE_BREADCRUMBS[activePage]?.map((crumb, i, arr) => (
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 px-2">
              <Avatar size="sm">
                <AvatarFallback className="bg-foreground/[0.08] text-foreground text-[10px]">
                  AW
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block max-w-[160px]">
                <p className="text-xs font-semibold leading-tight truncate">Alice Wonderland McPherson</p>
                <p className="text-[10px] text-muted-foreground leading-tight truncate">alice.wonderland.mcpherson@internationalcorporation.com</p>
              </div>
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-3 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="flex items-center gap-2.5 px-2 py-2">
              <Avatar size="sm">
                <AvatarFallback className="bg-foreground/[0.08] text-foreground text-[10px]">
                  AW
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold">Alice Wonderland McPherson</p>
                <p className="truncate text-[10px] text-muted-foreground">alice.wonderland.mcpherson@internationalcorporation.com</p>
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
            <DropdownMenuItem className="gap-2" onClick={() => onNavigate("workspaces")}>
              <HugeiconsIcon icon={Building06Icon} className="size-3.5" />
              My Workspaces
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => onNavigate("invitations")}>
              <HugeiconsIcon icon={Mail01Icon} className="size-3.5" />
              My Invitations
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
