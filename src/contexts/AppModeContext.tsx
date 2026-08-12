import { createContext, useContext, useState, type ReactNode } from "react"

interface AppModeContextValue {
  /** TEST vs LIVE environment. Mirrors envManager in the real app. */
  testMode: boolean
  setTestMode: (value: boolean) => void
  /** Reveals technical details (variables, raw events) across the app. */
  developerMode: boolean
  setDeveloperMode: (value: boolean) => void
}

const AppModeContext = createContext<AppModeContextValue | null>(null)

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [testMode, setTestModeState] = useState(
    () => localStorage.getItem("app-test-mode") === "true"
  )
  const [developerMode, setDeveloperModeState] = useState(
    () => localStorage.getItem("app-developer-mode") === "true"
  )

  const setTestMode = (value: boolean) => {
    setTestModeState(value)
    localStorage.setItem("app-test-mode", String(value))
  }

  const setDeveloperMode = (value: boolean) => {
    setDeveloperModeState(value)
    localStorage.setItem("app-developer-mode", String(value))
  }

  return (
    <AppModeContext.Provider value={{ testMode, setTestMode, developerMode, setDeveloperMode }}>
      {children}
    </AppModeContext.Provider>
  )
}

export function useAppMode() {
  const ctx = useContext(AppModeContext)
  if (!ctx) throw new Error("useAppMode must be used inside AppModeProvider")
  return ctx
}
