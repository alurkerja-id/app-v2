import { useState, useEffect, useRef } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"

import type { Page } from "@/types/navigation"

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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => {
          onNavigate(page)
          if (!isDesktop) setMobileSidebarOpen(false)
        }}
        open={sidebarOpen}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col transition-[padding] duration-200 lg:pl-56">
        <Header
          activePage={activePage}
          onMenuToggle={() => setMobileSidebarOpen((v) => !v)}
          onNavigate={onNavigate}
          scrolled={scrolled}
        />
        <main ref={mainRef} className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
