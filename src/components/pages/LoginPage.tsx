import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { usePreferences } from "@/contexts/PreferencesContext"
import type { Page } from "@/types/navigation"

const PATTERN_COLOR_LIGHT = "#0000000b"
const PATTERN_COLOR_DARK = "#ffffff16"

interface LoginPageProps {
  onNavigate: (page: Page) => void
}

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
      setEmailError("Email wajib diisi.")
      hasError = true
    }
    if (!password) {
      setPasswordError("Kata sandi wajib diisi.")
      hasError = true
    }
    if (hasError) return

    onNavigate("workspaces")
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-5"
      style={pageStyle}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <img
            src="https://alurkerja.com/images/alurkerja-logo.png"
            alt="AlurKerja"
            className="h-8 w-auto object-contain"
          />
          <span className="font-heading text-xl font-semibold tracking-tight">AlurKerja</span>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-4xl border border-border/70 bg-background/65 shadow-[0_10px_35px_rgba(15,23,42,0.06)] ring-1 ring-white/30 backdrop-blur-xl dark:bg-card/55 dark:ring-white/8">
          <div className="px-7 py-8">
            <div className="mb-6">
              <h1 className="font-heading text-[1.35rem] font-semibold leading-tight">Masuk</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Masukkan email dan kata sandi untuk melanjutkan.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <Field data-invalid={!!emailError || undefined}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@perusahaan.com"
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
                  <FieldLabel htmlFor="password">Kata Sandi</FieldLabel>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Lupa kata sandi?
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
                Masuk
              </Button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} AlurKerja. Hak cipta dilindungi.
        </p>
      </div>
    </div>
  )
}
