import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"

type Page = "home" | "tasks" | "group-tasks" | "requests-active" | "requests-completed" | "analytics" | "heatmap"

interface AppLayoutProps {
  activePage: Page
  onNavigate: (page: Page) => void
  children: React.ReactNode
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024)
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)")
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])
  return isDesktop
}

export function AppLayout({ activePage, onNavigate, children }: AppLayoutProps) {
  const isDesktop = useIsDesktop()
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => {
          onNavigate(page)
          if (!isDesktop) setSidebarOpen(false)
        }}
        open={sidebarOpen}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-200",
          sidebarOpen ? "lg:pl-56" : "pl-0"
        )}
      >
        <Header
          activePage={activePage}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
