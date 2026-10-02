import { useContext } from "react"
import { createPortal } from "react-dom"
import { HeaderToolbarContext } from "@/components/layout/header-toolbar-context"

/**
 * Renders its children as the header's second row, so the page's controls
 * share one box with the breadcrumb (like Studio's Design / Docs / Form row).
 * The header turns from a pill into a two-row card only while this is mounted.
 * Falls back to rendering in place when there is no header (e.g. tests).
 */
export function HeaderToolbar({ children }: { children: React.ReactNode }) {
  const slot = useContext(HeaderToolbarContext)
  return slot ? createPortal(children, slot) : <>{children}</>
}
