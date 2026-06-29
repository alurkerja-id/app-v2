import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { usePreferences } from "@/contexts/PreferencesContext"
import type { Page } from "@/types/navigation"

const AK_BLUE = "#297FE4"
const AK_BLUE_DARK = "#1B5598"

type InviteState = "idle" | "loading" | "success"

interface InviteLinkPageProps {
  token?: string
  onNavigate: (page: Page) => void
}

const MOCK_INVITE = {
  tenantName: "AlurKerjaaaaa",
  tenantInitials: "AK",
  tenantAccent: "from-blue-500 to-indigo-600",
  inviterName: "someone",
  role: "member",
}

export function InviteLinkPage({ onNavigate }: InviteLinkPageProps) {
  const { pattern } = usePreferences()

  const pageStyle = useMemo(
    () => pattern.getStyle("#0000000b"),
    [pattern]
  )

  const [state, setState] = useState<InviteState>("idle")

  const handleAccept = () => {
    setState("loading")
    setTimeout(() => setState("success"), 1200)
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-white text-foreground"
      style={pageStyle}
    >
      <style>{`
        @keyframes ak-float-a { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.07)} }
        @keyframes ak-float-b { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(22px) scale(0.93)} }
        @keyframes ak-float-c { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        .ak-blob-1{animation:ak-float-a 9s ease-in-out infinite}
        .ak-blob-2{animation:ak-float-b 12s ease-in-out infinite}
        .ak-blob-3{animation:ak-float-c 7s ease-in-out infinite}
        .ak-blob-4{animation:ak-float-a 14s ease-in-out infinite reverse}
        .ak-btn{
          background: linear-gradient(135deg, ${AK_BLUE}, ${AK_BLUE_DARK});
          color: #fff;
          border: none;
          box-shadow: 0 2px 8px rgba(27,85,152,0.3);
          transition: all .15s ease;
        }
        .ak-btn:hover{ box-shadow: 0 4px 14px rgba(27,85,152,0.4); }
        .ak-btn:active{ box-shadow: 0 1px 4px rgba(27,85,152,0.25); transform: translateY(0.5px); }
        .ak-btn:disabled{ opacity: 0.6; cursor: not-allowed; box-shadow: none; }
      `}</style>

      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="ak-blob-1 absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl" style={{ background: `${AK_BLUE}26` }} />
        <div className="ak-blob-2 absolute -bottom-48 -right-40 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: `${AK_BLUE_DARK}22` }} />
        <div className="ak-blob-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full blur-3xl" style={{ background: `${AK_BLUE}18` }} />
        <div className="ak-blob-4 absolute -top-16 right-1/3 w-[260px] h-[260px] rounded-full blur-3xl" style={{ background: `${AK_BLUE_DARK}1a` }} />
      </div>

      {/* Logo top-left */}
      <div className="relative z-10 flex items-center gap-2 px-6 py-5">
        <img
          src="https://alurkerja.com/images/alurkerja-logo.png"
          alt="AlurKerja"
          className="h-7 w-auto object-contain"
        />
        <span className="font-heading text-base font-semibold tracking-tight" style={{ color: AK_BLUE }}>
          AlurKerja
        </span>
      </div>

      {/* Center card */}
      <div className="relative z-10 flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="overflow-hidden rounded-4xl border border-black/[0.07] bg-white/70 shadow-[0_10px_35px_rgba(15,23,42,0.07)] ring-1 ring-white/50 backdrop-blur-xl">

            {/* Success state */}
            {state === "success" && (
              <div className="flex flex-col items-center gap-4 px-7 py-10 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-gray-900">You're in!</h2>
                  <p className="mt-1.5 text-sm text-gray-500">
                    You've successfully joined{" "}
                    <span className="font-semibold text-gray-900">{MOCK_INVITE.tenantName}</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate("home")}
                  className="ak-btn mt-2 flex w-full items-center justify-center gap-2 rounded-3xl px-5 py-2.5 text-sm font-medium"
                >
                  Go to Workspace
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                </button>
              </div>
            )}

            {/* Idle / Loading state */}
            {(state === "idle" || state === "loading") && (
              <div className="px-7 py-8">
                {/* Tenant avatar + name */}
                <div className="mb-6 flex flex-col items-center gap-3 text-center">
                  <div
                    className={`flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br text-xl font-bold text-white shadow-md ${MOCK_INVITE.tenantAccent}`}
                  >
                    {MOCK_INVITE.tenantInitials}
                  </div>
                  <h2 className="font-heading text-xl font-semibold text-gray-900">
                    {MOCK_INVITE.tenantName}
                  </h2>
                </div>

                {/* Invite message */}
                <div className="mb-6 rounded-2xl border border-black/[0.06] bg-gray-50 px-4 py-3 text-sm text-center text-gray-600">
                  You have been invited by{" "}
                  <span className="font-semibold text-gray-900">{MOCK_INVITE.inviterName}</span>{" "}
                  to join{" "}
                  <span className="font-semibold text-gray-900">{MOCK_INVITE.tenantName}</span>{" "}
                  as a{" "}
                  <span className="font-semibold text-gray-900 capitalize">{MOCK_INVITE.role}</span>.
                  {" "}Click <span className="font-semibold text-gray-900">Join</span> to continue.
                </div>

                {/* Action */}
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={state === "loading"}
                  className="ak-btn flex h-10 w-full items-center justify-center gap-2 rounded-3xl text-sm font-medium"
                >
                  {state === "loading" ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                      Joining…
                    </>
                  ) : (
                    "Join"
                  )}
                </button>
              </div>
            )}
          </div>

          <p className="mt-5 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} AlurKerja. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
