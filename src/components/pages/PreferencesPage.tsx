import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon, Sun01Icon, Moon01Icon, ComputerDesk01Icon, Settings02Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { usePreferences, type Theme } from "@/contexts/PreferencesContext"
import { COLOR_PRESETS, PATTERN_PRESETS } from "@/data/preferences"

const PATTERN_COLOR_LIGHT = "#00000014"
const PATTERN_COLOR_DARK  = "#ffffff1c"

const THEME_OPTIONS: { id: Theme; label: string; icon: React.ComponentType }[] = [
  { id: "system", label: "System", icon: ComputerDesk01Icon },
  { id: "light",  label: "Light",  icon: Sun01Icon    },
  { id: "dark",   label: "Dark",   icon: Moon01Icon   },
]

interface PreferencesPanelProps {
  inDialog?: boolean
}

export function PreferencesPanel({ inDialog = false }: PreferencesPanelProps) {
  const { color, pattern, theme, setColorId, setPatternId, setTheme } = usePreferences()

  const isDark = document.documentElement.classList.contains("dark")
  const patternColor = isDark ? PATTERN_COLOR_DARK : PATTERN_COLOR_LIGHT
  const optionCardClass =
    "rounded-xl border-2 bg-background shadow-sm transition-all duration-150"
  const optionCardStateClass = (selected: boolean) =>
    selected
      ? "border-primary shadow-md"
      : "border-border hover:border-foreground/30 hover:shadow-md"
  if (inDialog) {
    return (
      <div className="flex h-[min(82vh,760px)] flex-col">
        <div className="shrink-0 border-b border-border px-6 py-5 sm:px-7">
          <h1 className="flex items-center gap-2 text-xl font-normal font-heading">
            <HugeiconsIcon icon={Settings02Icon} className="size-5 text-muted-foreground" />
            My Preferences
          </h1>
        </div>

        <div className="min-h-0 overflow-y-auto px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-10">

            {/* ── Appearance ── */}
            <section>
              <h2 className="text-sm font-semibold mb-1">Appearance</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Choose how the interface looks.
              </p>
              <div className="flex gap-3">
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTheme(opt.id)}
                    className={cn(
                      optionCardClass,
                      optionCardStateClass(theme === opt.id),
                      "flex flex-col items-center gap-2 px-8 py-4"
                    )}
                  >
                    <HugeiconsIcon
                      icon={opt.icon}
                      className={cn("size-5", theme === opt.id ? "text-primary" : "text-muted-foreground")}
                    />
                    <span className={cn(
                      "text-xs font-medium",
                      theme === opt.id ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* ── Accent Color ── */}
            <section>
              <h2 className="text-sm font-semibold mb-1">Accent Color</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Changes buttons, active states, and highlights across the app.
              </p>
              <div className="flex flex-wrap gap-3">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setColorId(preset.id)}
                    className="group flex flex-col items-center gap-1.5"
                    title={preset.name}
                  >
                    <div
                      className={cn(
                        "relative size-9 rounded-full border-2 transition-all duration-150",
                        color.id === preset.id
                          ? "border-foreground scale-110 shadow-md"
                          : "border-transparent hover:border-border hover:scale-105"
                      )}
                      style={{ backgroundColor: preset.swatch }}
                    >
                      {color.id === preset.id && (
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          className="absolute inset-0 m-auto size-4 text-white drop-shadow"
                        />
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] transition-colors",
                      color.id === preset.id ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* ── Background Pattern ── */}
            <section>
              <h2 className="text-sm font-semibold mb-1">Background Pattern</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Subtle texture applied behind all page content.
              </p>
              <div className="grid grid-cols-6 gap-3">
                {PATTERN_PRESETS.map((preset) => {
                  const previewStyle = preset.getStyle(patternColor)
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setPatternId(preset.id)}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div
                        className={cn(
                          optionCardClass,
                          optionCardStateClass(pattern.id === preset.id),
                          "relative w-full aspect-[4/3] overflow-hidden"
                        )}
                        style={previewStyle}
                      >
                        {pattern.id === preset.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="size-5 rounded-full bg-primary flex items-center justify-center">
                              <HugeiconsIcon icon={Tick02Icon} className="size-3 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                      </div>
                      <span className={cn(
                        "text-[10px] transition-colors",
                        pattern.id === preset.id ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {preset.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl p-6 md:p-10">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-xl font-normal font-heading">
          <HugeiconsIcon icon={Settings02Icon} className="size-5 text-muted-foreground" />
          My Preferences
        </h1>
      </div>

      <div className="flex flex-col gap-10">

        {/* ── Appearance ── */}
        <section>
          <h2 className="text-sm font-semibold mb-1">Appearance</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Choose how the interface looks.
          </p>
          <div className="flex gap-3">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={cn(
                  optionCardClass,
                  optionCardStateClass(theme === opt.id),
                  "flex flex-col items-center gap-2 px-8 py-4"
                )}
              >
                <HugeiconsIcon
                  icon={opt.icon}
                  className={cn("size-5", theme === opt.id ? "text-primary" : "text-muted-foreground")}
                />
                <span className={cn(
                  "text-xs font-medium",
                  theme === opt.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Accent Color ── */}
        <section>
          <h2 className="text-sm font-semibold mb-1">Accent Color</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Changes buttons, active states, and highlights across the app.
          </p>
          <div className="flex flex-wrap gap-3">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setColorId(preset.id)}
                className="group flex flex-col items-center gap-1.5"
                title={preset.name}
              >
                <div
                  className={cn(
                    "relative size-9 rounded-full border-2 transition-all duration-150",
                    color.id === preset.id
                      ? "border-foreground scale-110 shadow-md"
                      : "border-transparent hover:border-border hover:scale-105"
                  )}
                  style={{ backgroundColor: preset.swatch }}
                >
                  {color.id === preset.id && (
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      className="absolute inset-0 m-auto size-4 text-white drop-shadow"
                    />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] transition-colors",
                  color.id === preset.id ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Background Pattern ── */}
        <section>
          <h2 className="text-sm font-semibold mb-1">Background Pattern</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Subtle texture applied behind all page content.
          </p>
          <div className="grid grid-cols-6 gap-3">
            {PATTERN_PRESETS.map((preset) => {
              const previewStyle = preset.getStyle(patternColor)
              return (
                <button
                  key={preset.id}
                  onClick={() => setPatternId(preset.id)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={cn(
                      optionCardClass,
                      optionCardStateClass(pattern.id === preset.id),
                      "relative w-full aspect-[4/3] overflow-hidden"
                    )}
                    style={previewStyle}
                  >
                    {pattern.id === preset.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="size-5 rounded-full bg-primary flex items-center justify-center">
                          <HugeiconsIcon icon={Tick02Icon} className="size-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] transition-colors",
                    pattern.id === preset.id ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {preset.name}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

      </div>
    </div>
  )
}

export function PreferencesPage() {
  return <PreferencesPanel />
}
