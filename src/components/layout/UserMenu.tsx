import { useState } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Building06Icon,
  Logout01Icon,
  Mail01Icon,
  Moon02Icon,
  PlugSocketIcon,
  SidebarLeftIcon,
  Sun03Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PreferencesPanel } from "@/components/pages/PreferencesPage"
import { usePreferences, type Theme } from "@/contexts/PreferencesContext"
import { useAppMode } from "@/contexts/AppModeContext"
import { currentUser } from "@/data/current-user"
import { cn } from "@/lib/utils"
import type { Page } from "@/types/navigation"

// Appearance modes mirror the My Preferences panel (Default / Dark / Light).
const THEME_OPTIONS: { id: Theme; label: string; icon: IconSvgElement }[] = [
  { id: "system", label: "Default", icon: SidebarLeftIcon },
  { id: "dark", label: "Dark", icon: Moon02Icon },
  { id: "light", label: "Light", icon: Sun03Icon },
]

interface UserMenuProps {
  onNavigate: (page: Page) => void
  /** The page being viewed — its own entry is dropped from the menu. */
  activePage?: Page
  /**
   * MCP Connection is an account-level entry point that only lives in the
   * workspace portal (My Workspaces / My Invitations).
   */
  showMcpConnection?: boolean
  /**
   * Advanced settings (Test Mode / Developer Mode) need a workspace context,
   * so they only appear once a workspace has been picked.
   */
  showAdvanced?: boolean
}

// Single source of truth for the avatar menu in the top-right corner. Both the
// workspace portal header and the in-workspace header render this, so the two
// can no longer drift apart.
export function UserMenu({
  onNavigate,
  activePage,
  showMcpConnection = false,
  showAdvanced = false,
}: UserMenuProps) {
  const { theme, setTheme } = usePreferences()
  const { testMode, setTestMode, developerMode, setDeveloperMode } = useAppMode()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  return (
    <>
      <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 px-2">
            <Avatar size="sm">
              <AvatarFallback className="bg-foreground/[0.08] text-foreground text-[10px]">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block max-w-[160px]">
              <p className="text-xs font-semibold leading-tight truncate">{currentUser.name}</p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate">{currentUser.email}</p>
            </div>
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-3 text-muted-foreground hidden sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {/* Identity header — only on mobile, where the trigger button
              collapses to just the avatar. On desktop the trigger already
              shows name + email, so repeating it here is redundant. */}
          <div className="flex items-center gap-2.5 px-2 py-2 sm:hidden">
            <Avatar size="sm">
              <AvatarFallback className="bg-foreground/[0.08] text-foreground text-[10px]">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-semibold">{currentUser.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{currentUser.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator className="sm:hidden" />
          {/* Account — the page you are already on is left out. */}
          {activePage !== "profile" && (
            <DropdownMenuItem className="gap-2" onClick={() => onNavigate("profile")}>
              <HugeiconsIcon icon={UserIcon} className="size-3.5" />
              My Profile
            </DropdownMenuItem>
          )}
          {activePage !== "workspaces" && (
            <DropdownMenuItem className="gap-2" onClick={() => onNavigate("workspaces")}>
              <HugeiconsIcon icon={Building06Icon} className="size-3.5" />
              My Workspaces
            </DropdownMenuItem>
          )}
          {activePage !== "invitations" && (
            <DropdownMenuItem className="gap-2" onClick={() => onNavigate("invitations")}>
              <HugeiconsIcon icon={Mail01Icon} className="size-3.5" />
              My Invitations
            </DropdownMenuItem>
          )}
          {/* Integrations — account-level, separate from the navigation above. */}
          {showMcpConnection && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2"
                onClick={() => toast.info("MCP Connection page is not part of this prototype yet.")}
              >
                <HugeiconsIcon icon={PlugSocketIcon} className="size-3.5" />
                MCP Connection
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          {/* Theme */}
          <div className="px-2 py-1.5">
            <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">
              Appearance
            </p>
            <div className="flex gap-2">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id)}
                  title={opt.label}
                  aria-label={opt.label}
                  aria-pressed={theme === opt.id}
                  className={cn(
                    "flex flex-1 items-center justify-center rounded-lg border-2 bg-background py-2 transition-all duration-150",
                    theme === opt.id
                      ? "border-primary shadow-sm"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  <HugeiconsIcon
                    icon={opt.icon}
                    className={cn(
                      "size-4",
                      theme === opt.id ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false)
                setPreferencesOpen(true)
              }}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              More Options…
            </button>
          </div>
          {showAdvanced && (
            <>
              <DropdownMenuSeparator />
              {/* Advanced */}
              <div className="px-2 py-1.5">
                <p className="mb-1 text-[10px] font-medium text-muted-foreground">
                  Advanced
                </p>
                {/* Test Mode */}
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs font-medium">Test Mode</span>
                  <Switch checked={testMode} onCheckedChange={setTestMode} />
                </div>
                {/* Developer Mode */}
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs font-medium">Developer Mode</span>
                  <Switch checked={developerMode} onCheckedChange={setDeveloperMode} />
                </div>
              </div>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" className="gap-2" onClick={() => onNavigate("login")}>
            <HugeiconsIcon icon={Logout01Icon} className="size-3.5" />
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
