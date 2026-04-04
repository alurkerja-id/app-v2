import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { COLOR_PRESETS, PATTERN_PRESETS, type ColorPreset, type PatternPreset } from "@/data/preferences"

export type Theme = "system" | "light" | "dark"

interface PreferencesContextValue {
  color: ColorPreset
  pattern: PatternPreset
  theme: Theme
  setColorId: (id: string) => void
  setPatternId: (id: string) => void
  setTheme: (theme: Theme) => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

const STYLE_TAG_ID = "preferences-override"

function injectColorVars(color: ColorPreset) {
  let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null
  if (!tag) {
    tag = document.createElement("style")
    tag.id = STYLE_TAG_ID
    document.head.appendChild(tag)
  }
  tag.textContent = `
    :root {
      --primary: ${color.light.primary};
      --primary-foreground: ${color.light.foreground};
      --ring: ${color.light.ring};
      --sidebar-primary: ${color.dark.primary};
      --sidebar-primary-foreground: ${color.dark.foreground};
    }
    .dark {
      --primary: ${color.dark.primary};
      --primary-foreground: ${color.dark.foreground};
      --ring: ${color.dark.ring};
      --sidebar-primary: ${color.dark.primary};
      --sidebar-primary-foreground: ${color.dark.foreground};
    }
  `
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === "dark") {
    root.classList.add("dark")
  } else if (theme === "light") {
    root.classList.remove("dark")
  } else {
    // system
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [colorId, setColorIdState] = useState<string>(
    () => localStorage.getItem("pref-color") ?? "zinc"
  )
  const [patternId, setPatternIdState] = useState<string>(
    () => localStorage.getItem("pref-pattern") ?? "none"
  )
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem("pref-theme") as Theme) ?? "system"
  )

  const color   = COLOR_PRESETS.find((c) => c.id === colorId)    ?? COLOR_PRESETS[0]
  const pattern = PATTERN_PRESETS.find((p) => p.id === patternId) ?? PATTERN_PRESETS[0]

  const setColorId = (id: string) => {
    setColorIdState(id)
    localStorage.setItem("pref-color", id)
  }

  const setPatternId = (id: string) => {
    setPatternIdState(id)
    localStorage.setItem("pref-pattern", id)
  }

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem("pref-theme", t)
    applyTheme(t)
  }

  // Apply theme and listen for system changes
  useEffect(() => {
    applyTheme(theme)
    if (theme !== "system") return
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applyTheme("system")
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [theme])

  // Inject CSS variable overrides whenever color changes
  useEffect(() => {
    injectColorVars(color)
  }, [color])

  // Inject on first mount too
  useEffect(() => {
    injectColorVars(color)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PreferencesContext.Provider value={{ color, pattern, theme, setColorId, setPatternId, setTheme }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error("usePreferences must be used inside PreferencesProvider")
  return ctx
}
