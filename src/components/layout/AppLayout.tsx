import { useState, useEffect, useRef, useMemo } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { HeaderToolbarContext } from "./header-toolbar-context"
import { Skeleton } from "@/components/ui/skeleton"
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
  // Two loading states. The sidebar is app-shell data (workspace, menus,
  // processes): it loads once, when the shell mounts, and stays put while the
  // user moves between pages. Only the page content reloads on navigation —
  // sharing one flag re-skeletoned the sidebar on every menu click.
  const [toolbarSlot, setToolbarSlot] = useState<HTMLDivElement | null>(null)
  const [shellLoading, setShellLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShellLoading(false), 1500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    setContentLoading(true)
    const t = setTimeout(() => setContentLoading(false), 1500)
    return () => clearTimeout(t)
  }, [activePage])

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
    // Hysteresis: docking shrinks the header (a dashboard's title row folds
    // away), so <main> grows and a barely-scrollable page clamps scrollTop
    // back down; a single threshold would flip back and forth.
    const onScroll = () => setScrolled((was) => (was ? el.scrollTop > 4 : el.scrollTop > 48))
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background [contain:layout]">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => {
          onNavigate(page)
          if (!isDesktop) setMobileSidebarOpen(false)
        }}
        open={sidebarOpen}
        isLoading={shellLoading}
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
          toolbarRef={setToolbarSlot}
        />
        <main ref={mainRef} className="flex-1 overflow-auto bg-background" style={patternStyle}>
        <HeaderToolbarContext.Provider value={toolbarSlot}>
          {/* The page mounts at once and the loading skeleton sits over it, rather
              than the page mounting after it: a page that merges its toolbar into
              the header has it there from the first frame (no late jump), and
              charts measure their real size underneath. */}
          <div className="relative min-h-full">
            {children}
            {contentLoading && (
              <div className="absolute inset-0 z-10 bg-background" style={patternStyle} aria-busy="true">
          <div className="flex flex-col gap-8 px-4 py-10 md:px-6 md:py-12 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-6 w-52" />
              </div>
              <Skeleton className="h-4 w-64 hidden sm:block" />
            </div>
            <Skeleton className="h-14 w-full rounded-4xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-3 w-20" />
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
                    <Skeleton className="size-6 rounded-md shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-8 w-full rounded-3xl" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
                    <Skeleton className="size-6 rounded-md shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
              </div>
            )}
          </div>
        </HeaderToolbarContext.Provider>
      </main>
      </div>
    </div>
  )
}
