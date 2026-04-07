import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiBeautifyIcon,
  ArrowDown01Icon,
  Building06Icon,
  CpuIcon,
  Globe02Icon,
  GridViewIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { WORKSPACES, type Workspace } from "@/data/workspaces"
import { WorkspacePortalLayout } from "@/components/pages/WorkspacePortalLayout"
import type { Page } from "@/types/navigation"
import { toast } from "sonner"

interface WorkspacesPageProps {
  onNavigate: (page: Page) => void
}

const APP_OPTIONS = [
  { id: "app", label: "App", description: "Tasklists for internal team", icon: GridViewIcon, gradient: "from-blue-500 to-indigo-600" },
  { id: "studio", label: "Studio", description: "Design & build processes", icon: AiBeautifyIcon, gradient: "from-violet-500 to-purple-600" },
  { id: "simulation", label: "Simulation", description: "Run several workflow scenarios", icon: CpuIcon, gradient: "from-emerald-500 to-teal-600" },
  { id: "company-profile", label: "Company Profile", description: "Manage company information", icon: Building06Icon, gradient: "from-cyan-500 to-sky-600" },
  { id: "microsite", label: "Microsite", description: "Company information for public", icon: Globe02Icon, gradient: "from-orange-500 to-amber-600" },
] as const

type AppOption = (typeof APP_OPTIONS)[number]

function getAccessibleApps(role: Workspace["role"]) {
  if (role === "member") {
    return APP_OPTIONS.filter((app) => app.id === "app" || app.id === "microsite")
  }

  return APP_OPTIONS
}

function resolveDefaultApp(workspace: Workspace): AppOption {
  const availableApps = getAccessibleApps(workspace.role)
  const queryAppId = new URLSearchParams(window.location.search).get("app")
  const savedAppId = window.localStorage.getItem(`workspace-default-app:${workspace.id}`)
  const requestedAppId = queryAppId || savedAppId
  return availableApps.find((app) => app.id === requestedAppId) ?? availableApps[0]
}

export function WorkspacesPage({ onNavigate }: WorkspacesPageProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [wsName, setWsName] = useState("")
  const [wsDescription, setWsDescription] = useState("")

  const openWorkspace = (workspace: Workspace, app: AppOption) => {
    window.localStorage.setItem(`workspace-default-app:${workspace.id}`, app.id)
    onNavigate("home")
  }

  const handleCreate = () => {
    if (!wsName.trim()) return
    toast.success(`Workspace "${wsName}" created successfully`)
    setWsName("")
    setWsDescription("")
    setCreateDialogOpen(false)
  }

  return (
    <WorkspacePortalLayout activeTab="workspaces" onNavigate={onNavigate}>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col py-8 md:py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-normal font-heading">
              <HugeiconsIcon icon={Building06Icon} className="size-5 text-muted-foreground" />
              My Workspaces ({WORKSPACES.length})
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose workspace you've joined.
            </p>
          </div>
          <Button size="sm" className="gap-1.5 self-start rounded-full" onClick={() => setCreateDialogOpen(true)}>
            <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
            Create New Workspace
          </Button>
        </div>

        <div className="overflow-hidden rounded-4xl border border-border/70 bg-background/65 shadow-[0_10px_35px_rgba(15,23,42,0.06)] ring-1 ring-white/30 backdrop-blur-xl dark:bg-card/55 dark:ring-white/8">
          {WORKSPACES.map((workspace, index) => (
            <div
              key={workspace.id}
              role="button"
              tabIndex={0}
              onClick={() => openWorkspace(workspace, resolveDefaultApp(workspace))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  openWorkspace(workspace, resolveDefaultApp(workspace))
                }
              }}
              className={cn(
                "group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.035] dark:hover:bg-white/[0.04]",
                index !== 0 && "border-t border-border/65"
              )}
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[13px] font-semibold text-white shadow-sm",
                  workspace.accent
                )}
              >
                {workspace.initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium leading-tight">{workspace.name}</p>
                <p className="mt-1 text-xs capitalize text-muted-foreground">
                  {workspace.role}
                </p>
              </div>

              <span className="hidden text-xs text-muted-foreground sm:block">
                {getAccessibleApps(workspace.role).length} apps
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 rounded-full"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 text-muted-foreground" />
                    <span className="sr-only">Choose app</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    {workspace.name}
                    <span className="text-[10px] font-medium capitalize text-muted-foreground">
                      {workspace.role}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {getAccessibleApps(workspace.role).map((app) => (
                    <DropdownMenuItem
                      key={app.id}
                      className="gap-3 py-2"
                      onClick={() => openWorkspace(workspace, app)}
                    >
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                          app.gradient
                        )}
                      >
                        <HugeiconsIcon icon={app.icon} className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{app.label}</p>
                        <p className="truncate text-muted-foreground">{app.description}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>

      {/* Create Workspace Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Set up a new workspace for your team or organization.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ws-name">Workspace Name <span className="text-destructive">*</span></Label>
              <Input
                id="ws-name"
                placeholder="e.g. My Company"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ws-desc">Description</Label>
              <Textarea
                id="ws-desc"
                placeholder="Brief description of this workspace..."
                value={wsDescription}
                onChange={(e) => setWsDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!wsName.trim()}>
              Create Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspacePortalLayout>
  )
}
