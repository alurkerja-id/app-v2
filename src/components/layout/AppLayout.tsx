import { useState } from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"

type Page = "home" | "tasks" | "requests" | "analytics" | "heatmap"

interface AppLayoutProps {
  activePage: Page
  onNavigate: (page: Page) => void
  children: React.ReactNode
}

export function AppLayout({ activePage, onNavigate, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
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
