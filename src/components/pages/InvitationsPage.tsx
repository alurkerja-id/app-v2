import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Building06Icon,
  CheckmarkCircle02Icon,
  UserIcon,
  Mail01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WorkspacePortalLayout } from "@/components/pages/WorkspacePortalLayout"
import { cn } from "@/lib/utils"
import type { Page } from "@/types/navigation"

interface InvitationsPageProps {
  onNavigate: (page: Page) => void
}

const INVITATIONS = [
  {
    no: 1,
    inviterName: "Luthfa Sobrian Pramasta",
    tenantName: "HSI",
    role: "admin",
    status: "pending" as const,
  },
  {
    no: 2,
    inviterName: "Anita Nur Hidayati",
    tenantName: "AlurKerjaaaaa",
    role: "member",
    status: "accepted" as const,
  },
]

export function InvitationsPage({ onNavigate }: InvitationsPageProps) {
  return (
    <WorkspacePortalLayout activeTab="invitations" onNavigate={onNavigate}>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col py-8 md:py-10">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-xl font-normal font-heading">
            <HugeiconsIcon icon={Mail01Icon} className="size-5 text-muted-foreground" />
            My Invitations (2)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review invitations you've received from other tenants.
          </p>
        </div>

        <div className="overflow-hidden rounded-4xl border border-border/70 bg-background/65 shadow-[0_10px_35px_rgba(15,23,42,0.06)] ring-1 ring-white/30 backdrop-blur-xl dark:bg-card/55 dark:ring-white/8">
          <div className="border-b border-border/65 bg-muted/20 px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Incoming invitations</p>
              <span className="text-xs text-muted-foreground">
                {INVITATIONS.length} items
              </span>
            </div>
          </div>

          <div>
            {INVITATIONS.map((invitation, index) => (
              <div
                key={invitation.no}
                className={cn(
                  "flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-foreground/[0.03] sm:px-5",
                  index !== 0 && "border-t border-border/65"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-xs font-semibold text-muted-foreground shadow-sm">
                    {String(invitation.no).padStart(2, "0")}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium leading-tight">
                          {invitation.inviterName}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <HugeiconsIcon icon={Building06Icon} className="size-3.5" />
                            {invitation.tenantName}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2 py-1 capitalize text-foreground/80">
                            <HugeiconsIcon icon={UserIcon} className="size-3.5" />
                            {invitation.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize",
                            invitation.status === "pending"
                              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                          )}
                        >
                          {invitation.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {invitation.status === "pending"
                      ? "This workspace invitation is waiting for your response."
                      : "This invitation has already been accepted and completed."}
                  </p>

                  {invitation.status === "pending" ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button size="sm" className="gap-1.5 rounded-full">
                        <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                        Accept
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
                        <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                        Decline
                      </Button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
                      Completed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WorkspacePortalLayout>
  )
}
