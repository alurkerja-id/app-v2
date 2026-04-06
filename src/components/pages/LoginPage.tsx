import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  GridViewIcon,
  AiBeautifyIcon,
  CpuIcon,
  Building06Icon,
  Globe02Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { usePreferences } from "@/contexts/PreferencesContext"
import { cn } from "@/lib/utils"
import type { Page } from "@/types/navigation"

const PATTERN_COLOR_LIGHT = "#0000000b"
const PATTERN_COLOR_DARK = "#ffffff16"

interface LoginPageProps {
  onNavigate: (page: Page) => void
}

const FEATURES = [
  {
    icon: GridViewIcon,
    gradient: "from-blue-500 to-indigo-600",
    label: "App",
    description: "Internal user tasklist",
  },
  {
    icon: AiBeautifyIcon,
    gradient: "from-violet-500 to-purple-600",
    label: "Studio",
    description: "Design and deploy process",
  },
  {
    icon: CpuIcon,
    gradient: "from-emerald-500 to-teal-600",
    label: "Simulation",
    description: "Run and optimize process",
  },
  {
    icon: Building06Icon,
    gradient: "from-cyan-500 to-sky-600",
    label: "Company Profile",
    description: "Manage company information",
  },
  {
    icon: Globe02Icon,
    gradient: "from-orange-500 to-amber-600",
    label: "Microsite",
    description: "Customizable company identity",
  },
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
    if (!email) {
      setEmailError("Email is required.")
      hasError = true
    }
    if (!password) {
      setPasswordError("Password is required.")
      hasError = true
    }
    if (hasError) return

    onNavigate("workspaces")
  }

  return (
    <div
      className="relative min-h-screen bg-background text-foreground overflow-hidden"
      style={pageStyle}
    >
      {/* Keyframe animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.08); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(20px) scale(0.94); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(6deg); }
        }
        .blob-1 { animation: float-slow 8s ease-in-out infinite; }
        .blob-2 { animation: float-medium 11s ease-in-out infinite; }
        .blob-3 { animation: float-fast 7s ease-in-out infinite; }
        .blob-4 { animation: float-slow 13s ease-in-out infinite reverse; }
      `}</style>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob-1 absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-500/15 blur-3xl dark:bg-blue-400/10" />
        <div className="blob-2 absolute -bottom-40 -right-32 w-[600px] h-[600px] rounded-full bg-violet-500/15 blur-3xl dark:bg-violet-400/10" />
        <div className="blob-3 absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-400/8" />
        <div className="blob-4 absolute -top-20 right-1/4 w-[280px] h-[280px] rounded-full bg-orange-400/12 blur-3xl dark:bg-orange-400/8" />
      </div>

      {/* Layout */}
      <div className="relative flex min-h-screen flex-col lg:flex-row">

        {/* Left Column — Login Form */}
        <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-sm">
            {/* Logo (always visible) */}
            <div className="mb-8 flex flex-col items-center gap-3">
              <img
                src="https://alurkerja.com/images/alurkerja-logo.png"
                alt="AlurKerja"
                className="h-9 w-auto object-contain"
              />
              <span className="font-heading text-xl font-semibold tracking-tight">AlurKerja</span>
            </div>

            {/* Card */}
            <div className="overflow-hidden rounded-4xl border border-border/70 bg-background/65 shadow-[0_10px_35px_rgba(15,23,42,0.07)] ring-1 ring-white/30 backdrop-blur-xl dark:bg-card/55 dark:ring-white/8">
              <div className="px-7 py-8">
                <div className="mb-6 text-center">
                  <h2 className="font-heading text-[1.35rem] font-semibold leading-tight">
                    Sign In
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
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
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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

                  <Button type="submit" className="mt-2 h-10 w-full rounded-3xl">
                    Sign In
                  </Button>
                </form>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} AlurKerja. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Column — Welcome (desktop only) */}
        <div className="hidden lg:flex flex-1 items-center justify-center px-10 py-16">
          <div className="w-full max-w-md space-y-10 text-center">
            {/* Headline */}
            <div className="space-y-3">
              <h1 className="font-heading text-4xl font-semibold leading-tight">
                Welcome Back
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                AlurKerja is one stop platform for SOP Management and Business Process Automation.
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 gap-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.label}
                  className="flex items-center gap-4 rounded-2xl border border-border/50 bg-background/40 px-4 py-3 backdrop-blur-sm dark:bg-card/30"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                      feature.gradient
                    )}
                  >
                    <HugeiconsIcon icon={feature.icon} className="size-4" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-medium">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
