import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Mail01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { WorkspacePortalLayout } from "@/components/pages/WorkspacePortalLayout"
import { cn } from "@/lib/utils"
import type { Page } from "@/types/navigation"

interface InvitationsPageProps {
  onNavigate: (page: Page) => void
}

const INVITATIONS = [
  {
    id: "inv-1",
    inviterName: "Luthfa Sobrian Pramasta",
    tenantName: "HSI",
    tenantInitials: "HS",
    tenantAccent: "from-rose-500 to-pink-600",
    role: "admin",
    status: "pending" as const,
  },
  {
    id: "inv-2",
    inviterName: "Anita Nur Hidayati",
    tenantName: "AlurKerjaaaaa",
    tenantInitials: "AK",
    tenantAccent: "from-blue-500 to-indigo-600",
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
            My Invitations ({INVITATIONS.length})
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review invitations you've received from other tenants.
          </p>
        </div>

        <div className="overflow-hidden rounded-4xl border border-border/70 bg-background/65 shadow-[0_10px_35px_rgba(15,23,42,0.06)] ring-1 ring-white/30 backdrop-blur-xl dark:bg-card/55 dark:ring-white/8">
          {INVITATIONS.map((invitation, index) => (
            <div
              key={invitation.id}
              className={cn(
                "group flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.035] dark:hover:bg-white/[0.04]",
                index !== 0 && "border-t border-border/65"
              )}
            >
              {/* Tenant avatar */}
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[13px] font-semibold text-white shadow-sm",
                  invitation.tenantAccent
                )}
              >
                {invitation.tenantInitials}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium leading-tight">
                  {invitation.tenantName}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="truncate">by {invitation.inviterName}</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">
                    you're invited as{" "}
                    <a
                      href={`https://docs.alurkerja.com/roles/${invitation.role}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="capitalize underline decoration-primary/40 underline-offset-2 transition-colors hover:text-primary hover:decoration-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {invitation.role}
                    </a>
                  </span>
                </p>
              </div>

              {/* Actions */}
              {invitation.status === "pending" ? (
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-full"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                    Decline
                  </Button>
                  <Button size="sm" className="gap-1.5 rounded-full">
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                    Accept
                  </Button>
                </div>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
                  <span className="hidden sm:inline">Accepted</span>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </WorkspacePortalLayout>
  )
}
