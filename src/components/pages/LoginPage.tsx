import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  GridViewIcon,
  AiBeautifyIcon,
  CpuIcon,
  Building06Icon,
  Globe02Icon,
} from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { usePreferences } from "@/contexts/PreferencesContext"
import { cn } from "@/lib/utils"
import type { Page } from "@/types/navigation"

const PATTERN_COLOR_LIGHT = "#0000000b"
const PATTERN_COLOR_DARK = "#ffffff16"

const AK_BLUE = "#297FE4"
const AK_BLUE_DARK = "#1B5598"

interface LoginPageProps {
  onNavigate: (page: Page) => void
}

const FEATURES = [
  { icon: GridViewIcon, gradient: "from-blue-500 to-indigo-600", label: "App", description: "Internal user tasklist" },
  { icon: AiBeautifyIcon, gradient: "from-violet-500 to-purple-600", label: "Studio", description: "Design and deploy process" },
  { icon: CpuIcon, gradient: "from-emerald-500 to-teal-600", label: "Simulation", description: "Run and optimize process" },
  { icon: Building06Icon, gradient: "from-cyan-500 to-sky-600", label: "Company Profile", description: "Manage company information" },
  { icon: Globe02Icon, gradient: "from-orange-500 to-amber-600", label: "Microsite", description: "Customizable company identity" },
]

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { pattern } = usePreferences()
  const isDark = document.documentElement.classList.contains("dark")
  const pageStyle = useMemo(
    () => pattern.getStyle(isDark ? PATTERN_COLOR_DARK : PATTERN_COLOR_LIGHT),
    [isDark, pattern]
  )

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError("")
    setPasswordError("")
    let hasError = false
    if (!email) { setEmailError("Email is required."); hasError = true }
    if (!password) { setPasswordError("Password is required."); hasError = true }
    if (hasError) return
    onNavigate("workspaces")
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden" style={pageStyle}>
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
        .ak-btn:hover{
          box-shadow: 0 4px 14px rgba(27,85,152,0.4);
        }
        .ak-btn:active{
          box-shadow: 0 1px 4px rgba(27,85,152,0.25);
          transform: translateY(0.5px);
        }
      `}</style>

      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="ak-blob-1 absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl" style={{ background: `${AK_BLUE}26` }} />
        <div className="ak-blob-2 absolute -bottom-48 -right-40 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: `${AK_BLUE_DARK}22` }} />
        <div className="ak-blob-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full blur-3xl" style={{ background: `${AK_BLUE}18` }} />
        <div className="ak-blob-4 absolute -top-16 right-1/3 w-[260px] h-[260px] rounded-full blur-3xl" style={{ background: `${AK_BLUE_DARK}1a` }} />
      </div>

      {/* Content */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-4xl flex-col gap-8 lg:flex-row lg:items-center lg:gap-16">

          {/* Left — Login Card */}
          <div className="flex flex-1 justify-center">
            <div className="w-full max-w-sm">
              <div className="overflow-hidden rounded-4xl border border-border/70 bg-background/65 shadow-[0_10px_35px_rgba(15,23,42,0.07)] ring-1 ring-white/30 backdrop-blur-xl dark:bg-card/55 dark:ring-white/8">
                <div className="px-7 py-8">
                  {/* Logo inside card */}
                  <div className="mb-6 flex flex-col items-center gap-2">
                    <img
                      src="https://alurkerja.com/images/alurkerja-logo.png"
                      alt="AlurKerja"
                      className="h-9 w-auto object-contain"
                    />
                    <span className="font-heading text-lg font-semibold tracking-tight">AlurKerja</span>
                    <p className="text-sm text-muted-foreground text-center">
                      Enter your email and password to continue.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                    <Field data-invalid={!!emailError || undefined}>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={!!emailError}
                        className="h-10 rounded-3xl"
                      />
                      {emailError && <FieldError>{emailError}</FieldError>}
                    </Field>

                    <Field data-invalid={!!passwordError || undefined}>
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <button
                          type="button"
                          className="text-xs transition-colors"
                          style={{ color: AK_BLUE }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = AK_BLUE_DARK)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = AK_BLUE)}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={!!passwordError}
                        className="h-10 rounded-3xl"
                      />
                      {passwordError && <FieldError>{passwordError}</FieldError>}
                    </Field>

                    <button type="submit" className="ak-btn mt-2 h-10 w-full rounded-3xl text-sm font-medium">
                      Sign In
                    </button>
                  </form>
                </div>
              </div>

              <p className="mt-5 text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} AlurKerja. All rights reserved.
              </p>
            </div>
          </div>

          {/* Right — Welcome + Features (visible on all sizes, stacked below on mobile) */}
          <div className="flex flex-1 justify-center lg:justify-start">
            <div className="w-full max-w-sm space-y-7">
              <div className="space-y-2 text-center lg:text-left">
                <h1 className="font-heading text-3xl font-semibold leading-tight">Welcome Back</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AlurKerja is one stop platform for SOP Management and Business Process Automation.
                </p>
              </div>

              <div className="space-y-4">
                {FEATURES.map((feature) => (
                  <div key={feature.label} className="flex items-center gap-4">
                    <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", feature.gradient)}>
                      <HugeiconsIcon icon={feature.icon} className="size-[15px]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{feature.label}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a
                href="https://alurkerja.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: AK_BLUE }}
                onMouseEnter={(e) => (e.currentTarget.style.color = AK_BLUE_DARK)}
                onMouseLeave={(e) => (e.currentTarget.style.color = AK_BLUE)}
              >
                Learn more about AlurKerja →
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
