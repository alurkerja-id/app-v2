import { useState, useEffect, useRef, useMemo } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { usePreferences } from "@/contexts/PreferencesContext"
import type { Page } from "@/types/navigation"

const PATTERN_COLOR_LIGHT = "#0000000b"
const PATTERN_COLOR_DARK  = "#ffffff16"

interface AppLayoutProps {
  activePage: Page
  onNavigate: (page: Page) => void
  children: React.ReactNode
  activeProcessId?: string
  onNavigateProcess?: (processId: string) => void
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

export function AppLayout({ activePage, onNavigate, children, activeProcessId, onNavigateProcess }: AppLayoutProps) {
  const isDesktop = useIsDesktop()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false)
    }
  }, [isDesktop])

  useEffect(() => {
    if (!mobileSidebarOpen) return

    const { overflow } = document.body.style
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = overflow
    }
  }, [mobileSidebarOpen])

  const sidebarOpen = isDesktop || mobileSidebarOpen
  const { pattern } = usePreferences()
  const isDark = document.documentElement.classList.contains("dark")
  const patternStyle = useMemo(() => {
    const base = pattern.getStyle(isDark ? PATTERN_COLOR_DARK : PATTERN_COLOR_LIGHT)
    if (!base.backgroundImage) return base

    const patternRepeat = typeof base.backgroundRepeat === "string" ? base.backgroundRepeat : "repeat"
    const patternPosition = typeof base.backgroundPosition === "string" ? base.backgroundPosition : "0 0"
    const patternSize = typeof base.backgroundSize === "string" ? base.backgroundSize : "auto"

    return {
      ...base,
      backgroundImage: `linear-gradient(to right, var(--background) 0px, transparent 260px), ${base.backgroundImage}`,
      backgroundPosition: `0 0, ${patternPosition}`,
      backgroundRepeat: `no-repeat, ${patternRepeat}`,
      backgroundSize: `100% 100%, ${patternSize}`,
    }
  }, [isDark, pattern])
  const mainRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => setScrolled(el.scrollTop > 10)
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => {
          onNavigate(page)
          if (!isDesktop) setMobileSidebarOpen(false)
        }}
        open={sidebarOpen}
        activeProcessId={activeProcessId}
        onNavigateProcess={(processId) => {
          onNavigateProcess?.(processId)
          if (!isDesktop) setMobileSidebarOpen(false)
        }}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col transition-[padding] duration-200 lg:pl-56 min-w-0">
        <Header
          activePage={activePage}
          onMenuToggle={() => setMobileSidebarOpen((v) => !v)}
          onNavigate={onNavigate}
          scrolled={scrolled}
          activeProcessId={activeProcessId}
        />
        <main ref={mainRef} className="flex-1 overflow-auto bg-background" style={patternStyle}>{children}</main>
      </div>
    </div>
  )
}
