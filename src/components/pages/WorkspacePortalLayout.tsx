import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building06Icon,
  Logout01Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePreferences } from "@/contexts/PreferencesContext"
import { cn } from "@/lib/utils"
import type { Page } from "@/types/navigation"

const PATTERN_COLOR_LIGHT = "#0000000b"
const PATTERN_COLOR_DARK = "#ffffff16"

interface WorkspacePortalLayoutProps {
  activeTab: "workspaces" | "invitations"
  children: React.ReactNode
  onNavigate: (page: Page) => void
}

export function WorkspacePortalLayout({
  activeTab,
  children,
  onNavigate,
}: WorkspacePortalLayoutProps) {
  const { pattern, color } = usePreferences()
  const isDark = document.documentElement.classList.contains("dark")
  const isDefaultAccent = color.id === "zinc"
  const pageStyle = useMemo(
    () => pattern.getStyle(isDark ? PATTERN_COLOR_DARK : PATTERN_COLOR_LIGHT),
    [isDark, pattern]
  )

  const badgeClass = isDefaultAccent
    ? "bg-red-500 text-white"
    : "bg-primary text-primary-foreground"

  return (
    <div className="min-h-screen bg-background text-foreground" style={pageStyle}>
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-5 md:px-8 md:py-6">
        <div className="sticky top-0 z-30 px-3 pt-2">
          <header className="flex min-h-11 flex-wrap items-center gap-2 rounded-full border border-border/50 bg-background/80 px-3 py-2 backdrop-blur-md dark:border-border/65 dark:bg-background/60 dark:backdrop-blur-xl sm:h-11 sm:flex-nowrap sm:py-0">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="flex shrink-0 items-center gap-2.5 text-left"
            >
              <img
                src="https://alurkerja.com/images/alurkerja-logo.png"
                alt="AlurKerja"
                className="h-4 w-auto object-contain"
              />
              <span className="font-semibold font-heading">AlurKerja</span>
            </button>

            <div className="order-3 flex w-full justify-center gap-1 pt-1 sm:order-2 sm:w-auto sm:flex-1 sm:pt-0">
              <Button
                variant={activeTab === "workspaces" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-2 px-2 text-xs sm:px-2.5 sm:text-sm"
                onClick={() => onNavigate("workspaces")}
              >
                <HugeiconsIcon icon={Building06Icon} className="size-4" />
                My Workspaces
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", badgeClass)}>
                  12
                </span>
              </Button>
              <Button
                variant={activeTab === "invitations" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-2 px-2 text-xs sm:px-2.5 sm:text-sm"
                onClick={() => onNavigate("invitations")}
              >
                <HugeiconsIcon icon={Mail01Icon} className="size-4" />
                My Invitations
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", badgeClass)}>
                  2
                </span>
              </Button>
            </div>

            <div className="order-2 ml-auto flex shrink-0 items-center gap-1 sm:order-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 px-2">
                    <Avatar size="sm">
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-[10px]">
                        AW
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left sm:block">
                      <p className="text-xs font-semibold leading-tight">Alice Wang</p>
                      <p className="text-[10px] leading-tight text-muted-foreground">alice@company.com</p>
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
                  <DropdownMenuItem variant="destructive" className="gap-2">
                    <HugeiconsIcon icon={Logout01Icon} className="size-3.5" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
        </div>

        {children}
      </div>
    </div>
  )
}
